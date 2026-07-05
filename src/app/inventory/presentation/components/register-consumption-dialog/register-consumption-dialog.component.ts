import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { InventoryApi } from '../../../application/inventory.api';
import { InventoryEntry } from '../../../domain/model/inventory-entry.entity';

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
  consumptionReason: string;
}

type ConsumptionReason = InventoryEntry['consumptionReason'];

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
    MatCheckbox,
  ],
  providers: [[provideNativeDateAdapter()]],
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
  readonly consumptionReasonOptions: Array<{ value: ConsumptionReason; labelKey: string }> = [
    { value: 'bar', labelKey: 'INVENTORY.CONSUMPTION_REASON.BAR' },
    { value: 'retail', labelKey: 'INVENTORY.CONSUMPTION_REASON.RETAIL' },
    { value: 'samples', labelKey: 'INVENTORY.CONSUMPTION_REASON.SAMPLES' },
    { value: 'other', labelKey: 'INVENTORY.CONSUMPTION_REASON.OTHER' },
  ];

  readonly today = this.startOfDay(new Date());
  readonly minDate = this.today;
  readonly maxDate = this.today;
  readonly isConsumptionDateAllowed = (date: Date | null): boolean =>
    !!date && this.startOfDay(date).getTime() === this.today.getTime();

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
    this.form = this.fb.group({
      date: [this.today, [Validators.required, this.todayOnlyValidation.bind(this)]],
      lotId: ['', Validators.required],
      finalProduct: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]+$/),
        ],
      ],
      consumptionReason: ['', Validators.required],
      usageNotes: ['', Validators.maxLength(1000)],
      consumptionKg: [
        null,
        [Validators.required, Validators.min(0.01), RegisterConsumptionDialogComponent.maxTwoDecimalsValidator],
      ],
      noEdit: [false, Validators.requiredTrue],
    });

    this.form.valueChanges.subscribe(() => this.updateSummary());
  }

  ngOnInit(): void {
    this.loadAvailableLots();
  }

  loadAvailableLots(): void {
    const fromParent = this.data.availableLots;
    if (fromParent?.length) {
      this.availableLots = fromParent.filter(
        (lot) =>
          lot.status === this.data.coffeeStatus &&
          (!this.data.coffeeType || lot.coffee_type === this.data.coffeeType),
      );
      return;
    }

    this.loading = true;
    this.coffeeLotApi
      .getAll()
      .pipe(
        catchError((err) => {
          console.error('Error loading lots:', err);
          return of([]);
        }),
      )
      .subscribe((lots) => {
        this.availableLots = lots.filter(
          (lot) =>
            lot.status === this.data.coffeeStatus &&
            (!this.data.coffeeType || lot.coffee_type === this.data.coffeeType),
        );
        this.loading = false;
      });
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
          consumptionReason: this.consumptionReasonLabel(entry.consumptionReason),
        }));
      });
  }

  submit(): void {
    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.value;
    const coffeeLotId = Number(formValue.lotId);
    if (!coffeeLotId || coffeeLotId <= 0) {
      this.error = this.translate.instant('INVENTORY.ERRORS.SELECT_VALID_LOT');
      return;
    }

    const qty = Math.round(Number(formValue.consumptionKg) * 100) / 100;
    const finalProduct = String(formValue.finalProduct ?? '').trim();
    const consumptionReason = formValue.consumptionReason as ConsumptionReason;
    const usageNotes = String(formValue.usageNotes ?? '').trim();
    const lot = this.availableLots.find((l) => Number(l.id) === coffeeLotId);

    if (lot && qty > lot.weight) {
      this.error = this.translate.instant('INVENTORY.ERRORS.QUANTITY_EXCEEDS_STOCK');
      return;
    }

    if (!this.consumptionReasonOptions.some((option) => option.value === consumptionReason)) {
      this.error = this.translate.instant('INVENTORY.ERRORS.SELECT_CONSUMPTION_REASON');
      return;
    }

    const payload: InventoryEntry = {
      id: 0,
      userId: 0,
      coffeeLotId,
      quantityUsed: qty,
      dateUsed: this.toLocalIsoString(this.today),
      finalProduct,
      consumptionReason,
      usageNotes,
    };

    this.dialogRef.close(payload);
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

  consumptionReasonLabel(value: string | null | undefined): string {
    const option = this.consumptionReasonOptions.find((item) => item.value === value);
    return option
      ? this.translate.instant(option.labelKey)
      : this.translate.instant('COMMON.NOT_AVAILABLE');
  }
  coffeeTypeLabelKey(type: string): string {
    const m: Record<string, string> = {
      Arábica: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ARABICA',
      Robusta: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.ROBUSTA',
      Mezcla: 'COFFEE_LOT_BC.OPTIONS.COFFEE_TYPE.BLEND',
    };
    return m[type] ?? type;
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private todayOnlyValidation(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const selectedDate = this.startOfDay(new Date(value));
    if (selectedDate.getTime() !== this.today.getTime()) {
      return { invalidDateRange: true };
    }

    return null;
  }

  private toLocalIsoString(value: Date): string {
    const date = this.startOfDay(value);
    date.setHours(12, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
