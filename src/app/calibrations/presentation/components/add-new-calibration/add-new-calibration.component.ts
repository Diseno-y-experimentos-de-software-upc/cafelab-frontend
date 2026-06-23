import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GrindCalibrationApi } from '../../../../grind-calibration/application/grind-calibration.api';
import type { GrindCalibrationEntry } from '../../../../grind-calibration/domain/model/grind-calibration-entry.entity';
import { todayLocalYyyyMmDd, toYyyyMmDdDateInput } from '../../utils/calibration-date.util';
import { isSafeHttpUrlForImgPreview } from '../../utils/sample-image-url.util';

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

  /** Mínimo permitido = hoy local (se recalcula para evitar fecha “vieja” si la pestaña queda abierta). */
  get minDate(): string {
    return todayLocalYyyyMmDd();
  }

  sampleImagePreviewBroken = false;

  constructor(
    private readonly grindCalibrationApi: GrindCalibrationApi,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  isSafeSampleImageUrl(): boolean {
    return isSafeHttpUrlForImgPreview(this.calibration.sampleImage);
  }

  onSampleImageUrlChange(): void {
    this.sampleImagePreviewBroken = false;
  }

  onSampleImageError(): void {
    this.sampleImagePreviewBroken = true;
  }

  isCalibrationDateInPast(): boolean {
    const v = toYyyyMmDdDateInput(this.calibration.calibrationDate);
    if (!v) {
      return false;
    }
    return v < this.minDate;
  }

  onSubmit(): void {
    const chosen = toYyyyMmDdDateInput(this.calibration.calibrationDate);
    if (!chosen) {
      return;
    }
    if (chosen < this.minDate) {
      this.snackBar.open(this.translate.instant('CALIBRATIONS.DATE_PAST_ERROR'), undefined, { duration: 4000 });
      return;
    }
    if (Number(this.calibration.aperture) < 0) {
      this.snackBar.open(this.translate.instant('CALIBRATIONS.ERRORS.APERTURE_NEGATIVE'), undefined, { duration: 4000 });
      return;
    }
    if (Number(this.calibration.cupVolume) < 0) {
      this.snackBar.open(this.translate.instant('CALIBRATIONS.ERRORS.CUP_VOLUME_NEGATIVE'), undefined, { duration: 4000 });
      return;
    }
    if (Number(this.calibration.finalVolume) < 0) {
      this.snackBar.open(this.translate.instant('CALIBRATIONS.ERRORS.FINAL_VOLUME_NEGATIVE'), undefined, { duration: 4000 });
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
      calibrationDate: chosen,
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
