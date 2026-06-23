import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefectLibraryApiEndpoint } from '../infrastructure/defect-library-api-endpoint';
import type { DefectLibraryEntry } from '../domain/model/defect-library-entry.entity';

@Injectable({
  providedIn: 'root',
})
export class DefectLibraryApi {
  constructor(private readonly defectLibraryApiEndpoint: DefectLibraryApiEndpoint) {}

  getAll(): Observable<DefectLibraryEntry[]> {
    return this.defectLibraryApiEndpoint.getAll();
  }

  getById(id: number): Observable<DefectLibraryEntry> {
    return this.defectLibraryApiEndpoint.getById(id);
  }

  create(entity: DefectLibraryEntry): Observable<DefectLibraryEntry> {
    return this.defectLibraryApiEndpoint.create(entity);
  }

  update(id: number, entity: DefectLibraryEntry): Observable<DefectLibraryEntry> {
    return this.defectLibraryApiEndpoint.update(entity, id);
  }

  delete(id: number): Observable<void> {
    return this.defectLibraryApiEndpoint.delete(id);
  }
}