import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { CuppingSessionEntry } from '../domain/model/cupping-session-entry.entity';
import { CuppingSessionEntryAssembler } from './cupping-session-entry.assembler';
import type {
  CreateCuppingSessionBody,
  CuppingSessionListResponse,
  CuppingSessionResource,
  UpdateCuppingSessionBody,
} from './cupping-session-entry.response';

@Injectable({
  providedIn: 'root',
})
export class CuppingSessionApiEndpoint extends BaseApiEndpoint<
  CuppingSessionEntry,
  CuppingSessionResource,
  CuppingSessionListResponse,
  CuppingSessionEntryAssembler
> {
  private readonly csAssembler: CuppingSessionEntryAssembler;

  constructor(http: HttpClient, private readonly translate: TranslateService) {
    const assembler = new CuppingSessionEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.cuppingSessionsEndpointPath}`,
      assembler,
    );
    this.csAssembler = assembler;
  }

  override getAll(): Observable<CuppingSessionEntry[]> {
    return this.http.get<CuppingSessionResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.LOAD'))),
    );
  }

  getByCoffeeLot(coffeeLotId: number): Observable<CuppingSessionEntry[]> {
    return this.http
      .get<CuppingSessionResource[]>(`${this.endpointUrl}/lot/${coffeeLotId}`, this.httpOptions)
      .pipe(
        map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.LOAD'))),
      );
  }

  override getById(id: number): Observable<CuppingSessionEntry> {
    return this.http
      .get<CuppingSessionResource>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.DETAIL'))),
      );
  }

  override create(entity: CuppingSessionEntry): Observable<CuppingSessionEntry> {
    const body: CreateCuppingSessionBody = this.csAssembler.toCreateBody(entity);
    return this.http
      .post<CuppingSessionResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: CuppingSessionEntry, id: number): Observable<CuppingSessionEntry> {
    const body: UpdateCuppingSessionBody = this.csAssembler.toUpdateBody(entity);
    return this.http
      .put<CuppingSessionResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.DELETE'))));
  }
}