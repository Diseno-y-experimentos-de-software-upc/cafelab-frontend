import { Component, Input, OnInit } from '@angular/core';
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
  /** Nombre del café: solo letras (incl. acentos) y espacios; al menos una letra. */
  private static readonly COFFEE_DISPLAY_NAME_PATTERN = /^(?=.*\p{L})[\p{L} ]+$/u;

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

  private static readonly API_FIELD_I18N: Record<string, string> = {
    coffeeDisplayName: 'DEFECT_BC.FORM.ERRORS.COFFEE_NAME_REQUIRED',
    coffeeVariety: 'DEFECT_BC.FORM.ERRORS.VARIETY_REQUIRED',
    name: 'DEFECT_BC.FORM.ERRORS.DEFECT_NAME_REQUIRED',
    defectType: 'DEFECT_BC.FORM.ERRORS.DEFECT_TYPE_REQUIRED',
    defectWeight: 'DEFECT_BC.FORM.ERRORS.DEFECT_WEIGHT_POSITIVE',
    percentage: 'DEFECT_BC.FORM.ERRORS.PERCENTAGE_RANGE',
    probableCause: 'DEFECT_BC.FORM.ERRORS.CAUSE_REQUIRED',
    suggestedSolution: 'DEFECT_BC.FORM.ERRORS.SOLUTION_REQUIRED',
  };

  private static readonly REQUIRED_I18N: Record<string, string> = {
    coffeeDisplayName: 'DEFECT_BC.FORM.ERRORS.COFFEE_NAME_REQUIRED',
    coffeeVariety: 'DEFECT_BC.FORM.ERRORS.VARIETY_REQUIRED',
    defectName: 'DEFECT_BC.FORM.ERRORS.DEFECT_NAME_REQUIRED',
    defectType: 'DEFECT_BC.FORM.ERRORS.DEFECT_TYPE_REQUIRED',
    probableCause: 'DEFECT_BC.FORM.ERRORS.CAUSE_REQUIRED',
    suggestedSolution: 'DEFECT_BC.FORM.ERRORS.SOLUTION_REQUIRED',
    percentage: 'DEFECT_BC.FORM.ERRORS.PERCENTAGE_REQUIRED',
  };

  form!: FormGroup;
  submitAttempted = false;
  apiBannerError: string | null = null;

  /** Si está definido (>0), el formulario actúa en modo edición (PUT). */
  @Input() editEntryId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly defectLibraryApi: DefectLibraryApi,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      coffeeDisplayName: [
        '',
        [
          Validators.required,
          Validators.maxLength(255),
          Validators.pattern(AddDefectLibraryEntryComponent.COFFEE_DISPLAY_NAME_PATTERN),
        ],
      ],
      coffeeRegion: ['', [Validators.maxLength(255)]],
      coffeeVariety: ['', [Validators.required, Validators.maxLength(255)]],
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
    if (this.editEntryId != null && this.editEntryId > 0) {
      this.loadForEdit(this.editEntryId);
    }
  }

  private gramsToInput(grams: number, unit: MassUnit): number {
    return unit === 'kg' ? grams / 1000 : grams;
  }

  private loadForEdit(id: number): void {
    this.defectLibraryApi.getById(id).subscribe({
      next: (e) => {
        const coffeeUnit: MassUnit =
          e.coffeeTotalWeight != null && e.coffeeTotalWeight >= 1000 ? 'kg' : 'g';
        const defectUnit: MassUnit = e.defectWeight >= 1000 ? 'kg' : 'g';
        this.form.patchValue({
          coffeeDisplayName: e.coffeeDisplayName,
          coffeeRegion: e.coffeeRegion ?? '',
          coffeeVariety: e.coffeeVariety ?? '',
          coffeeTotalWeight:
            e.coffeeTotalWeight != null
              ? this.gramsToInput(e.coffeeTotalWeight, coffeeUnit)
              : null,
          coffeeTotalWeightUnit: coffeeUnit,
          defectName: e.name,
          defectType: e.defectType,
          defectWeight: this.gramsToInput(e.defectWeight, defectUnit),
          defectWeightUnit: defectUnit,
          percentage: e.percentage,
          probableCause: e.probableCause,
          suggestedSolution: e.suggestedSolution,
        });
      },
      error: () => {
        this.snackBar.open(this.translate.instant('DEFECT_BC.ERRORS.DETAIL'), undefined, { duration: 5000 });
        void this.router.navigate(['/libraryDefects']);
      },
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
      if (!controlName) {
        continue;
      }
      const trimmed = msg.trim();
      const display = trimmed.startsWith('DEFECT_BC.')
        ? this.translate.instant(trimmed)
        : AddDefectLibraryEntryComponent.API_FIELD_I18N[apiField]
          ? this.translate.instant(AddDefectLibraryEntryComponent.API_FIELD_I18N[apiField])
          : trimmed;
      if (!display) {
        continue;
      }
      const c = this.form.get(controlName);
      if (c) {
        c.setErrors({ ...(c.errors ?? {}), apiMessage: display });
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
      coffeeVariety: String(v['coffeeVariety'] ?? '').trim(),
      coffeeTotalWeight: coffeeTotalWeightGrams,
      name: String(v['defectName']).trim(),
      defectType: String(v['defectType']).trim(),
      defectWeight: defectWeightGrams,
      percentage: pct,
      probableCause: String(v['probableCause']).trim(),
      suggestedSolution: String(v['suggestedSolution']).trim(),
    };

    const save$ =
      this.editEntryId != null && this.editEntryId > 0
        ? this.defectLibraryApi.update(this.editEntryId, { ...entry, id: this.editEntryId })
        : this.defectLibraryApi.create(entry);

    save$.subscribe({
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
      const key = AddDefectLibraryEntryComponent.REQUIRED_I18N[controlName];
      return this.translate.instant(key ?? 'DEFECT_BC.FORM.ERRORS.REQUIRED');
    }
    if (show && c.hasError('pattern')) {
      return this.translate.instant('DEFECT_BC.FORM.ERRORS.COFFEE_NAME_LETTERS_ONLY');
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