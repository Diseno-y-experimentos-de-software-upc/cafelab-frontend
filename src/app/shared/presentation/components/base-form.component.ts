import { FormGroup } from '@angular/forms';

export abstract class BaseFormComponent {
  isInvalidControl(form: FormGroup, controlName: string): boolean {
    const c = form.get(controlName);
    if (!c) return false;
    return c.invalid && (c.dirty || c.touched);
  }

  errorMessagesForControl(form: FormGroup, controlName: string): string {
    const c = form.get(controlName);
    if (!c?.errors || !(c.dirty || c.touched)) return '';
    const e = c.errors;
    if (e['required']) return 'Campo obligatorio';
    if (e['email']) return 'Email inválido';
    if (e['minlength'])
      return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength'])
      return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    if (e['min']) return `Valor mínimo: ${e['min'].min}`;
    if (e['max']) return `Valor máximo: ${e['max'].max}`;
    if (e['pattern']) {
      if (controlName === 'password' || controlName === 'newPassword') {
        return 'Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&_-#)';
      }
      return 'Formato inválido';
    }
    return 'Valor inválido';
  }
}