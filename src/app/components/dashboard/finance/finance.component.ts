import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Finance, FinancesService } from '../../../services/finances/finances.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent implements OnInit {
  finances: Finance[] = [];
  financeForm: FormGroup;
  editMode = false;
  editId: string | null = null;
  user: any;
  selectedType: number | null = null;
  selectedFinanceIds: Set<string> = new Set();
  showAddForm = false;

  constructor(
    private financesService: FinancesService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.financeForm = this.fb.group({
      type: [1, Validators.required],
      userId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      date: [''], // Not required
      incomeId: [''],
      expenseId: [''],
      savingId: [''],
      category: [''],
      paymentMethod: [''],
      source: [''],
      goal: [''],
      note: [''],
      dueDate: [''],       // New field
      maturityDate: ['']   // New field
    });
    this.getLoggedInUserDetails();
  }
  getLoggedInUserDetails() {
    this.user = this.authService.getUser()
    console.log(this.user)
  }
  ngOnInit() {
    this.loadFinances();
  }

  loadFinances() {
    this.financesService.getFinances().subscribe(data => {
      this.finances = data;
    });
  }

  onSubmit() {
    if (this.editMode && this.editId) {
      this.financesService.updateFinance(this.editId, this.financeForm.value).then(() => {
        this.resetForm();
        this.hideAddFinanceForm();
        this.loadFinances();
      });
    } else {
      this.financesService.addFinance(this.financeForm.value, this.user.uid).then(() => {
        this.resetForm();
        this.hideAddFinanceForm();
        this.loadFinances();
      });
    }
  }

  editFinance(finance: Finance) {
    this.editMode = true;
    this.editId = finance.id ?? null;
    this.financeForm.patchValue(finance);
    this.showAddForm = true;
  }

  deleteFinance(id: string | undefined) {
    if (id) {
      this.financesService.deleteFinance(id).then(() => {
        this.resetForm();
        this.loadFinances(); // Refresh after delete
      });
    }
  }

  resetForm() {
    this.financeForm.reset();
    this.editMode = false;
    this.editId = null;
  }

  addSample() {
    const samples: Finance[] = [
      {
        type: 1,
        incomeId: 'INC001',
        userId: 'USER123',
        amount: 5000,
        date: '2025-09-07',
        source: 'Salary',
        note: 'Monthly salary'
      },
      {
        type: 2,
        expenseId: 'EXP001',
        userId: 'USER123',
        amount: 300,
        date: '2025-09-07',
        category: 'Food',
        paymentMethod: 'Credit Card',
        note: 'Lunch at restaurant'
      },
      {
        type: 3,
        savingId: 'SAV001',
        userId: 'USER123',
        amount: 1000,
        date: '2025-09-07',
        source: 'Bank savings',
        goal: 'Emergency Fund',
        note: 'Monthly savings deposit'
      }
    ];
    Promise.all(samples.map(sample => this.financesService.addFinance(sample, this.user.uid))).then(() => {
      this.loadFinances(); // Refresh after adding samples
    });
  }

  getTotal(type: number): number {
    return this.finances
      .filter(f => f.type === type)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }

  setTypeFilter(type: number | null) {
    this.selectedType = type;
  }

  get filteredFinances(): Finance[] {
    return this.selectedType === null
      ? this.finances
      : this.finances.filter(fin => fin.type === this.selectedType);
  }

  toggleSelectAll(selectAll: boolean) {
    if (selectAll) {
      this.selectedFinanceIds = new Set(this.filteredFinances.map(f => f.id!));
    } else {
      this.selectedFinanceIds.clear();
    }
  }

  toggleSelection(id: string) {
    if (this.selectedFinanceIds.has(id)) {
      this.selectedFinanceIds.delete(id);
    } else {
      this.selectedFinanceIds.add(id);
    }
  }

  deleteSelectedFinances() {
    const ids = Array.from(this.selectedFinanceIds);
    Promise.all(ids.map(id => this.financesService.deleteFinance(id))).then(() => {
      this.selectedFinanceIds.clear();
      this.loadFinances();
    });
  }

  showAddFinanceForm() {
    this.editMode = false;
    this.financeForm.reset();
    this.showAddForm = true;
  }

  hideAddFinanceForm() {
    this.showAddForm = false;
  }
}
