import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type ProductionCostRecordStatus = 'registrado' | 'anulado';

export interface ProductionCostRecord extends BaseEntity {
  userId: number;
  coffeeLotId: number;
  lotName: string;
  coffeeType: string;
  currency: string;
  totalKg: number;
  marginPercent: number;
  rawMaterialsCost: number;
  laborCost: number;
  transportCost: number;
  storageCost: number;
  processingCost: number;
  otherIndirectCosts: number;
  totalDirectCost: number;
  totalIndirectCost: number;
  totalCost: number;
  costPerKg: number;
  suggestedPrice: number;
  potentialMargin: number;
  /**
   * 'registrado' por defecto. Pasa a 'anulado' tras una anulación. No vuelve a cambiar:
   * los registros anulados son evidencia de auditoría.
   */
  status: ProductionCostRecordStatus;
  /**
   * Si {@link status} es 'registrado', vale 'registrado'.
   * Si es 'anulado', contiene el motivo elegido o el texto libre (máx. 25 caracteres).
   */
  reason: string;
  createdAt: string;
  updatedAt: string;
}
