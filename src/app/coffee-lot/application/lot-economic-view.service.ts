import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { CoffeeLotApi } from './coffee-lot.api';
import type { CoffeeLot } from '../domain/model/coffee-lot.entity';
import { InventoryApi } from '../../inventory/application/inventory.api';
import type { InventoryEntry } from '../../inventory/domain/model/inventory-entry.entity';
import { ProductionCostRecordApi } from '../../production-cost-record/application/production-cost-record.api';
import type { ProductionCostRecord } from '../../production-cost-record/domain/model/production-cost-record.entity';

export interface LotEconomicViewData {
  lot: CoffeeLot;
  movements: InventoryEntry[];
  activeCost: ProductionCostRecord | null;
  showIncompleteWarning: boolean;
  missingInventory: boolean;
  missingCosts: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LotEconomicViewService {
  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly inventoryApi: InventoryApi,
    private readonly productionCostRecordApi: ProductionCostRecordApi,
  ) {}

  loadByLotId(lotId: number): Observable<LotEconomicViewData> {
    return forkJoin({
      lot: this.coffeeLotApi.getById(lotId),
      movements: this.inventoryApi.getByCoffeeLotId(lotId),
      costs: this.productionCostRecordApi.getByCoffeeLotId(lotId),
    }).pipe(map(({ lot, movements, costs }) => this.buildViewData(lot, movements, costs)));
  }

  private buildViewData(
    lot: CoffeeLot,
    movements: InventoryEntry[],
    costs: ProductionCostRecord[],
  ): LotEconomicViewData {
    const missingInventory = movements.length === 0;
    const missingCosts = costs.length === 0;
    const activeCost = costs.length > 0 ? costs[0] : null;

    return {
      lot,
      movements,
      activeCost,
      missingInventory,
      missingCosts,
      showIncompleteWarning: missingInventory || missingCosts,
    };
  }
}
