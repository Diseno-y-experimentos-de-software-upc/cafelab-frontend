import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../../infrastructure/recipe.service';
import { IngredientService } from '../../../infrastructure/ingredient.service';
import { PortfolioService } from '../../../infrastructure/portfolio.service';
import { CuppingSessionApi } from '../../../../cupping-session/application/cupping-session.api';
import { Portfolio } from '../../../domain/model/portfolio.entity';
import { Recipe, ExtractionMethod } from '../../../domain/model/recipe.entity';
import { Ingredient } from '../../../domain/model/ingredient.entity';
import type { CuppingSessionEntry } from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { switchMap, map } from 'rxjs/operators';

function nonNegativeIntegerPreparationTime(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === '' || v === null || v === undefined) {
    return { required: true };
  }
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { invalidPreparationTime: true };
  }
  return null;
}

@Component({
  selector: 'app-create-recipe',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    TranslateModule,
    MatToolbar,
    ToolbarComponent
  ],
  templateUrl: './create-recipe.component.html',
  styleUrls: ['./create-recipe.component.css', '../preparation-breadcrumb-shell.css'],
})
export class CreateRecipeComponent implements OnInit {
  recipeForm: FormGroup;
  extractionCategory: 'coffee' | 'espresso' = 'coffee';
  extractionMethod: ExtractionMethod = 'pour-over';
  portfolios: Portfolio[] = [];
  cuppingSessions: CuppingSessionEntry[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isSubmitting = false;
  isEditMode = false;
  recipeId: string | null = null;

  private loadedRecipe: Recipe | null = null;

  extractionMethods: { value: ExtractionMethod; label: string }[] = [
    { value: 'pour-over', label: 'recipes.creation.extraction_methods.pour-over' },
    { value: 'french-press', label: 'recipes.creation.extraction_methods.french-press' },
    { value: 'cold-brew', label: 'recipes.creation.extraction_methods.cold-brew' },
    { value: 'aeropress', label: 'recipes.creation.extraction_methods.aeropress' },
    { value: 'chemex', label: 'recipes.creation.extraction_methods.chemex' },
    { value: 'v60', label: 'recipes.creation.extraction_methods.v60' },
    { value: 'clever', label: 'recipes.creation.extraction_methods.clever' }
  ];

  availableUnits = [
    { value: 'gr', label: 'recipes.creation.unidades.gr' },
    { value: 'ml', label: 'recipes.creation.unidades.ml' },
    { value: 'oz', label: 'recipes.creation.unidades.oz' },
    { value: 'cups', label: 'recipes.creation.unidades.cups' },
    { value: 'tbsp', label: 'recipes.creation.unidades.tbsp' },
    { value: 'tsp', label: 'recipes.creation.unidades.tsp' }
  ];

  coffeeRatios = [
    { value: '1:12', label: 'recipes.creation.ratios.1:12' },
    { value: '1:14', label: 'recipes.creation.ratios.1:14' },
    { value: '1:15', label: 'recipes.creation.ratios.1:15' },
    { value: '1:16', label: 'recipes.creation.ratios.1:16' },
    { value: '1:17', label: 'recipes.creation.ratios.1:17' }
  ];

  espressoRatios = [
    { value: '1:1', label: 'recipes.creation.ratios.1:1' },
    { value: '1:1.5', label: 'recipes.creation.ratios.1:1.5' },
    { value: '1:2', label: 'recipes.creation.ratios.1:2' },
    { value: '1:2.5', label: 'recipes.creation.ratios.1:2.5' },
    { value: '1:3', label: 'recipes.creation.ratios.1:3' }
  ];

  get availableRatios() {
    return this.extractionCategory === 'coffee' ? this.coffeeRatios : this.espressoRatios;
  }

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private portfolioService: PortfolioService,
    private cuppingSessionApi: CuppingSessionApi,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.recipeForm = this.createForm();
    this.changeExtractionCategory('coffee');
  }

  ngOnInit(): void {
    this.loadPortfolios();
    this.loadCuppingSessions();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.recipeId = id;
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string): void {
    this.recipeService.getById(id).subscribe({
      next: (recipe) => {
        this.loadedRecipe = recipe;
        this.extractionCategory = recipe.extractionCategory;
        this.extractionMethod = recipe.extractionMethod;

        while (this.ingredients.length) {
          this.ingredients.removeAt(0);
        }

        const pushIngredients = (ingredients: Ingredient[]) => {
          ingredients.forEach((ingredient) => {
            this.ingredients.push(
              this.fb.group({
                name: [ingredient.name, Validators.required],
                amount: [ingredient.amount, Validators.required],
                unit: [ingredient.unit, Validators.required],
              }),
            );
          });
        };

        if (recipe.ingredients?.length) {
          pushIngredients(recipe.ingredients);
        } else {
          this.ingredientService.getByRecipeId(parseInt(id, 10)).subscribe({
            next: pushIngredients,
            error: (err) => console.error('Error al cargar los ingredientes:', err),
          });
        }

        this.recipeForm.patchValue({
          name: recipe.name,
          imageUrl: recipe.imageUrl,
          cupping: recipe.cupping,
          cuppingSessionId: recipe.cuppingSessionId,
          portfolioId: recipe.portfolioId,
          grindSize: recipe.grindSize,
          ratio: recipe.ratio,
          preparationTime: recipe.preparationTime,
          steps: recipe.steps,
          tips: recipe.tips,
          extractionCategory: recipe.extractionCategory,
          extractionMethod: recipe.extractionMethod
        });

        this.imagePreview = recipe.imageUrl;
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.snackBar.open(
          this.translate.instant('recipes.edit.error_loading'),
          this.translate.instant('recipes.creation.close'),
          { duration: 3000 }
        );
        this.router.navigate(['/preparation/recipes']);
      }
    });
  }

  loadCuppingSessions(): void {
    this.cuppingSessionApi.getAll().subscribe({
      next: (sessions: CuppingSessionEntry[]) => {
        this.cuppingSessions = sessions;
      },
      error: (error: unknown) => {
        console.error('Error al cargar las sesiones de cata:', error);
        this.snackBar.open(
          this.translate.instant('recipes.creation.error_loading_cupping_sessions'),
          this.translate.instant('CUPPING_SESSIONS.CLOSE'),
          { duration: 3000 }
        );
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      imageUrl: ['', Validators.required],
      cupping: [''],
      cuppingSessionId: [null],
      portfolioId: [null],
      grindSize: ['Medio', Validators.required],
      ratio: ['1:15', Validators.required],
      preparationTime: ['', [Validators.required, nonNegativeIntegerPreparationTime]],
      steps: ['', Validators.required],
      tips: [''],
      extractionCategory: ['coffee', Validators.required],
      extractionMethod: ['pour-over', Validators.required],
      ingredients: this.fb.array([]),
    });
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  createIngredientFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      amount: ['', Validators.required],
      unit: ['gr', Validators.required]
    });
  }

  loadPortfolios(): void {
    this.portfolioService.getAll().subscribe({
      next: data => this.portfolios = data,
      error: () => this.snackBar.open(
        this.translate.instant('recipes.creation.error_loading_portfolios'),
        this.translate.instant('recipes.creation.close'),
        { duration: 3000 }
      )
    });
  }

  changeExtractionCategory(category: 'coffee' | 'espresso'): void {
    if (this.isEditMode) return;

    this.extractionCategory = category;
    const defaultRatio = category === 'coffee' ? '1:15' : '1:2';
    this.recipeForm.patchValue({
      extractionCategory: category,
      ratio: defaultRatio,
    });

    if (category === 'espresso') {
      this.extractionMethod = 'espresso';
      this.recipeForm.patchValue({ extractionMethod: 'espresso' });
    } else {
      this.extractionMethod = 'pour-over';
      this.recipeForm.patchValue({ extractionMethod: 'pour-over' });
    }

    while (this.ingredients.length) {
      this.ingredients.removeAt(0);
    }

    if (category === 'coffee') {
      this.translate.get([
        'recipes.creation.ingredients_default.water',
        'recipes.creation.ingredients_default.coffee'
      ]).subscribe(translations => {
        this.ingredients.push(this.fb.group({
          name: [translations['recipes.creation.ingredients_default.water'], Validators.required],
          amount: ['', Validators.required],
          unit: ['ml', Validators.required]
        }));
        this.ingredients.push(this.fb.group({
          name: [translations['recipes.creation.ingredients_default.coffee'], Validators.required],
          amount: ['', Validators.required],
          unit: ['gr', Validators.required]
        }));
      });
    } else {
      this.addIngredient();
    }
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files?.length) return;
    this.selectedFile = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result;
    reader.readAsDataURL(this.selectedFile);
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientFormGroup());
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  onSubmit(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      const parts = this.collectRecipeFormValidationMessages();
      const detail =
        parts.length > 0
          ? parts.join(' • ')
          : this.translate.instant('recipes.creation.form_validation_generic');
      const title = this.translate.instant('recipes.creation.form_validation_title');
      this.snackBar.open(`${title}: ${detail}`, this.translate.instant('recipes.creation.close'), {
        duration: 10000,
        panelClass: ['recipe-form-validation-snackbar'],
      });
      return;
    }

    this.isSubmitting = true;
    const f = this.recipeForm.value;

    const selectedSession = this.cuppingSessions.find((s) => s.id === f.cuppingSessionId);

    const base = this.loadedRecipe;
    const recipe: Recipe = {
      id: this.isEditMode && this.recipeId ? Number(this.recipeId) : 0,
      userId: base?.userId ?? 0,
      name: f.name,
      imageUrl: f.imageUrl,
      extractionMethod: f.extractionMethod,
      extractionCategory: f.extractionCategory,
      ratio: f.ratio || '',
      grindSize: f.grindSize || '',
      preparationTime: Number.parseInt(String(f.preparationTime), 10),
      steps: f.steps || '',
      tips: f.tips || '',
      portfolioId: f.portfolioId != null ? Number(f.portfolioId) : null,
      cuppingSessionId: f.cuppingSessionId != null ? Number(f.cuppingSessionId) : null,
      cupping: selectedSession?.name ?? base?.cupping ?? '',
      createdAt: base?.createdAt ?? new Date().toISOString(),
      ingredients: base?.ingredients ?? [],
    };

    const request =
      this.isEditMode && this.recipeId
        ? this.recipeService.update(this.recipeId, recipe)
        : this.recipeService.create(recipe);

    request.pipe(
      switchMap((recipe) => {
        const ingredientsData = f.ingredients.map((ingredient: any) => ({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit
        }));

        if (this.isEditMode && this.recipeId) {
          return this.ingredientService.updateRecipeIngredients(recipe.id, ingredientsData)
            .pipe(map(() => recipe));
        } else {
          return this.ingredientService.createMultiple(recipe.id, ingredientsData)
            .pipe(map(() => recipe));
        }
      })
    ).subscribe({
      next: (recipe) => {
        this.snackBar.open(
          this.translate.instant(this.isEditMode ? 'recipes.edit.success' : 'recipes.creation.success'),
          this.translate.instant('recipes.creation.close'),
          { duration: 3000 }
        );

        if (recipe.portfolioId) {
          this.router.navigate(['/preparation/portfolios', recipe.portfolioId]);
        } else {
          this.router.navigate(['/preparation/recipes']);
        }
      },
      error: (err: unknown) => {
        console.error('Error:', err);
        this.isSubmitting = false;
        const apiText = err instanceof Error && err.message?.trim() ? err.message.trim() : '';
        const fallback = this.translate.instant(
          this.isEditMode ? 'recipes.edit.error' : 'recipes.creation.error',
        );
        this.snackBar.open(apiText || fallback, this.translate.instant('recipes.creation.close'), {
          duration: apiText.length > 120 ? 12000 : 6000,
          panelClass: ['recipe-form-api-error-snackbar'],
        });
      },
    });
  }

  private collectRecipeFormValidationMessages(): string[] {
    const t = (key: string) => this.translate.instant(key);
    const msgs: string[] = [];

    const pushField = (controlName: string, messageKey: string) => {
      const c = this.recipeForm.get(controlName);
      if (c?.invalid) {
        msgs.push(t(messageKey));
      }
    };

    pushField('name', 'recipes.creation.name_required');
    pushField('imageUrl', 'recipes.creation.image_required');
    pushField('grindSize', 'recipes.creation.grind_required');
    pushField('ratio', 'recipes.creation.ratio_required');

    const pt = this.recipeForm.get('preparationTime');
    if (pt?.invalid) {
      if (pt.hasError('required')) {
        msgs.push(t('recipes.creation.preparation_time_required'));
      } else {
        msgs.push(t('recipes.creation.preparation_time_invalid'));
      }
    }

    pushField('steps', 'recipes.creation.steps_required');
    pushField('extractionMethod', 'recipes.creation.extraction_method_required');
    pushField('extractionCategory', 'recipes.creation.extraction_category_required');

    this.ingredients.controls.forEach((ctrl, i) => {
      const g = ctrl as FormGroup;
      if (!g.invalid) {
        return;
      }
      const prefix = `${t('recipes.creation.ingredientes')} ${i + 1}`;
      if (g.get('name')?.invalid) {
        msgs.push(`${prefix}: ${t('recipes.creation.ingredient_name_required')}`);
      }
      if (g.get('amount')?.invalid) {
        msgs.push(`${prefix}: ${t('recipes.creation.ingredient_amount_required')}`);
      }
      if (g.get('unit')?.invalid) {
        msgs.push(`${prefix}: ${t('recipes.creation.ingredient_unit_required')}`);
      }
    });

    return msgs;
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