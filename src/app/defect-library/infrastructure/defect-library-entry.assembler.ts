import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { DefectLibraryEntry } from '../domain/model/defect-library-entry.entity';
import type {
  CreateDefectLibraryBody,
  DefectLibraryListResponse,
  DefectLibraryResource,
} from './defect-library-entry.response';

export class DefectLibraryEntryAssembler
  implements
    BaseAssembler<DefectLibraryEntry, DefectLibraryResource, DefectLibraryListResponse>
{
  toEntityFromResource(resource: DefectLibraryResource): DefectLibraryEntry {
    return {
      id: resource.id,
      userId: resource.userId ?? null,
      coffeeDisplayName: resource.coffeeDisplayName?.trim() ?? '',
      coffeeRegion: resource.coffeeRegion?.trim() || null,
      coffeeVariety: resource.coffeeVariety?.trim() || null,
      coffeeTotalWeight:
        resource.coffeeTotalWeight === null || resource.coffeeTotalWeight === undefined
          ? null
          : Number(resource.coffeeTotalWeight),
      name: resource.name ?? '',
      defectType: resource.defectType ?? '',
      defectWeight: Number(resource.defectWeight),
      percentage: Number(resource.percentage),
      probableCause: resource.probableCause ?? '',
      suggestedSolution: resource.suggestedSolution ?? '',
    };
  }

  toResourceFromEntity(entity: DefectLibraryEntry): DefectLibraryResource {
    return {
      id: entity.id,
      userId: entity.userId,
      coffeeDisplayName: entity.coffeeDisplayName,
      coffeeRegion: entity.coffeeRegion,
      coffeeVariety: entity.coffeeVariety,
      coffeeTotalWeight: entity.coffeeTotalWeight,
      name: entity.name,
      defectType: entity.defectType,
      defectWeight: entity.defectWeight,
      percentage: entity.percentage,
      probableCause: entity.probableCause,
      suggestedSolution: entity.suggestedSolution,
    };
  }

  toEntitiesFromResponse(_response: DefectLibraryListResponse): DefectLibraryEntry[] {
    return [];
  }

  toCreateBody(entity: DefectLibraryEntry): CreateDefectLibraryBody {
    const body: CreateDefectLibraryBody = {
      coffeeDisplayName: entity.coffeeDisplayName.trim(),
      coffeeVariety: (entity.coffeeVariety ?? '').trim(),
      name: entity.name.trim(),
      defectType: entity.defectType.trim(),
      defectWeight: Number(entity.defectWeight),
      percentage: Number(entity.percentage),
      probableCause: entity.probableCause.trim(),
      suggestedSolution: entity.suggestedSolution.trim(),
    };
    const r = entity.coffeeRegion?.trim();
    if (r) {
      body.coffeeRegion = r;
    }
    if (entity.coffeeTotalWeight !== null && entity.coffeeTotalWeight !== undefined) {
      body.coffeeTotalWeight = Number(entity.coffeeTotalWeight);
    }
    return body;
  }
}