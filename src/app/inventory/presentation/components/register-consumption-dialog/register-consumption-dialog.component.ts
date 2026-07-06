import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InventoryApi } from '../../../application/inventory.api';
import { InventoryEntry } from '../../../domain/model/inventory-entry.entity';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatCheckbox} from '@angular/material/checkbox';

interface ConsumptionSummary {
  lotName: string;
  coffeeType: string;
  status: string;
  totalWeight: number;
  remainingWeight: number;
}

interface PreviousConsumption {
  date: string;
  quantity: number;
}



@Component({
  selector: 'app-register-consumption-dialog',
  standalone: true,
  templateUrl: './register-consumption-dialog.component.html',
  styleUrls: ['./register-consumption-dialog.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatButtonModule,
    TranslateModule,
    MatCheckbox
  ],
  providers: [
    [provideNativeDateAdapter()],
  ]
})
export class RegisterConsumptionDialogComponent implements OnInit {
  private static maxTwoDecimalsValidator(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return null;
    }
    const normalized = n.toFixed(10).replace(/\.?0+$/, '');
    const dot = normalized.indexOf('.');
    if (dot === -1) {
      return null;
    }
    const frac = normalized.slice(dot + 1);
    return frac.length > 2 ? { maxDecimals: true } : null;
  }

  form: FormGroup;
  availableLots: CoffeeLot[] = [];
  consumptionSummary: ConsumptionSummary | null = null;
  previousConsumptions: PreviousConsumption[] = [];
  loading = false;
  error: string | null = null;

  minDate = new Date();
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegisterConsumptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      coffeeStatus: string;
      coffeeType?: string;
      availableLots?: CoffeeLot[];
    },
    private inventoryApi: InventoryApi,
    private coffeeLotApi: CoffeeLotApi,
    private translate: TranslateService,
  ) {
    this.minDate.setHours(0, 0, 0, 0);
    this.maxDate.setHours(0, 0, 0, 0);

    this.form = this.fb.group({
      date: [new Date(),
        [
        Validators.required,
        this.dateRangeValidation
        ]
      ],
      lotId: ['', Validators.required],
      finalProduct: ['',
        [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]+$/)
        ]
      ],
      consumptionKg: [
        null,
        [Validators.required, Validators.min(0.01), RegisterConsumptionDialogComponent.maxTwoDecimalsValidator],
      ],
      noEdit: [false, Validators.requiredTrue]
    });

    this.form.valueChanges.subscribe(() => this.updateSummary());
  }

  ngOnInit(): void {
    this.loadAvailableLots();
  }

  loadAvailableLots(): void {
    const fromParent = this.data.availableLots;
    if (fromParent?.length) {
      this.availableLots = fromParent.filter((lot) => this.matchesLotFilters(lot));
      return;
    }

    this.loading = true;
    this.coffeeLotApi
      .getSelectable()
      .pipe(
        catchError((err) => {
          console.error('Error loading lots:', err);
          return of([]);
        }),
      )
      .subscribe((lots) => {
        this.availableLots = lots.filter((lot) => this.matchesLotFilters(lot));
        this.loading = false;
      });
  }

  private matchesLotFilters(lot: CoffeeLot): boolean {
    if (lot.record_status === 'anulado') {
      return false;
    }
    if (this.normalizeLotStatus(lot.status) !== this.data.coffeeStatus) {
      return false;
    }
    if (this.data.coffeeType && this.normalizeCoffeeType(lot.coffee_type) !== this.data.coffeeType) {
      return false;
    }
    return true;
  }

  private normalizeLotStatus(raw: string | undefined | null): string {
    const s = (raw ?? '').trim().toLowerCase();
    return s === 'green' || s === 'roasted' ? s : '';
  }

  private normalizeCoffeeType(raw: string | undefined | null): string {
    const t = (raw ?? '').trim();
    if (!t) return '';
    const folded = t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    if (folded === 'arabica') return 'Arábica';
    if (folded === 'robusta') return 'Robusta';
    if (folded === 'mezcla' || folded === 'blend') return 'Mezcla';
    return t;
  }

  updateSummary(): void {
    const selectedLotId = this.form.get('lotId')?.value;
    const consumptionKg = Number(this.form.get('consumptionKg')?.value) || 0;

    if (selectedLotId) {
      const selectedLot = this.availableLots.find(
        (lot) => Number(lot.id) === Number(selectedLotId),
      );
      if (selectedLot) {
        const remainingWeight = Math.max(0, selectedLot.weight - consumptionKg);
        this.consumptionSummary = {
          lotName: selectedLot.lot_name,
          coffeeType: selectedLot.coffee_type,
          status: selectedLot.status,
          totalWeight: selectedLot.weight,
          remainingWeight,
        };
        this.loadPreviousConsumptions(selectedLotId);
      }
    } else {
      this.consumptionSummary = null;
      this.previousConsumptions = [];
    }
  }

  loadPreviousConsumptions(lotId: number | string): void {
    this.inventoryApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading previous consumptions:', err);
          return of([]);
        }),
      )
      .subscribe((entries) => {
        const lotEntries = entries
          .filter((entry) => Number(entry.coffeeLotId) === Number(lotId))
          .sort(
            (a, b) =>
              new Date(b.dateUsed).getTime() - new Date(a.dateUsed).getTime(),
          )
          .slice(0, 2);

        this.previousConsumptions = lotEntries.map((entry) => ({
          date: new Date(entry.dateUsed).toLocaleDateString(),
          quantity: entry.quantityUsed,
        }));
      });
  }

  submit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const coffeeLotId = Number(formValue.lotId);

      if (!coffeeLotId || coffeeLotId <= 0) {
        this.error = this.translate.instant('INVENTORY.ERRORS.SELECT_VALID_LOT');
        return;
      }

      const qty = Math.round(Number(formValue.consumptionKg) * 100) / 100;
      const lot = this.availableLots.find((l) => Number(l.id) === coffeeLotId);
      if (lot && qty > lot.weight) {
        this.error = this.translate.instant('INVENTORY.ERRORS.QUANTITY_EXCEEDS_STOCK');
        return;
      }

      const payload: InventoryEntry = {
        id: 0,
        userId: 0,
        coffeeLotId,
        quantityUsed: qty,
        dateUsed: this.toLocalDateTimeString(formValue.date as Date),
        finalProduct: String(formValue.finalProduct).trim(),
      };

      this.dialogRef.close(payload);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  lotStatusLabel(status: string): string {
    if (status === 'green') {
      return this.translate.instant('FORM.STATUS_OPTIONS.GREEN');
    }
    if (status === 'roasted') {
      return this.translate.instant('FORM.STATUS_OPTIONS.ROASTED');
    }
    return this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  getSelectedLotName(): string {
    const lotId = this.form.get('lotId')?.value;
    const lot = this.availableLots.find((l) => Number(l.id) === Number(lotId));
    return lot ? lot.lot_name : '';
  }

    coffeeTypeLabelKey(type: string): string {
    const m: Record<string, string> = {
      Arábica: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ARABICA',
      Robusta: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ROBUSTA',
      Mezcla: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.BLEND',
    };
    return m[type] ?? type;
  }

  private dateRangeValidation(control: any) {
    const value = control.value;

    if (!value) return null;

    const selectedDate = new Date(value);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() !== today.getTime()) {
      return { invalidDateRange: true };
    }

    return null;
  }

  private toLocalDateTimeString(dateValue: Date): string {
    const localDate = new Date(dateValue);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  }

}
