import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface CuppingSessionEntry extends BaseEntity {
  userId: number;
  name: string;
  origin: string;
  variety: string;
  processing: string;
  
  sessionDate: string;
  favorite: boolean;
  resultsJson: string | null;
  roastStyleNotes: string | null;
  coffeeLotId: number | null;
  roastProfileId: number | null;
}

export interface CuppingSensoryScores {
  aroma: number;
  cuerpo: number;
  acidez: number;
  dulzor: number;
  amargor: number;
  aftertaste: number;
}

export const DEFAULT_SENSORY: CuppingSensoryScores = {
  aroma: 5,
  cuerpo: 5,
  acidez: 5,
  dulzor: 5,
  amargor: 5,
  aftertaste: 5,
};

export function parseSensory(json: string | null | undefined): CuppingSensoryScores {
  if (!json?.trim()) {
    return { ...DEFAULT_SENSORY };
  }
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    return {
      aroma: Number(o['aroma'] ?? DEFAULT_SENSORY.aroma),
      cuerpo: Number(o['cuerpo'] ?? DEFAULT_SENSORY.cuerpo),
      acidez: Number(o['acidez'] ?? DEFAULT_SENSORY.acidez),
      dulzor: Number(o['dulzor'] ?? DEFAULT_SENSORY.dulzor),
      amargor: Number(o['amargor'] ?? DEFAULT_SENSORY.amargor),
      aftertaste: Number(o['aftertaste'] ?? DEFAULT_SENSORY.aftertaste),
    };
  } catch {
    return { ...DEFAULT_SENSORY };
  }
}