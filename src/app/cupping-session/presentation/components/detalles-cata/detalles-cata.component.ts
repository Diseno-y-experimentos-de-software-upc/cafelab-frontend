import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CuppingSessionApi } from '../../../../cupping-session/application/cupping-session.api';
import {
  parseSensory,
  type CuppingSensoryScores,
  type CuppingSessionEntry,
} from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { TranslateService } from '@ngx-translate/core';
import { CuppingSensoryRadarComponent } from '../cupping-sensory-radar/cupping-sensory-radar.component';

@Component({
  selector: 'app-detalles-cata',
  standalone: true,
  imports: [
    CommonModule,
    MatSliderModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    TranslateModule,
    MatSnackBarModule,
    CuppingSensoryRadarComponent,
  ],
  templateUrl: './detalles-cata.component.html',
  styleUrls: ['./detalles-cata.component.css'],
})
export class DetallesCataComponent implements OnChanges {
  @Input({ required: true }) sesion!: CuppingSessionEntry;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<CuppingSessionEntry>();

  evaluacion: CuppingSensoryScores = { ...parseSensory(null) };

  configDraft = {
    name: '',
    origin: '',
    variety: '',
    processing: 'washed',
    roastStyleNotes: '',
  };

  processingCodes = ['washed', 'natural', 'honey', 'experimental'] as const;
  saving = false;

  /** Fecha de sesión solo lectura (misma lógica de presentación que el listado). */
  get sessionDateDisplay(): string {
    const raw = (this.sesion?.sessionDate ?? '').toString().slice(0, 10);
    if (raw.length !== 10) {
      return '—';
    }
    try {
      const lang = this.translate.getCurrentLang() || 'es';
      return formatDate(`${raw}T12:00:00`, 'mediumDate', lang);
    } catch {
      return raw;
    }
  }

  
  hexagonoAnimar = false;

  constructor(
    private readonly router: Router,
    private readonly cuppingSessionApi: CuppingSessionApi,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sesion']?.currentValue) {
      this.syncFromSesion();
    }
  }

  private syncFromSesion(): void {
    const s = this.sesion;
    this.evaluacion = { ...parseSensory(s.resultsJson) };
    this.configDraft = {
      name: s.name ?? '',
      origin: s.origin ?? '',
      variety: s.variety ?? '',
      processing: s.processing || 'washed',
      roastStyleNotes: s.roastStyleNotes ?? '',
    };
  }

  volver(): void {
    this.closed.emit();
  }

  generarHexagono(): void {
    this.hexagonoAnimar = true;
    window.setTimeout(() => {
      this.hexagonoAnimar = false;
    }, 450);
  }

  abrirBibliotecaDefectos(): void {
    void this.router.navigate(['/libraryDefects']);
  }

  guardarSesion(): void {
    if (!this.sesion?.id || this.saving) {
      return;
    }
    if (!this.configDraft.name.trim()) {
      this.snackBar.open(this.translate.instant('CUPPING_DETAILS.NAME_REQUIRED'), undefined, { duration: 4000 });
      return;
    }
    this.saving = true;
    const resultsJson = JSON.stringify({
      aroma: this.evaluacion.aroma,
      cuerpo: this.evaluacion.cuerpo,
      acidez: this.evaluacion.acidez,
      dulzor: this.evaluacion.dulzor,
      amargor: this.evaluacion.amargor,
      aftertaste: this.evaluacion.aftertaste,
    });
    const sessionDateIso = (this.sesion.sessionDate ?? '').slice(0, 10);
    const updated: CuppingSessionEntry = {
      ...this.sesion,
      name: this.configDraft.name.trim(),
      origin: this.configDraft.origin.trim(),
      variety: this.configDraft.variety.trim(),
      processing: this.configDraft.processing.trim(),
      sessionDate: sessionDateIso,
      roastStyleNotes: this.configDraft.roastStyleNotes.trim() || null,
      resultsJson,
    };
    this.cuppingSessionApi.update(this.sesion.id, updated).subscribe({
      next: (entity) => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('CUPPING_DETAILS.SAVE_SUCCESS'), undefined, { duration: 3000 });
        this.saved.emit(entity);
      },
      error: (err: unknown) => {
        this.saving = false;
        const msg = getUserFacingApiMessage(err, this.translate.instant('CUPPING_DETAILS.SAVE_ERROR'));
        this.snackBar.open(msg, undefined, { duration: 5000 });
      },
    });
  }
}