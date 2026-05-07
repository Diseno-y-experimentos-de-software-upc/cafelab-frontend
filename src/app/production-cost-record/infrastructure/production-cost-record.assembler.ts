import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { ProductionCostRecord } from '../domain/model/production-cost-record.entity';
import type {
  CreateProductionCostRecordBody,
  ProductionCostRecordListResponse,
  ProductionCostRecordResource,
} from './production-cost-record.response';

export class ProductionCostRecordAssembler
  implements
    BaseAssembler<
      ProductionCostRecord,
      ProductionCostRecordResource,
      ProductionCostRecordListResponse
    >
{
  toEntityFromResource(r: ProductionCostRecordResource): ProductionCostRecord {
    const rawStatus = String(r.status ?? 'registrado').toLowerCase();
    const status = rawStatus === 'anulado' ? 'anulado' : 'registrado';
    return {
      id: r.id ?? 0,
      userId: Number(r.userId),
      coffeeLotId: Number(r.coffeeLotId),
      lotName: String(r.lotName ?? ''),
      coffeeType: String(r.coffeeType ?? ''),
      currency: String(r.currency ?? 'PEN'),
      totalKg: Number(r.totalKg),
      marginPercent: Number(r.marginPercent),
      rawMaterialsCost: Number(r.rawMaterialsCost),
      laborCost: Number(r.laborCost),
      transportCost: Number(r.transportCost),
      storageCost: Number(r.storageCost),
      processingCost: Number(r.processingCost),
      otherIndirectCosts: Number(r.otherIndirectCosts),
      totalDirectCost: Number(r.totalDirectCost),
      totalIndirectCost: Number(r.totalIndirectCost),
      totalCost: Number(r.totalCost),
      costPerKg: Number(r.costPerKg),
      suggestedPrice: Number(r.suggestedPrice),
      potentialMargin: Number(r.potentialMargin),
      status,
      reason: String(r.reason ?? 'registrado'),
      createdAt: String(r.createdAt ?? ''),
      updatedAt: String(r.updatedAt ?? ''),
    };
  }

  toResourceFromEntity(entity: ProductionCostRecord): ProductionCostRecordResource {
    return {
      id: entity.id,
      userId: entity.userId,
      coffeeLotId: entity.coffeeLotId,
      lotName: entity.lotName,
      coffeeType: entity.coffeeType,
      currency: entity.currency,
      totalKg: entity.totalKg,
      marginPercent: entity.marginPercent,
      rawMaterialsCost: entity.rawMaterialsCost,
      laborCost: entity.laborCost,
      transportCost: entity.transportCost,
      storageCost: entity.storageCost,
      processingCost: entity.processingCost,
      otherIndirectCosts: entity.otherIndirectCosts,
      totalDirectCost: entity.totalDirectCost,
      totalIndirectCost: entity.totalIndirectCost,
      totalCost: entity.totalCost,
      costPerKg: entity.costPerKg,
      suggestedPrice: entity.suggestedPrice,
      potentialMargin: entity.potentialMargin,
      status: entity.status,
      reason: entity.reason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toEntitiesFromResponse(_response: ProductionCostRecordListResponse): ProductionCostRecord[] {
    return [];
  }

  toCreateBody(entity: Partial<ProductionCostRecord>): CreateProductionCostRecordBody {
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      currency: String(entity.currency ?? 'PEN'),
      totalKg: Number(entity.totalKg),
      marginPercent: Number(entity.marginPercent ?? 45),
      rawMaterialsCost: Number(entity.rawMaterialsCost),
      laborCost: Number(entity.laborCost),
      transportCost: Number(entity.transportCost),
      storageCost: Number(entity.storageCost),
      processingCost: Number(entity.processingCost),
      otherIndirectCosts: Number(entity.otherIndirectCosts),
    };
  }
}
