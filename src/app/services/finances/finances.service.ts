import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { firebaseConfig } from '../../firebase.config'; // Adjust path if needed

export interface Finance {
  id?: string;
  name: string;
  type: number;
  remarks: string;
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

  addFinance(finance: Finance): Promise<void> {
    const financesCol = collection(this.db, 'finances');
    return addDoc(financesCol, finance).then(() => { });
  }
}