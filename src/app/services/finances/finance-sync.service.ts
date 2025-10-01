import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceSyncService {
    private expenseChangedSource = new Subject<void>();
    expenseChanged$ = this.expenseChangedSource.asObservable();

    notifyExpenseChanged() {
        this.expenseChangedSource.next();
    }
}
