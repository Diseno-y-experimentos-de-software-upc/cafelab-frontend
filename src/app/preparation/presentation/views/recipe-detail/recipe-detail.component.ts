import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../infrastructure/recipe.service';
import { IngredientService } from '../../../infrastructure/ingredient.service';
import { PortfolioService } from '../../../infrastructure/portfolio.service';
import { Recipe } from '../../../domain/model/recipe.entity';
import { Ingredient } from '../../../domain/model/ingredient.entity';
import { Portfolio } from '../../../domain/model/portfolio.entity';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {MatToolbar} from '@angular/material/toolbar';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule,
    MatSnackBarModule,
    MatToolbar,
    ToolbarComponent,
    MatDialogModule
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css', '../preparation-breadcrumb-shell.css'],
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  ingredients: Ingredient[] = [];
  portfolio: Portfolio | null = null;
  isLoading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private portfolioService: PortfolioService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (!recipeId) {
      this.router.navigate(['/preparation/recipes']);
      return;
    }

    this.loadRecipe(recipeId);
  }

  private loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        if (recipe.ingredients?.length) {
          this.ingredients = recipe.ingredients;
          if (recipe.portfolioId) {
            this.loadPortfolio(recipe.portfolioId);
          } else {
            this.isLoading = false;
          }
          return;
        }
        this.ingredientService.getByRecipeId(parseInt(id, 10)).subscribe({
          next: (ingredients) => {
            this.ingredients = ingredients;
            if (recipe.portfolioId) {
              this.loadPortfolio(recipe.portfolioId);
            } else {
              this.isLoading = false;
            }
          },
          error: () => {
            this.ingredients = [];
            if (recipe.portfolioId) {
              this.loadPortfolio(recipe.portfolioId);
            } else {
              this.isLoading = false;
            }
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.error = true;
        this.isLoading = false;
        this.snackBar.open(
          'Error al cargar la receta',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  private loadPortfolio(portfolioId: number): void {
    this.portfolioService.getById(portfolioId).subscribe({
      next: (portfolio) => {
        this.portfolio = portfolio;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el portafolio:', err);
        this.isLoading = false;
      }
    });
  }

  getNavigationPath(): string {
    return this.recipe?.portfolioId
      ? `/preparation/portfolios/${this.recipe.portfolioId}`
      : '/preparation/recipes';
  }

  getNavigationText(): string {
    return this.recipe?.portfolioId
      ? 'NAVIGATION.PORTFOLIO'
      : 'NAVIGATION.DRINKS';
  }

  editRecipe(): void {
    if (!this.recipe) return;
    this.router.navigate(['/preparation/recipes/edit', this.recipe.id]);
  }

  deleteRecipe(): void {
    if (!this.recipe) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '400px',
      data: { recipeName: this.recipe.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recipeService.delete(this.recipe!.id).subscribe({
          next: () => {
            this.snackBar.open(
              this.translate.instant('recipes.detail.delete_success'),
              this.translate.instant('Cerrar'),
              { duration: 3000 }
            );
            this.router.navigate([this.getNavigationPath()]);
          },
          error: (err) => {
            console.error('Error deleting recipe:', err);
            this.snackBar.open(
              this.translate.instant('recipes.detail.delete_error'),
              this.translate.instant('Cerrar'),
              { duration: 3000 }
            );
          }
        });
      }
    });
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

    grindLabelKey(value: string): string {
    const m: Record<string, string> = {
      'Muy fino': 'recipes.creation.grind_options.very_fine',
      'Fino': 'recipes.creation.grind_options.fine',
      'Medio': 'recipes.creation.grind_options.medium',
      'Grueso': 'recipes.creation.grind_options.coarse',
    };
    return m[value] ?? value;
  }
      
}

@Component({
  selector: 'delete-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'recipes.detail.delete_confirmation_title' | translate }}</h2>
    <mat-dialog-content>
      {{ 'recipes.detail.delete_confirmation_message' | translate: { name: data.recipeName } }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ 'recipes.detail.cancel' | translate }}
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        {{ 'recipes.detail.confirm_delete' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslateModule
  ]
})
export class DeleteConfirmationDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { recipeName: string }) {}
}