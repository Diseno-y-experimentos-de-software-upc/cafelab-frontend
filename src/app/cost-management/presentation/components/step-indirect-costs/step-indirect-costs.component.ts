import { Component, Input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-step-indirect-costs',
  standalone: true,
  templateUrl: './step-indirect-costs.component.html',
  styleUrls: ['./step-indirect-costs.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatCardModule,
    TranslateModule,
    DecimalPipe
  ]
})
export class StepIndirectCostsComponent {
  @Input() formGroup!: FormGroup;
  @Input() currencySymbol = 'S/.';
  @Input() onCancel!: () => void;

  get transportForm(): FormGroup {
    return this.formGroup.get('transport') as FormGroup;
  }

  get storageForm(): FormGroup {
    return this.formGroup.get('storage') as FormGroup;
  }

  get processingForm(): FormGroup {
    return this.formGroup.get('processing') as FormGroup;
  }

  get othersForm(): FormGroup {
    return this.formGroup.get('others') as FormGroup;
  }

  get trCostKg(): AbstractControl {
    return this.transportForm.get('costPerKg')!;
  }
  get trQty(): AbstractControl {
    return this.transportForm.get('quantity')!;
  }
  get stDays(): AbstractControl {
    return this.storageForm.get('daysInStorage')!;
  }
  get stDaily(): AbstractControl {
    return this.storageForm.get('dailyCost')!;
  }
  get prElectric(): AbstractControl {
    return this.processingForm.get('electricity')!;
  }
  get prWater(): AbstractControl {
    return this.processingForm.get('water')!;
  }
  get prSupplies(): AbstractControl {
    return this.processingForm.get('supplies')!;
  }
  get prMaint(): AbstractControl {
    return this.processingForm.get('maintenance')!;
  }
  get prDepr(): AbstractControl {
    return this.processingForm.get('depreciation')!;
  }
  get otQc(): AbstractControl {
    return this.othersForm.get('qualityControl')!;
  }
  get otCert(): AbstractControl {
    return this.othersForm.get('certifications')!;
  }
  get otIns(): AbstractControl {
    return this.othersForm.get('insurance')!;
  }
  get otAdm(): AbstractControl {
    return this.othersForm.get('administrative')!;
  }

  get transportTotal(): number {
    const { costPerKg = 0, quantity = 0 } = this.transportForm.value;
    return costPerKg * quantity;
  }

  get storageTotal(): number {
    const { daysInStorage = 0, dailyCost = 0 } = this.storageForm.value;
    return daysInStorage * dailyCost;
  }

  get processingTotal(): number {
    const p = this.processingForm.value;
    return (p.electricity || 0) + (p.maintenance || 0) + (p.supplies || 0) + (p.water || 0) + (p.depreciation || 0);
  }

  get othersTotal(): number {
    const o = this.othersForm.value;
    return (o.qualityControl || 0) + (o.certifications || 0) + (o.insurance || 0) + (o.administrative || 0);
  }
}
