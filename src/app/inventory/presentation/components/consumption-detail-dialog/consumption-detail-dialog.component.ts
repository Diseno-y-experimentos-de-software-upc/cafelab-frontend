import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/infrastructure/AuthService';

interface ConsumptionDetailData {
  id: number;
  date: string;
  lotName: string;
  consumptionKg: number;
  lotId: number;
  consumptionReason?: string;
  usageNotes?: string | null;
  coffeeType?: string;
  status?: string;
  currentLotStockKg?: number | null;
}

@Component({
  selector: 'app-consumption-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './consumption-detail-dialog.component.html',
  styleUrls: ['./consumption-detail-dialog.component.css']
})
export class ConsumptionDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConsumptionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConsumptionDetailData,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusText(status: string): string {
    if (status === 'green') {
      return this.translate.instant('FORM.STATUS_OPTIONS.GREEN');
    }
    if (status === 'roasted') {
      return this.translate.instant('FORM.STATUS_OPTIONS.ROASTED');
    }
    return this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  goToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      this.close();
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
    this.close();
  }
}
