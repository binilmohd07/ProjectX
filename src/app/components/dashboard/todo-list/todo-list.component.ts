import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// ...existing imports...
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { TodoService, TodoItem } from '../../../services/todo/todo.service';
import { AuthService } from '../../../services/auth.service';

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
  calendarMessage: string | null = null;
  showAddTaskForm = false;
  editingIndex: number | null = null;
  editForm: FormGroup;
  todoForm: FormGroup;
  userId: string = '';
  loading = true;

  @ViewChild('calendarIframe') calendarIframe!: ElementRef<HTMLIFrameElement>;

  refreshCalendarIframe() {
    if (this.calendarIframe && this.calendarIframe.nativeElement) {
      const src = this.calendarIframe.nativeElement.src;
      this.calendarIframe.nativeElement.src = src;
    }
  }

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private authService: AuthService // Inject AuthService
  ) {
    this.todoForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: ['', dueDateValidator()],
      frequency: ['one time', Validators.required],
      addToCalendar: [false]
    });

    this.editForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: [''],
      frequency: ['one time', Validators.required],
      addToCalendar: [false]
    });
  }
  startEditTask(index: number) {
    this.editingIndex = index;
    const task = this.tasks[index];
    this.editForm.setValue({
      task: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      frequency: task.frequency || 'one time',
      addToCalendar: !!task.addToCalendar
    });
  }

  async saveEditTask(index: number) {
    const task = this.tasks[index];
    if (task.id && this.editForm.valid) {
      const updated: TodoItem = {
        ...task,
        title: this.editForm.value.task,
        description: this.editForm.value.description,
        dueDate: this.editForm.value.dueDate,
        frequency: this.editForm.value.frequency,
        addToCalendar: this.editForm.value.addToCalendar
      };
      this.todoService.updateTodo(task.id, updated).then(async () => {
        if (this.editForm.value.addToCalendar) {
          await this.addEventToGoogleCalendar(updated);
        }
        this.editingIndex = null;
        this.fetchTodos();
      });
    }
  }

  cancelEditTask() {
    this.editingIndex = null;
  }

  tasks: TodoItem[] = [];

  ngOnInit() {
    const user = this.authService.getUser();
    this.userId = user?.uid || '';
    this.fetchTodos();
  }

  fetchTodos() {
    this.todoService.getTodos(this.userId).subscribe(todos => {
      // Sort: incomplete first, completed last
      this.tasks = todos.sort((a, b) => Number(a.completed) - Number(b.completed));
      this.loading = false;
      // Show add task form if no tasks exist
      this.showAddTaskForm = this.tasks.length === 0;
    });
  }

  toggleAddTaskForm() {
    this.showAddTaskForm = !this.showAddTaskForm;
  }

  async addTask() {
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
      this.todoService.addTodo(newTodo).then(async () => {
        if (this.todoForm.value.addToCalendar) {
          await this.addEventToGoogleCalendar(newTodo);
        }
        this.todoForm.reset();
        this.fetchTodos();
        // Sorting will be handled in fetchTodos
      });
    }
  }
  async addEventToGoogleCalendar(todo: TodoItem) {
    // @ts-ignore
    const gapi = window['gapi'];
    if (!gapi || !gapi.client || !gapi.client.calendar) return;
    const event: any = {
      summary: todo.title,
      description: todo.description || '',
      start: {
        date: todo.dueDate || new Date().toISOString().slice(0, 10)
      },
      end: {
        date: todo.dueDate || new Date().toISOString().slice(0, 10)
      }
    };
    // Set recurrence based on frequency
    switch (todo.frequency) {
      case 'daily':
        event.recurrence = ['RRULE:FREQ=DAILY'];
        break;
      case 'weekly':
        event.recurrence = ['RRULE:FREQ=WEEKLY'];
        break;
      case 'monthly':
        event.recurrence = ['RRULE:FREQ=MONTHLY'];
        break;
      default:
        break;
    }
    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      this.calendarMessage = 'Event added to Google Calendar!';
      setTimeout(() => { this.calendarMessage = null; }, 4000);
    } catch (e) {
      this.calendarMessage = 'Failed to add event to Google Calendar.';
      setTimeout(() => { this.calendarMessage = null; }, 4000);
      console.error('Failed to add event to Google Calendar', e);
    }
  }

  removeTask(index: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    const todo = this.tasks[index];
    if (todo.id) {
      this.todoService.deleteTodo(todo.id).then(() => {
        this.fetchTodos();
        // Sorting will be handled in fetchTodos
      });
    }
  }

  toggleTask(index: number) {
    const todo = this.tasks[index];
    if (todo.id) {
      this.todoService.updateTodo(todo.id, { ...todo, completed: !todo.completed }).then(() => {
        this.fetchTodos();
        // Sorting will be handled in fetchTodos
      });
    }
  }

  getCompletedControl(taskCtrl: AbstractControl): FormControl {
    return taskCtrl.get('completed') as FormControl;
  }
}
