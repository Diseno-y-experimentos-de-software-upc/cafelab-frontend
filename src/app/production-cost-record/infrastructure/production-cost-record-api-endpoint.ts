import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { ProductionCostRecord } from '../domain/model/production-cost-record.entity';
import { ProductionCostRecordAssembler } from './production-cost-record.assembler';
import type {
  AnnullProductionCostRecordBody,
  CreateProductionCostRecordBody,
  ProductionCostRecordListResponse,
  ProductionCostRecordResource,
  UpdateProductionCostRecordBody,
} from './production-cost-record.response';

@Injectable({
  providedIn: 'root',
})
export class ProductionCostRecordApiEndpoint extends BaseApiEndpoint<
  ProductionCostRecord,
  ProductionCostRecordResource,
  ProductionCostRecordListResponse,
  ProductionCostRecordAssembler
> {
  constructor(http: HttpClient, private readonly translate: TranslateService) {
    const assembler = new ProductionCostRecordAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.productionCostRecordsEndpointPath}`,
      assembler,
    );
  }

  override getAll(): Observable<ProductionCostRecord[]> {
    return this.http.get<ProductionCostRecordResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<ProductionCostRecord> {
    return this.http
      .get<ProductionCostRecordResource>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.LOAD_ONE'))),
      );
  }

  createWithBody(body: CreateProductionCostRecordBody): Observable<ProductionCostRecord> {
    return this.http
      .post<ProductionCostRecordResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.CREATE'))),
      );
  }

  updateWithBody(id: number, body: UpdateProductionCostRecordBody): Observable<ProductionCostRecord> {
    return this.http
      .put<ProductionCostRecordResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.DELETE'))));
  }

  /** POST /api/v1/production-cost-records/{id}/annulment con el motivo. */
  annullWithBody(
    id: number,
    body: AnnullProductionCostRecordBody,
  ): Observable<ProductionCostRecord> {
    return this.http
      .post<ProductionCostRecordResource>(
        `${this.endpointUrl}/${id}/annulment`,
        body,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COST_RECORDS.ERRORS.ANNULL'))),
      );
  }
}
