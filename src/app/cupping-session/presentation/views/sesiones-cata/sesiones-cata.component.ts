import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { FormsModule } from '@angular/forms';
import {
  FiltroDialogComponent,
  type CuppingFiltrosAplicados,
} from '../../components/filtro-dialog/filtro-dialog.component';
import { NuevasCataComponent, type NuevaCataFormResult } from '../../components/nuevas-cata/nuevas-cata.component';
import { DetallesCataComponent } from '../../components/detalles-cata/detalles-cata.component';
import { CuppingSensoryRadarComponent } from '../../components/cupping-sensory-radar/cupping-sensory-radar.component';
import { CuppingSessionApi } from '../../../../cupping-session/application/cupping-session.api';
import type {
  CuppingSensoryScores,
  CuppingSessionEntry,
} from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { parseSensory } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/infrastructure/AuthService';

type SortMode = 'recent' | 'oldest' | 'name';

export interface CuppingCompareRow {
  readonly key: keyof CuppingSensoryScores;
  readonly labelKey: string;
}

@Component({
  selector: 'app-sesiones-cata',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    ToolbarComponent,
    FormsModule,
    DetallesCataComponent,
    CuppingSensoryRadarComponent,
    TranslateModule,
    MatToolbarModule,
    DatePipe,
  ],
  templateUrl: './sesiones-cata.component.html',
  styleUrls: ['./sesiones-cata.component.css'],
})
export class SesionesCataComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'fecha', 'origen', 'variedad', 'acciones'];
  searchText = '';
  mostrarComparacion = false;
  mostrarDetalle = false;
  sesionSeleccionada: CuppingSessionEntry | null = null;
  sesiones: CuppingSessionEntry[] = [];

  sortMode: SortMode = 'recent';
  favoritesOnly = false;

  compareIdA: number | null = null;
  compareIdB: number | null = null;

  filtros: CuppingFiltrosAplicados = {
    origen: '',
    variedad: '',
    fecha: null,
    procesamiento: '',
  };

  readonly compareRows: CuppingCompareRow[] = [
    { key: 'aroma', labelKey: 'CUPPING_DETAILS.AROMA' },
    { key: 'cuerpo', labelKey: 'CUPPING_DETAILS.BODY' },
    { key: 'acidez', labelKey: 'CUPPING_DETAILS.ACIDITY' },
    { key: 'dulzor', labelKey: 'CUPPING_DETAILS.SWEETNESS' },
    { key: 'amargor', labelKey: 'CUPPING_DETAILS.BITTERNESS' },
    { key: 'aftertaste', labelKey: 'CUPPING_DETAILS.AFTERTASTE' },
  ];

  
  compareScoreA(row: CuppingCompareRow | { key: keyof CuppingSensoryScores }): number {
    return this.sensoryA()[row.key];
  }

  compareScoreB(row: CuppingCompareRow | { key: keyof CuppingSensoryScores }): number {
    return this.sensoryB()[row.key];
  }

  constructor(
    private readonly dialog: MatDialog,
    private readonly cuppingSessionApi: CuppingSessionApi,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.obtenerSesiones();
  }

  obtenerSesiones(): void {
    this.cuppingSessionApi.getAll().subscribe({
      next: (data) => {
        this.sesiones = data;
      },
      error: () => {
        this.snackBar.open(this.translate.instant('CUPPING_BC.ERRORS.LOAD'), undefined, { duration: 4000 });
      },
    });
  }

  get sesionesFiltradas(): CuppingSessionEntry[] {
    const q = this.searchText.toLowerCase().trim();
    let list = this.sesiones
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.variety.toLowerCase().includes(q),
      )
      .filter(
        (s) =>
          (!this.filtros.origen || s.origin === this.filtros.origen) &&
          (!this.filtros.variedad || s.variety === this.filtros.variedad) &&
          (!this.filtros.procesamiento || s.processing === this.filtros.procesamiento) &&
          (!this.filtros.fecha || s.sessionDate.slice(0, 10) === this.filtros.fecha),
      );
    if (this.favoritesOnly) {
      list = list.filter((s) => s.favorite);
    }
    const sorted = [...list];
    if (this.sortMode === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } else if (this.sortMode === 'oldest') {
      sorted.sort((a, b) => this.cmpSessionDate(a, b));
    } else {
      sorted.sort((a, b) => this.cmpSessionDate(b, a));
    }
    return sorted;
  }

  private cmpSessionDate(a: CuppingSessionEntry, b: CuppingSessionEntry): number {
    const da = a.sessionDate.slice(0, 10);
    const db = b.sessionDate.slice(0, 10);
    if (da !== db) {
      return da.localeCompare(db);
    }
    return a.id - b.id;
  }

  get sesionCompareA(): CuppingSessionEntry | undefined {
    return this.sesiones.find((s) => s.id === this.compareIdA);
  }

  get sesionCompareB(): CuppingSessionEntry | undefined {
    return this.sesiones.find((s) => s.id === this.compareIdB);
  }

  sensoryA() {
    return parseSensory(this.sesionCompareA?.resultsJson);
  }

  sensoryB() {
    return parseSensory(this.sesionCompareB?.resultsJson);
  }

  toggleFavorito(sesion: CuppingSessionEntry): void {
    const actualizado: CuppingSessionEntry = { ...sesion, favorite: !sesion.favorite };
    this.cuppingSessionApi.update(sesion.id, actualizado).subscribe({
      next: (entity) => {
        Object.assign(sesion, entity);
      },
      error: () => {
        this.snackBar.open(this.translate.instant('CUPPING_BC.ERRORS.UPDATE'), undefined, { duration: 4000 });
      },
    });
  }

  mostrarFiltros(): void {
    const dialogRef = this.dialog.open(FiltroDialogComponent, {
      width: '600px',
      backdropClass: 'dialog-backdrop',
      panelClass: 'filter-dialog-panel',
      data: { sessions: this.sesiones, initial: this.filtros },
    });

    dialogRef.afterClosed().subscribe((result: CuppingFiltrosAplicados | undefined) => {
      if (result) {
        this.filtros = result;
      }
    });
  }

  verDetalle(sesion: CuppingSessionEntry): void {
    this.cuppingSessionApi.getById(sesion.id).subscribe({
      next: (fresh) => {
        this.mergeIntoList(fresh);
        this.sesionSeleccionada = fresh;
        this.mostrarDetalle = true;
      },
      error: () => {
        this.sesionSeleccionada = sesion;
        this.mostrarDetalle = true;
        this.snackBar.open(this.translate.instant('CUPPING_BC.ERRORS.DETAIL'), undefined, { duration: 4000 });
      },
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.sesionSeleccionada = null;
  }

  onSesionGuardada(entity: CuppingSessionEntry): void {
    this.sesionSeleccionada = entity;
    this.mergeIntoList(entity);
  }

  private mergeIntoList(entity: CuppingSessionEntry): void {
    const i = this.sesiones.findIndex((s) => s.id === entity.id);
    if (i >= 0) {
      this.sesiones[i] = entity;
    }
  }

  toggleComparacion(): void {
    this.mostrarComparacion = !this.mostrarComparacion;
    if (this.mostrarComparacion) {
      const list = this.sesionesFiltradas;
      this.compareIdA = list[0]?.id ?? null;
      this.compareIdB = list[1]?.id ?? list[0]?.id ?? null;
    }
  }

  iniciarNuevaCata(): void {
    const dialogRef = this.dialog.open(NuevasCataComponent, {
      width: '500px',
      backdropClass: 'dialog-backdrop',
      panelClass: 'filter-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((nueva: NuevaCataFormResult | undefined) => {
      if (!nueva) {
        return;
      }
      const entity: CuppingSessionEntry = {
        id: 0,
        userId: 0,
        name: nueva.name,
        origin: nueva.origin,
        variety: nueva.variety,
        processing: nueva.processing,
        sessionDate: nueva.sessionDate,
        favorite: false,
        resultsJson: null,
        roastStyleNotes: nueva.roastStyleNotes ? nueva.roastStyleNotes : null,
        coffeeLotId: nueva.coffeeLotId,
        roastProfileId: null,
      };
      this.cuppingSessionApi.create(entity).subscribe({
        next: (creada) => {
          this.sesiones = [creada, ...this.sesiones];
        },
        error: (err: unknown) => {
          const msg = getUserFacingApiMessage(err, this.translate.instant('CUPPING_BC.ERRORS.REGISTER'));
          this.snackBar.open(msg, undefined, { duration: 5000 });
        },
      });
    });
  }

  confirmarEliminacion(sesion: CuppingSessionEntry): void {
    const confirmMessage = this.translate.instant('CUPPING_SESSIONS.CONFIRM_DELETE', { name: sesion.name });
    const confirmTitle = this.translate.instant('CUPPING_SESSIONS.DELETE_SESSION_TITLE');

    if (confirm(`${confirmTitle}\n\n${confirmMessage}`)) {
      this.eliminarSesion(sesion);
    }
  }

  private eliminarSesion(sesion: CuppingSessionEntry): void {
    this.cuppingSessionApi.delete(sesion.id).subscribe({
      next: () => {
        const index = this.sesiones.findIndex((s) => s.id === sesion.id);
        if (index !== -1) {
          this.sesiones.splice(index, 1);
        }

        this.snackBar.open(
          this.translate.instant('CUPPING_SESSIONS.DELETE_SUCCESS', { name: sesion.name }),
          this.translate.instant('CUPPING_SESSIONS.CLOSE'),
          { duration: 3000 },
        );

        if (this.mostrarDetalle && this.sesionSeleccionada?.id === sesion.id) {
          this.cerrarDetalle();
        }
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('CUPPING_SESSIONS.DELETE_ERROR'),
          this.translate.instant('CUPPING_SESSIONS.CLOSE'),
          { duration: 3000 },
        );
      },
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

  
  refreshSesiones(): void {
    this.obtenerSesiones();
  }
}