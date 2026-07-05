import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Entrada de consumo de inventario vinculada a un lote ({@code coffeeLotId}).
 */
export interface InventoryEntry extends BaseEntity {
  userId: number;
  coffeeLotId: number;
  quantityUsed: number;
  dateUsed: string;
  finalProduct?: string;
  consumptionReason: 'bar' | 'retail' | 'samples' | 'other';
  usageNotes?: string | null;
}
