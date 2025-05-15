import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponentComponent } from './components/auth-callback-component/auth-callback-component.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: 'auth/callback', component: AuthCallbackComponentComponent },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
