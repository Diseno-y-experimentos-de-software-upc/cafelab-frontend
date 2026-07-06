import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SupplierApi } from '../../../application/supplier.api';
import { Supplier } from '../../../domain/model/supplier.entity';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-Supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, MatSnackBarModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
  @ViewChild('supplierForm') supplierForm!: NgForm;
  @ViewChild('editForm') editForm!: NgForm;

  suppliers: Supplier[] = [];
  searchQuery: string = '';
  showRegisterModal: boolean = false;
  showEditModal: boolean = false;
  showSupplierDetails: boolean = false;
  showDeleteModal: boolean = false;

  newSpecialties: string[] = [];
  editingSpecialties: string[] = [];

  newSupplier: Supplier = {
    id: 0,
    name: '',
    email: '',
    phone: 0,
    location: '',
    specialties: [],
    userId: 0,
    contactPerson: '',
    webLink: '',
  };

  editingSupplier: Supplier = {
    id: 0,
    name: '',
    email: '',
    phone: 0,
    location: '',
    specialties: [],
    userId: 0,
    contactPerson: '',
    webLink: '',
  };

  selectedSupplier: Supplier | null = null;
  supplierToDelete: Supplier | null = null;
  loading: boolean = false;
  error: string | null = null;


  registerFieldErrors: Partial<Record<string, string>> = {};

  editFieldErrors: Partial<Record<string, string>> = {};

  constructor(
    private supplierApi: SupplierApi,
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.error = null;

    this.supplierApi.getAll()
      .pipe(
        catchError(err => {
          console.error('Error loading suppliers', err);
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.LOAD');
          return of([]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  searchSuppliers(): void {
    if (this.searchQuery.trim()) {
      this.loading = true;
      this.error = null;

      this.supplierApi.searchSuppliers(this.searchQuery)
        .pipe(
          catchError(err => {
            console.error('Error searching suppliers', err);
            this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.SEARCH');
            return of([]);
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((suppliers: Supplier[]) => (this.suppliers = suppliers));
    } else {
      this.loadSuppliers();
    }
  }

  viewSupplierDetails(supplier: Supplier): void {
    this.selectedSupplier = { ...supplier };
    this.showSupplierDetails = true;
    this.error = null;
  }

  closeSupplierDetails(): void {
    this.showSupplierDetails = false;
    this.selectedSupplier = null;
    this.error = null;
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplier = { ...supplier };
    this.editingSpecialties = [...supplier.specialties];
    this.showEditModal = true;
    this.showSupplierDetails = false;
    this.error = null;
    this.editFieldErrors = {};
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.error = null;
    this.editFieldErrors = {};
    this.editingSpecialties = [];
    if (this.editForm) {
      this.editForm.resetForm();
    }
  }

  openRegisterModal(): void {
    this.error = null;
    this.registerFieldErrors = {};
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
    this.error = null;
    this.registerFieldErrors = {};
  }

  saveSupplierChanges(): void {
    this.editFieldErrors = {};
    this.error = null;

    if (!this.editingSupplier.id || this.editingSupplier.id <= 0) {
      this.error = this.translateService.instant('SUPPLIER_BC.ERRORS.NOT_FOUND');
      return;
    }

    const isSupplierValid = this.validateSupplierFields(this.editingSupplier, 'edit');
    const areSpecialtiesValid = this.validateSpecialties(this.editingSpecialties, 'edit');

    if (!isSupplierValid || !areSpecialtiesValid) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
      return;
    }

    this.editingSupplier.phone = this.parsePhone(this.editingSupplier.phone);

    this.loading = true;
    this.error = null;

    this.editingSupplier.specialties = [...this.editingSpecialties];

    this.supplierApi.update(this.editingSupplier.id, this.editingSupplier)
      .pipe(
        catchError((err) => {
          console.error('Error updating supplier', err);
          if (
            err instanceof HttpErrorResponse &&
            this.applySupplierApiValidationErrors(err, 'edit')
          ) {
            return of(null);
          }
          const msg = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.UPDATE');
          this.error = msg;
          if (msg) {
            this.snackBar.open(msg, this.translateService.instant('COMMON.CLOSE'), { duration: 6000, panelClass: ['snack-error'] });
          }
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result !== null) {
          this.showEditModal = false;
          this.loadSuppliers();
        }
      });
  }
  openDeleteModal(supplier: Supplier): void {
    if (!supplier.id || supplier.id <= 0) {
      return;
    }
    this.supplierToDelete = supplier;
    this.showDeleteModal = true;
    this.error = null;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.supplierToDelete = null;
    this.error = null;
  }

  confirmDelete(): void {
    if (!this.supplierToDelete?.id || this.supplierToDelete.id <= 0) {
      this.error = this.translateService.instant('SUPPLIER_BC.ERRORS.NOT_FOUND');
      return;
    }

    const id = this.supplierToDelete.id;
    this.loading = true;
    this.error = null;

    this.supplierApi.delete(id)
      .pipe(
        catchError(err => {
          console.error('Error deleting supplier', err);
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.DELETE');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.showDeleteModal = false;
          this.supplierToDelete = null;
        })
      )
      .subscribe((result: unknown) => {
        if (result !== null) {
          this.loadSuppliers();
        }
      });
  }

  registerSupplier(): void {
    this.registerFieldErrors = {};
    this.error = null;

    const isSupplierValid = this.validateSupplierFields(this.newSupplier, 'register');
    const areSpecialtiesValid = this.validateSpecialties(this.newSpecialties, 'register');

    if (!isSupplierValid || !areSpecialtiesValid) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
      return;
    }

    this.newSupplier.phone = this.parsePhone(this.newSupplier.phone);

    this.loading = true;
    this.error = null;

    this.newSupplier.specialties = [...this.newSpecialties];

    this.supplierApi.create(this.newSupplier)
      .pipe(
        catchError((err) => {
          console.error('Error adding supplier', err);
          if (
            err instanceof HttpErrorResponse &&
            this.applySupplierApiValidationErrors(err, 'register')
          ) {
            return of(null);
          }
          const msg = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.REGISTER');
          this.error = msg;
          if (msg) {
            this.snackBar.open(msg, this.translateService.instant('COMMON.CLOSE'), { duration: 6000, panelClass: ['snack-error'] });
          }
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result !== null) {
          this.showRegisterModal = false;
          this.resetForm();
          this.loadSuppliers();
        }
      });
  }

  addNewSpecialty(specialtyInput: HTMLInputElement): void {
    const specialty = specialtyInput.value.trim();
    delete this.registerFieldErrors['specialties'];

    const t = (k: string) => this.translateService.instant(k);

    if (!specialty) {
      return;
    }

    if (this.newSpecialties.length >= 4) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTIES_MAX');
      return;
    }

    if (this.newSpecialties.some((item) => item.toLowerCase() === specialty.toLowerCase())) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_DUPLICATE');
      return;
    }

    if (specialty.length < 2) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MIN_LENGTH');
      return;
    }

    if (specialty.length > 100) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MAX_LENGTH');
      return;
    }

    if (/^\d+$/.test(specialty)) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_NUMBERS');
      return;
    }

    if (/^[,.;]+$/.test(specialty)) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_PUNCTUATION');
      return;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(specialty)) {
      this.registerFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_INVALID_CHARACTERS');
      return;
    }

    this.newSpecialties.push(specialty);
    specialtyInput.value = '';
  }

  removeNewSpecialty(index: number): void {
    this.newSpecialties.splice(index, 1);
  }

  addEditSpecialty(specialtyInput: HTMLInputElement): void {
    const specialty = specialtyInput.value.trim();
    delete this.editFieldErrors['specialties'];

    const t = (k: string) => this.translateService.instant(k);

    if (!specialty) {
      return;
    }

    if (this.editingSpecialties.length >= 4) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTIES_MAX');
      return;
    }

    if (this.editingSpecialties.some((item) => item.toLowerCase() === specialty.toLowerCase())) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_DUPLICATE');
      return;
    }

    if (specialty.length < 2) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MIN_LENGTH');
      return;
    }

    if (specialty.length > 100) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MAX_LENGTH');
      return;
    }

    if (/^\d+$/.test(specialty)) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_NUMBERS');
      return;
    }

    if (/^[,.;]+$/.test(specialty)) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_PUNCTUATION');
      return;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(specialty)) {
      this.editFieldErrors['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_INVALID_CHARACTERS');
      return;
    }

    this.editingSpecialties.push(specialty);
    specialtyInput.value = '';
  }

  removeEditSpecialty(index: number): void {
    this.editingSpecialties.splice(index, 1);
  }

  resetForm(): void {
    this.newSupplier = {
      id: 0,
      name: '',
      email: '',
      phone: 0,
      location: '',
      specialties: [],
      userId: 0,
      contactPerson: '',
      webLink: '',
    };

    this.newSpecialties = [];
    this.registerFieldErrors = {};

    if (this.supplierForm) {
      this.supplierForm.resetForm();
    }

    this.error = null;
  }

  clearRegisterFieldError(field: string): void {
    delete this.registerFieldErrors[field];
  }

  clearEditFieldError(field: string): void {
    delete this.editFieldErrors[field];
  }

  private parsePhone(raw: unknown): number {
    if (raw === null || raw === undefined) {
      return NaN;
    }

    const phoneText = String(raw).trim();

    if (!phoneText) {
      return NaN;
    }

    if (!/^\d+$/.test(phoneText)) {
      return NaN;
    }

    return Number(phoneText);
  }

  private emailLooksValid(email: string): boolean {
    return /^(?!-)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  }

  private validateSpecialties(
    specialties: string[],
    mode: 'register' | 'edit',
  ): boolean {
    const target = mode === 'register' ? this.registerFieldErrors : this.editFieldErrors;
    delete target['specialties'];

    const t = (k: string) => this.translateService.instant(k);

    const cleanedSpecialties = specialties
      .map((specialty) => specialty.trim())
      .filter((specialty) => specialty.length > 0);

    if (cleanedSpecialties.length > 4) {
      target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTIES_MAX');
      return false;
    }

    const normalizedSpecialties = cleanedSpecialties.map((specialty) =>
      specialty.toLowerCase(),
    );

    const hasDuplicates = new Set(normalizedSpecialties).size !== normalizedSpecialties.length;

    if (hasDuplicates) {
      target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_DUPLICATE');
      return false;
    }

    for (const specialty of cleanedSpecialties) {
      if (specialty.length < 2) {
        target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MIN_LENGTH');
        return false;
      }

      if (specialty.length > 100) {
        target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_MAX_LENGTH');
        return false;
      }

      if (/^\d+$/.test(specialty)) {
        target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_NUMBERS');
        return false;
      }

      if (/^[,.;]+$/.test(specialty)) {
        target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_ONLY_PUNCTUATION');
        return false;
      }

      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(specialty)) {
        target['specialties'] = t('SUPPLIER_BC.VALIDATION.SPECIALTY_INVALID_CHARACTERS');
        return false;
      }
    }

    if (mode === 'register') {
      this.newSpecialties = cleanedSpecialties;
    } else {
      this.editingSpecialties = cleanedSpecialties;
    }

    return true;
  }


  /**
   * Validación en cliente con mensaje por campo.
   * @returns true si todo es válido.
   */
  private validateSupplierFields(
    model: Supplier,
    mode: 'register' | 'edit',
  ): boolean {
    const target = mode === 'register' ? this.registerFieldErrors : this.editFieldErrors;
    (['name', 'email', 'phone', 'location', 'contactPerson', 'webLink'] as const).forEach((k) => delete target[k]);
    delete target['specialties'];

    let ok = true;
    const t = (k: string) => this.translateService.instant(k);

    const name = (model.name ?? '').trim();
    if (!name) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_REQUIRED');
      ok = false;
    } else if (name.length < 2) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_MIN_LENGTH');
      ok = false;
    } else if (name.length > 100) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_MAX_LENGTH');
      ok = false;
    } else if (/^\d+$/.test(name)) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_ONLY_NUMBERS');
      ok = false;
    } else if (/^[,.;]+$/.test(name)) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_INVALID_CHARACTERS');
      ok = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(name)) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_INVALID_CHARACTERS');
      ok = false;
    }

    const email = (model.email ?? '').trim();

    if (!email) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_REQUIRED');
      ok = false;
    } else if (email.length > 100) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_MAX_LENGTH');
      ok = false;
    } else if (email.startsWith('-')) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_STARTS_WITH_HYPHEN');
      ok = false;
    } else if (!this.emailLooksValid(email)) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_INVALID');
      ok = false;
    }

    const phoneText = String(model.phone ?? '').trim();

    if (!phoneText || phoneText === '0') {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_REQUIRED');
      ok = false;
    } else if (/^-/.test(phoneText)) {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_NEGATIVE');
      ok = false;
    } else if (!/^\d+$/.test(phoneText)) {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_ONLY_NUMBERS');
      ok = false;
    } else if (phoneText.length < 7) {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_MIN_LENGTH');
      ok = false;
    } else if (phoneText.length > 15) {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_MAX_LENGTH');
      ok = false;
    }

    const location = (model.location ?? '').trim();

    if (!location) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_REQUIRED');
      ok = false;
    } else if (location.length < 2) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_MIN_LENGTH');
      ok = false;
    } else if (location.length > 200) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_MAX_LENGTH');
      ok = false;
    } else if (/^\d+$/.test(location)) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_ONLY_NUMBERS');
      ok = false;
    } else if (/^[,.;]+$/.test(location)) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_ONLY_PUNCTUATION');
      ok = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s,.;]+$/.test(location)) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_INVALID_CHARACTERS');
      ok = false;
    }

    // Campos opcionales TUS01: solo se validan si tienen valor
    const contactPerson = (model.contactPerson ?? '').trim();
    if (contactPerson) {
      if (contactPerson.length < 2) {
        target['contactPerson'] = t('SUPPLIER_BC.VALIDATION.CONTACT_PERSON_MIN_LENGTH');
        ok = false;
      } else if (contactPerson.length > 100) {
        target['contactPerson'] = t('SUPPLIER_BC.VALIDATION.CONTACT_PERSON_MAX_LENGTH');
        ok = false;
      } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.]+$/.test(contactPerson)) {
        target['contactPerson'] = t('SUPPLIER_BC.VALIDATION.CONTACT_PERSON_INVALID_CHARACTERS');
        ok = false;
      }
    }

    const webLink = (model.webLink ?? '').trim();
    if (webLink) {
      if (webLink.length > 200) {
        target['webLink'] = t('SUPPLIER_BC.VALIDATION.WEB_LINK_MAX_LENGTH');
        ok = false;
      } else if (!/^https?:\/\/[\w.-]+(:\d+)?(\/\S*)?$/.test(webLink)) {
        target['webLink'] = t('SUPPLIER_BC.VALIDATION.WEB_LINK_INVALID');
        ok = false;
      }
    }

    return ok;
  }

  /**
   * Mapea cuerpo 400 con {@code errors: [{ field, message }]} del backend.
   * @returns true si se interpretó como validación por campo.
   */
  private applySupplierApiValidationErrors(
    err: HttpErrorResponse,
    mode: 'register' | 'edit',
  ): boolean {
    if (err.status !== 400) {
      return false;
    }
    const body = err.error;
    if (!body || typeof body !== 'object') {
      return false;
    }
    const rawErrors = (body as { errors?: unknown }).errors;
    if (!Array.isArray(rawErrors) || rawErrors.length === 0) {
      return false;
    }

    if (mode === 'register') {
      this.registerFieldErrors = {};
    } else {
      this.editFieldErrors = {};
    }
    const target =
      mode === 'register' ? this.registerFieldErrors : this.editFieldErrors;

    const unmapped: string[] = [];
    for (const item of rawErrors) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const row = item as {
        field?: string;
        message?: string;
        defaultMessage?: string;
      };
      const text = (row.message || row.defaultMessage || '').trim();
      if (!text) {
        continue;
      }
      const key = this.normalizeSupplierApiField(row.field || '');
      if (key === 'userId') {
        unmapped.push(text);
      } else if (key) {
        const prev = target[key];
        target[key] = prev ? `${prev} · ${text}` : text;
      } else {
        unmapped.push(text);
      }
    }

    const hasFieldErrors = Object.keys(target).length > 0;
    if (unmapped.length > 0) {
      this.error = unmapped.join(' | ');
    } else if (hasFieldErrors) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
    } else {
      this.error = null;
    }
    return true;
  }

  private normalizeSupplierApiField(field: string): string | null {
    if (!field) {
      return null;
    }
    const leaf = field.replace(/\[\d+\]/g, '').split('.').pop() || field;
    const allowed = new Set([
      'name',
      'email',
      'phone',
      'location',
      'specialties',
      'userId',
      'contactPerson',
      'webLink',
    ]);
    return allowed.has(leaf) ? leaf : null;
  }


  private supplierErrorMessage(err: unknown, i18nKey: string): string {
    const fallback = this.translateService.instant(i18nKey);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.NETWORK');
      }
      if (err.status === 401 || err.status === 403) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.UNAUTHORIZED');
      }
      const fromBody = getUserFacingApiMessage(err, '');
      if (fromBody) {
        return fromBody;
      }
      if (err.status === 404) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.NOT_FOUND');
      }
    }
    const fromApi = getUserFacingApiMessage(err, '');
    if (fromApi) {
      return fromApi;
    }
    return fallback || this.translateService.instant('SUPPLIER_BC.ERRORS.GENERIC');
  }
}
