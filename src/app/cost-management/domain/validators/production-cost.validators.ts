import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxDecimalPlaces(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const str = String(raw).trim();
    if (str === '') {
      return null;
    }
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      return { invalidNumber: true };
    }
    const dot = str.indexOf('.');
    if (dot === -1) {
      return null;
    }
    const decimals = str.length - dot - 1;
    return decimals > max ? { maxDecimals: { max } } : null;
  };
}

export function integerInRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const v = Number(raw);
    if (!Number.isFinite(v) || !Number.isInteger(v)) {
      return { notInteger: true };
    }
    if (v < min || v > max) {
      return { range: { min, max } };
    }
    return null;
  };
}

export function integerInRangeWorkers(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const v = Number(raw);
    if (!Number.isFinite(v) || !Number.isInteger(v)) {
      return { notInteger: true };
    }
    if (v < min || v > max) {
      return { workersRange: { min, max } };
    }
    return null;
  };
}
