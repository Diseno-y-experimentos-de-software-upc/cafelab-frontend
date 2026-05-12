import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AddDefectLibraryEntryComponent } from './add-defect-library-entry.component';
import { DefectLibraryApi } from '../../../application/defect-library.api';
import type { DefectLibraryEntry } from '../../../domain/model/defect-library-entry.entity';

describe('AddDefectLibraryEntryComponent', () => {
  let component: AddDefectLibraryEntryComponent;
  let fixture: ComponentFixture<AddDefectLibraryEntryComponent>;
  let apiSpy: jasmine.SpyObj<DefectLibraryApi>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('DefectLibraryApi', ['create', 'getById', 'update']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const translateSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateSpy.instant.and.callFake((k: string) => k);

    await TestBed.configureTestingModule({
      imports: [AddDefectLibraryEntryComponent],
      providers: [
        { provide: DefectLibraryApi, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDefectLibraryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has g as default unit for defect weight', () => {
    expect(component.form.get('defectWeightUnit')?.value).toBe('g');
  });

  it('rejects coffee name with digits and does not call api', () => {
    component.form.patchValue({
      coffeeDisplayName: 'qweqw123-123',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: 10,
      percentage: 5,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    component.onSubmit();
    expect(apiSpy.create).not.toHaveBeenCalled();
  });

  it('rejects negative defect weight and does not call api', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: -5,
      percentage: 5,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    component.onSubmit();
    expect(apiSpy.create).not.toHaveBeenCalled();
  });

  it('sends defect weight in grams when unit is g', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano negro',
      defectType: 'Categoría 1',
      defectWeight: 25,
      defectWeightUnit: 'g',
      percentage: 5,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
    component.onSubmit();
    expect(apiSpy.create).toHaveBeenCalled();
    const entry = apiSpy.create.calls.mostRecent().args[0] as DefectLibraryEntry;
    expect(entry.defectWeight).toBe(25);
  });

  it('converts defect weight from kg to grams', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: 25,
      defectWeightUnit: 'kg',
      coffeeTotalWeightUnit: 'kg',
      percentage: 5,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
    component.onSubmit();
    const entry = apiSpy.create.calls.mostRecent().args[0] as DefectLibraryEntry;
    expect(entry.defectWeight).toBe(25000);
  });

  it('navigates to /libraryDefects on success', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: 10,
      percentage: 5,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    apiSpy.create.and.returnValue(of({} as DefectLibraryEntry));
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/libraryDefects']);
  });

  it('rejects percentage over 100 and does not call api', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: 10,
      percentage: 150,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    component.onSubmit();
    expect(apiSpy.create).not.toHaveBeenCalled();
  });

  it('rejects percentage below 0 and does not call api', () => {
    component.form.patchValue({
      coffeeDisplayName: 'Café',
      coffeeVariety: 'Typica',
      defectName: 'Grano',
      defectType: 'Cat 1',
      defectWeight: 10,
      percentage: -1,
      probableCause: 'Causa',
      suggestedSolution: 'Solución',
    });
    component.onSubmit();
    expect(apiSpy.create).not.toHaveBeenCalled();
  });

  it('navigates to /libraryDefects on cancel', () => {
    component.onCancel();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/libraryDefects']);
  });
});
