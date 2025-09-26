import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './services/auth.guard';
import { LoginGuard } from './services/guards/login.guard';
import { DashboardHomeComponent } from './components/dashboard/dashboard-home/dashboard-home.component';
import { FinanceComponent } from './components/dashboard/finance/finance.component';
import { TodoListComponent } from './components/dashboard/todo-list/todo-list.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent }, // Dashboard home
      {
        path: 'finances',
        component: FinanceComponent,
        canActivate: [AuthGuard],
      }, {
        path: 'to-do',
        component: TodoListComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
