import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { CoffeeLot } from '../../../domain/model/coffee-lot.entity';
import {
  LotEconomicViewData,
  LotEconomicViewService,
} from '../../../application/lot-economic-view.service';
import { MetricsCardComponent } from '../../../../cost-management/presentation/components/metrics-card/metrics-card.component';
import { ConsumptionTableComponent } from '../../../../inventory/presentation/components/consumption-table/consumption-table.component';

export interface LotEconomicAnalysisDialogData {
  lotId: number;
}

@Component({
  selector: 'app-lot-economic-analysis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    TranslateModule,
    MetricsCardComponent,
    ConsumptionTableComponent,
  ],
  templateUrl: './lot-economic-analysis-dialog.component.html',
  styleUrls: ['./lot-economic-analysis-dialog.component.css'],
})
export class LotEconomicAnalysisDialogComponent implements OnInit {
  viewData: LotEconomicViewData | null = null;
  loading = false;
  loadError = false;

  constructor(
    private readonly dialogRef: MatDialogRef<LotEconomicAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: LotEconomicAnalysisDialogData,
    private readonly lotEconomicViewService: LotEconomicViewService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.lotEconomicViewService.loadByLotId(this.data.lotId).subscribe({
      next: (data: LotEconomicViewData) => {
        this.viewData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  get currencySymbol(): string {
    const currency = this.viewData?.activeCost?.currency;
    return currency === 'USD' ? '$' : 'S/.';
  }

  get selectedLots(): CoffeeLot[] {
    if (!this.viewData?.lot) {
      return [];
    }
    return [this.viewData.lot];
  }

  getStatusText(status: string | undefined): string {
    if (status === 'green') {
      return this.translate.instant('FORM.STATUS_OPTIONS.GREEN');
    }
    if (status === 'roasted') {
      return this.translate.instant('FORM.STATUS_OPTIONS.ROASTED');
    }
    return status || this.translate.instant('COMMON.NOT_AVAILABLE');
  }
}
