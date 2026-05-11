import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GrindCalibrationApiEndpoint } from '../infrastructure/grind-calibration-api-endpoint';
import type { GrindCalibrationEntry } from '../domain/model/grind-calibration-entry.entity';

@Injectable({
  providedIn: 'root',
})
export class GrindCalibrationApi {
  constructor(private readonly endpoint: GrindCalibrationApiEndpoint) {}

  getAll(): Observable<GrindCalibrationEntry[]> {
    return this.endpoint.getAll();
  }

  getById(id: number): Observable<GrindCalibrationEntry> {
    return this.endpoint.getById(id);
  }

  create(entity: GrindCalibrationEntry): Observable<GrindCalibrationEntry> {
    return this.endpoint.create(entity);
  }

  update(id: number, entity: GrindCalibrationEntry): Observable<GrindCalibrationEntry> {
    return this.endpoint.update(entity, id);
  }

  delete(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }
}