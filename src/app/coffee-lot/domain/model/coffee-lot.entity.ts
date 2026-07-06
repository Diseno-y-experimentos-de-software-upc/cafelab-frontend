import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Lote de café (dominio). {@code id === 0} en borradores de UI antes de persistir.
 */
export type CoffeeLotRecordStatus = 'activo' | 'anulado';

export interface CoffeeLot extends BaseEntity {
  userId: number;
  supplier_id: number;
  supplier_name: string;
  lot_lineage_id?: number;
  version_number?: number;
  is_current?: boolean;
  supersedes_id?: number | null;
  record_status?: CoffeeLotRecordStatus;
  annulment_reason?: string;
  lot_name: string;
  coffee_type: string;
  processing_method: string;
  altitude: number;
  weight: number;
  original_weight: number;
  certifications: string[];
  origin: string;
  status: string;
}