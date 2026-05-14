import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GrindCalibrationApi } from '../../../../grind-calibration/application/grind-calibration.api';
import type { GrindCalibrationEntry } from '../../../../grind-calibration/domain/model/grind-calibration-entry.entity';
import { todayLocalYyyyMmDd, toYyyyMmDdDateInput } from '../../utils/calibration-date.util';
import { isSafeHttpUrlForImgPreview } from '../../utils/sample-image-url.util';

@Component({
  selector: 'app-edit-calibration',
  templateUrl: './edit-calibration.component.html',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgIf, MatSnackBarModule],
  styleUrls: ['./edit-calibration.component.css'],
})
export class EditCalibrationComponent implements OnInit {
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

  get minDate(): string {
    return todayLocalYyyyMmDd();
  }

  sampleImagePreviewBroken = false;

  constructor(
    private readonly route: ActivatedRoute,
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

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (Number.isNaN(id)) {
      void this.router.navigate(['/grind-calibration']);
      return;
    }
    this.grindCalibrationApi.getById(id).subscribe({
      next: (data) => {
        this.calibration = { ...data };
        const normalized = toYyyyMmDdDateInput(data.calibrationDate);
        const today = todayLocalYyyyMmDd();
        this.calibration.calibrationDate =
          normalized && normalized < today ? today : normalized;
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.DETAIL'),
          undefined,
          { duration: 4000 },
        );
        void this.router.navigate(['/grind-calibration']);
      },
    });
  }

  onUpdate(): void {
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
    const id = this.calibration.id;
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
    this.grindCalibrationApi.update(id, payload).subscribe({
      next: () => void this.router.navigate(['/grind-calibration']),
      error: () => {
        this.snackBar.open(
          this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.UPDATE'),
          undefined,
          { duration: 4000 },
        );
      },
    });
  }
}
