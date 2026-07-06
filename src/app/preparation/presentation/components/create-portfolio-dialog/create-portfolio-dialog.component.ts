import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-portfolio-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './create-portfolio-dialog.component.html',
  styleUrls: ['./create-portfolio-dialog.component.css']
})
export class CreatePortfolioDialogComponent implements OnInit {
  portfolioName: string = '';
  isEditMode: boolean = false;
  dialogTitle: string = 'portfolio.create';

  constructor(
    private dialogRef: MatDialogRef<CreatePortfolioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.name) {
      this.portfolioName = this.data.name;
      this.isEditMode = true;
      this.dialogTitle = 'portfolio.edit';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.portfolioName.trim()) {
      this.dialogRef.close({ name: this.portfolioName });
    }
  }
}