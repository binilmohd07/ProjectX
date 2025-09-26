import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent {
  chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // chartData = [{ data: [10, 25, 15, 40, 20], label: 'Visits' }];
  chartData = {
    labels: ['January', 'February', 'March', 'April'],
    datasets: [
      {
        label: 'Sales',
        data: [65, 59, 80, 81],
        fill: false,
        borderColor: 'blue'
      }
    ]
  };

  chartOptions = {
    responsive: true
  };

  isFinancesPage = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isFinancesPage = event.urlAfterRedirects.includes('/dashboard/finances');
      }
    });
  }

  goToFinances() {
    this.router.navigate(['dashboard/finances']);
  }

  goToTodoList() {
    this.router.navigate(['dashboard/to-do']);
  }
}
