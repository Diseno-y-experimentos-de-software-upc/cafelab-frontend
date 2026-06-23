import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { MatToolbar } from '@angular/material/toolbar';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { DefectLibraryApi } from '../../../application/defect-library.api';
import type { DefectLibraryEntry } from '../../../domain/model/defect-library-entry.entity';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';

@Component({
  selector: 'app-defect-library-list',
  standalone: true,
  templateUrl: './defect-library-list.component.html',
  styleUrl: './defect-library-list.component.css',
  imports: [
    TranslatePipe,
    MatFormField,
    MatInput,
    MatPrefix,
    MatSuffix,
    MatButton,
    MatIconButton,
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
    MatToolbar,
    MatSnackBarModule,
  ],
})
export class DefectLibraryListComponent implements OnInit {
  coffeeSearch = '';
  defectSearch = '';
  entries: DefectLibraryEntry[] = [];
  filteredEntries: DefectLibraryEntry[] = [];
  displayedColumns: string[] = ['peso', 'cafe', 'defecto', 'porcentaje', 'acciones'];
  deletingId: number | null = null;

  constructor(
    private readonly defectLibraryApi: DefectLibraryApi,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.defectLibraryApi.getAll().subscribe({
      next: (list) => {
        this.entries = list;
        this.filteredEntries = [...list];
      },
      error: () => {
        this.entries = [];
        this.filteredEntries = [];
      },
    });
  }

  filterData(): void {
    const c = this.coffeeSearch.trim().toLowerCase();
    const d = this.defectSearch.trim().toLowerCase();
    this.filteredEntries = this.entries.filter((row) => {
      const coffeeLabel = (row.coffeeDisplayName ?? '').toLowerCase();
      const defectLabel = (row.name ?? '').toLowerCase();
      return (!c || coffeeLabel.includes(c)) && (!d || defectLabel.includes(d));
    });
  }

  clearCoffeeSearch(): void {
    this.coffeeSearch = '';
    this.filterData();
  }

  clearDefectSearch(): void {
    this.defectSearch = '';
    this.filterData();
  }

  goToDetail(id: number): void {
    void this.router.navigate(['/file', id]);
  }

  goToEdit(id: number): void {
    void this.router.navigate(['/edit-defect', id]);
  }

  confirmDelete(row: DefectLibraryEntry): void {
    if (!row.id || row.id <= 0) {
      return;
    }
    const msg = this.translate.instant('DEFECT_BC.LIST.DELETE_CONFIRM', { name: row.name });
    if (!window.confirm(msg)) {
      return;
    }
    this.deletingId = row.id;
    this.defectLibraryApi
      .delete(row.id)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('DEFECT_BC.LIST.DELETE_SUCCESS'), undefined, {
            duration: 4000,
          });
          this.load();
        },
        error: (err: unknown) => {
          const text = getUserFacingApiMessage(
            err,
            this.translate.instant('DEFECT_BC.ERRORS.DELETE'),
            this.translate.instant('DEFECT_BC.ERRORS.UNAUTHORIZED'),
          );
          this.snackBar.open(text, undefined, { duration: 6000 });
        },
      });
  }

  goToNew(): void {
    void this.router.navigate(['/new-defect']);
  }

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    if (user.home) {
      void this.router.navigate([user.home]);
      return;
    }
    switch (user.plan) {
      case 'barista':
        void this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        void this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        void this.router.navigate(['/dashboard/complete']);
        break;
      default:
        void this.router.navigate(['/']);
    }
  }
}
