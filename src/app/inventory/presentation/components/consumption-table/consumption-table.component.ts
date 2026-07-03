import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryEntry } from '../../../domain/model/inventory-entry.entity';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { ConsumptionDetailDialogComponent } from '../consumption-detail-dialog/consumption-detail-dialog.component';

export interface ConsumptionTableItem {
  id: number;
  date: string;
  lotName: string;
  consumptionKg: number;
  lotId: number;
  consumptionReason: string;
  usageNotes?: string | null;
  coffeeType?: string;
  status?: string;
  
  currentLotStockKg: number | null;
  sortTs: number;
}

@Component({
  selector: 'app-consumption-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, TranslateModule],
  templateUrl: './consumption-table.component.html',
  styleUrls: ['./consumption-table.component.css'],
})
export class ConsumptionTableComponent implements OnChanges {
  @Input() consumptionEntries: InventoryEntry[] = [];
  @Input() lots: CoffeeLot[] = [];

  tableData: ConsumptionTableItem[] = [];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.updateTableData();
  }

  updateTableData(): void {
    this.tableData = this.consumptionEntries
      .map((entry) => {
        const lot = this.lots.find((l) => Number(l.id) === Number(entry.coffeeLotId));
        const used = new Date(entry.dateUsed);
        return {
          id: entry.id ?? 0,
          date: Number.isFinite(used.getTime())
            ? used.toLocaleDateString()
            : String(entry.dateUsed),
          lotName: lot
            ? lot.lot_name
            : this.translate.instant('INVENTORY.CONSUMPTION_TABLE.LOT_FALLBACK', {
                id: entry.coffeeLotId,
              }),
          consumptionKg: entry.quantityUsed,
          lotId: entry.coffeeLotId,
          consumptionReason: this.consumptionReasonLabel(entry.consumptionReason),
          usageNotes: entry.usageNotes?.trim(),
          coffeeType: lot
            ? lot.coffee_type
            : this.translate.instant('COMMON.NOT_AVAILABLE'),
          status: lot
            ? lot.status
            : this.translate.instant('COMMON.NOT_AVAILABLE'),
          currentLotStockKg: lot != null ? lot.weight : null,
          sortTs: Number.isFinite(used.getTime()) ? used.getTime() : 0,
        };
      })
      .sort((a, b) => b.sortTs - a.sortTs);
  }

  viewConsumptionDetail(item: ConsumptionTableItem): void {
    this.dialog.open(ConsumptionDetailDialogComponent, {
      width: '500px',
      data: item,
    });
  }

  private consumptionReasonLabel(value: string | null | undefined): string {
    const labels: Record<string, string> = {
      bar: 'INVENTORY.CONSUMPTION_REASON.BAR',
      retail: 'INVENTORY.CONSUMPTION_REASON.RETAIL',
      samples: 'INVENTORY.CONSUMPTION_REASON.SAMPLES',
      other: 'INVENTORY.CONSUMPTION_REASON.OTHER',
    };
    return value && labels[value]
      ? this.translate.instant(labels[value])
      : this.translate.instant('COMMON.NOT_AVAILABLE');
  }
}
