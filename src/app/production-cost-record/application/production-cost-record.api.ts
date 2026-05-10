import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductionCostRecordApiEndpoint } from '../infrastructure/production-cost-record-api-endpoint';
import type { ProductionCostRecord } from '../domain/model/production-cost-record.entity';
import type {
  AnnullProductionCostRecordBody,
  CreateProductionCostRecordBody,
  UpdateProductionCostRecordBody,
} from '../infrastructure/production-cost-record.response';

@Injectable({
  providedIn: 'root',
})
export class ProductionCostRecordApi {
  constructor(private readonly endpoint: ProductionCostRecordApiEndpoint) {}

  getAll(): Observable<ProductionCostRecord[]> {
    return this.endpoint.getAll();
  }

  getById(id: number): Observable<ProductionCostRecord> {
    return this.endpoint.getById(id);
  }

  create(body: CreateProductionCostRecordBody): Observable<ProductionCostRecord> {
    return this.endpoint.createWithBody(body);
  }

  update(id: number, body: UpdateProductionCostRecordBody): Observable<ProductionCostRecord> {
    return this.endpoint.updateWithBody(id, body);
  }

  delete(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }

  /** Anula un registro: el backend cambia status='anulado' y guarda el motivo. */
  annull(id: number, body: AnnullProductionCostRecordBody): Observable<ProductionCostRecord> {
    return this.endpoint.annullWithBody(id, body);
  }
}
