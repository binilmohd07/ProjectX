import { Component, OnInit } from '@angular/core';
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
  showAddTaskForm = false;
  editingIndex: number | null = null;
  editForm: FormGroup;
  todoForm: FormGroup;
  userId: string = '';
  loading = true;

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private authService: AuthService // Inject AuthService
  ) {
    this.todoForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: ['', dueDateValidator()]
    });

    this.editForm = this.fb.group({
      task: ['', Validators.required],
      description: [''],
      dueDate: ['']
    });
  }
  startEditTask(index: number) {
    this.editingIndex = index;
    const task = this.tasks[index];
    this.editForm.setValue({
      task: task.title,
      description: task.description || '',
      dueDate: task.dueDate || ''
    });
  }

  saveEditTask(index: number) {
    const task = this.tasks[index];
    if (task.id && this.editForm.valid) {
      const updated: TodoItem = {
        ...task,
        title: this.editForm.value.task,
        description: this.editForm.value.description,
        dueDate: this.editForm.value.dueDate
      };
      this.todoService.updateTodo(task.id, updated).then(() => {
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

  addTask() {
    if (this.todoForm.valid) {
      const newTodo: TodoItem = {
        userId: this.userId, // Uses Google logged-in user ID
        title: this.todoForm.value.task,
        description: this.todoForm.value.description,
        completed: false,
        dueDate: this.todoForm.value.dueDate
      };
      this.todoService.addTodo(newTodo).then(() => {
        this.todoForm.reset();
        this.fetchTodos();
        // Sorting will be handled in fetchTodos
      });
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
