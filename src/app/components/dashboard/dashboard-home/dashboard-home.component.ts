import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
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

}
