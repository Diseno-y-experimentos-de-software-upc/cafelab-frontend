import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CoffeeLotApi } from '../../../application/coffee-lot.api';
import { CoffeeLot } from '../../../domain/model/coffee-lot.entity';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { SupplierApi } from '../../../../supplier/application/supplier.api';
import { Supplier } from '../../../../supplier/domain/model/supplier.entity';
import type { ApiError } from '../../../../shared/infrastructure/base-api-endpoint';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const PREDEFINED_ANNUL_REASON_KEYS = [
  'DUPLICATE_RECORD',
  'WRONG_LOT',
  'INCORRECT_DATA',
  'OPERATIONAL_CANCELLATION',
  'WEIGHT_ERROR',
  'NO_REAL_STOCK',
  'OPERATIONAL_CHANGE',
  'INTERNAL_AUDIT',
] as const;

const OTHER_REASON_KEY = '__OTHER__';
const REASON_MAX_LENGTH = 25;

@Component({
  selector: 'app-lot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, MatSnackBarModule],
  templateUrl: './lot-list.component.html',
  styleUrls: ['./lot-list.component.css'],
})
export class LotListComponent implements OnInit {
  @ViewChild('lotForm') lotForm!: NgForm;
  @ViewChild('editForm') editForm!: NgForm;

  lots: CoffeeLot[] = [];
  suppliers: Supplier[] = [];
  searchQuery = '';
  showRegisterModal = false;
  showRegisterConfirmModal = false;
  showEditConfirmModal = false;
  showEditModal = false;
  showLotDetails = false;
  showAnnulModal = false;
  loading = false;
  error: string | null = null;
  newCertification = '';

  readonly predefinedAnnulReasonKeys = PREDEFINED_ANNUL_REASON_KEYS;
  readonly otherReasonKey = OTHER_REASON_KEY;
  readonly reasonMaxLength = REASON_MAX_LENGTH;
  annulReasonSelection = '';
  annulReasonCustom = '';
  annulFormError: string | null = null;

  /** Errores por campo (registro) — claves alineadas con el API (p. ej. {@code lot_name}). */
  fieldErrors: Record<string, string> = {};
  editFieldErrors: Record<string, string> = {};

  
  readonly coffeeTypeCanonical = ['Arábica', 'Robusta', 'Mezcla'] as const;
  readonly processCanonical = ['Anaeróbico', 'Lavado', 'Natural', 'Honey'] as const;
  readonly certificationCanonical = [
    'Comercio Justo',
    'Bird Friendly',
    'UTZ certified',
    'Orgánico',
    'Rainforest Alliance',
  ] as const;

  coffeeTypeLabelKey(value: string | undefined | null): string {
    if (!value) return '';
    const m: Record<string, string> = {
      Arábica: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ARABICA',
      Robusta: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ROBUSTA',
      Mezcla: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.BLEND',
    };
    return m[value] ?? value;
  }

  processLabelKey(value: string): string {
    const m: Record<string, string> = {
      Anaeróbico: 'COFFEE_LOT_BC.OPTIONS.PROCESSING.ANAEROBIC',
      Lavado: 'COFFEE_LOT_BC.OPTIONS.PROCESSING.WASHED',
      Natural: 'COFFEE_LOT_BC.OPTIONS.PROCESSING.NATURAL',
      Honey: 'COFFEE_LOT_BC.OPTIONS.PROCESSING.HONEY',
    };
    return m[value] ?? value;
  }

  certificationLabelKey(value: string): string {
    const m: Record<string, string> = {
      'Comercio Justo': 'COFFEE_LOT_BC.OPTIONS.CERTIFICATION.FAIR_TRADE',
      'Bird Friendly': 'COFFEE_LOT_BC.OPTIONS.CERTIFICATION.BIRD_FRIENDLY',
      'UTZ certified': 'COFFEE_LOT_BC.OPTIONS.CERTIFICATION.UTZ',
      Orgánico: 'COFFEE_LOT_BC.OPTIONS.CERTIFICATION.ORGANIC',
      'Rainforest Alliance': 'COFFEE_LOT_BC.OPTIONS.CERTIFICATION.RAINFOREST',
    };
    return m[value] ?? value;
  }

  newLot: CoffeeLot = this.getEmptyLot();
  editingLot: CoffeeLot = this.getEmptyLot();
  selectedLot: CoffeeLot | null = null;
  lotToAnnul: CoffeeLot | null = null;
  versionHistory: CoffeeLot[] = [];
  loadingVersions = false;

  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly supplierApi: SupplierApi,
    private readonly translateService: TranslateService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadLots();
    this.loadSuppliers();
  }

  private getEmptyLot(): CoffeeLot {
    return {
      id: 0,
      lot_name: '',
      coffee_type: '',
      processing_method: '',
      altitude: 0,
      weight: 0,
      original_weight: 0,
      origin: '',
      certifications: [],
      supplier_id: 0,
      supplier_name: '',
      userId: 0,
      status: '',
      version_number: 1,
      is_current: true,
      record_status: 'activo',
      annulment_reason: '',
    };
  }

  isAnnulled(lot: CoffeeLot | null | undefined): boolean {
    return lot?.record_status === 'anulado';
  }

  getVersionLabel(lot: CoffeeLot | null | undefined): string {
    const version = lot?.version_number ?? 1;
    return `v${version}`;
  }

  getNextVersionNumber(): number {
    return (this.editingLot.version_number ?? 1) + 1;
  }

  getLineageId(lot: CoffeeLot | null | undefined): number | null {
    if (!lot) return null;
    return lot.lot_lineage_id ?? lot.id ?? null;
  }

  openRegisterModal(): void {
    this.error = null;
    this.fieldErrors = {};
    if (this.suppliers.length === 0) {
      this.error = this.translateService.instant('COFFEE_LOT_BC.HINT.NEED_SUPPLIER');
      return;
    }
    this.showRegisterModal = true;
  }

  loadSuppliers(): void {
    this.supplierApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading suppliers', err);
          this.error = this.translateService.instant('COFFEE_LOT_BC.ERRORS.LOAD_SUPPLIERS');
          return of([]);
        }),
      )
      .subscribe((suppliers: Supplier[]) => {
        this.suppliers = suppliers;
      });
  }

  loadLots(): void {
    this.loading = true;
    this.error = null;

    this.coffeeLotApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading lots', err);
          this.error = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.LOAD');
          return of([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((lots) => {
        this.lots = lots;
      });
  }

  searchLots(): void {
    if (this.searchQuery.trim()) {
      this.loading = true;
      this.error = null;

      this.coffeeLotApi
        .searchLots(this.searchQuery)
        .pipe(
          catchError((err) => {
            console.error('Error searching lots', err);
            this.error = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.SEARCH');
            return of([]);
          }),
          finalize(() => (this.loading = false)),
        )
        .subscribe((lots) => (this.lots = lots));
    } else {
      this.loadLots();
    }
  }

  viewLotDetails(lot: CoffeeLot): void {
    this.selectedLot = { ...lot };
    this.versionHistory = [];
    this.showLotDetails = true;
    this.error = null;
    this.loadVersionHistory(lot);
  }

  private loadVersionHistory(lot: CoffeeLot): void {
    const lineageId = this.getLineageId(lot);
    if (!lineageId) {
      return;
    }

    this.loadingVersions = true;
    this.coffeeLotApi
      .getVersionsByLineage(lineageId)
      .pipe(
        catchError((err) => {
          console.error('Error loading version history', err);
          this.error = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.LOAD_VERSIONS');
          return of([]);
        }),
        finalize(() => (this.loadingVersions = false)),
      )
      .subscribe((versions) => {
        this.versionHistory = versions;
      });
  }

  closeLotDetails(): void {
    this.showLotDetails = false;
    this.selectedLot = null;
    this.versionHistory = [];
    this.error = null;
  }

  editLot(lot: CoffeeLot): void {
    if (this.isAnnulled(lot)) {
      return;
    }
    this.editFieldErrors = {};
    this.editingLot = { ...lot };
    this.showEditModal = true;
    this.showLotDetails = false;
    this.error = null;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editFieldErrors = {};
    this.error = null;
    if (this.editForm) {
      this.editForm.resetForm();
    }
  }

  private collectRegisterFieldErrors(): Record<string, string> {
    const e: Record<string, string> = {};
    const t = (k: string) => this.translateService.instant(k);
    const namePattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ ]+$/;
    if (!this.newLot.lot_name?.trim()) {
      e['lot_name'] = t('COFFEE_LOT_BC.VALIDATION.LOT_NAME');
    } else if (!namePattern.test(this.newLot.lot_name.trim())) {
      e['lot_name'] = t('COFFEE_LOT_BC.VALIDATION.LOT_NAME_SPECIAL_CHARS');
    }
    if (!this.newLot.coffee_type?.trim()) {
      e['coffee_type'] = t('COFFEE_LOT_BC.VALIDATION.COFFEE_TYPE');
    }
    if (!this.newLot.processing_method?.trim()) {
      e['processing_method'] = t('COFFEE_LOT_BC.VALIDATION.PROCESSING_METHOD');
    }
    const alt = Number(this.newLot.altitude);
    if (!Number.isFinite(alt) || alt < 0) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE');
    } else if (!Number.isInteger(alt)) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE_INTEGER');
    } else if (alt > 2500) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE_MAX');
    }
    const w = Number(this.newLot.weight);
    const weightStr = String(this.newLot.weight ?? '');
    const decimalPlaces = weightStr.includes('.') ? weightStr.split('.')[1].length : 0;
    if (!Number.isFinite(w) || w < 1) {
      e['weight'] = t('COFFEE_LOT_BC.VALIDATION.WEIGHT');
    } else if (w > 70) {
      e['weight'] = t('COFFEE_LOT_BC.VALIDATION.WEIGHT_MAX');
    } else if (decimalPlaces > 2) {
      e['weight'] = t('COFFEE_LOT_BC.VALIDATION.WEIGHT_DECIMALS');
    }
    if (!this.newLot.origin?.trim()) {
      e['origin'] = t('COFFEE_LOT_BC.VALIDATION.ORIGIN');
    }
    if (!this.newLot.status?.trim()) {
      e['status'] = t('COFFEE_LOT_BC.VALIDATION.STATUS');
    }
    const sid = Number(this.newLot.supplier_id);
    if (!sid || sid <= 0) {
      e['supplier_id'] = t('COFFEE_LOT_BC.VALIDATION.SUPPLIER');
    }
    if (this.suppliers.length === 0) {
      e['supplier_id'] = t('COFFEE_LOT_BC.VALIDATION.NO_SUPPLIERS');
    }
    return e;
  }

  private collectEditFieldErrors(): Record<string, string> {
    const e: Record<string, string> = {};
    const t = (k: string) => this.translateService.instant(k);
    const namePattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ ]+$/;
    if (!this.editingLot.lot_name?.trim()) {
      e['lot_name'] = t('COFFEE_LOT_BC.VALIDATION.LOT_NAME');
    } else if (!namePattern.test(this.editingLot.lot_name.trim())) {
      e['lot_name'] = t('COFFEE_LOT_BC.VALIDATION.LOT_NAME_SPECIAL_CHARS');
    }
    if (!this.editingLot.coffee_type?.trim()) {
      e['coffee_type'] = t('COFFEE_LOT_BC.VALIDATION.COFFEE_TYPE');
    }
    if (!this.editingLot.processing_method?.trim()) {
      e['processing_method'] = t('COFFEE_LOT_BC.VALIDATION.PROCESSING_METHOD');
    }
    const alt = Number(this.editingLot.altitude);
    if (!Number.isFinite(alt) || alt < 0) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE');
    } else if (!Number.isInteger(alt)) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE_INTEGER');
    } else if (alt > 2500) {
      e['altitude'] = t('COFFEE_LOT_BC.VALIDATION.ALTITUDE_MAX');
    }
    if (!this.editingLot.origin?.trim()) {
      e['origin'] = t('COFFEE_LOT_BC.VALIDATION.ORIGIN');
    }
    if (!this.editingLot.status?.trim()) {
      e['status'] = t('COFFEE_LOT_BC.VALIDATION.STATUS');
    }
    return e;
  }

  requestRegisterLot(): void {
    this.fieldErrors = {};
    const client = this.collectRegisterFieldErrors();
    if (Object.keys(client).length > 0) {
      this.fieldErrors = client;
      this.error = this.translateService.instant('COFFEE_LOT_BC.VALIDATION.SUMMARY');
      const toastMsg = client['weight'] ?? client['altitude'];
      if (toastMsg) {
        this.snackBar.open(toastMsg, undefined, { duration: 4000 });
      }
      return;
    }

    this.error = null;
    this.showRegisterConfirmModal = true;
  }

  confirmRegisterLot(): void {
    this.loading = true;
    this.error = null;

    this.newLot.userId = Number(this.authService.getCurrentUserId());
    this.newLot.altitude = Number(this.newLot.altitude);
    this.newLot.weight = Number(this.newLot.weight);
    this.newLot.original_weight = Number(this.newLot.weight);

    this.coffeeLotApi
      .create(this.newLot)
      .pipe(
        catchError((err) => {
          console.error('Error creating lot', err);
          const api = err as ApiError;
          if (api.fieldErrors && Object.keys(api.fieldErrors).length > 0) {
            this.fieldErrors = { ...api.fieldErrors };
          }
          const msg = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.REGISTER');
          this.error = msg;
          this.showRegisterConfirmModal = false;
          if (msg) {
            this.snackBar.open(msg, this.translateService.instant('COMMON.CLOSE'), { duration: 6000, panelClass: ['snack-error'] });
          }
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showRegisterConfirmModal = false;
          this.showRegisterModal = false;
          this.resetForm();
          this.loadLots();
        }
      });
  }

  cancelRegisterConfirm(): void {
    this.showRegisterConfirmModal = false;
  }

  cancelRegister(): void {
    this.showRegisterModal = false;
    this.resetForm();
  }

  saveLotChanges(): void {
    this.editFieldErrors = {};
    const client = this.collectEditFieldErrors();
    if (Object.keys(client).length > 0) {
      this.editFieldErrors = client;
      this.error = this.translateService.instant('COFFEE_LOT_BC.VALIDATION.SUMMARY');
      const toastMsg = client['weight'] ?? client['altitude'];
      if (toastMsg) {
        this.snackBar.open(toastMsg, undefined, { duration: 4000 });
      }
      return;
    }

    if (!this.editingLot.id) {
      this.error = this.translateService.instant('COFFEE_LOT_BC.ERRORS.MISSING_ID');
      return;
    }

    this.error = null;
    this.showEditConfirmModal = true;
  }

  confirmSaveLotChanges(): void {
    if (!this.editingLot.id) {
      this.error = this.translateService.instant('COFFEE_LOT_BC.ERRORS.MISSING_ID');
      return;
    }

    this.loading = true;
    this.error = null;
    this.editingLot.altitude = Number(this.editingLot.altitude);

    this.coffeeLotApi
      .createVersion(this.editingLot.id, this.editingLot)
      .pipe(
        catchError((err) => {
          console.error('Error creating lot version', err);
          const api = err as ApiError;
          if (api.fieldErrors && Object.keys(api.fieldErrors).length > 0) {
            this.editFieldErrors = { ...api.fieldErrors };
          }
          const msg = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.UPDATE');
          this.error = msg;
          if (msg) {
            this.snackBar.open(msg, this.translateService.instant('COMMON.CLOSE'), { duration: 6000, panelClass: ['snack-error'] });
          }
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showEditConfirmModal = false;
          this.showEditModal = false;
          this.editFieldErrors = {};
          this.loadLots();
        }
      });
  }

  cancelEditConfirm(): void {
    this.showEditConfirmModal = false;
  }

  onSupplierChange(event: Event): void {
    this.newLot.supplier_id = Number((event.target as HTMLSelectElement).value);
  }

  addCertification(value: string): void {
    if (value.trim() && !this.newLot.certifications.includes(value)) {
      this.newLot.certifications.push(value);
      this.newCertification = '';
    }
  }

  addCertificationToEdit(value: string): void {
    if (value.trim() && !this.editingLot.certifications.includes(value)) {
      this.editingLot.certifications.push(value);
      this.newCertification = '';
    }
  }

  removeCertification(index: number): void {
    this.newLot.certifications.splice(index, 1);
  }

  removeCertificationFromEdit(index: number): void {
    this.editingLot.certifications.splice(index, 1);
  }

  getSupplierName(id: number | undefined): string {
    if (!id) return '';
    const supplier = this.suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : '';
  }

  getSupplierDisplayName(lot: CoffeeLot | null | undefined): string {
    if (!lot) return '';
    if (lot.supplier_name?.trim()) {
      return lot.supplier_name.trim();
    }
    return this.getSupplierName(lot.supplier_id);
  }

  getBaseWeight(lot: CoffeeLot | null | undefined): number {
    if (!lot) return 0;
    return lot.original_weight ?? lot.weight ?? 0;
  }

  getCurrentWeight(lot: CoffeeLot | null | undefined): number {
    return lot?.weight ?? 0;
  }

  getStatusText(status: string | undefined): string {
    if (!status) return '';
    return status === 'green'
      ? this.translateService.instant('FORM.STATUS_OPTIONS.GREEN')
      : this.translateService.instant('FORM.STATUS_OPTIONS.ROASTED');
  }

  annulLot(lot: CoffeeLot): void {
    if (!lot.id) {
      this.error = this.translateService.instant('COFFEE_LOT_BC.ERRORS.MISSING_ID');
      return;
    }
    if (this.isAnnulled(lot)) {
      return;
    }

    this.lotToAnnul = lot;
    this.annulReasonSelection = '';
    this.annulReasonCustom = '';
    this.annulFormError = null;
    this.showAnnulModal = true;
  }

  cancelAnnul(): void {
    this.showAnnulModal = false;
    this.lotToAnnul = null;
    this.annulReasonSelection = '';
    this.annulReasonCustom = '';
    this.annulFormError = null;
  }

  private resolveAnnulReason(): string | null {
    const selection = this.annulReasonSelection;
    if (!selection) {
      return null;
    }
    if (selection !== OTHER_REASON_KEY) {
      return this.annulReasonLabel(selection);
    }
    const custom = (this.annulReasonCustom || '').trim();
    return custom || null;
  }

  annulReasonLabel(key: string): string {
    return this.translateService.instant(`COFFEE_LOT_BC.ANNUL.REASONS.${key}`);
  }

  getAnnulReasonDisplay(reason: string | undefined | null): string {
    const text = (reason ?? '').trim();
    if (!text) {
      return '';
    }
    const key = PREDEFINED_ANNUL_REASON_KEYS.find(
      (k) => this.annulReasonLabel(k) === text || k === text,
    );
    if (key) {
      return this.annulReasonLabel(key);
    }
    const legacyKey = this.legacyAnnulReasonKeyBySpanishLabel[text];
    if (legacyKey) {
      return this.annulReasonLabel(legacyKey);
    }
    return text;
  }

  private readonly legacyAnnulReasonKeyBySpanishLabel: Record<string, string> = {
    'Registro duplicado': 'DUPLICATE_RECORD',
    'Lote erróneo': 'WRONG_LOT',
    'Datos incorrectos': 'INCORRECT_DATA',
    'Cancelación operativa': 'OPERATIONAL_CANCELLATION',
    'Error de peso': 'WEIGHT_ERROR',
    'Sin stock real': 'NO_REAL_STOCK',
    'Cambio operativo': 'OPERATIONAL_CHANGE',
    'Auditoría interna': 'INTERNAL_AUDIT',
  };

  confirmAnnul(): void {
    if (!this.lotToAnnul?.id) {
      this.error = this.translateService.instant('COFFEE_LOT_BC.ERRORS.MISSING_ID');
      return;
    }

    const reason = this.resolveAnnulReason();
    if (!reason) {
      this.annulFormError = this.translateService.instant('COFFEE_LOT_BC.ANNUL.ERROR_REQUIRED');
      return;
    }

    this.loading = true;
    this.error = null;
    this.annulFormError = null;

    this.coffeeLotApi
      .annull(this.lotToAnnul.id, reason)
      .pipe(
        catchError((err) => {
          console.error('Error annulling lot', err);
          this.annulFormError = this.lotErrorMessage(err, 'COFFEE_LOT_BC.ERRORS.ANNULL');
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.cancelAnnul();
          this.loadLots();
        }
      });
  }

  resetForm(): void {
    this.newLot = this.getEmptyLot();
    this.fieldErrors = {};
    if (this.lotForm) {
      this.lotForm.resetForm();
    }
    this.error = null;
  }

  private lotErrorMessage(err: unknown, i18nKey: string): string {
    const fallback = this.translateService.instant(i18nKey);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return this.translateService.instant('COFFEE_LOT_BC.ERRORS.NETWORK');
      }
      if (err.status === 401 || err.status === 403) {
        return this.translateService.instant('COFFEE_LOT_BC.ERRORS.UNAUTHORIZED');
      }
      if (err.status === 404) {
        return this.translateService.instant('COFFEE_LOT_BC.ERRORS.NOT_FOUND');
      }
    }
    const fromApi = getUserFacingApiMessage(err, '');
    if (fromApi) {
      return fromApi;
    }
    return fallback || this.translateService.instant('COFFEE_LOT_BC.ERRORS.GENERIC');
  }
}