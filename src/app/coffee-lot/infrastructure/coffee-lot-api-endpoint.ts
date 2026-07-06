import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { CoffeeLot } from '../domain/model/coffee-lot.entity';
import { CoffeeLotAssembler } from './coffee-lot.assembler';
import type { CoffeeLotListResponse, CoffeeLotResource } from './coffee-lot.response';

@Injectable({
  providedIn: 'root',
})
export class CoffeeLotApiEndpoint extends BaseApiEndpoint<
  CoffeeLot,
  CoffeeLotResource,
  CoffeeLotListResponse,
  CoffeeLotAssembler
> {
  private readonly coffeeLotAssembler: CoffeeLotAssembler;

  constructor(
    http: HttpClient,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {
    const assembler = new CoffeeLotAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.coffeeLotsEndpointPath}`,
      assembler,
    );
    this.coffeeLotAssembler = assembler;
  }

  /**
   * Lista lotes del usuario autenticado (id de perfil desde el JWT en el servidor).
   * No usar {@code /user/{localStorageId}}: el id guardado en cliente puede no coincidir con el perfil del token.
   */
  override getAll(): Observable<CoffeeLot[]> {
    return this.http.get<CoffeeLotResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD'))),
    );
  }

  override create(entity: CoffeeLot): Observable<CoffeeLot> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('COFFEE_LOT_BC.ERRORS.NOT_AUTHENTICATED_CREATE'),
          ),
      );
    }
    const body = this.coffeeLotAssembler.toCreateResource(entity);
    return this.http
      .post<CoffeeLotResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.REGISTER'))),
      );
  }

  createVersion(id: number, entity: CoffeeLot): Observable<CoffeeLot> {
    const body = this.coffeeLotAssembler.toUpdateResource(entity);
    return this.http
      .post<CoffeeLotResource>(`${this.endpointUrl}/${id}/versions`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.UPDATE'))),
      );
  }

  getVersionsByLineage(lineageId: number): Observable<CoffeeLot[]> {
    return this.http
      .get<CoffeeLotResource[]>(`${this.endpointUrl}/lineage/${lineageId}/versions`, this.httpOptions)
      .pipe(
        map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD_VERSIONS'))),
      );
  }

  getSelectable(): Observable<CoffeeLot[]> {
    return this.http
      .get<CoffeeLotResource[]>(`${this.endpointUrl}/selectable`, this.httpOptions)
      .pipe(
        map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD'))),
      );
  }

  annull(id: number, reason: string): Observable<CoffeeLot> {
    return this.http
      .post<CoffeeLotResource>(`${this.endpointUrl}/${id}/annulment`, { reason }, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.ANNULL'))),
      );
  }
}