import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { ProductionCostCalculation, ProductionCostCurrency } from '../domain/model/production-cost.entity';

export function productionCostCurrencySymbol(code: ProductionCostCurrency): string {
  return code === 'USD' ? '$' : 'S/.';
}

@Injectable({
  providedIn: 'root'
})
export class ProductionCostService {
  constructor(private authService: AuthService) {}

  
  calculateProductionCost(data: {
    coffeeLotId: number;
    coffeeLotName: string;
    coffeeType: string;
    currency: ProductionCostCurrency;
    totalKg: number;
    rawMaterialsCost: number;
    laborCost: number;
    transportCost: number;
    storageCost: number;
    processingCost: number;
    otherIndirectCosts: number;
    margin: number;
  }): ProductionCostCalculation {
    const userId = Number(this.authService.getCurrentUserId());
    
    const totalDirectCost = data.rawMaterialsCost + data.laborCost;
    const totalIndirectCost = data.transportCost + data.storageCost + data.processingCost + data.otherIndirectCosts;
    const totalCost = totalDirectCost + totalIndirectCost;
    const costPerKg = data.totalKg > 0 ? totalCost / data.totalKg : 0;
    const suggestedPrice = costPerKg * (1 + data.margin / 100);
    const potentialMargin =
      suggestedPrice > 0 ? ((suggestedPrice - costPerKg) / suggestedPrice) * 100 : 0;

    return {
      coffeeLotId: data.coffeeLotId,
      coffeeLotName: data.coffeeLotName,
      coffeeType: data.coffeeType,
      currency: data.currency,
      totalKg: data.totalKg,
      rawMaterialsCost: data.rawMaterialsCost,
      laborCost: data.laborCost,
      transportCost: data.transportCost,
      storageCost: data.storageCost,
      processingCost: data.processingCost,
      otherIndirectCosts: data.otherIndirectCosts,
      totalDirectCost,
      totalIndirectCost,
      totalCost,
      costPerKg,
      margin: data.margin,
      suggestedPrice,
      potentialMargin,
      calculatedAt: new Date().toISOString(),
      userId
    };
  }

  
  generatePDF(costCalculation: ProductionCostCalculation): void {
    try {
      console.log('Generando PDF para:', costCalculation);
      
      const htmlContent = this.createHTMLContent(costCalculation);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } else {
        this.generateTextFallback(costCalculation);
      }
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.generateTextFallback(costCalculation);
    }
  }

  private createHTMLContent(costCalculation: ProductionCostCalculation): string {
    const sym = productionCostCurrencySymbol(costCalculation.currency ?? 'PEN');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumen de Costos de Producción</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #414535;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #414535;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #414535;
            font-size: 24px;
            margin: 0;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-section h2 {
            color: #414535;
            font-size: 18px;
            border-bottom: 2px solid #414535;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .cost-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-left: 20px;
          }
          .cost-total {
            font-weight: bold;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 10px;
          }
          .summary-section {
            background-color: #f8f7f2;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .summary-section h2 {
            color: #414535;
            font-size: 20px;
            margin-top: 0;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 20px; }
            .header { page-break-after: avoid; }
            .info-section { page-break-inside: avoid; }
            .summary-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RESUMEN DE COSTOS DE PRODUCCIÓN</h1>
        </div>
        
        <div class="info-section">
          <h2>Información del Lote</h2>
          <div class="cost-item">
            <span>Lote:</span>
            <span>${costCalculation.coffeeLotName}</span>
          </div>
          <div class="cost-item">
            <span>Tipo:</span>
            <span>${costCalculation.coffeeType}</span>
          </div>
          <div class="cost-item">
            <span>Cantidad:</span>
            <span>${costCalculation.totalKg} kg</span>
          </div>
          <div class="cost-item">
            <span>Fecha:</span>
            <span>${new Date(costCalculation.calculatedAt).toLocaleDateString()}</span>
          </div>
          <div class="cost-item">
            <span>Moneda:</span>
            <span>${(costCalculation.currency ?? 'PEN') === 'USD' ? 'USD ($)' : 'PEN (S/.)'}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h2>Costos Directos</h2>
          <div class="cost-item">
            <span>Materia Prima:</span>
            <span>${sym} ${costCalculation.rawMaterialsCost.toFixed(2)}</span>
          </div>
          <div class="cost-item">
            <span>Mano de Obra:</span>
            <span>${sym} ${costCalculation.laborCost.toFixed(2)}</span>
          </div>
          <div class="cost-total">
            <span>Total Directos:</span>
            <span>${sym} ${costCalculation.totalDirectCost.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h2>Costos Indirectos</h2>
          <div class="cost-item">
            <span>Transporte:</span>
            <span>${sym} ${costCalculation.transportCost.toFixed(2)}</span>
          </div>
          <div class="cost-item">
            <span>Almacenamiento:</span>
            <span>${sym} ${costCalculation.storageCost.toFixed(2)}</span>
          </div>
          <div class="cost-item">
            <span>Procesamiento:</span>
            <span>${sym} ${costCalculation.processingCost.toFixed(2)}</span>
          </div>
          <div class="cost-item">
            <span>Otros:</span>
            <span>${sym} ${costCalculation.otherIndirectCosts.toFixed(2)}</span>
          </div>
          <div class="cost-total">
            <span>Total Indirectos:</span>
            <span>${sym} ${costCalculation.totalIndirectCost.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="summary-section">
          <h2>Resumen Final</h2>
          <div class="summary-item">
            <span>Costo Total:</span>
            <span>${sym} ${costCalculation.totalCost.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span>Costo por kg:</span>
            <span>${sym} ${costCalculation.costPerKg.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span>Margen:</span>
            <span>${costCalculation.margin}%</span>
          </div>
          <div class="summary-item">
            <span>Precio sugerido (por kg):</span>
            <span>${sym} ${costCalculation.suggestedPrice.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span>Margen potencial:</span>
            <span>${costCalculation.potentialMargin.toFixed(1)}%</span>
          </div>
        </div>
        
        <div class="footer">
          Generado por CafeLab - Sistema de Gestión de Café
        </div>
      </body>
      </html>
    `;
  }

  private generateTextFallback(costCalculation: ProductionCostCalculation): void {
    const content = this.createPDFContent(costCalculation);
    const filename = `costos-produccion-${costCalculation.coffeeLotName}-${new Date().getFullYear()}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private createPDFContent(costCalculation: ProductionCostCalculation): string {
    const sym = productionCostCurrencySymbol(costCalculation.currency ?? 'PEN');
    return `
      RESUMEN DE COSTOS DE PRODUCCIÓN
      
      Lote: ${costCalculation.coffeeLotName}
      Tipo: ${costCalculation.coffeeType}
      Cantidad: ${costCalculation.totalKg} kg
      Fecha: ${new Date(costCalculation.calculatedAt).toLocaleDateString()}
      Moneda: ${(costCalculation.currency ?? 'PEN') === 'USD' ? 'USD ($)' : 'PEN (S/.)'}
      
      COSTOS DIRECTOS:
      - Materia Prima: ${sym} ${costCalculation.rawMaterialsCost.toFixed(2)}
      - Mano de Obra: ${sym} ${costCalculation.laborCost.toFixed(2)}
      Total Directos: ${sym} ${costCalculation.totalDirectCost.toFixed(2)}
      
      COSTOS INDIRECTOS:
      - Transporte: ${sym} ${costCalculation.transportCost.toFixed(2)}
      - Almacenamiento: ${sym} ${costCalculation.storageCost.toFixed(2)}
      - Procesamiento: ${sym} ${costCalculation.processingCost.toFixed(2)}
      - Otros: ${sym} ${costCalculation.otherIndirectCosts.toFixed(2)}
      Total Indirectos: ${sym} ${costCalculation.totalIndirectCost.toFixed(2)}
      
      RESUMEN:
      Costo Total: ${sym} ${costCalculation.totalCost.toFixed(2)}
      Costo por kg: ${sym} ${costCalculation.costPerKg.toFixed(2)}
      Margen: ${costCalculation.margin}%
      Precio sugerido (por kg): ${sym} ${costCalculation.suggestedPrice.toFixed(2)}
      Margen potencial: ${costCalculation.potentialMargin.toFixed(1)}%
    `;
  }
}