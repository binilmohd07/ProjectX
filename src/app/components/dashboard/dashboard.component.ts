import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.getLoggedInUserDetails()
  }
  user: any;


  getLoggedInUserDetails() {
    this.user = this.authService.getUser()
  }

  logout() {
    this.authService.logout().then(() => {
      this.user = null;
      this.router.navigate(['/login']);
    });
  }
}
