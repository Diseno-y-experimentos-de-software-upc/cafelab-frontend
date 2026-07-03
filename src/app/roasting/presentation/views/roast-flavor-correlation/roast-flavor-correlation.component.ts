import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import type { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { RoastProfileApi } from '../../../application/roast-profile.api';
import type { RoastProfile } from '../../../domain/model/roast-profile.entity';
import { CuppingSessionApi } from '../../../../cupping-session/application/cupping-session.api';
import type {
  CuppingSessionEntry,
  CuppingSensoryScores,
} from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { parseSensory } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { CuppingSensoryRadarComponent } from '../../../../cupping-session/presentation/components/cupping-sensory-radar/cupping-sensory-radar.component';

/**
 * TUS04: Vista mínima de correlación lote-tueste-cata.
 * Reúne en una sola pantalla el lote seleccionado, sus perfiles de tueste
 * (curva de tueste) y sus sesiones de cata (radar sensorial).
 */
@Component({
  selector: 'app-roast-flavor-correlation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatToolbar,
    TranslateModule,
    ToolbarComponent,
    CuppingSensoryRadarComponent,
  ],
  templateUrl: './roast-flavor-correlation.component.html',
  styleUrl: './roast-flavor-correlation.component.css',
})
export class RoastFlavorCorrelationComponent implements OnInit {
  @ViewChild('curveCanvas') curveCanvas?: ElementRef<HTMLCanvasElement>;

  lots: CoffeeLot[] = [];
  selectedLotId: number | null = null;

  selectedLot: CoffeeLot | null = null;
  roastProfiles: RoastProfile[] = [];
  cuppingSessions: CuppingSessionEntry[] = [];
  selectedSessionId: number | null = null;

  loading = false;

  readonly curveColors = ['#8e44ad', '#c0392b', '#2980b9', '#27ae60'];

  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly roastProfileApi: RoastProfileApi,
    private readonly cuppingSessionApi: CuppingSessionApi,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.coffeeLotApi.getAll().subscribe((lots) => {
      this.lots = lots;
    });
  }

  ngAfterViewChecked(): void {
    this.drawRoastCurves();
  }

  onLotChange(): void {
    this.selectedLot = null;
    this.roastProfiles = [];
    this.cuppingSessions = [];
    this.selectedSessionId = null;
    const lotId = Number(this.selectedLotId);
    if (!lotId) {
      return;
    }
    this.loading = true;
    forkJoin({
      lot: this.coffeeLotApi.getById(lotId),
      profiles: this.roastProfileApi.getAll(),
      sessions: this.cuppingSessionApi.getByCoffeeLot(lotId),
    }).subscribe({
      next: ({ lot, profiles, sessions }) => {
        this.selectedLot = lot;
        this.roastProfiles = profiles.filter((p) => Number(p.lot) === lotId);
        this.cuppingSessions = sessions;
        this.selectedSessionId = sessions[0]?.id ?? null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get hasRelatedData(): boolean {
    return this.roastProfiles.length > 0 || this.cuppingSessions.length > 0;
  }

  get selectedSession(): CuppingSessionEntry | null {
    return this.cuppingSessions.find((s) => s.id === Number(this.selectedSessionId)) ?? null;
  }

  get selectedSessionScores(): CuppingSensoryScores {
    return parseSensory(this.selectedSession?.resultsJson);
  }

  private drawRoastCurves(): void {
    const canvas = this.curveCanvas?.nativeElement;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.roastProfiles.length === 0) {
      return;
    }

    const padding = 55;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    const durationMax = Math.max(...this.roastProfiles.map((p) => p.duration));
    const tempStartMin = Math.min(...this.roastProfiles.map((p) => p.tempStart));
    const tempEndMax = Math.max(...this.roastProfiles.map((p) => p.tempEnd));
    const tempRange = tempEndMax - tempStartMin || 1;

    const timeToX = (t: number) => padding + (t / (durationMax || 1)) * graphWidth;
    const tempToY = (temp: number) =>
      canvas.height - padding - ((temp - tempStartMin) / tempRange) * graphHeight;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const x = timeToX((i / steps) * durationMax);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      const y = tempToY(tempStartMin + (i / steps) * tempRange);
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

    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * durationMax;
      ctx.fillText(
        `${t.toFixed(1)} ${this.translate.instant('comparison.minutos')}`,
        timeToX(t),
        canvas.height - padding + 18,
      );
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= steps; i++) {
      const temp = tempStartMin + (i / steps) * tempRange;
      ctx.fillText(
        `${temp.toFixed(0)} ${this.translate.instant('comparison.gradosCelsius')}`,
        padding - 8,
        tempToY(temp) + 4,
      );
    }

    this.roastProfiles.forEach((profile, index) => {
      ctx.strokeStyle = this.curveColors[index % this.curveColors.length];
      ctx.lineWidth = 3;
      ctx.beginPath();
      const curveSteps = 100;
      for (let i = 0; i <= curveSteps; i++) {
        const t = (i / curveSteps) * profile.duration;
        const temp =
          profile.tempStart +
          ((profile.tempEnd - profile.tempStart) * Math.log1p(t)) / Math.log1p(profile.duration);
        const x = timeToX(t);
        const y = tempToY(temp);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
  }

  curveColor(index: number): string {
    return this.curveColors[index % this.curveColors.length];
  }
}
