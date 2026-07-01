import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryApiEndpoint } from '../infrastructure/inventory-api-endpoint';
import type { InventoryEntry } from '../domain/model/inventory-entry.entity';

@Injectable({
  providedIn: 'root',
})
export class InventoryApi {
  constructor(private readonly inventoryApiEndpoint: InventoryApiEndpoint) {}

  getAll(): Observable<InventoryEntry[]> {
    return this.inventoryApiEndpoint.getAll();
  }

  create(entity: InventoryEntry): Observable<InventoryEntry> {
    return this.inventoryApiEndpoint.create(entity);
  }

  update(id: number, entity: InventoryEntry): Observable<InventoryEntry> {
    return this.inventoryApiEndpoint.update(entity, id);
  }

  delete(id: number): Observable<void> {
    return this.inventoryApiEndpoint.delete(id);
  }

  getByCoffeeLotId(coffeeLotId: number): Observable<InventoryEntry[]> {
    return this.inventoryApiEndpoint.getByCoffeeLotId(coffeeLotId);
  }
}