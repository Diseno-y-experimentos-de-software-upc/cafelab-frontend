import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { DefectLibraryEntry } from '../domain/model/defect-library-entry.entity';
import { DefectLibraryEntryAssembler } from './defect-library-entry.assembler';
import type {
  CreateDefectLibraryBody,
  DefectLibraryListResponse,
  DefectLibraryResource,
} from './defect-library-entry.response';

@Injectable({
  providedIn: 'root',
})
export class DefectLibraryApiEndpoint extends BaseApiEndpoint<
  DefectLibraryEntry,
  DefectLibraryResource,
  DefectLibraryListResponse,
  DefectLibraryEntryAssembler
> {
  private readonly defectAssembler: DefectLibraryEntryAssembler;

  constructor(http: HttpClient, private readonly translate: TranslateService) {
    const assembler = new DefectLibraryEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.defectsEndpointPath}`,
      assembler,
    );
    this.defectAssembler = assembler;
  }

  override getAll(): Observable<DefectLibraryEntry[]> {
    return this.http.get<DefectLibraryResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<DefectLibraryEntry> {
    return this.http
      .get<DefectLibraryResource>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.DETAIL'))),
      );
  }

  override create(entity: DefectLibraryEntry): Observable<DefectLibraryEntry> {
    const body: CreateDefectLibraryBody = this.defectAssembler.toCreateBody(entity);
    return this.http
      .post<DefectLibraryResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: DefectLibraryEntry, id: number): Observable<DefectLibraryEntry> {
    const body = this.defectAssembler.toCreateBody(entity);
    return this.http
      .put<DefectLibraryResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.DELETE'))));
  }
}