import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface ProductionCostRecordListResponse extends BaseResponse {}

export interface ProductionCostRecordResource extends BaseResource {
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
  status: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionCostRecordBody {
  coffeeLotId: number;
  currency: string;
  totalKg: number;
  marginPercent: number;
  rawMaterialsCost: number;
  laborCost: number;
  transportCost: number;
  storageCost: number;
  processingCost: number;
  otherIndirectCosts: number;
}

export type UpdateProductionCostRecordBody = CreateProductionCostRecordBody;

/** Cuerpo para anular un registro: motivo elegido en el selector o texto libre (máx. 25). */
export interface AnnullProductionCostRecordBody {
  reason: string;
}
