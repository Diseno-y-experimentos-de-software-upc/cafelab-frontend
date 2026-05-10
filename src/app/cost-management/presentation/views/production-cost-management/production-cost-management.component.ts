import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MetricsCardComponent } from '../../components/metrics-card/metrics-card.component';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { StepLotSelectionComponent } from '../../components/step-lot-selection/step-lot-selection.component';
import { StepDirectCostsComponent } from '../../components/step-direct-costs/step-direct-costs.component';
import { StepIndirectCostsComponent } from '../../components/step-indirect-costs/step-indirect-costs.component';
import { CostRecordsListComponent } from '../../components/cost-records-list/cost-records-list.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ProductionCostCalculation,
  ProductionCostCurrency,
} from '../../../domain/model/production-cost.entity';
import {
  maxDecimalPlaces,
  integerInRange,
  integerInRangeWorkers,
} from '../../../domain/validators/production-cost.validators';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { ProductionCostService } from '../../../infrastructure/production-cost.service';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { ProductionCostRecordApi } from '../../../../production-cost-record/application/production-cost-record.api';
import { finalize } from 'rxjs';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';

type ModuleMode = 'list' | 'wizard';

@Component({
  selector: 'app-production-cost-page',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule,
    MatInputModule,
    MatCardModule,
    ReactiveFormsModule,
    MetricsCardComponent,
    ToolbarComponent,
    StepLotSelectionComponent,
    StepDirectCostsComponent,
    StepIndirectCostsComponent,
    CostRecordsListComponent,
    TranslateModule,
    MatTableModule,
    MatToolbarModule,
    MatListModule,
  ],
  templateUrl: './production-cost-management.component.html',
  styleUrl: './production-cost-management.component.css',
})
export class ProductionCostPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(CostRecordsListComponent) recordsList?: CostRecordsListComponent;

  /** 'list' = pantalla inicial con la tabla de registros · 'wizard' = stepper de cálculo. */
  mode: ModuleMode = 'list';

  firstFormGroup!: FormGroup;
  directCostsForm!: FormGroup;
  indirectCostsForm!: FormGroup;
  currentStep = 0;

  /** Sincronizado con el control `currency` para que el símbolo se actualice en todos los pasos del stepper. */
  currencyDisplaySymbol = 'S/.';
  
  totalSteps = 4;
  isSubmitting = false;
  isSuccess = false;
  /** Controla la apertura del modal de "verificar antes de registrar". */
  showSaveConfirmation = false;
  registrationCode = '';
  readonly EXPECTED_MARGIN = 45;
  costSummary: { tipo: string; monto: number }[] = [];
  lots: CoffeeLot[] = [];
  loading = false;
  error: string | null = null;
  currentCalculation: ProductionCostCalculation | null = null;

  readonly summaryFieldColumns: string[] = ['field', 'value', 'edit'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private productionCostService: ProductionCostService,
    private coffeeLotApi: CoffeeLotApi,
    private productionCostRecordApi: ProductionCostRecordApi,
  ) {
    this.firstFormGroup = this.fb.group({
      selectedLot: ['', Validators.required],
      currency: ['PEN', Validators.required],
    });

    this.directCostsForm = this.fb.group({
      rawMaterials: this.fb.group({
        costPerKg: [
          null,
          [Validators.required, Validators.min(0.01), Validators.max(100), maxDecimalPlaces(2)],
        ],
        quantity: [
          null,
          [Validators.required, Validators.min(0.01), Validators.max(70), maxDecimalPlaces(2)],
        ],
      }),
      labor: this.fb.group({
        hoursWorked: [null, [Validators.required, integerInRange(1, 60)]],
        costPerHour: [
          null,
          [Validators.required, Validators.min(0.1), Validators.max(100), maxDecimalPlaces(2)],
        ],
        numberOfWorkers: [1, [Validators.required, integerInRangeWorkers(1, 10)]],
      }),
    });

    this.indirectCostsForm = this.fb.group({
      transport: this.fb.group({
        costPerKg: [
          null,
          [Validators.required, Validators.min(0.1), Validators.max(100), maxDecimalPlaces(2)],
        ],
        quantity: [
          null,
          [Validators.required, Validators.min(1), Validators.max(200), maxDecimalPlaces(2)],
        ],
      }),
      storage: this.fb.group({
        daysInStorage: [null, [Validators.required, integerInRange(1, 30)]],
        dailyCost: [
          null,
          [Validators.required, Validators.min(0.1), Validators.max(100), maxDecimalPlaces(2)],
        ],
      }),
      processing: this.fb.group({
        electricity: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        maintenance: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        supplies: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        water: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        depreciation: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
      }),
      others: this.fb.group({
        qualityControl: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        certifications: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        insurance: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
        administrative: [0, [Validators.required, Validators.min(0), Validators.max(200), maxDecimalPlaces(2)]],
      }),
    });

    this.firstFormGroup
      .get('currency')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncCurrencyDisplaySymbol());
  }

  ngOnInit(): void {
    this.syncCurrencyDisplaySymbol();
    this.loadLots();
  }

  /** Inicia el wizard desde la lista. */
  startNewCalculation(): void {
    this.resetForm();
    this.mode = 'wizard';
  }

  /** Vuelve a la pantalla inicial (lista) y refresca registros. */
  backToList(): void {
    this.mode = 'list';
    this.isSuccess = false;
    this.currentCalculation = null;
    this.registrationCode = '';
    setTimeout(() => this.recordsList?.reload(), 0);
  }

  private syncCurrencyDisplaySymbol(): void {
    const raw = this.firstFormGroup.get('currency')?.value;
    this.currencyDisplaySymbol = raw === 'USD' ? '$' : 'S/.';
  }

  onStepperSelectionChange(ev: StepperSelectionEvent): void {
    this.currentStep = ev.selectedIndex;
    this.syncCurrencyDisplaySymbol();
    // El último paso es el resumen: precalculamos para que la tabla muestre filas antes de guardar.
    if (ev.selectedIndex === this.totalSteps - 1) {
      this.calculateResumen();
    }
  }

  loadLots(): void {
    this.loading = true;
    const userId = Number(this.authService.getCurrentUserId());

    if (!userId || isNaN(userId)) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.AUTH_USER');
      this.loading = false;
      return;
    }

    this.coffeeLotApi.getAll().subscribe({
      next: (list: CoffeeLot[]) => {
        this.lots = list;
        this.loading = false;
        this.error = null;
      },
      error: (err: unknown) => {
        console.error('Error loading lots:', err);
        this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.LOAD_LOTS');
        this.loading = false;
      },
    });
  }

  
  private rawMaterialsQuantityKg(): number {
    const q = this.directCostsForm.get('rawMaterials')?.value?.quantity;
    const n = Number(q);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Punto de entrada del botón "Finalizar y guardar": valida los formularios y abre el modal
   * de verificación. Si el usuario confirma, recién se invoca `saveProductionCost`.
   */
  requestSaveConfirmation(): void {
    if (!this.isFormValid()) {
      this.firstFormGroup.markAllAsTouched();
      this.directCostsForm.markAllAsTouched();
      this.indirectCostsForm.markAllAsTouched();
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.FORM_REQUIRED');
      return;
    }
    this.error = null;
    this.showSaveConfirmation = true;
  }

  cancelSaveConfirmation(): void {
    this.showSaveConfirmation = false;
  }

  confirmSaveConfirmation(): void {
    this.showSaveConfirmation = false;
    this.saveProductionCost();
  }

  saveProductionCost(): void {
    if (!this.isFormValid()) {
      this.firstFormGroup.markAllAsTouched();
      this.directCostsForm.markAllAsTouched();
      this.indirectCostsForm.markAllAsTouched();
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.FORM_REQUIRED');
      return;
    }

    this.isSubmitting = true;
    const userId = Number(this.authService.getCurrentUserId());
    const selectedLotId = Number(this.firstFormGroup.value.selectedLot);
    const currency = this.firstFormGroup.value.currency as ProductionCostCurrency;

    if (!userId || !selectedLotId) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.INVALID_USER_LOT');
      this.isSubmitting = false;
      return;
    }

    const selectedLot = this.lots.find((lot) => Number(lot.id) === selectedLotId);
    if (!selectedLot) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.INVALID_SELECTED_LOT');
      this.isSubmitting = false;
      return;
    }

    const totalKg = this.rawMaterialsQuantityKg();
    if (totalKg <= 0) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.QUANTITY_KG_REQUIRED');
      this.isSubmitting = false;
      return;
    }

    this.calculateResumen();

    const costCalculation = this.productionCostService.calculateProductionCost({
      coffeeLotId: selectedLotId,
      coffeeLotName: selectedLot.lot_name,
      coffeeType: selectedLot.coffee_type,
      currency: currency === 'USD' ? 'USD' : 'PEN',
      totalKg,
      rawMaterialsCost: this.rawMaterialTotal,
      laborCost: this.laborTotal,
      transportCost: this.transportTotal,
      storageCost: this.storageTotal,
      processingCost: this.processingTotal,
      otherIndirectCosts: this.othersTotal,
      margin: this.EXPECTED_MARGIN,
    });

    this.productionCostRecordApi
      .create({
        coffeeLotId: selectedLotId,
        currency: currency === 'USD' ? 'USD' : 'PEN',
        totalKg,
        marginPercent: this.EXPECTED_MARGIN,
        rawMaterialsCost: this.rawMaterialTotal,
        laborCost: this.laborTotal,
        transportCost: this.transportTotal,
        storageCost: this.storageTotal,
        processingCost: this.processingTotal,
        otherIndirectCosts: this.othersTotal,
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (saved) => {
          this.isSuccess = true;
          this.registrationCode = String(saved.id);
          this.error = null;
          this.currentCalculation = costCalculation;
        },
        error: (err: unknown) => {
          this.error = getUserFacingApiMessage(
            err,
            this.translate.instant('COST_MANAGEMENT.ERRORS.SERVER_SAVE'),
          );
          this.isSuccess = false;
          this.currentCalculation = null;
          this.registrationCode = '';
        },
      });
  }

  downloadPDF(): void {
    if (this.currentCalculation) {
      this.productionCostService.generatePDF(this.currentCalculation);
    }
  }

  resetForm(): void {
    this.isSuccess = false;
    this.showSaveConfirmation = false;
    this.currentCalculation = null;
    this.registrationCode = '';
    this.error = null;
    this.currentStep = 0;

    this.firstFormGroup.reset({ selectedLot: '', currency: 'PEN' });
    this.directCostsForm.reset();
    this.indirectCostsForm.reset();

    this.directCostsForm.patchValue({
      labor: { numberOfWorkers: 1 },
    });
    this.indirectCostsForm.patchValue({
      processing: { electricity: 0, maintenance: 0, supplies: 0, water: 0, depreciation: 0 },
      others: { qualityControl: 0, certifications: 0, insurance: 0, administrative: 0 },
    });
    this.syncCurrencyDisplaySymbol();
  }

  /** Cancela el wizard y regresa a la pantalla inicial (lista) sin guardar nada. */
  cancelWizard(): void {
    this.resetForm();
    this.mode = 'list';
    setTimeout(() => this.recordsList?.reload(), 0);
  }

  isFormValid(): boolean {
    return (
      this.firstFormGroup.valid &&
      this.directCostsForm.valid &&
      this.indirectCostsForm.valid
    );
  }

  onCancel = () => {
    this.cancelWizard();
  };

  get progressValue(): number {
    return (this.currentStep / (this.totalSteps - 1)) * 100;
  }

  get currencySymbol(): string {
    return this.currencyDisplaySymbol;
  }

  get summaryFieldRows(): {
    labelKey: string;
    value: string;
    stepIndex: number;
    editLabelKey: string;
  }[] {
    const sym = this.currencySymbol;
    const money = (n: number) => {
      const v = Number(n);
      return Number.isFinite(v) ? `${sym} ${v.toFixed(2)}` : '—';
    };
    const kg = (n: number) => {
      const v = Number(n);
      return Number.isFinite(v) ? `${v.toFixed(2)} kg` : '—';
    };
    const intStr = (n: unknown) =>
      n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n))
        ? String(Math.trunc(Number(n)))
        : '—';

    const lot = this.lots.find((l) => Number(l.id) === Number(this.firstFormGroup.value.selectedLot));
    const cur = this.firstFormGroup.value.currency as string;
    const curLabel = cur === 'USD' ? 'USD' : 'PEN';

    const d = this.directCostsForm.value;
    const ind = this.indirectCostsForm.value;

    return [
      {
        labelKey: 'COST_MANAGEMENT.LOT_LABEL',
        value: lot?.lot_name ?? '—',
        stepIndex: 0,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.CURRENCY_LABEL',
        value: curLabel,
        stepIndex: 0,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.COST_PER_KG_GREEN_COFFEE',
        value: money(Number(d?.rawMaterials?.costPerKg)),
        stepIndex: 1,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.GREEN_COFFEE_QUANTITY_KG',
        value: kg(Number(d?.rawMaterials?.quantity)),
        stepIndex: 1,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.HOURS_WORKED',
        value: intStr(d?.labor?.hoursWorked),
        stepIndex: 1,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.COST_PER_HOUR',
        value: money(Number(d?.labor?.costPerHour)),
        stepIndex: 1,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.NUMBER_OF_WORKERS',
        value: intStr(d?.labor?.numberOfWorkers),
        stepIndex: 1,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.TRANSPORT_COST_PER_KG',
        value: money(Number(ind?.transport?.costPerKg)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.TRANSPORT_QUANTITY_KG',
        value: kg(Number(ind?.transport?.quantity)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.DAYS_IN_STORAGE',
        value: intStr(ind?.storage?.daysInStorage),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.DAILY_COST',
        value: money(Number(ind?.storage?.dailyCost)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.ELECTRICITY',
        value: money(Number(ind?.processing?.electricity)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.WATER',
        value: money(Number(ind?.processing?.water)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.SUPPLIES',
        value: money(Number(ind?.processing?.supplies)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.MAINTENANCE',
        value: money(Number(ind?.processing?.maintenance)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.DEPRECIATION',
        value: money(Number(ind?.processing?.depreciation)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.QUALITY_CONTROL',
        value: money(Number(ind?.others?.qualityControl)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.CERTIFICATIONS',
        value: money(Number(ind?.others?.certifications)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.INSURANCE',
        value: money(Number(ind?.others?.insurance)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
      {
        labelKey: 'COST_MANAGEMENT.ADMINISTRATIVE',
        value: money(Number(ind?.others?.administrative)),
        stepIndex: 2,
        editLabelKey: 'COST_MANAGEMENT.EDIT',
      },
    ];
  }

  goToStep(index: number): void {
    this.currentStep = index;
  }

  get rawMaterialTotal(): number {
    const { costPerKg, quantity } = this.directCostsForm.get('rawMaterials')?.value || {};
    return Number(costPerKg || 0) * Number(quantity || 0);
  }

  get laborTotal(): number {
    const { hoursWorked, costPerHour, numberOfWorkers } =
      this.directCostsForm.get('labor')?.value || {};
    return Number(hoursWorked || 0) * Number(costPerHour || 0) * Number(numberOfWorkers || 0);
  }

  get transportTotal(): number {
    const { costPerKg, quantity } = this.indirectCostsForm.get('transport')?.value || {};
    return Number(costPerKg || 0) * Number(quantity || 0);
  }

  get storageTotal(): number {
    const { daysInStorage, dailyCost } = this.indirectCostsForm.get('storage')?.value || {};
    return Number(daysInStorage || 0) * Number(dailyCost || 0);
  }

  get processingTotal(): number {
    const p = this.indirectCostsForm.get('processing')?.value || {};
    return p.electricity + p.maintenance + p.supplies + p.water + p.depreciation;
  }

  get othersTotal(): number {
    const o = this.indirectCostsForm.get('others')?.value || {};
    return o.qualityControl + o.certifications + o.insurance + o.administrative;
  }

  get totalDirectCosts(): number {
    return this.rawMaterialTotal + this.laborTotal;
  }

  get totalIndirectCosts(): number {
    return this.transportTotal + this.storageTotal + this.processingTotal + this.othersTotal;
  }

  get grandTotal(): number {
    return this.totalDirectCosts + this.totalIndirectCosts;
  }

  get costPerKg(): number {
    const qty = this.rawMaterialsQuantityKg();
    return qty > 0 ? this.grandTotal / qty : 0;
  }

  get potentialMargin(): number {
    const sp = this.suggestedPrice;
    const cpk = this.costPerKg;
    return sp > 0 ? ((sp - cpk) / sp) * 100 : 0;
  }

  get suggestedPrice(): number {
    return this.costPerKg * (1 + this.EXPECTED_MARGIN / 100);
  }

  calculateResumen(): void {
    this.costSummary = [
      { tipo: 'COST_MANAGEMENT.RAW_MATERIAL', monto: this.rawMaterialTotal },
      { tipo: 'COST_MANAGEMENT.DIRECT_LABOR', monto: this.laborTotal },
      { tipo: 'COST_MANAGEMENT.CATEGORY_TRANSPORT', monto: this.transportTotal },
      { tipo: 'COST_MANAGEMENT.CATEGORY_STORAGE', monto: this.storageTotal },
      { tipo: 'COST_MANAGEMENT.CATEGORY_PROCESSING', monto: this.processingTotal },
      { tipo: 'COST_MANAGEMENT.CATEGORY_OTHERS', monto: this.othersTotal },
    ];
  }

  onSubmit(): void {
    this.saveProductionCost();
  }

  onExit(): void {
    this.goToHome();
  }

  onPrint(): void {
    this.downloadPDF();
  }

  goToHome(): void {
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