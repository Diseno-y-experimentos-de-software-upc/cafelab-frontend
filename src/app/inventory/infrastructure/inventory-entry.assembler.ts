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
  toEntityFromResource(resource: InventoryEntryResource): InventoryEntry {
    return {
      id: resource.id,
      userId: resource.userId,
      coffeeLotId: resource.coffeeLotId,
      quantityUsed: Number(resource.quantityUsed),
      dateUsed:
        typeof resource.dateUsed === 'string'
          ? resource.dateUsed
          : String(resource.dateUsed),
      finalProduct: resource.finalProduct ?? '',
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
    };
  }

  toEntitiesFromResponse(_response: InventoryEntryListResponse): InventoryEntry[] {
    return [];
  }

  toCreateResource(entity: InventoryEntry): CreateInventoryEntryBody {
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      quantityUsed: Number(entity.quantityUsed),
      dateUsed: this.toApiLocalDateTime(entity.dateUsed),
      finalProduct: entity.finalProduct.trim(),
    };
  }

  /** Envía la fecha local sin pasar por UTC (evita cambiar de día en el backend). */
  private toApiLocalDateTime(raw: string): string {
    const text = String(raw ?? '').trim();
    const localMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})$/.exec(text);
    if (localMatch) {
      return text;
    }
    const parsed = new Date(text);
    if (!Number.isFinite(parsed.getTime())) {
      return text;
    }
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  }

  toUpdateResource(entity: InventoryEntry): UpdateInventoryEntryBody {
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      quantityUsed: Number(entity.quantityUsed),
      dateUsed: this.toCreateResource(entity).dateUsed,
      finalProduct: entity.finalProduct.trim(),
    };
  }
}