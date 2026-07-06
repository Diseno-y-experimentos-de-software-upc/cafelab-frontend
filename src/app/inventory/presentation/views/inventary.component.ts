import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RegisterConsumptionDialogComponent } from '../components/register-consumption-dialog/register-consumption-dialog.component';
import { ConsumptionTableComponent } from '../components/consumption-table/consumption-table.component';
import { ToolbarComponent } from '../../../public/presentation/components/toolbar/toolbar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryApi } from '../../application/inventory.api';
import { CoffeeLotApi } from '../../../coffee-lot/application/coffee-lot.api';
import { CoffeeLot } from '../../../coffee-lot/domain/model/coffee-lot.entity';
import { MatToolbar } from "@angular/material/toolbar";
import { AuthService } from '../../../auth/infrastructure/AuthService';
import { SupplierApi } from '../../../supplier/application/supplier.api';
import { Supplier } from '../../../supplier/domain/model/supplier.entity';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InventoryEntry } from '../../domain/model/inventory-entry.entity';
import { Router } from '@angular/router';

interface CoffeeTypeMetrics {
  totalKg: number;
  activeLots: number;
  suppliers: number;
  stockStatus: 'low' | 'adequate';
}

interface CoffeeStatusData {
  arabica: CoffeeTypeMetrics;
  robusta: CoffeeTypeMetrics;
  mezcla: CoffeeTypeMetrics;
  selectedType: string;
}

@Component({
  selector: 'app-inventary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    ToolbarComponent,
    TranslateModule,
    MatToolbar,
    ConsumptionTableComponent
  ],
  templateUrl: './inventary.component.html',
  styleUrl: './inventary.component.css'
})
export class InventaryComponent implements OnInit {
  private static readonly COFFEE_TYPES_CANONICAL = ['Arábica', 'Robusta', 'Mezcla'] as const;

  private static readonly TYPE_TO_DATA_KEY: Record<
    string,
    keyof Omit<CoffeeStatusData, 'selectedType'>
  > = {
    Arábica: 'arabica',
    Robusta: 'robusta',
    Mezcla: 'mezcla',
  };

  readonly coffeeTypes = [...InventaryComponent.COFFEE_TYPES_CANONICAL];
  
  greenCoffeeData: CoffeeStatusData = {
    arabica: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    robusta: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    mezcla: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    selectedType: 'Arábica'
  };

  roastedCoffeeData: CoffeeStatusData = {
    arabica: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    robusta: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    mezcla: { totalKg: 0, activeLots: 0, suppliers: 0, stockStatus: 'low' },
    selectedType: 'Arábica'
  };

  lots: CoffeeLot[] = [];
  suppliers: Supplier[] = [];
  consumptionEntries: InventoryEntry[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private dialog: MatDialog,
    private inventoryApi: InventoryApi,
    private coffeeLotApi: CoffeeLotApi,
    private authService: AuthService,
    private supplierApi: SupplierApi,
    private router: Router,
    private translate: TranslateService,
  ) {}

  coffeeTypeLabelKey(type: string): string {
    const m: Record<string, string> = {
      Arábica: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ARABICA',
      Robusta: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ROBUSTA',
      Mezcla: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.BLEND',
    };
    return m[type] ?? type;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const userId = Number(this.authService.getCurrentUserId());

    if (!userId || isNaN(userId)) {
      this.error = this.translate.instant('INVENTORY.ERRORS.AUTH_USER');
      this.loading = false;
      return;
    }
  
    forkJoin({
      lots: this.coffeeLotApi.getAll().pipe(
        catchError(err => {
          console.error('Error loading lots:', err);
          return of([]);
        })
      ),
      suppliers: this.supplierApi.getAll().pipe(
        catchError(err => {
          console.error('Error loading suppliers:', err);
          return of([]);
        })
      ),
      consumptionEntries: this.inventoryApi.getAll().pipe(
        catchError(err => {
          console.error('Error loading consumption entries:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (data) => {
        this.lots = data.lots;
        this.suppliers = data.suppliers.filter((supplier: Supplier) => Number(supplier.userId) === userId);
        this.consumptionEntries = data.consumptionEntries;
        this.calculateMetrics();
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error loading inventory data:', err);
        this.error = this.translate.instant('INVENTORY.ERRORS.LOAD_DATA');
        this.loading = false;
      }
    });
  }

  calculateMetrics(): void {
    this.calculateStatusMetrics('green', this.greenCoffeeData);
    
    this.calculateStatusMetrics('roasted', this.roastedCoffeeData);
  }

  
  getTotalKgForStatus(status: 'green' | 'roasted'): number {
    return this.lots
      .filter((lot) => this.isActiveLot(lot) && this.normalizeLotStatus(lot.status) === status)
      .reduce((sum, lot) => sum + this.lotWeightKg(lot), 0);
  }

  /**
   * Stock por tipo = suma de {@code lot.weight} de todos los lotes de ese tipo y estado
   * (el backend descuenta al registrar consumo).
   */
  calculateStatusMetrics(status: string, data: CoffeeStatusData): void {
    const statusKey = status as 'green' | 'roasted';
    const statusLots = this.lots.filter(
      (lot) => this.isActiveLot(lot) && this.normalizeLotStatus(lot.status) === statusKey,
    );
    const statusTotalKg = statusLots.reduce((sum, lot) => sum + this.lotWeightKg(lot), 0);
    const threshold = statusTotalKg * 0.3;

    InventaryComponent.COFFEE_TYPES_CANONICAL.forEach((type) => {
      const typeLots = statusLots.filter(
        (lot) => this.normalizeCoffeeType(lot.coffee_type) === type,
      );
      const remainingKg = typeLots.reduce(
        (sum, lot) => sum + this.lotWeightKg(lot),
        0,
      );
      const typeSuppliers = new Set(typeLots.map((lot) => lot.supplier_id)).size;

      const stockStatus: 'low' | 'adequate' =
        remainingKg <= 0 || (statusTotalKg > 0 && remainingKg < threshold)
          ? 'low'
          : 'adequate';

      const key = InventaryComponent.TYPE_TO_DATA_KEY[type];
      if (key) {
        data[key] = {
          totalKg: remainingKg,
          activeLots: typeLots.length,
          suppliers: typeSuppliers,
          stockStatus,
        };
      }
    });
  }

  private lotWeightKg(lot: CoffeeLot): number {
    const w = Number(lot.weight);
    return Number.isFinite(w) ? w : 0;
  }

  private isActiveLot(lot: CoffeeLot): boolean {
    return lot.record_status !== 'anulado';
  }

  private normalizeLotStatus(raw: string | undefined | null): 'green' | 'roasted' | '' {
    const s = (raw ?? '').trim().toLowerCase();
    if (s === 'green' || s === 'roasted') return s;
    return '';
  }

  
  private normalizeCoffeeType(raw: string | undefined | null): string {
    const t = (raw ?? '').trim();
    if (!t) return '';
    const folded = t
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
    if (folded === 'arabica') return 'Arábica';
    if (folded === 'robusta') return 'Robusta';
    if (folded === 'mezcla' || folded === 'blend') return 'Mezcla';
    if (
      (InventaryComponent.COFFEE_TYPES_CANONICAL as readonly string[]).includes(t)
    ) {
      return t;
    }
    return t;
  }

  onTypeChange(status: string, type: string): void {
    if (status === 'green') {
      this.greenCoffeeData.selectedType = type;
    } else {
      this.roastedCoffeeData.selectedType = type;
    }
  }

  getCurrentMetrics(status: string): CoffeeTypeMetrics {
    const data = status === 'green' ? this.greenCoffeeData : this.roastedCoffeeData;
    const key = InventaryComponent.TYPE_TO_DATA_KEY[data.selectedType];
    return key ? data[key] : data.arabica;
  }

  openRegisterConsumptionDialog(status: string): void {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || isNaN(userId)) {
      this.error = this.translate.instant('INVENTORY.ERRORS.AUTH_USER');
      return;
    }

    this.coffeeLotApi.getAll().subscribe({
      next: (lots) => {
        this.lots = lots;
        this.calculateMetrics();
        this.openRegisterConsumptionDialogWithLots(status);
      },
      error: (err) => {
        console.error('Error refreshing lots before consumption dialog:', err);
        this.openRegisterConsumptionDialogWithLots(status);
      },
    });
  }

  private openRegisterConsumptionDialogWithLots(status: string): void {
    const st = status as 'green' | 'roasted';
    const availableLots = this.lots.filter(
      (lot) => this.isActiveLot(lot) && this.normalizeLotStatus(lot.status) === st,
    );
    
    if (availableLots.length === 0) {
      const statusLabel = this.translate.instant(
        status === 'green'
          ? 'FORM.STATUS_OPTIONS.GREEN'
          : 'FORM.STATUS_OPTIONS.ROASTED',
      );
      this.error = this.translate.instant('INVENTORY.ERRORS.NO_LOTS_FOR_STATUS', {
        statusLabel,
      });
      return;
    }
  
    const dialogRef = this.dialog.open(RegisterConsumptionDialogComponent, {
      width: '90%',
      maxWidth: '1000px',
      panelClass: 'register-consumption-dialog',
      data: { 
        coffeeStatus: status,
        coffeeType: status === 'green' ? this.greenCoffeeData.selectedType : this.roastedCoffeeData.selectedType,
        availableLots: availableLots,
      }
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const entry: InventoryEntry = { ...result };
        
        if (!this.isValidInventoryEntry(entry)) {
          this.error = this.translate.instant('INVENTORY.ERRORS.INVALID_CONSUMPTION');
          return;
        }
  
        this.inventoryApi.create(entry).subscribe({
          next: (createdEntry) => {
            console.log('Consumo registrado:', createdEntry);
            this.error = null;
            this.loadData();
          },
          error: (err: Error) => {
            console.error('Error al registrar consumo:', err);
            const fallback = this.translate.instant('INVENTORY.ERRORS.REGISTER_CONSUMPTION');
            this.error = err?.message?.trim() && err.message !== fallback ? err.message : fallback;
          }
        });
      }
    });
  }
  
  private isValidInventoryEntry(entry: InventoryEntry): boolean {
    return (
      entry.coffeeLotId > 0 &&
      entry.quantityUsed > 0 &&
      (entry.finalProduct?.trim().length ?? 0) > 0
    );
  }

  goToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    switch (user.plan) {
      case 'barista':
        this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        this.router.navigate(['/dashboard/complete']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}