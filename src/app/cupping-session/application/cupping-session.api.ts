import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CuppingSessionApiEndpoint } from '../infrastructure/cupping-session-api-endpoint';
import type { CuppingSessionEntry } from '../domain/model/cupping-session-entry.entity';

@Injectable({
  providedIn: 'root',
})
export class CuppingSessionApi {
  constructor(private readonly endpoint: CuppingSessionApiEndpoint) {}

  getAll(): Observable<CuppingSessionEntry[]> {
    return this.endpoint.getAll();
  }

  getById(id: number): Observable<CuppingSessionEntry> {
    return this.endpoint.getById(id);
  }

  getByCoffeeLot(coffeeLotId: number): Observable<CuppingSessionEntry[]> {
    return this.endpoint.getByCoffeeLot(coffeeLotId);
  }

  create(entity: CuppingSessionEntry): Observable<CuppingSessionEntry> {
    return this.endpoint.create(entity);
  }

  update(id: number, entity: CuppingSessionEntry): Observable<CuppingSessionEntry> {
    return this.endpoint.update(entity, id);
  }

  delete(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }
}