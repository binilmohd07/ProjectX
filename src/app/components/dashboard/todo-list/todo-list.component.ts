// ...existing code...
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { TodoService, TodoItem } from '../../../services/todo/todo.service';

// UI extension of TodoItem for template-only properties
interface UITodoItem extends TodoItem {
  showOccurrencePicker?: boolean;
  occurrenceDate?: string;
}
import { AuthService } from '../../../services/auth.service';
import { firebaseConfig } from '../../../firebase.config';

// Add Google Identity Services types
declare var google: any;
declare var gapi: any;

// Custom validator for due date
function dueDateValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value;
    if (!value) return null; // Optional field
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(selectedDate.getTime())) {
      return { invalidDate: true };
    }
    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent implements OnInit {
  /**
   * Mark a specific occurrence of a recurring calendar event as complete.
   * @param todo The TodoItem with calendarEventId
   * @param date The date string (YYYY-MM-DD) of the occurrence to mark complete
   */
  async markCalendarOccurrenceComplete(todo: UITodoItem, date: string): Promise<void> {
    if (!todo.calendarEventId) return;
    await this.ensureGoogleCalendarToken();
    const gapi = (window as any).gapi;
    try {
      // Find the instance for the date
      const instancesResp = await gapi.client.calendar.events.instances({
        calendarId: 'primary',
        eventId: todo.calendarEventId,
        timeMin: date + 'T00:00:00Z',
        timeMax: date + 'T23:59:59Z'
      });
      const instance = (instancesResp.result.items || []).find((ev: any) => ev.start && (ev.start.date === date || ev.start.dateTime?.startsWith(date)));
      if (instance) {
        let summary = instance.summary || '';
        if (!summary.startsWith('✔ ')) {
          summary = '✔ ' + summary;
        }
        await gapi.client.calendar.events.patch({
          calendarId: 'primary',
          eventId: instance.id,
          resource: { summary }
        });
      }
    } catch (e) {
      console.warn('Failed to mark calendar occurrence complete', e);
    }
  }
  @ViewChild('calendarIframe') calendarIframe!: ElementRef;
  refreshCalendarIframe(): void {
    // Refresh the embedded Google Calendar iframe by resetting its src
    if (this.calendarIframe && this.calendarIframe.nativeElement) {
      const iframe = this.calendarIframe.nativeElement;
      const src = iframe.src;
      iframe.src = '';
      setTimeout(() => { iframe.src = src; }, 100);
    }
  }

  startEditTask(i: number): void {
    this.editingIndex = i;
    const task = this.tasks[i];
    this.editForm.patchValue({
      task: task.title,
      description: task.description,
      dueDate: task.dueDate,
      frequency: task.frequency,
      addToCalendar: task.addToCalendar,
      repeatUntil: task.repeatUntil,
      occurrences: task.occurrences
    });
  }

  async saveEditTask(i: number): Promise<void> {
    if (this.editForm.valid && this.editingIndex !== null) {
      const task = this.tasks[this.editingIndex];
      const updated: TodoItem = {
        ...task,
        userId: this.userId,
        title: this.editForm.value.task,
        description: this.editForm.value.description,
        dueDate: this.editForm.value.dueDate,
        frequency: this.editForm.value.frequency,
        addToCalendar: this.editForm.value.addToCalendar,
        repeatUntil: this.editForm.value.repeatUntil !== undefined ? this.editForm.value.repeatUntil : null,
        occurrences: this.editForm.value.occurrences !== undefined ? this.editForm.value.occurrences : null,
        calendarEventId: task.calendarEventId // ensure event id is preserved for update
      };
      if (task.id) {
        await this.todoService.updateTodo(task.id, updated);
        // If addToCalendar is checked, update or create event
        if (updated.addToCalendar) {
          await this.addTaskToGoogleTasks(updated);
        } else if (task.calendarEventId) {
          // If unchecked and event exists, remove from calendar
          await this.ensureGoogleCalendarToken();
          const gapi = (window as any).gapi;
          try {
            await gapi.client.calendar.events.delete({
              calendarId: 'primary',
              eventId: task.calendarEventId
            });
            // Remove calendarEventId from Firestore
            const { calendarEventId, ...rest } = updated;
            await this.todoService.updateTodo(task.id, rest);
          } catch (e: any) {
            // Ignore 410 Gone errors
            const status = e?.result?.error?.code || e?.status;
            if (status !== 410) {
              console.warn('Failed to delete event from Google Calendar', e);
            }
          }
        }
      }
      this.editingIndex = null;
      this.editForm.reset();
      this.fetchTodos();
    }
  }
  gisClient: any = null;
  gisToken: string | null = null;
  isSignedIn: boolean = true;
  userEmail: string = '';
  calendarIframeUrl: SafeResourceUrl | null = null;
  calendarMessage: string | null = null;
  calendarEvents: any[] = [];
  tasks: UITodoItem[] = [];
  userId: string = '';
  loading: boolean = true;
  showAddTaskForm: boolean = false;
  editingIndex: number | null = null;
  todoForm: FormGroup;
  editForm: FormGroup;


  constructor(
    private fb: FormBuilder,
    public todoService: TodoService,
    public authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.todoForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: ['', dueDateValidator()],
      frequency: ['one time'],
      addToCalendar: [false],
      repeatUntil: [''],
      occurrences: ['']
    });
    this.editForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: ['', dueDateValidator()],
      frequency: ['one time'],
      addToCalendar: [false],
      repeatUntil: [''],
      occurrences: ['']
    });
  }

  /**
   * Confirm before toggling completion. If calendar event, mark all instances as complete.
   */
  async confirmAndToggleTask(index: number): Promise<void> {
    const todo = this.tasks[index];
    if (todo.calendarEventId) {
      const confirmed = window.confirm('Are you sure you want to mark all occurrences of this calendar event as complete?');
      if (!confirmed) return;
      await this.markAllCalendarOccurrencesComplete(todo);
    }
    this.toggleTask(index);
  }

  /**
   * Mark all instances of a recurring calendar event as complete.
   */
  async markAllCalendarOccurrencesComplete(todo: UITodoItem): Promise<void> {
    await this.ensureGoogleCalendarToken();
    const gapi = (window as any).gapi;
    try {
      // Get all instances of the recurring event
      const instancesResp = await gapi.client.calendar.events.instances({
        calendarId: 'primary',
        eventId: todo.calendarEventId
      });
      const items = instancesResp.result.items || [];
      for (const instance of items) {
        let summary = instance.summary || '';
        if (!summary.startsWith('✔ ')) {
          summary = '✔ ' + summary;
          await gapi.client.calendar.events.patch({
            calendarId: 'primary',
            eventId: instance.id,
            resource: { summary }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to mark all calendar occurrences complete', e);
    }
  }


  cancelEditTask(): void {
    this.editingIndex = null;
  }


  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userId = user?.uid || '';
    this.userEmail = user?.email || '';
    if (this.userEmail) {
      const url = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(this.userEmail)}&ctz=auto`;
      this.calendarIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    this.fetchTodos();
    // Initialize Google API client before using calendar API
    this.initGoogleApi()
      .then(() => {
        console.log('Google API client initialized');
        // Do not auto-login to Google Calendar. Only login when user clicks sign-in button.
      })
      .catch((e: any) => {
        console.error('Failed to initialize Google API client', e);
      });
  }


  fetchTodos(): void {
    this.todoService.getTodos(this.userId).subscribe((todos: TodoItem[]) => {
      // Sort: incomplete first, completed last
      this.tasks = todos
        .sort((a: TodoItem, b: TodoItem) => Number(a.completed) - Number(b.completed))
        .map((task: TodoItem) => {
          const uiTask: UITodoItem = { ...task };
          if (uiTask.calendarEventId && uiTask.frequency && uiTask.frequency !== 'one time') {
            if (typeof uiTask.showOccurrencePicker === 'undefined') uiTask.showOccurrencePicker = false;
            if (typeof uiTask.occurrenceDate === 'undefined') uiTask.occurrenceDate = '';
          }
          return uiTask;
        });
      this.loading = false;
      // Show add task form if no tasks exist
      this.showAddTaskForm = this.tasks.length === 0;
    });
  }


  toggleAddTaskForm(): void {
    this.showAddTaskForm = !this.showAddTaskForm;
  }


  async addTask(): Promise<void> {
    if (this.todoForm.valid) {
      const newTodo: TodoItem = {
        userId: this.userId, // Uses Google logged-in user ID
        title: this.todoForm.value.task,
        description: this.todoForm.value.description,
        completed: false,
        dueDate: this.todoForm.value.dueDate,
        frequency: this.todoForm.value.frequency,
        addToCalendar: this.todoForm.value.addToCalendar
      };
      await this.todoService.addTodo(newTodo);
      if (this.todoForm.value.addToCalendar) {
        // Fetch the just-added todo from Firestore to get its ID
        const todos = await this.todoService.getTodos(this.userId).toPromise();
        const added = todos && Array.isArray(todos) ? todos.find((t: TodoItem) => t.title === newTodo.title && t.description === newTodo.description && t.dueDate === newTodo.dueDate) : undefined;
        if (added && added.id) {
          await this.addTaskToGoogleTasks({ ...added });
        }
      }
      this.todoForm.reset();
      await this.fetchTodos();
      // Sorting will be handled in fetchTodos
    }
  }



  async removeTask(index: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    const todo = this.tasks[index];
    // Remove from Google Calendar if calendarEventId exists
    if (todo.calendarEventId) {
      try {
        await this.ensureGoogleCalendarToken();
        const gapi = (window as any).gapi;
        await gapi.client.calendar.events.delete({
          calendarId: 'primary',
          eventId: todo.calendarEventId
        });
        console.log('Deleted event from Google Calendar:', todo.calendarEventId);
      } catch (e) {
        console.warn('Failed to delete event from Google Calendar', e);
      }
      // Optionally, remove calendarEventId from the todo
      if (todo.id) {
        const { calendarEventId, ...rest } = todo;
        await this.todoService.updateTodo(todo.id, rest);
      }
      this.fetchTodos();
    }
    if (todo.id) {
      this.todoService.deleteTodo(todo.id).then(() => {
        this.fetchTodos();
      });
    }
  }




  toggleTask(index: number): void {
    const todo = this.tasks[index];
    if (todo.id) {
      const completed = !todo.completed;
      this.todoService.updateTodo(todo.id, { ...todo, completed }).then(async () => {
        // Update Google Calendar event title if exists
        if (todo.calendarEventId) {
          await this.ensureGoogleCalendarToken();
          const gapi = (window as any).gapi;
          try {
            // If this is a recurring event, update only the instance for today (or dueDate)
            const instanceDate = todo.dueDate || new Date().toISOString().slice(0, 10);
            // Find the instance for the date
            const instancesResp = await gapi.client.calendar.events.instances({
              calendarId: 'primary',
              eventId: todo.calendarEventId,
              timeMin: instanceDate + 'T00:00:00Z',
              timeMax: instanceDate + 'T23:59:59Z'
            });
            const instance = (instancesResp.result.items || []).find((ev: any) => ev.start && (ev.start.date === instanceDate || ev.start.dateTime?.startsWith(instanceDate)));
            if (instance) {
              let summary = instance.summary || '';
              if (completed && !summary.startsWith('✔ ')) {
                summary = '✔ ' + summary;
              } else if (!completed && summary.startsWith('✔ ')) {
                summary = summary.replace(/^✔ /, '');
              }
              await gapi.client.calendar.events.patch({
                calendarId: 'primary',
                eventId: instance.id,
                resource: { summary }
              });
            } else {
              // fallback: update the main event (non-recurring or not found)
              const eventResp = await gapi.client.calendar.events.get({
                calendarId: 'primary',
                eventId: todo.calendarEventId
              });
              let summary = eventResp.result.summary || '';
              if (completed && !summary.startsWith('✔ ')) {
                summary = '✔ ' + summary;
              } else if (!completed && summary.startsWith('✔ ')) {
                summary = summary.replace(/^✔ /, '');
              }
              await gapi.client.calendar.events.patch({
                calendarId: 'primary',
                eventId: todo.calendarEventId,
                resource: { summary }
              });
            }
          } catch (e) {
            console.warn('Failed to update calendar event completion status', e);
          }
        }
        this.fetchTodos();
        // Sorting will be handled in fetchTodos
      });
    }
  }


  getCompletedControl(taskCtrl: AbstractControl): FormControl {
    return taskCtrl.get('completed') as FormControl;
  }

  // --- STUBS FOR MISSING METHODS ---
  async initGoogleApi(): Promise<void> {
    // Load gapi script if not already loaded
    if (!(window as any).gapi) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve();
        script.onerror = () => reject('Failed to load gapi script');
        document.head.appendChild(script);
      });
    }
    // Load GIS script if not already loaded
    if (!(window as any).google || !(window as any).google.accounts || !(window as any).google.accounts.oauth2) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        script.onerror = () => reject('Failed to load GIS script');
        document.head.appendChild(script);
      });
    }
    const gapi = (window as any).gapi;
    if (!gapi.client) {
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', {
          callback: resolve,
          onerror: reject
        });
      });
    }
    // Only use apiKey and discoveryDocs for gapi.client.init
    if (!gapi.client.calendar) {
      await gapi.client.init({
        apiKey: firebaseConfig.apiKey,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
        ]
      });
    }
  }

  async addTaskToGoogleTasks(todo: TodoItem): Promise<void> {
    // Create a Google Calendar event for the task
    await this.ensureGoogleCalendarToken();
    const gapi = (window as any).gapi;
    if (!gapi || !gapi.client) {
      console.error('Google API client is not loaded.');
      return;
    }
    // Ensure the calendar API is loaded
    if (!gapi.client.calendar) {
      await new Promise<void>((resolve, reject) => {
        gapi.client.load('calendar', 'v3', () => {
          if (!gapi.client.calendar) {
            reject('Failed to load Google Calendar API');
          } else {
            resolve();
          }
        });
      });
    }
    if (!gapi.client.calendar) {
      console.error('Google Calendar API is not available after loading.');
      return;
    }
    const event: any = {
      summary: todo.title,
      description: todo.description,
      start: {
        date: todo.dueDate || new Date().toISOString().slice(0, 10)
      },
      end: {
        date: todo.dueDate || new Date().toISOString().slice(0, 10)
      }
    };
    // Add recurrence if needed
    if (todo.frequency && todo.frequency !== 'one time') {
      let rule = 'RRULE:FREQ=';
      if (todo.frequency === 'daily') rule += 'DAILY';
      else if (todo.frequency === 'weekly') rule += 'WEEKLY';
      else if (todo.frequency === 'monthly') rule += 'MONTHLY';
      if (todo.repeatUntil) {
        rule += `;UNTIL=${todo.repeatUntil.replace(/-/g, '')}`;
      } else if (todo.occurrences) {
        rule += `;COUNT=${todo.occurrences}`;
      }
      event.recurrence = [rule];
    }
    try {
      let response;
      if (todo.calendarEventId) {
        // Update existing event
        response = await gapi.client.calendar.events.update({
          calendarId: 'primary',
          eventId: todo.calendarEventId,
          resource: event
        });
      } else {
        // Create new event
        response = await gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: event
        });
      }
      // Store the event id in your todo for future reference
      if (todo.id && response && response.result && response.result.id) {
        await this.todoService.updateTodo(todo.id, { ...todo, calendarEventId: response.result.id });
      }
    } catch (err) {
      console.error('Failed to create/update Google Calendar event', err);
    }
  }

  async ensureGoogleCalendarToken(): Promise<void> {
    // Use GIS to get an access token and set it for gapi
    if (this.gisToken) {
      (window as any).gapi.client.setToken({ access_token: this.gisToken });
      return;
    }
    const clientId = firebaseConfig.clientId;
    const SCOPES = 'https://www.googleapis.com/auth/calendar';
    await new Promise<void>((resolve, reject) => {
      (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.gisToken = tokenResponse.access_token;
            (window as any).gapi.client.setToken({ access_token: this.gisToken });
            resolve();
          } else {
            reject('Failed to get GIS access token');
          }
        }
      }).requestAccessToken();
    });
  }
}
