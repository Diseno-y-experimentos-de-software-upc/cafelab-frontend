import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoastProfileApi } from '../../../application/roast-profile.api';
import { RoastProfile } from '../../../domain/model/roast-profile.entity';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import type { ApiError } from '../../../../shared/infrastructure/base-api-endpoint';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';

@Component({
  selector: 'app-roast-profile-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './roast-profile-list.component.html',
  styleUrls: ['./roast-profile-list.component.css'],
})
export class RoastProfileListComponent implements OnInit {
  @ViewChild('profileForm') profileForm!: NgForm;
  @ViewChild('editForm') editForm!: NgForm;
  @ViewChild('roastCurveCanvas') roastCurveCanvas: unknown;

  coffeeLots: CoffeeLot[] = [];
  profiles: RoastProfile[] = [];
  searchQuery = '';
  showProfileDetails = false;
  showEditModal = false;
  showRegisterModal = false;
  showDeleteModal = false;

  selectedProfile: RoastProfile | null = null;
  editingProfile: RoastProfile | null = null;
  profileToDelete: RoastProfile | null = null;

  newProfile: RoastProfile = this.getEmptyProfile();

  loading = false;
  error: string | null = null;

  fieldErrors: Record<string, string> = {};
  editFieldErrors: Record<string, string> = {};

  showFavoritesOnly = false;
  sortOrder: 'asc' | 'desc' = 'desc';

  readonly roastTypeCanonical = ['Ligero', 'Medio', 'Medio-Oscuro', 'Oscuro'] as const;

  private readonly roastProfileFieldErrorOrder = [
    'name',
    'type',
    'duration',
    'tempStart',
    'tempEnd',
    'lot',
    'isFavorite',
  ];

  constructor(
    private readonly roastProfileApi: RoastProfileApi,
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    this.loadCoffeeLots();
  }

  private getEmptyProfile(): RoastProfile {
    return {
      id: 0,
      userId: 0,
      name: '',
      type: '',
      duration: 0,
      tempStart: 0,
      tempEnd: 0,
      lot: 0,
      isFavorite: false,
    };
  }

  roastTypeLabelKey(value: string): string {
    const m: Record<string, string> = {
      Ligero: 'ROAST_PROFILE_BC.OPTIONS.ROAST_TYPE.LIGHT',
      Medio: 'ROAST_PROFILE_BC.OPTIONS.ROAST_TYPE.MEDIUM',
      'Medio-Oscuro': 'ROAST_PROFILE_BC.OPTIONS.ROAST_TYPE.MEDIUM_DARK',
      Oscuro: 'ROAST_PROFILE_BC.OPTIONS.ROAST_TYPE.DARK',
    };
    return m[value] ?? value;
  }

  roastTypeLabel(value: string): string {
    const key = this.roastTypeLabelKey(value);
    return key === value ? value : this.translate.instant(key);
  }

  
  fieldLabel(fieldKey: string): string {
    const i18nKey = this.roastProfileFieldLabelKey(fieldKey);
    return i18nKey ? this.translate.instant(i18nKey) : fieldKey;
  }

  private roastProfileFieldLabelKey(fieldKey: string): string | null {
    const m: Record<string, string> = {
      name: 'ROAST_PROFILE_BC.FIELD.NAME',
      type: 'ROAST_PROFILE_BC.FIELD.TYPE',
      duration: 'ROAST_PROFILE_BC.FIELD.DURATION',
      tempStart: 'ROAST_PROFILE_BC.FIELD.TEMP_START',
      tempEnd: 'ROAST_PROFILE_BC.FIELD.TEMP_END',
      lot: 'ROAST_PROFILE_BC.FIELD.LOT',
      isFavorite: 'ROAST_PROFILE_BC.FIELD.IS_FAVORITE',
    };
    return m[fieldKey] ?? null;
  }

  registerFieldErrorKeys(): string[] {
    return this.sortedFieldErrorKeys(this.fieldErrors);
  }

  editFieldErrorKeys(): string[] {
    return this.sortedFieldErrorKeys(this.editFieldErrors);
  }

  private sortedFieldErrorKeys(errors: Record<string, string>): string[] {
    const keys = Object.keys(errors);
    const rank = (k: string) => {
      const i = this.roastProfileFieldErrorOrder.indexOf(k);
      return i === -1 ? this.roastProfileFieldErrorOrder.length : i;
    };
    return keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }

  /**
   * Unifica claves de validación Spring ({@code createRoastProfileResource.lot} → {@code lot}).
   */
  private normalizeRoastProfileFieldErrors(
    raw: Record<string, string>,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [rawKey, msg] of Object.entries(raw)) {
      const key = rawKey.includes('.')
        ? rawKey.slice(rawKey.lastIndexOf('.') + 1)
        : rawKey;
      out[key] = msg;
    }
    return out;
  }

  openRegisterModal(): void {
    this.error = null;
    this.fieldErrors = {};
    if (this.coffeeLots.length === 0) {
      this.error = this.translate.instant('ROAST_PROFILE_BC.HINT.NEED_LOT');
      return;
    }
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
    this.fieldErrors = {};
    this.error = null;
  }

  loadProfiles(): void {
    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading profiles', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.LOAD');
          return of([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((profiles) => {
        this.profiles = profiles;
      });
  }

  searchProfiles(): void {
    if (this.searchQuery.trim()) {
      this.loading = true;
      this.error = null;

      this.roastProfileApi
        .searchRoastProfiles(this.searchQuery)
        .pipe(
          catchError((err) => {
            console.error('Error searching profiles', err);
            this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.SEARCH');
            return of([]);
          }),
          finalize(() => (this.loading = false)),
        )
        .subscribe((profiles) => {
          this.profiles = profiles;
        });
    } else {
      this.loadProfiles();
    }
  }

  applyFilters(): void {
    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .filterProfiles(this.showFavoritesOnly, this.sortOrder)
      .pipe(
        catchError((err) => {
          console.error('Error filtering profiles', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.FILTER');
          return of([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((profiles) => {
        this.profiles = profiles;
      });
  }

  toggleFavorite(profile: RoastProfile, event: Event): void {
    event.stopPropagation();
    if (!profile.id || profile.id <= 0) return;

    this.roastProfileApi
      .toggleFavorite(profile.id)
      .pipe(
        catchError((err) => {
          console.error('Error toggling favorite', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.TOGGLE_FAVORITE');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          const index = this.profiles.findIndex((p) => p.id === profile.id);
          if (index !== -1) {
            this.profiles[index].isFavorite = result.isFavorite;
          }
        }
      });
  }

  viewProfileDetails(profile: RoastProfile): void {
    this.selectedProfile = { ...profile };
    this.showProfileDetails = true;
    this.error = null;

    setTimeout(() => {
      this.drawRoastCurve();
    }, 0);
  }

  closeProfileDetails(): void {
    this.showProfileDetails = false;
    this.selectedProfile = null;
  }

  editProfile(profile: RoastProfile): void {
    this.editFieldErrors = {};
    this.editingProfile = { ...profile };
    this.showEditModal = true;
    this.showProfileDetails = false;
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
    const t = (k: string) => this.translate.instant(k);
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]+$/;
    if (!this.newProfile.name?.trim()) {
      e['name'] = t('ROAST_PROFILE_BC.VALIDATION.NAME');
    } else if (!namePattern.test(this.newProfile.name.trim())) {
      e['name'] = t('ROAST_PROFILE_BC.VALIDATION.NAME_SPECIAL_CHARS');
    }
    if (!this.newProfile.type?.trim()) {
      e['type'] = t('ROAST_PROFILE_BC.VALIDATION.TYPE');
    }
    const dur = Number(this.newProfile.duration);
    if (!Number.isFinite(dur) || dur < 1) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION');
    } else if (dur > 15) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION_MAX');
    } else if (!Number.isInteger(dur)) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION_INTEGER');
    }
    const ts = Number(this.newProfile.tempStart);
    if (!Number.isFinite(ts) || ts < 1) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START');
    } else if (ts > 240) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START_RANGE');
    } else if (!Number.isInteger(ts)) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START_INTEGER');
    }
    const te = Number(this.newProfile.tempEnd);
    if (!Number.isFinite(te) || te < 1) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END');
    } else if (te > 240) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END_RANGE');
    } else if (!Number.isInteger(te)) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END_INTEGER');
    }
    if (!e['tempStart'] && !e['tempEnd'] && Number.isFinite(ts) && Number.isFinite(te) && ts >= te) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_ORDER');
    }
    const lot = Number(this.newProfile.lot);
    if (!lot || lot <= 0) {
      e['lot'] = t('ROAST_PROFILE_BC.VALIDATION.LOT');
    }
    if (this.coffeeLots.length === 0) {
      e['lot'] = t('ROAST_PROFILE_BC.VALIDATION.NO_LOTS');
    }
    return e;
  }

  private collectEditFieldErrors(): Record<string, string> {
    if (!this.editingProfile) return {};
    const p = this.editingProfile;
    const e: Record<string, string> = {};
    const t = (k: string) => this.translate.instant(k);
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]+$/;
    if (!p.name?.trim()) {
      e['name'] = t('ROAST_PROFILE_BC.VALIDATION.NAME');
    } else if (!namePattern.test(p.name.trim())) {
      e['name'] = t('ROAST_PROFILE_BC.VALIDATION.NAME_SPECIAL_CHARS');
    }
    if (!p.type?.trim()) {
      e['type'] = t('ROAST_PROFILE_BC.VALIDATION.TYPE');
    }
    const dur = Number(p.duration);
    if (!Number.isFinite(dur) || dur < 1) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION');
    } else if (dur > 15) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION_MAX');
    } else if (!Number.isInteger(dur)) {
      e['duration'] = t('ROAST_PROFILE_BC.VALIDATION.DURATION_INTEGER');
    }
    const ts = Number(p.tempStart);
    if (!Number.isFinite(ts) || ts < 1) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START');
    } else if (ts > 240) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START_RANGE');
    } else if (!Number.isInteger(ts)) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_START_INTEGER');
    }
    const te = Number(p.tempEnd);
    if (!Number.isFinite(te) || te < 1) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END');
    } else if (te > 240) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END_RANGE');
    } else if (!Number.isInteger(te)) {
      e['tempEnd'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_END_INTEGER');
    }
    if (!e['tempStart'] && !e['tempEnd'] && Number.isFinite(ts) && Number.isFinite(te) && ts >= te) {
      e['tempStart'] = t('ROAST_PROFILE_BC.VALIDATION.TEMP_ORDER');
    }
    const lot = Number(p.lot);
    if (!lot || lot <= 0) {
      e['lot'] = t('ROAST_PROFILE_BC.VALIDATION.LOT');
    }
    return e;
  }

  saveProfileChanges(): void {
    if (!this.editingProfile?.id || this.editingProfile.id <= 0) {
      this.error = this.translate.instant('ROAST_PROFILE_BC.ERRORS.MISSING_ID');
      return;
    }

    this.editFieldErrors = {};
    const client = this.collectEditFieldErrors();
    if (Object.keys(client).length > 0) {
      this.editFieldErrors = client;
      this.error = null;
      return;
    }

    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .update(this.editingProfile.id, this.editingProfile)
      .pipe(
        catchError((err) => {
          console.error('Error updating profile', err);
          const api = err as ApiError;
          if (api.fieldErrors && Object.keys(api.fieldErrors).length > 0) {
            this.editFieldErrors = this.normalizeRoastProfileFieldErrors(api.fieldErrors);
            this.error = null;
          } else {
            this.editFieldErrors = {};
            this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.UPDATE');
          }
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showEditModal = false;
          this.loadProfiles();
        }
      });
  }

  duplicateProfile(profile: RoastProfile, event: Event): void {
    event.stopPropagation();
    if (!profile.id || profile.id <= 0) return;

    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .duplicateProfile(profile.id)
      .pipe(
        catchError((err) => {
          console.error('Error duplicating profile', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.DUPLICATE');
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result) {
          this.profiles = [...this.profiles, result];
        }
      });
  }

  deleteProfile(profile: RoastProfile): void {
    if (!profile.id || profile.id <= 0) {
      this.error = this.translate.instant('ROAST_PROFILE_BC.ERRORS.MISSING_ID');
      return;
    }

    this.profileToDelete = profile;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.profileToDelete?.id || this.profileToDelete.id <= 0) {
      this.error = this.translate.instant('ROAST_PROFILE_BC.ERRORS.MISSING_ID');
      return;
    }

    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .delete(this.profileToDelete.id)
      .pipe(
        catchError((err) => {
          console.error('Error deleting profile', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.DELETE');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.showDeleteModal = false;
          this.profileToDelete = null;
        }),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.loadProfiles();
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.profileToDelete = null;
  }

  registerProfile(): void {
    this.fieldErrors = {};
    const client = this.collectRegisterFieldErrors();
    if (Object.keys(client).length > 0) {
      this.fieldErrors = client;
      this.error = null;
      return;
    }

    this.newProfile.lot = Number(this.newProfile.lot);

    this.loading = true;
    this.error = null;

    this.roastProfileApi
      .create(this.newProfile)
      .pipe(
        catchError((err) => {
          console.error('Error registering profile', err);
          const api = err as ApiError;
          if (api.fieldErrors && Object.keys(api.fieldErrors).length > 0) {
            this.fieldErrors = this.normalizeRoastProfileFieldErrors(api.fieldErrors);
            this.error = null;
          } else {
            this.fieldErrors = {};
            this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.REGISTER');
          }
          return of(null);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showRegisterModal = false;
          this.resetForm();
          this.loadProfiles();
        }
      });
  }

  resetForm(): void {
    this.newProfile = this.getEmptyProfile();
    this.fieldErrors = {};

    if (this.profileForm) {
      this.profileForm.resetForm();
    }

    this.error = null;
  }

  toggleShowFavorites(): void {
    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  compareProfiles(): void {
    void this.router.navigate(['/compare-profile']);
  }

  loadCoffeeLots(): void {
    this.coffeeLotApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading coffee lots', err);
          this.error = this.roastErrorMessage(err, 'ROAST_PROFILE_BC.ERRORS.LOAD_LOTS');
          return of([]);
        }),
      )
      .subscribe((lots: CoffeeLot[]) => {
        this.coffeeLots = lots;
      });
  }

  getLotName(lotId: number | undefined): string {
    if (!lotId) return '';
    const lot = this.coffeeLots.find((l) => l.id === lotId);
    return lot ? lot.lot_name : '';
  }

  drawRoastCurve(): void {
    if (!this.selectedProfile || !this.roastCurveCanvas) {
      return;
    }

    const canvas = (this.roastCurveCanvas as { nativeElement: HTMLCanvasElement })
      .nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = this.selectedProfile.duration;
    const tempStart = this.selectedProfile.tempStart;
    const tempEnd = this.selectedProfile.tempEnd;

    const padding = 70;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    const timeToX = (t: number) => padding + (t / duration) * graphWidth;
    const tempToY = (temp: number) =>
      canvas.height - padding - ((temp - tempStart) / (tempEnd - tempStart)) * graphHeight;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    const xSteps = 10;
    const ySteps = 10;

    for (let i = 0; i <= xSteps; i++) {
      const t = (i / xSteps) * duration;
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    for (let i = 0; i <= ySteps; i++) {
      const temp = tempStart + (i / ySteps) * (tempEnd - tempStart);
      const y = tempToY(temp);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    for (let i = 0; i <= xSteps; i++) {
      const t = (i / xSteps) * duration;
      const x = timeToX(t);
      ctx.fillText(
        `${t.toFixed(1)} ${this.translate.instant('comparison.minutos')}`,
        x,
        canvas.height - padding + 20,
      );
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const temp = tempStart + (i / ySteps) * (tempEnd - tempStart);
      const y = tempToY(temp);
      ctx.fillText(
        `${temp.toFixed(0)} ${this.translate.instant('comparison.gradosCelsius')}`,
        padding - 10,
        y + 5,
      );
    }

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText(
      this.translate.instant('comparison.graficoTitulo2'),
      canvas.width / 2,
      padding / 2,
    );

    const steps = 100;
    ctx.lineWidth = 3;

    ctx.strokeStyle = '#8e44ad';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration;
      const temp =
        tempStart + (tempEnd - tempStart) * (Math.log1p(t) / Math.log1p(duration));
      const x = timeToX(t);
      const y = tempToY(temp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#c0392b';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration;
      const temp =
        tempStart +
        (tempEnd - tempStart) *
          0.8 *
          (Math.log1p(t + 2) / Math.log1p(duration + 2));
      const x = timeToX(t);
      const y = tempToY(temp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const firstCrackTime = duration * 0.7;
    const secondCrackTime = duration * 0.9;

    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    ctx.strokeStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(timeToX(firstCrackTime), padding);
    ctx.lineTo(timeToX(firstCrackTime), canvas.height - padding);
    ctx.stroke();

    ctx.strokeStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(timeToX(secondCrackTime), padding);
    ctx.lineTo(timeToX(secondCrackTime), canvas.height - padding);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    const legendX = canvas.width - padding - 200;
    const legendY = padding + 20;
    const lineHeight = 20;

    const legendItems = [
      { color: '#8e44ad', label: this.translate.instant('comparison.temperaturaGrano') },
      { color: '#c0392b', label: this.translate.instant('comparison.temperaturaTambor') },
      { color: '#f1c40f', label: this.translate.instant('comparison.firstCrack') },
      { color: '#e74c3c', label: this.translate.instant('comparison.secondCrack') },
    ];

    legendItems.forEach((item, index) => {
      ctx.strokeStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + index * lineHeight);
      ctx.lineTo(legendX + 30, legendY + index * lineHeight);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.fillText(item.label, legendX + 40, legendY + index * lineHeight + 5);
    });
  }

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    if (user.home) {
      void this.router.navigate([user.home]);
      return;
    }
    switch (user.plan) {
      case 'barista':
        void this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        void this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        void this.router.navigate(['/dashboard/complete']);
        break;
      default:
        void this.router.navigate(['/']);
    }
  }

  refreshRoastProfiles(): void {
    window.location.reload();
  }

  private roastErrorMessage(err: unknown, i18nKey: string): string {
    if (err && typeof err === 'object' && 'i18nKey' in err) {
      const k = (err as { i18nKey: unknown }).i18nKey;
      if (typeof k === 'string' && k.length > 0) {
        return this.translate.instant(k);
      }
    }
    const fallback = this.translate.instant(i18nKey);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return this.translate.instant('ROAST_PROFILE_BC.ERRORS.NETWORK');
      }
      if (err.status === 401 || err.status === 403) {
        return this.translate.instant('ROAST_PROFILE_BC.ERRORS.UNAUTHORIZED');
      }
      if (err.status === 404) {
        return this.translate.instant('ROAST_PROFILE_BC.ERRORS.NOT_FOUND');
      }
    }
    const fromApi = getUserFacingApiMessage(err, '');
    if (fromApi) {
      return fromApi;
    }
    return fallback || this.translate.instant('ROAST_PROFILE_BC.ERRORS.GENERIC');
  }
}