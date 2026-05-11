import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AddDefectLibraryEntryComponent } from './add-defect-library-entry.component';
import { DefectLibraryApi } from '../../../application/defect-library.api';
import type { DefectLibraryEntry } from '../../../domain/model/defect-library-entry.entity';

describe('AddDefectLibraryEntryComponent', () => {
  let component: AddDefectLibraryEntryComponent;
  let fixture: ComponentFixture<AddDefectLibraryEntryComponent>;
  let apiSpy: jasmine.SpyObj<DefectLibraryApi>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('DefectLibraryApi', ['create']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        AddDefectLibraryEntryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: DefectLibraryApi, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDefectLibraryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('starts with invalid form', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('has g as default unit for defect weight', () => {
      expect(component.form.get('defectWeightUnit')?.value).toBe('g');
    });

    it('has g as default unit for coffee total weight', () => {
      expect(component.form.get('coffeeTotalWeightUnit')?.value).toBe('g');
    });
  });

  describe('onSubmit — invalid form', () => {
    it('does not call api when form is empty', () => {
      component.onSubmit();
      expect(apiSpy.create).not.toHaveBeenCalled();
    });

    it('marks submitAttempted after first submit attempt', () => {
      component.onSubmit();
      expect(component.submitAttempted).toBeTrue();
    });
  });

  describe('onSubmit — client-side validation', () => {
    it('rejects negative defect weight and does not call api', () => {
      component.form.patchValue({ defectWeight: -5 });
      component.onSubmit();
      expect(apiSpy.create).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit — percentage validation', () => {
    it('rejects percentage > 100', () => {
      component.form.patchValue({
        coffeeDisplayName: 'Café',
        defectName: 'Grano',
        defectType: 'Cat 1',
        defectWeight: 10,
        percentage: 150,
        probableCause: 'Causa',
        suggestedSolution: 'Solución',
      });
      component.onSubmit();
      expect(component.form.get('percentage')?.errors?.['custom']).toBeTruthy();
      expect(apiSpy.create).not.toHaveBeenCalled();
    });

    it('rejects negative percentage', () => {
      component.form.patchValue({
        coffeeDisplayName: 'Café',
        defectName: 'Grano',
        defectType: 'Cat 1',
        defectWeight: 10,
        percentage: -1,
        probableCause: 'Causa',
        suggestedSolution: 'Solución',
      });
      component.onSubmit();
      expect(component.form.get('percentage')?.errors?.['custom']).toBeTruthy();
    });
  });

  describe('onSubmit — valid form', () => {
    beforeEach(() => {
      component.form.patchValue({
        coffeeDisplayName: 'Café Etiopía',
        coffeeRegion: 'Yirgacheffe',
        coffeeVariety: 'Heirloom',
        coffeeTotalWeight: 500,
        coffeeTotalWeightUnit: 'g',
        defectName: 'Grano negro',
        defectType: 'Categoría 1',
        defectWeight: 25,
        defectWeightUnit: 'g',
        percentage: 5,
        probableCause: 'Temperatura excesiva',
        suggestedSolution: 'Reducir temperatura',
      });
    });

    it('calls api.create with grams when unit is g', () => {
      apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
      component.onSubmit();
      const entry = apiSpy.create.calls.mostRecent().args[0];
      expect(entry.defectWeight).toBe(25);
      expect(entry.coffeeTotalWeight).toBe(500);
    });

    it('converts kg to grams before sending to api', () => {
      component.form.patchValue({ defectWeightUnit: 'kg', coffeeTotalWeightUnit: 'kg' });
      apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
      component.onSubmit();
      const entry = apiSpy.create.calls.mostRecent().args[0];
      expect(entry.defectWeight).toBe(25000);
      expect(entry.coffeeTotalWeight).toBe(500000);
    });

    it('navigates to /libraryDefects on success', () => {
      apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
      routerSpy.navigate.and.returnValue(Promise.resolve(true));
      component.onSubmit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/libraryDefects']);
    });

    it('sets apiBannerError on api failure', () => {
      apiSpy.create.and.returnValue(throwError(() => ({ message: 'Server error', fieldErrors: {} })));
      component.onSubmit();
      expect(component.apiBannerError).toBeTruthy();
    });

    it('sends null coffeeTotalWeight when field is empty', () => {
      component.form.patchValue({ coffeeTotalWeight: '' });
      apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
      component.onSubmit();
      const entry = apiSpy.create.calls.mostRecent().args[0];
      expect(entry.coffeeTotalWeight).toBeNull();
    });
  });

  describe('controlErrorMessage', () => {
    it('returns null when control has no errors', () => {
      component.form.patchValue({ coffeeRegion: 'Región válida' });
      expect(component.controlErrorMessage('coffeeRegion')).toBeNull();
    });
  });

  describe('onCancel', () => {
    it('navigates to /libraryDefects', () => {
      routerSpy.navigate.and.returnValue(Promise.resolve(true));
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/libraryDefects']);
    });
  });
});
