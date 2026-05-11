import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  dateToIsoLocal,
  isIsoDateStrictlyBeforeToday,
} from '../../../../cupping-session/domain/local-calendar-date';

export interface NuevaCataFormResult {
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string;
  roastStyleNotes: string;
}

@Component({
  selector: 'app-nuevas-cata',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    TranslateModule,
  ],
  templateUrl: './nuevas-cata.component.html',
  styleUrls: ['./nuevas-cata.component.css'],
})
export class NuevasCataComponent {
  form = {
    name: '',
    origin: '',
    variety: '',
    processing: 'washed',
    sessionDate: (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    })(),
    roastStyleNotes: '',
  };

  readonly textPattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/;


  /** Mínimo seleccionable en el calendario (inicio del día local de hoy). */
  readonly minSessionDate: Date = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  /** Clave i18n mostrada con {@link TranslatePipe} (reacciona al idioma). */
  formErrorKey: string | null = null;

  processingCodes = ['washed', 'natural', 'honey', 'experimental'] as const;

  constructor(private readonly dialogRef: MatDialogRef<NuevasCataComponent, NuevaCataFormResult>) {}

  private isValidText(value: string): boolean {
    return this.textPattern.test(value.trim());
  }


  crearSesion(): void {
    this.formErrorKey = null;
    if (
      !this.form.name.trim() ||
      !this.form.origin.trim() ||
      !this.form.variety.trim() ||
      !this.form.sessionDate
    ) {
      this.formErrorKey = 'CUPPING_SESSIONS.REQUIRED_FIELDS_ERROR';
      return;
    }

    if (!this.isValidText(this.form.name)) {
      this.formErrorKey = 'CUPPING_SESSIONS.ERROR_INVALID_NAME';
      return;
    }

    if (!this.isValidText(this.form.origin)) {
      this.formErrorKey = 'CUPPING_SESSIONS.ERROR_INVALID_ORIGIN';
      return;
    }

    if (!this.isValidText(this.form.variety)) {
      this.formErrorKey = 'CUPPING_SESSIONS.ERROR_INVALID_VARIETY';
      return;
    }

    const d = this.form.sessionDate instanceof Date ? this.form.sessionDate : new Date(this.form.sessionDate);
    if (Number.isNaN(d.getTime())) {
      this.formErrorKey = 'CUPPING_SESSIONS.SESSION_DATE_INVALID';
      return;
    }
    const iso = dateToIsoLocal(d);
    if (isIsoDateStrictlyBeforeToday(iso)) {
      this.formErrorKey = 'CUPPING_SESSIONS.SESSION_DATE_PAST_ERROR';
      return;
    }
    const out: NuevaCataFormResult = {
      name: this.form.name.trim(),
      origin: this.form.origin.trim(),
      variety: this.form.variety.trim(),
      processing: this.form.processing,
      sessionDate: iso,
      roastStyleNotes: this.form.roastStyleNotes.trim(),
    };
    this.dialogRef.close(out);
  }
}
