import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DefectLibraryApi } from '../../../application/defect-library.api';
import type { DefectLibraryEntry } from '../../../domain/model/defect-library-entry.entity';
import type { ApiError } from '../../../../shared/infrastructure/base-api-endpoint';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { massInputToGrams, type MassUnit } from '../../../domain/mass-unit.util';

@Component({
  selector: 'app-add-defect-library-entry',
  standalone: true,
  templateUrl: './add-defect-library-entry.component.html',
  styleUrl: './add-defect-library-entry.component.css',
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    NgIf,
    MatSnackBarModule,
  ],
})
export class AddDefectLibraryEntryComponent implements OnInit {
  private static readonly API_FIELD_TO_CONTROL: Record<string, string> = {
    coffeeDisplayName: 'coffeeDisplayName',
    coffeeRegion: 'coffeeRegion',
    coffeeVariety: 'coffeeVariety',
    coffeeTotalWeight: 'coffeeTotalWeight',
    name: 'defectName',
    defectType: 'defectType',
    defectWeight: 'defectWeight',
    percentage: 'percentage',
    probableCause: 'probableCause',
    suggestedSolution: 'suggestedSolution',
  };

  form!: FormGroup;
  submitAttempted = false;
  apiBannerError: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly defectLibraryApi: DefectLibraryApi,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      coffeeDisplayName: ['', [Validators.required, Validators.maxLength(255)]],
      coffeeRegion: ['', [Validators.maxLength(255)]],
      coffeeVariety: ['', [Validators.maxLength(255)]],
      coffeeTotalWeight: [null as number | null],
      coffeeTotalWeightUnit: ['g' as MassUnit],
      defectName: ['', [Validators.required, Validators.maxLength(255)]],
      defectType: ['', [Validators.required, Validators.maxLength(255)]],
      defectWeight: ['', [Validators.required]],
      defectWeightUnit: ['g' as MassUnit],
      percentage: ['', [Validators.required]],
      probableCause: ['', [Validators.required]],
      suggestedSolution: ['', [Validators.required]],
    });
  }

  private resetCustomAndApiErrors(): void {
    for (const key of Object.keys(this.form.controls)) {
      const c = this.form.get(key);
      if (!c?.errors) {
        continue;
      }
      const er = { ...c.errors } as Record<string, unknown>;
      delete er['custom'];
      delete er['apiMessage'];
      c.setErrors(Object.keys(er).length > 0 ? (er as object) : null);
    }
  }

  private applyApiFieldErrors(fieldErrors: Record<string, string>): void {
    for (const [apiField, msg] of Object.entries(fieldErrors)) {
      const controlName = AddDefectLibraryEntryComponent.API_FIELD_TO_CONTROL[apiField];
      if (!controlName || !msg.trim()) {
        continue;
      }
      const c = this.form.get(controlName);
      if (c) {
        c.setErrors({ ...(c.errors ?? {}), apiMessage: msg.trim() });
        c.markAsTouched();
      }
    }
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.apiBannerError = null;
    this.resetCustomAndApiErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(this.translate.instant('DEFECT_BC.FORM.ERRORS.FIX_FORM'), undefined, {
        duration: 5000,
      });
      return;
    }

    const v = this.form.value as Record<string, unknown>;
    const dw = Number(v['defectWeight']);
    const defectUnit = (v['defectWeightUnit'] as MassUnit) || 'g';
    const pct = Number(v['percentage']);
    let clientInvalid = false;

    if (!(dw > 0) || Number.isNaN(dw)) {
      const c = this.form.get('defectWeight');
      c?.setErrors({ ...(c.errors ?? {}), custom: 'DEFECT_BC.FORM.ERRORS.DEFECT_WEIGHT_POSITIVE' });
      c?.markAsTouched();
      clientInvalid = true;
    }

    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      const c = this.form.get('percentage');
      c?.setErrors({ ...(c.errors ?? {}), custom: 'DEFECT_BC.FORM.ERRORS.PERCENTAGE_RANGE' });
      c?.markAsTouched();
      clientInvalid = true;
    }

    const rawTw = v['coffeeTotalWeight'];
    const tw =
      rawTw === null || rawTw === undefined || rawTw === ''
        ? null
        : Number(rawTw);
    const coffeeUnit = (v['coffeeTotalWeightUnit'] as MassUnit) || 'g';
    if (tw !== null && (Number.isNaN(tw) || tw < 0)) {
      const c = this.form.get('coffeeTotalWeight');
      c?.setErrors({ ...(c.errors ?? {}), custom: 'DEFECT_BC.FORM.ERRORS.COFFEE_WEIGHT_NEGATIVE' });
      c?.markAsTouched();
      clientInvalid = true;
    }

    if (clientInvalid) {
      this.snackBar.open(this.translate.instant('DEFECT_BC.FORM.ERRORS.FIX_FORM'), undefined, { duration: 5000 });
      return;
    }

    const coffeeTotalWeightGrams = tw === null ? null : massInputToGrams(tw, coffeeUnit);
    const defectWeightGrams = massInputToGrams(dw, defectUnit);

    const entry: DefectLibraryEntry = {
      id: 0,
      userId: null,
      coffeeDisplayName: String(v['coffeeDisplayName']).trim(),
      coffeeRegion: String(v['coffeeRegion'] ?? '').trim() || null,
      coffeeVariety: String(v['coffeeVariety'] ?? '').trim() || null,
      coffeeTotalWeight: coffeeTotalWeightGrams,
      name: String(v['defectName']).trim(),
      defectType: String(v['defectType']).trim(),
      defectWeight: defectWeightGrams,
      percentage: pct,
      probableCause: String(v['probableCause']).trim(),
      suggestedSolution: String(v['suggestedSolution']).trim(),
    };

    this.defectLibraryApi.create(entry).subscribe({
      next: () => void this.router.navigate(['/libraryDefects']),
      error: (err: unknown) => {
        const msg = getUserFacingApiMessage(
          err,
          this.translate.instant('DEFECT_BC.ERRORS.GENERIC'),
          this.translate.instant('DEFECT_BC.ERRORS.UNAUTHORIZED'),
        );
        this.apiBannerError = msg;
        this.snackBar.open(msg, undefined, { duration: 7000 });
        const fe = (err as ApiError).fieldErrors;
        if (fe && Object.keys(fe).length > 0) {
          this.applyApiFieldErrors(fe);
        }
      },
    });
  }

  onCancel(): void {
    void this.router.navigate(['/libraryDefects']);
  }

  /** Texto de ayuda g/kg solo tras intento de envío y error en el peso del café. */
  shouldShowCoffeeWeightFeedback(): boolean {
    if (!this.submitAttempted) {
      return false;
    }
    const c = this.form.get('coffeeTotalWeight');
    return !!(c && c.invalid);
  }

  /** Texto de ayuda g/kg solo tras intento de envío y error en el peso del defecto. */
  shouldShowDefectWeightFeedback(): boolean {
    if (!this.submitAttempted) {
      return false;
    }
    const c = this.form.get('defectWeight');
    return !!(c && c.invalid);
  }

  
  controlErrorMessage(controlName: string, maxLength = 255): string | null {
    const c = this.form.get(controlName);
    if (!c) {
      return null;
    }
    const show = c.touched || this.submitAttempted;
    if (c.hasError('apiMessage')) {
      return String(c.getError('apiMessage'));
    }
    if (show && c.hasError('custom')) {
      return this.translate.instant(String(c.getError('custom')));
    }
    if (show && c.hasError('required')) {
      return this.translate.instant('DEFECT_BC.FORM.ERRORS.REQUIRED');
    }
    if (show && c.hasError('maxlength')) {
      const req = (c.errors?.['maxlength'] as { requiredLength?: number } | undefined)?.requiredLength;
      return this.translate.instant('DEFECT_BC.FORM.ERRORS.MAX_LENGTH', {
        max: req ?? maxLength,
      });
    }
    return null;
  }
}