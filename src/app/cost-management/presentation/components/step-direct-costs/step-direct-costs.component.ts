import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-step-direct-costs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    TranslateModule,
    DecimalPipe
  ],
  templateUrl: './step-direct-costs.component.html',
  styleUrls: ['./step-direct-costs.component.css']
})
export class StepDirectCostsComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() currencySymbol = 'S/.';
  @Output() totalsCalculated = new EventEmitter<{ materiaPrima: number; manoObra: number }>();

  get rmCostPerKg(): AbstractControl {
    return this.formGroup.get('rawMaterials')!.get('costPerKg')!;
  }
  get rmQty(): AbstractControl {
    return this.formGroup.get('rawMaterials')!.get('quantity')!;
  }
  get lbHours(): AbstractControl {
    return this.formGroup.get('labor')!.get('hoursWorked')!;
  }
  get lbCostH(): AbstractControl {
    return this.formGroup.get('labor')!.get('costPerHour')!;
  }
  get lbWorkers(): AbstractControl {
    return this.formGroup.get('labor')!.get('numberOfWorkers')!;
  }

  totalMateriaPrima = 0;
  totalManoObra = 0;

  ngOnInit(): void {
    if (this.formGroup) {
      this.formGroup.valueChanges.subscribe(() => this.calculateTotals());
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    const rawMaterials = this.formGroup.get('rawMaterials')?.value;
    const labor = this.formGroup.get('labor')?.value;

    this.totalMateriaPrima = (rawMaterials?.costPerKg || 0) * (rawMaterials?.quantity || 0);
    this.totalManoObra = (labor?.hoursWorked || 0) * (labor?.costPerHour || 0) * (labor?.numberOfWorkers || 0);

    this.totalsCalculated.emit({
      materiaPrima: this.totalMateriaPrima,
      manoObra: this.totalManoObra
    });
  }
}