import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Expense, ExpensesService } from '../../../../services/finances/expenses.service';
import { AuthService } from '../../../../services/auth.service';
import { FinanceSyncService } from '../../../../services/finances/finance-sync.service';


@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  isTableView: boolean = true;
  displayedColumns: string[] = [
    'expenseName', 'frequency', 'dueDate', 'amount', 'netAmountYearly', 'netAmountMonthly'
  ];
  expenseForm: FormGroup;
  editingExpenseId: string | null = null;
  showForm: boolean = false;
  user: any;

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    private authService: AuthService,
    private financeSyncService: FinanceSyncService
  ) {
    this.expenseForm = this.fb.group({
      expenseName: ['', Validators.required],
      frequency: ['', Validators.required],
      dueDate: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      netAmountYearly: [null],
      netAmountMonthly: [null]
    });
    this.user = this.authService.getUser();
  }

  ngOnInit(): void {
    this.expensesService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
    });
    this.expenseForm.get('frequency')?.valueChanges.subscribe(() => this.calculateNetAmounts());
    this.expenseForm.get('amount')?.valueChanges.subscribe(() => this.calculateNetAmounts());
    this.expenseForm.get('netAmountYearly')?.disable();
    this.expenseForm.get('netAmountMonthly')?.disable();
  }

  toggleView(): void {
    this.isTableView = !this.isTableView;
  }

  editExpense(expense: Expense): void {
    this.editingExpenseId = expense.expenseId || null; // Assign null if expenseId is undefined
    this.expenseForm.patchValue(expense);
    this.showForm = true;
  }

  saveExpense(): void {
    if (this.expenseForm.valid && this.editingExpenseId) {
      const updatedExpense: Expense = { ...this.expenseForm.value, expenseId: this.editingExpenseId };
      this.expensesService.updateExpense(this.editingExpenseId, updatedExpense).then(() => {
        this.editingExpenseId = null;
        this.expenseForm.reset();
        this.refreshExpenses();
      });
    }
  }

  deleteExpense(expenseId: string): void {
    if (!expenseId) {
      console.error('Expense ID is undefined or invalid');
      return;
    }
      if (!confirm('Are you sure you want to delete this expense?')) {
        return;
      }
    console.log(`Attempting to delete expense with ID: ${expenseId}`);
    this.expensesService.deleteExpense(expenseId).then(() => {
      console.log(`Expense with ID ${expenseId} deleted successfully.`);
      this.refreshExpenses();
    }).catch(error => {
      console.error(`Error deleting expense with ID ${expenseId}:`, error);
    });
  }

  refreshExpenses(): void {
    this.expensesService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
    });
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const expense: Expense = this.expenseForm.value;

      // Calculate netAmountYearly and netAmountMonthly based on frequency and amount
      const amount = expense.amount || 0;
      const frequency = expense.frequency;

      switch (frequency) {
        case 'yearly':
          expense.netAmountYearly = amount;
          expense.netAmountMonthly = amount / 12;
          break;
        case 'monthly':
          expense.netAmountMonthly = amount;
          expense.netAmountYearly = amount * 12;
          break;
        default:
          expense.netAmountYearly = 0;
          expense.netAmountMonthly = 0;
      }

      if (this.editingExpenseId) {
        // Update existing expense
        this.expensesService.updateExpense(this.editingExpenseId, expense).then(() => {
          this.editingExpenseId = null;
          this.expenseForm.reset();
          this.refreshExpenses();
          this.financeSyncService.notifyExpenseChanged();
        });
      } else {
        // Add new expense
        const googleUserId = this.authService.getUser()?.uid || '';
        expense.userId = googleUserId;
        this.expensesService.addExpense(expense, googleUserId).then(() => {
          this.expenseForm.reset();
          this.refreshExpenses();
          this.financeSyncService.notifyExpenseChanged();
        });
      }
    }
  }

  calculateNetAmounts(): void {
    const amount = this.expenseForm.get('amount')?.value || 0;
    const frequency = this.expenseForm.get('frequency')?.value;

    if (frequency === 'yearly') {
      this.expenseForm.patchValue({
        netAmountYearly: amount,
        netAmountMonthly: amount / 12
      });
    } else if (frequency === 'monthly') {
      this.expenseForm.patchValue({
        netAmountMonthly: amount,
        netAmountYearly: amount * 12
      });
    } else {
      this.expenseForm.patchValue({
        netAmountYearly: null,
        netAmountMonthly: null
      });
    }
  }

  getFormattedDueDate(expense: Expense): string {
    if (!expense.dueDate) return '';
    const dateObj = new Date(expense.dueDate);
    const day = dateObj.getDate();
    const suffix = (day === 1) ? 'st' : (day === 2) ? 'nd' : (day === 3) ? 'rd' : 'th';

    if (expense.frequency === 'monthly') {
      return `${day}${suffix} of every month`;
    } else if (expense.frequency === 'yearly') {
      return `${day}${suffix} of every year`;
    } else {
      // For weekly or one-time, just show the date in a readable format
      return dateObj.toLocaleDateString();
    }
  }

  round(value: number, decimals: number = 2): number {
    if (typeof value !== 'number') return value;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  onCreateNew(): void {
    this.showForm = true;
    this.editingExpenseId = null;
    this.expenseForm.reset();
  }

  onCancel(): void {
    this.showForm = false;
    this.editingExpenseId = null;
    this.expenseForm.reset();
  }

  onFormSubmit(): void {
    this.onSubmit();
    this.showForm = false;
    this.editingExpenseId = null;
  }

  getTotal(key: 'amount' | 'netAmountYearly' | 'netAmountMonthly'): number {
    return this.expenses.reduce((sum, expense) => sum + (Number(expense[key]) || 0), 0);
  }
}
