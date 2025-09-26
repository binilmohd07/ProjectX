import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  user: any;
  isFinancesPage = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.getLoggedInUserDetails();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isFinancesPage = event.urlAfterRedirects.includes('/dashboard/finances');
      }
    });
  }

  getLoggedInUserDetails() {
    this.user = this.authService.getUser();
    console.log(this.user);
  }

  logout() {
    this.authService.logout().then(() => {
      this.user = null;
      this.router.navigate(['/login']);
    });
  }

  onSettings() {
    // TODO: Implement settings navigation or dialog
    alert('Settings clicked!');
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
