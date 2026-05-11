import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-register-consumption-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './register-consumption-dialog.component.html',
  styleUrl: './register-consumption-dialog.component.css'
})
export class RegisterConsumptionDialogComponent {
  lots = ['Lote 1', 'Lote 2', 'Lote 3'];
  selectedLot = '';
  productName = '';
  quantity = '';
  date = new Date().toISOString().split('T')[0];

  constructor(public dialogRef: MatDialogRef<RegisterConsumptionDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close({
      date: this.date,
      lot: this.selectedLot,
      product: this.productName,
      quantity: this.quantity
    });
  }
}