import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { CuppingSessionEntry } from '../domain/model/cupping-session-entry.entity';
import type {
  CreateCuppingSessionBody,
  CuppingSessionListResponse,
  CuppingSessionResource,
  UpdateCuppingSessionBody,
} from './cupping-session-entry.response';

function toIsoDate(v: unknown): string {
  if (v == null) {
    return '';
  }
  if (typeof v === 'string') {
    return v.length >= 10 ? v.slice(0, 10) : v;
  }
  if (Array.isArray(v) && v.length >= 3) {
    const y = v[0];
    const m = String(v[1]).padStart(2, '0');
    const d = String(v[2]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v);
}

export class CuppingSessionEntryAssembler
  implements
    BaseAssembler<CuppingSessionEntry, CuppingSessionResource, CuppingSessionListResponse>
{
  toEntityFromResource(resource: CuppingSessionResource): CuppingSessionEntry {
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      origin: resource.origin ?? '',
      variety: resource.variety ?? '',
      processing: resource.processing ?? '',
      sessionDate: toIsoDate(resource.sessionDate),
      favorite: Boolean(resource.favorite),
      resultsJson: resource.resultsJson ?? null,
      roastStyleNotes: resource.roastStyleNotes ?? null,
      coffeeLotId: resource.coffeeLotId ?? null,
      roastProfileId: resource.roastProfileId ?? null,
    };
  }

  toResourceFromEntity(entity: CuppingSessionEntry): CuppingSessionResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      origin: entity.origin,
      variety: entity.variety,
      processing: entity.processing,
      sessionDate: entity.sessionDate,
      favorite: entity.favorite,
      resultsJson: entity.resultsJson,
      roastStyleNotes: entity.roastStyleNotes,
      coffeeLotId: entity.coffeeLotId,
      roastProfileId: entity.roastProfileId,
    };
  }

  toEntitiesFromResponse(_response: CuppingSessionListResponse): CuppingSessionEntry[] {
    return [];
  }

  toCreateBody(entity: CuppingSessionEntry): CreateCuppingSessionBody {
    const body: CreateCuppingSessionBody = {
      name: entity.name.trim(),
      origin: entity.origin.trim(),
      variety: entity.variety.trim(),
      processing: entity.processing.trim(),
      sessionDate: entity.sessionDate.slice(0, 10),
      favorite: entity.favorite,
    };
    if (entity.resultsJson) {
      body.resultsJson = entity.resultsJson;
    }
    if (entity.roastStyleNotes?.trim()) {
      body.roastStyleNotes = entity.roastStyleNotes.trim();
    }
    if (entity.coffeeLotId != null) {
      body.coffeeLotId = entity.coffeeLotId;
    }
    if (entity.roastProfileId != null) {
      body.roastProfileId = entity.roastProfileId;
    }
    return body;
  }

  toUpdateBody(entity: CuppingSessionEntry): UpdateCuppingSessionBody {
    const body: UpdateCuppingSessionBody = {
      name: entity.name.trim(),
      origin: entity.origin.trim(),
      variety: entity.variety.trim(),
      processing: entity.processing.trim(),
      sessionDate: entity.sessionDate.slice(0, 10),
      favorite: entity.favorite,
      resultsJson: entity.resultsJson ?? null,
      roastStyleNotes: entity.roastStyleNotes?.trim() || null,
      coffeeLotId: entity.coffeeLotId ?? null,
      roastProfileId: entity.roastProfileId ?? null,
    };
    return body;
  }
}