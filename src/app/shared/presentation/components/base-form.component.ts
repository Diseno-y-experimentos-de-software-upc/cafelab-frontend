import { inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

export abstract class BaseFormComponent {
  private readonly formTranslate = inject(TranslateService);

  isInvalidControl(form: FormGroup, controlName: string): boolean {
    const c = form.get(controlName);
    if (!c) return false;
    return c.invalid && (c.dirty || c.touched);
  }

  errorMessagesForControl(form: FormGroup, controlName: string): string {
    const c = form.get(controlName);
    if (!c?.errors || !(c.dirty || c.touched)) return '';
    const e = c.errors;
    if (e['required']) return this.formTranslate.instant('FORM_VALIDATION.REQUIRED');
    if (e['email']) return this.formTranslate.instant('FORM_VALIDATION.EMAIL');
    if (e['minlength'])
      return this.formTranslate.instant('FORM_VALIDATION.MINLENGTH', { n: e['minlength'].requiredLength });
    if (e['maxlength'])
      return this.formTranslate.instant('FORM_VALIDATION.MAXLENGTH', { n: e['maxlength'].requiredLength });
    if (e['min']) return this.formTranslate.instant('FORM_VALIDATION.MIN', { n: e['min'].min });
    if (e['max']) return this.formTranslate.instant('FORM_VALIDATION.MAX', { n: e['max'].max });
    if (e['pattern']) {
      if (controlName === 'password' || controlName === 'newPassword') {
        return this.formTranslate.instant('FORM_VALIDATION.PASSWORD_PATTERN');
      }
      return this.formTranslate.instant('FORM_VALIDATION.PATTERN');
    }
    return this.formTranslate.instant('FORM_VALIDATION.INVALID');
  }
}