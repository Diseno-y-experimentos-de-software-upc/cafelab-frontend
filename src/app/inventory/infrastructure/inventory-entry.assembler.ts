import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { InventoryEntry } from '../domain/model/inventory-entry.entity';
import type {
  CreateInventoryEntryBody,
  InventoryEntryListResponse,
  InventoryEntryResource,
  UpdateInventoryEntryBody,
} from './inventory-entry.response';

export class InventoryEntryAssembler
  implements
    BaseAssembler<
      InventoryEntry,
      InventoryEntryResource,
      InventoryEntryListResponse
    >
{
  private readonly allowedReasons = ['bar', 'retail', 'samples', 'other'];

  private toLocalIsoString(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return value;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  toEntityFromResource(resource: InventoryEntryResource): InventoryEntry {
    const consumptionReason = resource.consumptionReason || 'other';
    const normalizedReason = this.allowedReasons.includes(consumptionReason)
      ? consumptionReason
      : 'other';
    return {
      id: resource.id,
      userId: resource.userId,
      coffeeLotId: resource.coffeeLotId,
      quantityUsed: Number(resource.quantityUsed),
      dateUsed:
        typeof resource.dateUsed === 'string'
          ? resource.dateUsed
          : String(resource.dateUsed),
      finalProduct: resource.finalProduct,
      consumptionReason: normalizedReason as InventoryEntry['consumptionReason'],
      usageNotes: resource.usageNotes ?? '',
    };
  }

  toResourceFromEntity(entity: InventoryEntry): InventoryEntryResource {
    return {
      id: entity.id,
      userId: entity.userId,
      coffeeLotId: entity.coffeeLotId,
      quantityUsed: entity.quantityUsed,
      dateUsed: entity.dateUsed,
      finalProduct: entity.finalProduct,
      consumptionReason: entity.consumptionReason,
      usageNotes: entity.usageNotes,
    };
  }

  toEntitiesFromResponse(_response: InventoryEntryListResponse): InventoryEntry[] {
    return [];
  }

  toCreateResource(entity: InventoryEntry): CreateInventoryEntryBody {
    const usageNotes = entity.usageNotes?.trim();
    const finalProduct = entity.finalProduct?.trim();
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      quantityUsed: Number(entity.quantityUsed),
      dateUsed: this.toLocalIsoString(entity.dateUsed),
      consumptionReason: entity.consumptionReason,
      ...(finalProduct ? { finalProduct } : {}),
      ...(usageNotes ? { usageNotes } : {}),
    };
  }

  toUpdateResource(entity: InventoryEntry): UpdateInventoryEntryBody {
    const finalProduct = entity.finalProduct?.trim();
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      quantityUsed: Number(entity.quantityUsed),
      dateUsed: this.toCreateResource(entity).dateUsed,
      consumptionReason: entity.consumptionReason,
      ...(finalProduct ? { finalProduct } : {}),
      ...(entity.usageNotes?.trim() ? { usageNotes: entity.usageNotes.trim() } : {}),
    };
  }
}
