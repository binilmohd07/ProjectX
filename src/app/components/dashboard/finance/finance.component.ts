import { Component } from '@angular/core';
import { Finance, FinancesService } from '../../../services/finances/finances.service';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent {
  finances: Finance[] = [];

  constructor(private financesService: FinancesService) { }

  ngOnInit() {
    this.financesService.getFinances().subscribe(data => {
      this.finances = data;
    });
  }

  addSample() {
    const sample: Finance = {
      name: 'Sample Finance',
      type: 1,
      remarks: 'Added from Angular'
    };
    this.financesService.addFinance(sample);
  }
}
