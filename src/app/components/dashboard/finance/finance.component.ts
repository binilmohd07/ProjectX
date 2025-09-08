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
      date: [''],
      incomeId: [''],
      expenseId: [''],
      savingId: [''],
      category: [''],
      paymentMethod: [''],
      source: [''],
      goal: [''],
      savingsType: [''], // <-- Add this line
      note: [''],
      dueDate: [''],
      maturityDate: [''],
      currentValue: [''], // <-- Add this line
      numInstallments: [''],
      lastDueDate: [''],
      maturityAmount: [''] // <-- Add this line
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
        type: 3,
        savingId: 'SAV_FD',
        userId: 'USER123',
        amount: 100000,
        date: '2025-09-08',
        source: 'Bank',
        goal: 'Fixed Deposit',
        savingsType: 'FD',
        maturityAmount: 120000,
        maturityDate: '2028-09-08',
        note: '5 year FD'
      },
      {
        type: 3,
        savingId: 'SAV_SIP',
        userId: 'USER123',
        amount: 5000,
        date: '2025-09-08',
        source: 'Mutual Fund',
        goal: 'Monthly SIP',
        savingsType: 'SIP',
        dueDate: '2025-09-15',
        currentValue: 55000,
        maturityDate: '2030-09-08',
        note: 'SIP for retirement'
      },
      {
        type: 3,
        savingId: 'SAV_POST',
        userId: 'USER123',
        amount: 20000,
        date: '2025-09-08',
        source: 'Post Office',
        goal: 'Post Office Savings',
        savingsType: 'POST',
        maturityAmount: 25000,
        maturityDate: '2027-09-08',
        note: 'Post office scheme'
      },
      {
        type: 3,
        savingId: 'SAV_PPF',
        userId: 'USER123',
        amount: 150000,
        date: '2025-09-08',
        source: 'Bank',
        goal: 'PPF Account',
        savingsType: 'PPF',
        currentValue: 180000,
        maturityDate: '2035-09-08',
        note: 'Long term PPF'
      },
      {
        type: 3,
        savingId: 'SAV_INSURANCE',
        userId: 'USER123',
        amount: 12000,
        date: '2025-09-08',
        source: 'LIC',
        goal: 'Life Insurance',
        savingsType: 'INSURANCE',
        numInstallments: 12,
        lastDueDate: '2025-08-31',
        maturityAmount: 200000,
        maturityDate: '2040-09-08',
        note: 'LIC policy'
      },
      {
        type: 3,
        savingId: 'SAV_PF',
        userId: 'USER123',
        amount: 80000,
        date: '2025-09-08',
        source: 'Employer',
        goal: 'Provident Fund',
        savingsType: 'PF',
        maturityDate: '2030-09-08',
        note: 'PF contribution'
      },
      {
        type: 3,
        savingId: 'SAV_STOCKS',
        userId: 'USER123',
        amount: 50000,
        date: '2025-09-08',
        source: 'Stock Market',
        goal: 'Equity Investment',
        savingsType: 'STOCKS',
        currentValue: 65000,
        maturityDate: '2026-09-08',
        note: 'Stocks portfolio'
      },
      {
        type: 3,
        savingId: 'SAV_CRYPTO',
        userId: 'USER123',
        amount: 10000,
        date: '2025-09-08',
        source: 'Crypto Exchange',
        goal: 'Crypto Investment',
        savingsType: 'CRYPTO',
        currentValue: 12000,
        maturityDate: '2027-09-08',
        note: 'Crypto assets'
      },
      {
        type: 3,
        savingId: 'SAV_ACCOUNT_BALANCE',
        userId: 'USER123',
        amount: 25000,
        date: '2025-09-08',
        source: 'Bank',
        goal: 'Account Balance',
        savingsType: 'ACCOUNT BALANCE',
        maturityDate: '2025-09-08',
        note: 'Current account balance'
      }
    ];
    Promise.all(samples.map(sample => this.financesService.addFinance(sample, this.user.uid))).then(() => {
      this.loadFinances(); // Refresh after adding samples
      this.hideAddFinanceForm(); // Hide form and show cards
    });
  }

  getTotal(type: number): number {
    return this.finances
      .filter(f => f.type === type && f.userId === this.user?.uid)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }

  setTypeFilter(type: number | null) {
    this.selectedType = type;
    if (this.showAddForm) {
      this.hideAddFinanceForm();
    }
  }

  get filteredFinances(): Finance[] {
    let list = this.finances;
    if (this.selectedType !== null) {
      list = list.filter(f => f.type === this.selectedType);
    }
    // Filter by logged-in user
    if (this.user?.uid) {
      list = list.filter(f => f.userId === this.user.uid);
    }
    return list;
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
