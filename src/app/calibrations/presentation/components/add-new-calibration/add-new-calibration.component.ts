import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GrindCalibrationApi } from '../../../../grind-calibration/application/grind-calibration.api';
import type { GrindCalibrationEntry } from '../../../../grind-calibration/domain/model/grind-calibration-entry.entity';

@Component({
  selector: 'app-add-new-calibration',
  templateUrl: './add-new-calibration.component.html',
  styleUrls: ['./add-new-calibration.component.css'],
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgIf, MatSnackBarModule],
})
export class AddNewCalibrationComponent {
  calibration: GrindCalibrationEntry = {
    id: 0,
    userId: 0,
    name: '',
    method: '',
    equipment: '',
    grindNumber: '',
    aperture: 58,
    cupVolume: 30,
    finalVolume: 25,
    calibrationDate: '',
    comments: '',
    notes: '',
    sampleImage: null,
  };
  minDate: string;

  constructor(
    private readonly grindCalibrationApi: GrindCalibrationApi,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {
    const today = new Date();
    // Use local date part YYYY-MM-DD
    this.minDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  }

  onSubmit(): void {
    if (!this.calibration.calibrationDate?.trim()) {
      return;
    }
    // Prevent manual bypass of [min]
    if (this.calibration.calibrationDate < this.minDate) {
      this.snackBar.open(
        this.translate.instant('CALIBRATIONS.DATE_PAST_ERROR'),
        undefined,
        { duration: 4000 }
      );
      return;
    }
    const payload: GrindCalibrationEntry = {
      ...this.calibration,
      name: this.calibration.name.trim(),
      method: this.calibration.method.trim(),
      equipment: this.calibration.equipment.trim(),
      grindNumber: this.calibration.grindNumber.trim(),
      aperture: Number(this.calibration.aperture),
      cupVolume: Number(this.calibration.cupVolume),
      finalVolume: Number(this.calibration.finalVolume),
      calibrationDate: this.calibration.calibrationDate.slice(0, 10),
      comments: this.calibration.comments?.trim() ?? '',
      notes: this.calibration.notes?.trim() ?? '',
    };
    this.grindCalibrationApi.create(payload).subscribe({
      next: () => void this.router.navigate(['/grind-calibration']),
      error: () => {
        this.snackBar.open(
          this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.REGISTER'),
          undefined,
          { duration: 4000 },
        );
      },
    });
  }
}