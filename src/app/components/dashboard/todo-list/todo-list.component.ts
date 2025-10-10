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
    });
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
