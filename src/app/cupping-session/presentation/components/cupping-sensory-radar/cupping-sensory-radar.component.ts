import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import type { CuppingSensoryScores } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { DEFAULT_SENSORY } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';

export type CuppingRadarAccent = 'teal' | 'amber';

@Component({
  selector: 'app-cupping-sensory-radar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './cupping-sensory-radar.component.html',
  styleUrls: ['./cupping-sensory-radar.component.css'],
})
export class CuppingSensoryRadarComponent {
  
  @Input() scores: CuppingSensoryScores = { ...DEFAULT_SENSORY };

  
  @Input() chartInstanceId = 'radar';

  
  @Input() accent: CuppingRadarAccent = 'teal';

  
  @Input() pulse = false;

  
  @Input() compact = false;

  readonly maxChartR = 88;

  readonly axisKeys: (keyof CuppingSensoryScores)[] = [
    'aroma',
    'cuerpo',
    'acidez',
    'dulzor',
    'amargor',
    'aftertaste',
  ];

  readonly axisLabelKeys: string[] = [
    'CUPPING_DETAILS.AROMA',
    'CUPPING_DETAILS.BODY',
    'CUPPING_DETAILS.ACIDITY',
    'CUPPING_DETAILS.SWEETNESS',
    'CUPPING_DETAILS.BITTERNESS',
    'CUPPING_DETAILS.AFTERTASTE',
  ];

  readonly gridFractions = [0.25, 0.5, 0.75, 1] as const;

  get radarGradientId(): string {
    return `radarFillGrad-${this.chartInstanceId}`;
  }

  get strokeColor(): string {
    return this.accent === 'amber' ? '#7a4d24' : '#414535';
  }

  get fillStop1(): { color: string; opacity: number } {
    return this.accent === 'amber'
      ? { color: '#d4a574', opacity: 0.5 }
      : { color: '#618985', opacity: 0.45 };
  }

  get fillStop2(): { color: string; opacity: number } {
    return this.accent === 'amber'
      ? { color: '#8b5a2b', opacity: 0.38 }
      : { color: '#414535', opacity: 0.35 };
  }

  hexGridPoints(fraction: number): string {
    const R = this.maxChartR * fraction;
    return this.regularHexagonPoints(R);
  }

  private regularHexagonPoints(R: number): string {
    const n = 6;
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      parts.push(`${(R * Math.cos(angle)).toFixed(2)},${(R * Math.sin(angle)).toFixed(2)}`);
    }
    return parts.join(' ');
  }

  sensoryPolygonPoints(): string {
    const n = this.axisKeys.length;
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const v = Number(this.scores[this.axisKeys[i]]);
      const t = Math.max(0, Math.min(10, Number.isFinite(v) ? v : 5)) / 10;
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const r = t * this.maxChartR;
      parts.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
    }
    return parts.join(' ');
  }

  axisLineEnd(i: number): { x2: number; y2: number } {
    const n = 6;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return {
      x2: this.maxChartR * Math.cos(angle),
      y2: this.maxChartR * Math.sin(angle),
    };
  }

  axisLabelPos(i: number): { x: number; y: number } {
    const n = 6;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const R = this.maxChartR + 22;
    return { x: R * Math.cos(angle), y: R * Math.sin(angle) };
  }
}