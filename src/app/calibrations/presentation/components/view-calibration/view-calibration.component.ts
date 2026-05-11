import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatInput, MatPrefix, MatSuffix } from '@angular/material/input';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { GrindCalibrationApi } from '../../../../grind-calibration/application/grind-calibration.api';
import type { GrindCalibrationEntry } from '../../../../grind-calibration/domain/model/grind-calibration-entry.entity';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-view-calibration',
  templateUrl: './view-calibration.component.html',
  standalone: true,
  imports: [
    TranslatePipe,
    MatFormField,
    MatIconButton,
    MatInput,
    MatPrefix,
    MatSuffix,
    MatButton,
    NgIf,
    FormsModule,
    MatIconModule,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    ToolbarComponent,
    MatSnackBarModule,
  ],
  styleUrls: ['./view-calibration.component.css'],
})
export class ViewCalibrationComponent implements OnInit {
  search = '';
  calibrations: GrindCalibrationEntry[] = [];
  filteredCalibrations: GrindCalibrationEntry[] = [];
  displayedColumns: string[] = ['nombre', 'metodo', 'equipo', 'apertura', 'acciones'];

  constructor(
    private readonly grindCalibrationApi: GrindCalibrationApi,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadCalibrations();
  }

  loadCalibrations(): void {
    this.grindCalibrationApi.getAll().subscribe({
      next: (list) => {
        this.calibrations = list;
        this.filteredCalibrations = [...list];
      },
      error: () => {
        this.calibrations = [];
        this.filteredCalibrations = [];
      },
    });
  }

  filterData(): void {
    const q = this.search.trim().toLowerCase();
    this.filteredCalibrations = this.calibrations.filter(
      (row) =>
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.method.toLowerCase().includes(q) ||
        row.equipment.toLowerCase().includes(q) ||
        row.grindNumber.toLowerCase().includes(q),
    );
  }

  clearSearch(): void {
    this.search = '';
    this.filterData();
  }

  goToEdit(calibrationId: number): void {
    void this.router.navigate(['/edit-calibration', calibrationId]);
  }

  goToView(calibrationId: number): void {
    void this.router.navigate(['/more-info-calibration', calibrationId]);
  }

  goToRegister(): void {
    void this.router.navigate(['/add-new-calibration']);
  }

  deleteCalibration(id: number): void {
    if (confirm(this.translate.instant('CALIBRATIONS.DELETE_CONFIRMATION') || 'Are you sure you want to delete this?')) {
      this.grindCalibrationApi.delete(id).subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('CALIBRATIONS.DELETE_SUCCESS') || 'Deleted successfully', undefined, { duration: 3000 });
          this.loadCalibrations();
        },
        error: () => {
          this.snackBar.open(this.translate.instant('CALIBRATIONS.DELETE_ERROR') || 'Error deleting', undefined, { duration: 3000 });
        }
      });
    }
  }
}