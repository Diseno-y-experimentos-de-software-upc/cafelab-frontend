import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { InventoryEntry } from '../domain/model/inventory-entry.entity';
import { InventoryEntryAssembler } from './inventory-entry.assembler';
import type {
  CreateInventoryEntryBody,
  InventoryEntryListResponse,
  InventoryEntryResource,
  UpdateInventoryEntryBody,
} from './inventory-entry.response';

@Injectable({
  providedIn: 'root',
})
export class InventoryApiEndpoint extends BaseApiEndpoint<
  InventoryEntry,
  InventoryEntryResource,
  InventoryEntryListResponse,
  InventoryEntryAssembler
> {
  private readonly inventoryAssembler: InventoryEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
  ) {
    const assembler = new InventoryEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.inventoryEndpointPath}`,
      assembler,
    );
    this.inventoryAssembler = assembler;
  }

  
  override getAll(): Observable<InventoryEntry[]> {
    return this.http.get<InventoryEntryResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.LOAD'))),
    );
  }

  override create(entity: InventoryEntry): Observable<InventoryEntry> {
    const body: CreateInventoryEntryBody = this.inventoryAssembler.toCreateResource(entity);
    return this.http
      .post<InventoryEntryResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: InventoryEntry, id: number): Observable<InventoryEntry> {
    const body: UpdateInventoryEntryBody = this.inventoryAssembler.toUpdateResource(entity);
    return this.http
      .put<InventoryEntryResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.DELETE'))),
      );
  }

  getByCoffeeLotId(coffeeLotId: number): Observable<InventoryEntry[]> {
    return this.http
      .get<InventoryEntryResource[]>(
        `${this.endpointUrl}/coffee-lot/${coffeeLotId}`,
        this.httpOptions,
      )
      .pipe(
        map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.LOAD'))),
      );
  }
}