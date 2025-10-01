import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FinanceComponent } from './components/dashboard/finance/finance.component';
import { DashboardHomeComponent } from './components/dashboard/dashboard-home/dashboard-home.component';
import { TodoListComponent } from './components/dashboard/todo-list/todo-list.component';
import { ExpensesComponent } from './components/dashboard/finance/expenses/expenses.component';
import { SavingsComponent } from './components/dashboard/finance/savings/savings.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    FinanceComponent,
    DashboardHomeComponent,
    TodoListComponent,
    ExpensesComponent,
    SavingsComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatCheckboxModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommonModule,
    MatTableModule,
    MatDialogModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
