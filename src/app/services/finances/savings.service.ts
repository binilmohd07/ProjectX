
import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { firebaseConfig } from '../../firebase.config';

export interface Saving {
  savingId: string;
  name: string;
  type: string;
  savingsType: string;
  userId: string;
  maturityDate: string;
  currentValue: number;
  maturityAmount: number;
}

@Injectable({
  providedIn: 'root'
})

export class SavingsService {
  private db;

  constructor() {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  getSavings(): Observable<Saving[]> {
    const savingsCol = collection(this.db, 'savings');
    return from(
      getDocs(savingsCol).then(snapshot =>
        snapshot.docs.map(doc => ({ savingId: doc.id, ...doc.data() } as Saving))
      )
    );
  }

  addSaving(saving: Omit<Saving, 'savingId'>): Promise<void> {
    const savingsCol = collection(this.db, 'savings');
    // Do not set savingId in the document data
    return addDoc(savingsCol, { ...saving }).then(() => { });
  }

  updateSaving(savingId: string, saving: Omit<Saving, 'savingId'>): Promise<void> {
    const savingDoc = doc(this.db, 'savings', savingId);
    return updateDoc(savingDoc, { ...saving });
  }

  deleteSaving(savingId: string): Promise<void> {
    const savingDoc = doc(this.db, 'savings', savingId);
    return deleteDoc(savingDoc);
  }
}
