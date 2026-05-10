import { Component, Input } from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {DecimalPipe} from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-metrics-card',
  standalone: true,
  templateUrl: './metrics-card.component.html',
  imports: [
    MatCard,
    MatCardContent,
    DecimalPipe,
    TranslateModule
  ],
  styleUrls: ['./metrics-card.component.css']
})
export class MetricsCardComponent {
  @Input() costPerKg!: number;
  @Input() potentialMargin!: number;
  @Input() suggestedPrice!: number;
  @Input() currencySymbol = 'S/.';
}