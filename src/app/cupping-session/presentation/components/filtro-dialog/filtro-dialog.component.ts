import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import type { CuppingSessionEntry } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';

export interface CuppingFiltroDialogData {
  sessions: CuppingSessionEntry[];
  initial?: CuppingFiltrosAplicados;
}

export interface CuppingFiltrosAplicados {
  origen: string;
  variedad: string;
  fecha: string | null;
  procesamiento: string;
}

@Component({
  selector: 'app-filtro-dialog',
  standalone: true,
  templateUrl: './filtro-dialog.component.html',
  styleUrls: ['./filtro-dialog.component.css'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    FormsModule,
    TranslatePipe,
  ],
})
export class FiltroDialogComponent implements OnInit {
  filtrosUi = {
    origen: '',
    variedad: '',
    fecha: null as Date | null,
    procesamiento: '',
  };

  origenes: string[] = [];
  variedades: string[] = [];
  procesamientos: string[] = [];

  constructor(
    private readonly dialogRef: MatDialogRef<FiltroDialogComponent, CuppingFiltrosAplicados>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CuppingFiltroDialogData,
  ) {}

  ngOnInit(): void {
    const sessions = this.data?.sessions ?? [];
    const origins = new Set<string>();
    const varieties = new Set<string>();
    const processings = new Set<string>();
    for (const s of sessions) {
      if (s.origin?.trim()) {
        origins.add(s.origin.trim());
      }
      if (s.variety?.trim()) {
        varieties.add(s.variety.trim());
      }
      if (s.processing?.trim()) {
        processings.add(s.processing.trim());
      }
    }
    this.origenes = [...origins].sort((a, b) => a.localeCompare(b));
    this.variedades = [...varieties].sort((a, b) => a.localeCompare(b));
    this.procesamientos = [...processings].sort((a, b) => a.localeCompare(b));

    const init = this.data?.initial;
    if (init) {
      this.filtrosUi.origen = init.origen ?? '';
      this.filtrosUi.variedad = init.variedad ?? '';
      this.filtrosUi.procesamiento = init.procesamiento ?? '';
      this.filtrosUi.fecha = init.fecha ? new Date(`${init.fecha}T12:00:00`) : null;
    }
  }

  aplicarFiltros(): void {
    let fechaIso: string | null = null;
    if (this.filtrosUi.fecha instanceof Date && !Number.isNaN(this.filtrosUi.fecha.getTime())) {
      fechaIso = this.filtrosUi.fecha.toISOString().slice(0, 10);
    }
    this.dialogRef.close({
      origen: this.filtrosUi.origen,
      variedad: this.filtrosUi.variedad,
      fecha: fechaIso,
      procesamiento: this.filtrosUi.procesamiento,
    });
  }
}