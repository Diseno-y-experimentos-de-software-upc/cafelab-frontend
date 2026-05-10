export type ProductionCostCurrency = 'PEN' | 'USD';

export interface ProductionCostCalculation {
  coffeeLotId: number;
  coffeeLotName: string;
  coffeeType: string;
  currency?: ProductionCostCurrency;
  totalKg: number;
  
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
  margin: number;
  suggestedPrice: number;
  potentialMargin: number;
  
  calculatedAt: string;
  userId: number;
}

export class ProductionCostEntity {
  constructor(private cost: any) {}

  get totalDirectCost(): number {
    return (this.cost.rawMaterialsCost || 0) + (this.cost.laborCost || 0);
  }

  get totalIndirectCost(): number {
    return (this.cost.transportCost || 0) +
      (this.cost.storageCost || 0) +
      (this.cost.processingCost || 0) +
      (this.cost.otherIndirectCosts || 0);
  }

  get totalCost(): number {
    return this.totalDirectCost + this.totalIndirectCost;
  }

  get costPerKg(): number {
    return this.cost.totalKg ? this.totalCost / this.cost.totalKg : 0;
  }

  get suggestedPrice(): number {
    return this.costPerKg * (1 + (this.cost.margin || 0) / 100);
  }

  get potentialMargin(): number {
    const sp = this.suggestedPrice;
    return sp > 0 ? ((sp - this.costPerKg) / sp) * 100 : 0;
  }
}