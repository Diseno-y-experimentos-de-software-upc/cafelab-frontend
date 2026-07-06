import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CoffeeLotApiEndpoint } from '../infrastructure/coffee-lot-api-endpoint';
import type { CoffeeLot } from '../domain/model/coffee-lot.entity';

/**
 * Fachada del bounded context Coffee Lot (equivalente a {@code SupplierApi}).
 */
@Injectable({
  providedIn: 'root',
})
export class CoffeeLotApi {
  constructor(private readonly coffeeLotApiEndpoint: CoffeeLotApiEndpoint) {}

  getAll(): Observable<CoffeeLot[]> {
    return this.coffeeLotApiEndpoint.getAll();
  }

  getById(id: number): Observable<CoffeeLot> {
    return this.coffeeLotApiEndpoint.getById(id);
  }

  
  searchLots(query: string): Observable<CoffeeLot[]> {
    const q = query.trim().toLowerCase();
    return this.getAll().pipe(
      map((rows) =>
        !q
          ? rows
          : rows.filter(
              (l) =>
                l.lot_name.toLowerCase().includes(q) ||
                l.coffee_type.toLowerCase().includes(q),
            ),
      ),
    );
  }

  create(entity: CoffeeLot): Observable<CoffeeLot> {
    return this.coffeeLotApiEndpoint.create(entity);
  }

  update(id: number, entity: CoffeeLot): Observable<CoffeeLot> {
    return this.coffeeLotApiEndpoint.createVersion(id, entity);
  }

  createVersion(id: number, entity: CoffeeLot): Observable<CoffeeLot> {
    return this.coffeeLotApiEndpoint.createVersion(id, entity);
  }

  getVersionsByLineage(lineageId: number): Observable<CoffeeLot[]> {
    return this.coffeeLotApiEndpoint.getVersionsByLineage(lineageId);
  }

  getSelectable(): Observable<CoffeeLot[]> {
    return this.coffeeLotApiEndpoint.getSelectable();
  }

  annull(id: number, reason: string): Observable<CoffeeLot> {
    return this.coffeeLotApiEndpoint.annull(id, reason);
  }
}