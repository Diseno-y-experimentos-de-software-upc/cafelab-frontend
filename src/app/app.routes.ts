import { AuthGuard } from './auth/infrastructure/auth.guard';
import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/presentation/views/login-page/login-page.component';
import { LoginSuccessPageComponent } from './auth/presentation/views/login-success-page/login-success-page.component';
import { LogupBaristaPageComponent } from './auth/presentation/views/logup-barista-page/logup-barista-page.component';
import { LogupBaristaSuccessPageComponent } from './auth/presentation/views/logup-barista-success-page/logup-barista-success-page.component';
import { LogupOwnerPageComponent } from './auth/presentation/views/logup-owner-page/logup-owner-page.component';
import { LogupOwnerSuccessPageComponent } from './auth/presentation/views/logup-owner-success-page/logup-owner-success-page.component';
import { EditProfilePageComponent } from './auth/presentation/views/edit-profile-page/edit-profile-page.component';
import { SelectPlanComponent } from './subscription/presentation/components/select-plan/select-plan.component';
import { BaristaDashboardComponent } from './dashboard/presentation/components/barista-dashboard/barista-dashboard.component';
import { OwnerDashboardComponent } from './dashboard/presentation/components/owner-dashboard/owner-dashboard.component';
import { CompleteDashboardComponent } from './dashboard/presentation/components/complete-dashboard/complete-dashboard.component';
import { PageNotFoundComponent } from './public/presentation/views/page-not-found/page-not-found.component';
import { ConfirmPlanComponent } from './subscription/presentation/components/confirm-plan/confirm-plan.component';
import { RoastingPageComponent } from './roasting/presentation/views/roasting-page/roasting-page.component';
import { RoastProfileComparisonComponent } from './roasting/presentation/components/roast-profile-comparison/roast-profile-comparison.component';
import { LotsComponent } from './coffee-lot/presentation/views/lots-page/lots.component';
import { SupplyPageComponent } from './supplier/presentation/views/supply-page/supply-page.component';
import { DefectLibraryListComponent } from './defect-library/presentation/components/defect-library-list/defect-library-list.component';
import { SesionesCataComponent } from './cupping-session/presentation/views/sesiones-cata/sesiones-cata.component';
import { InventaryComponent } from './inventory/presentation/views/inventary.component';
import { ProductionCostPageComponent } from './cost-management/presentation/views/production-cost-management/production-cost-management.component';
import { ViewNewDefectLibraryEntryComponent } from './defect-library/presentation/views/view-new-defect-library-entry/view-new-defect-library-entry.component';
import { ViewEditDefectLibraryEntryComponent } from './defect-library/presentation/views/view-edit-defect-library-entry/view-edit-defect-library-entry.component';
import { ViewDefectLibraryDetailComponent } from './defect-library/presentation/views/view-defect-library-detail/view-defect-library-detail.component';
import { RecipeListComponent } from './preparation/presentation/views/recipe-list/recipe-list.component';
import { CreateRecipeComponent } from './preparation/presentation/views/create-recipe/create-recipe.component';
import { PortfolioDetailComponent } from './preparation/presentation/views/portfolio-detail/portfolio-detail.component';
import { RecipeDetailComponent } from './preparation/presentation/views/recipe-detail/recipe-detail.component';
import { ViewCalibrationPageComponent } from './calibrations/presentation/views/view-calibration-page/view-calibration-page.component';
import { AddCalibrationPageComponent } from './calibrations/presentation/views/add-calibration-page/add-calibration-page.component';
import { EditCalibrationPageComponent } from './calibrations/presentation/views/edit-calibration-page/edit-calibration-page.component';
import { MoreInfoPageComponent } from './calibrations/presentation/views/more-info-page/more-info-page.component';
import { EditProfileSessionPageComponent } from './auth/presentation/views/edit-profile-session-page/edit-profile-session-page.component';
import { ChangePlanComponent } from './subscription/presentation/components/change-plan/change-plan.component';
import { ConfirmChangePlanComponent } from './subscription/presentation/components/confirm-change-plan/confirm-change-plan.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'login/success', component: LoginSuccessPageComponent, canActivate: [AuthGuard] },
  { path: 'register/barista', component: LogupBaristaPageComponent },
  { path: 'logup/barista/success', component: LogupBaristaSuccessPageComponent },
  { path: 'register/owner', component: LogupOwnerPageComponent },
  { path: 'logup/owner/success', component: LogupOwnerSuccessPageComponent },
  { path: 'edit-profile', component: EditProfilePageComponent, canActivate: [AuthGuard] },
  { path: 'subscription/select-plan', component: SelectPlanComponent, canActivate: [AuthGuard] },
  { path: 'subscription/change-plan', component: ChangePlanComponent, canActivate: [AuthGuard] },
  { path: 'subscription/confirm-change-plan', component: ConfirmChangePlanComponent, canActivate: [AuthGuard] },
  { path: 'subscription/confirm-plan', component: ConfirmPlanComponent, canActivate: [AuthGuard] },
  { path: 'confirm-plan/select-plan', component: SelectPlanComponent, canActivate: [AuthGuard] },
  { path: 'edit-profile-session', component: EditProfileSessionPageComponent, canActivate: [AuthGuard] },
  { path: 'select-plan', component: SelectPlanComponent, canActivate: [AuthGuard] },
  { path: 'dashboard/barista', component: BaristaDashboardComponent, canActivate: [AuthGuard] },
  { path: 'libraryDefects', component: DefectLibraryListComponent, canActivate: [AuthGuard] },
  { path: 'cupping-sessions', component: SesionesCataComponent, canActivate: [AuthGuard] },
  { path: 'new-defect', component: ViewNewDefectLibraryEntryComponent, canActivate: [AuthGuard] },
  { path: 'edit-defect/:id', component: ViewEditDefectLibraryEntryComponent, canActivate: [AuthGuard] },
  { path: 'file/:id', component: ViewDefectLibraryDetailComponent, canActivate: [AuthGuard] },
  {
    path: 'preparation',
    children: [
      { path: 'recipes', component: RecipeListComponent, canActivate: [AuthGuard] },
      { path: 'recipes/create', component: CreateRecipeComponent, canActivate: [AuthGuard] },
      { path: 'recipes/:id', component: RecipeDetailComponent, canActivate: [AuthGuard] },
      { path: 'recipes/edit/:id', component: CreateRecipeComponent, canActivate: [AuthGuard] },
      { path: 'portfolios/:id', component: PortfolioDetailComponent, canActivate: [AuthGuard] },
    ],
  },
  { path: 'dashboard/owner', component: OwnerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'inventory', component: InventaryComponent, canActivate: [AuthGuard] },
  { path: 'production-cost-management', component: ProductionCostPageComponent, canActivate: [AuthGuard] },
  { path: 'dashboard/complete', component: CompleteDashboardComponent, canActivate: [AuthGuard] },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./public/presentation/components/contact-us/contact-us.component').then((m) => m.ContactUsComponent),
    canActivate: [AuthGuard],
  },
  { path: 'grind-calibration', component: ViewCalibrationPageComponent, canActivate: [AuthGuard] },
  { path: 'add-new-calibration', component: AddCalibrationPageComponent, canActivate: [AuthGuard] },
  { path: 'edit-calibration/:id', component: EditCalibrationPageComponent, canActivate: [AuthGuard] },
  { path: 'more-info-calibration/:id', component: MoreInfoPageComponent, canActivate: [AuthGuard] },
  { path: 'suppliers', component: SupplyPageComponent, canActivate: [AuthGuard] },
  { path: 'coffee-lots', component: LotsComponent, canActivate: [AuthGuard] },
  { path: 'profiles-roasting', component: RoastingPageComponent, canActivate: [AuthGuard] },
  { path: 'compare-profile', component: RoastProfileComparisonComponent, canActivate: [AuthGuard] },
  { path: '**', component: PageNotFoundComponent },
];
