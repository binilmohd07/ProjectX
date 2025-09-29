import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { firebaseConfig } from '../../firebase.config';

export interface Expense {
  expenseId?: string;
  expenseName: string;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'one-time';
  dueDate: string;
  amount: number;
  netAmountYearly: number;
  netAmountMonthly: number;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private db;

  constructor() {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  getExpenses(): Observable<Expense[]> {
    const expensesCol = collection(this.db, 'expenses');
    return from(
      getDocs(expensesCol).then(snapshot =>
        snapshot.docs.map(doc => ({ expenseId: doc.id, ...doc.data() } as Expense))
      )
    );
  }

  addExpense(expense: Expense, googleUserId: string): Promise<void> {
    const expensesCol = collection(this.db, 'expenses');
    expense.userId = googleUserId;
    return addDoc(expensesCol, expense).then(docRef => {
      // Store Firestore document ID as expenseId
      return updateDoc(docRef, { expenseId: docRef.id });
    });
  }

  updateExpense(expenseId: string, expense: Expense): Promise<void> {
    const expenseDoc = doc(this.db, 'expenses', expenseId);
    return updateDoc(expenseDoc, { ...expense });
  }

  deleteExpense(expenseId: string): Promise<void> {
    const expenseDoc = doc(this.db, 'expenses', expenseId);
    return deleteDoc(expenseDoc);
  }
}
