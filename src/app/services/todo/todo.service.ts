import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { firebaseConfig } from '../../firebase.config';

export interface TodoItem {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt?: string;
  dueDate?: string; // <-- Optional due date
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private db;

  constructor() {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  getTodos(userId: string): Observable<TodoItem[]> {
    const todosCol = collection(this.db, 'todos');
    return from(
      getDocs(todosCol).then(snapshot =>
        snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TodoItem))
          .filter(todo => todo.userId === userId)
      )
    );
  }

  addTodo(todo: TodoItem): Promise<void> {
    const todosCol = collection(this.db, 'todos');
    todo.createdAt = new Date().toISOString();
    return addDoc(todosCol, todo).then(() => { });
  }

  updateTodo(id: string, todo: TodoItem): Promise<void> {
    const todoDoc = doc(this.db, 'todos', id);
    return updateDoc(todoDoc, { ...todo });
  }

  deleteTodo(id: string): Promise<void> {
    const todoDoc = doc(this.db, 'todos', id);
    return deleteDoc(todoDoc);
  }
}
