import { Component, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SavingsService } from '../../../../services/finances/savings.service';
import { AuthService } from '../../../../services/auth.service';
import { FinanceSyncService } from '../../../../services/finances/finance-sync.service';

@Component({
  selector: 'app-savings',
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss'
})
export class SavingsComponent implements OnInit {
  @ViewChild('savingsFormRef') savingsFormRef!: ElementRef;
  @ViewChildren('groupCardRef', { read: ElementRef }) groupCardRefs!: QueryList<ElementRef>;
  // ...existing code...
  getGroupTotalAmount(group: any[]): number {
    return group.reduce((sum, s) => sum + (s.amount || 0), 0);
  }
  getGroupTotalCurrentValue(group: any[]): number {
    return group.reduce((sum, s) => sum + (s.currentValue || 0), 0);
  }
  getGroupTotalMaturityAmount(group: any[]): number {
    return group.reduce((sum, s) => sum + (s.maturityAmount || 0), 0);
  }
  showAddForm = false;
  savingsForm: FormGroup;
  submitted = false;
  successMessage = '';

  user: any;

  isTableView = true;
  savingsList: any[] = [];
  groupedSavings: { [type: string]: any[] } = {};
  expandedGroups: { [type: string]: boolean } = {};
  displayedColumns: string[] = ['name', 'savingsType', 'maturityDate', 'currentValue', 'maturityAmount'];

  editingSavingId: string | null = null;
  editSaving(saving: any): void {
    this.editingSavingId = saving.savingId;
    this.savingsForm.patchValue({
      name: saving.name,
      savingsType: saving.savingsType,
      maturityDate: saving.maturityDate,
      dueDate: saving.dueDate || '',
      appName: saving.appName || '',
      currentValue: saving.currentValue,
      maturityAmount: saving.maturityAmount,
      amount: saving.amount,
      lastUpdated: new Date().toISOString()
    });
    this.successMessage = '';
    this.showAddForm = true;
    setTimeout(() => {
      if (this.savingsFormRef && this.savingsFormRef.nativeElement) {
        this.savingsFormRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  deleteSaving(savingId: string): void {
    if (savingId) {
      this.savingsService.deleteSaving(savingId).then(() => {
        this.loadSavings();
        this.successMessage = 'Saving deleted.';
        if (this.editingSavingId === savingId) {
          this.editingSavingId = null;
          this.savingsForm.reset();
        }
      });
    }
  }

  constructor(
    private fb: FormBuilder,
    private savingsService: SavingsService,
    private authService: AuthService,
    private financeSyncService: FinanceSyncService
  ) {
    this.savingsForm = this.fb.group({
      name: ['', Validators.required],
      savingsType: ['', Validators.required],
      maturityDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      appName: ['', Validators.required],
      currentValue: [0, [Validators.required, Validators.min(0)]],
      maturityAmount: [0, [Validators.required, Validators.min(0)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      lastUpdated: ['']
    });
    this.user = this.authService.getUser();
  }

  ngOnInit() {
    this.loadSavings();
  }

  loadSavings(): void {
    this.savingsService.getSavings().subscribe((savings: any[]) => {
      this.savingsList = savings.filter((s: any) => s.userId === this.user?.uid);
      this.groupedSavings = {};
      this.savingsList.forEach(saving => {
        const type = saving.savingsType;
        if (!this.groupedSavings[type]) {
          this.groupedSavings[type] = [];
        }
        this.groupedSavings[type].push(saving);
      });
    });
  }

  toggleGroup(type: string): void {
    // Collapse all groups except the one being toggled
    Object.keys(this.expandedGroups).forEach(key => {
      this.expandedGroups[key] = false;
    });
    this.expandedGroups[type] = !this.expandedGroups[type];
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.savingsForm.valid && this.user?.uid) {
      // Always update lastUpdated to now before submit
      this.savingsForm.patchValue({ lastUpdated: new Date().toISOString() });
      let formValue = {
        ...this.savingsForm.value,
        userId: this.user.uid
      };
      if (this.editingSavingId) {
        // Remove savingId from payload if present
        if ('savingId' in formValue) {
          delete (formValue as any).savingId;
        }
        this.savingsService.updateSaving(this.editingSavingId, formValue)
          .then(() => {
            this.successMessage = 'Saving updated successfully!';
            this.savingsForm.reset();
            this.submitted = false;
            this.editingSavingId = null;
            this.showAddForm = false;
            this.loadSavings();
            this.financeSyncService.notifySavingsChanged();
            // Scroll to the open group card after update
            setTimeout(() => {
              if (this.groupCardRefs && this.groupCardRefs.length > 0) {
                const openGroup = Object.keys(this.expandedGroups).find(key => this.expandedGroups[key]);
                if (openGroup) {
                  const ref = this.groupCardRefs.find((el: ElementRef) => el.nativeElement.dataset.groupKey === openGroup);
                  if (ref && ref.nativeElement) {
                    ref.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }
            }, 300);
          })
          .catch(() => {
            this.successMessage = 'Error updating saving.';
          });
      } else {
        this.savingsService.addSaving(formValue)
          .then(() => {
            this.successMessage = 'Saving added successfully!';
            this.savingsForm.reset();
            this.submitted = false;
            this.showAddForm = false;
            this.loadSavings();
            this.financeSyncService.notifySavingsChanged();
          })
          .catch(() => {
            this.successMessage = 'Error adding saving.';
          });
      }
    }
  }
  cancelEdit(): void {
    this.editingSavingId = null;
    this.savingsForm.reset();
    this.successMessage = '';
    this.submitted = false;
    this.showAddForm = false;
  }

  onCreateNew(): void {
    this.editingSavingId = null;
    this.savingsForm.reset();
    this.successMessage = '';
    this.submitted = false;
    this.showAddForm = true;
    setTimeout(() => {
      if (this.savingsFormRef && this.savingsFormRef.nativeElement) {
        this.savingsFormRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }
}
