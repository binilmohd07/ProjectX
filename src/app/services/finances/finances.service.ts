import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { firebaseConfig } from '../../firebase.config'; // Adjust path if needed

export interface Finance {
  id?: string;
  type: number; // 1: Income, 2: Expenses, 3: Savings
  userId: string;
  amount: number;
  date?: string; // Now optional
  // Expenses
  expenseId?: string;
  category?: string;
  paymentMethod?: string;
  dueDate?: string; // New field
  // Savings
  savingId?: string;
  goal?: string;
  source?: string;
  maturityDate?: string; // New field
  // Income
  incomeId?: string;
  // Common
  note?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinancesService {

  private db;

  constructor() {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  getFinances(): Observable<Finance[]> {
    const financesCol = collection(this.db, 'finances');
    return from(
      getDocs(financesCol).then(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Finance))
      )
    );
  }

  addFinance(finance: Finance, googleUserId: string): Promise<void> {
    const financesCol = collection(this.db, 'finances');
    const uniqueId = crypto.randomUUID();

    // Assign unique IDs based on type
    if (finance.type === 1) {
      finance.incomeId = uniqueId;
    } else if (finance.type === 2) {
      finance.expenseId = uniqueId;
    } else if (finance.type === 3) {
      finance.savingId = uniqueId;
    }

    finance.userId = googleUserId;

    return addDoc(financesCol, finance).then(() => { });
  }

  updateFinance(id: string, finance: Finance): Promise<void> {
    const financeDoc = doc(this.db, 'finances', id);
    return updateDoc(financeDoc, { ...finance });
  }

  deleteFinance(id: string): Promise<void> {
    const financeDoc = doc(this.db, 'finances', id);
    return deleteDoc(financeDoc);
  }
}