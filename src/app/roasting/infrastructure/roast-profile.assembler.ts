import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { RoastProfile } from '../domain/model/roast-profile.entity';
import type {
  CreateRoastProfileBody,
  RoastProfileListResponse,
  RoastProfileResource,
  UpdateRoastProfileBody,
} from './roast-profile.response';

export class RoastProfileAssembler
  implements BaseAssembler<RoastProfile, RoastProfileResource, RoastProfileListResponse>
{
  toEntityFromResource(resource: RoastProfileResource): RoastProfile {
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      type: resource.type ?? '',
      duration: Number(resource.duration),
      tempStart: Number(resource.tempStart),
      tempEnd: Number(resource.tempEnd),
      isFavorite: Boolean(resource.isFavorite),
      createdAt: resource.createdAt,
      lot: Number(resource.lot ?? resource.coffeeLotId ?? 0),
    };
  }

  toResourceFromEntity(entity: RoastProfile): RoastProfileResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      type: entity.type,
      duration: entity.duration,
      tempStart: entity.tempStart,
      tempEnd: entity.tempEnd,
      isFavorite: entity.isFavorite,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt ?? ''),
      lot: entity.lot,
    };
  }

  toEntitiesFromResponse(_response: RoastProfileListResponse): RoastProfile[] {
    return [];
  }

  toCreateResource(entity: RoastProfile): CreateRoastProfileBody {
    return {
      name: entity.name.trim(),
      type: entity.type.trim(),
      duration: Number(entity.duration),
      tempStart: Number(entity.tempStart),
      tempEnd: Number(entity.tempEnd),
      lot: Number(entity.lot),
      isFavorite: entity.isFavorite ?? false,
    };
  }

  toUpdateResource(entity: RoastProfile): UpdateRoastProfileBody {
    return {
      name: entity.name.trim(),
      type: entity.type.trim(),
      duration: Number(entity.duration),
      tempStart: Number(entity.tempStart),
      tempEnd: Number(entity.tempEnd),
      lot: Number(entity.lot),
      isFavorite: Boolean(entity.isFavorite),
    };
  }
}