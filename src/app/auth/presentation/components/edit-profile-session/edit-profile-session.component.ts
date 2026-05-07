import { Component, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../../../shared/presentation/components/base-form.component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { User } from '../../../domain/model/user.entity';
import { NgClass, CommonModule } from '@angular/common';
import { AuthService } from '../../../infrastructure/AuthService';
import { ProfileFieldsAvailability, UserService } from '../../../infrastructure/user.service';
import { HttpErrorResponse } from '@angular/common/http';

/** Snapshot mínimo de los campos que comparamos para detectar cambios reales. */
interface ProfileSnapshot {
  name: string;
  email: string;
  cafeteriaName: string;
  experience: string;
}

interface ChangedFields {
  email?: string;
  name?: string;
  cafeteriaName?: string;
}

@Component({
  selector: 'app-edit-profile-session',
  templateUrl: './edit-profile-session.component.html',
  styleUrls: ['./edit-profile-session.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    NgClass
  ]
})
export class EditProfileSessionComponent extends BaseFormComponent implements OnInit {

  editProfileForm: FormGroup;
  currentUser: User | null = null;
  /** Snapshot inmutable de los valores con los que entró el usuario, base para detectar cambios. */
  private originalSnapshot: ProfileSnapshot | null = null;

  /** Estado del modal de confirmación de cambio de correo. */
  showEmailChangeModal = false;
  /** Mensaje de error a mostrar dentro del modal (correo ya en uso, error de red, etc.). */
  emailChangeModalError: string | null = null;
  /** Mientras se verifica disponibilidad o se guarda. */
  emailChangeSubmitting = false;
  /** Resumen de qué cambios pendientes se aplicarán al confirmar. */
  pendingChangesSummary: ChangedFields = {};

  /** Errores inline por campo cuando el conflicto se detecta sin necesidad de modal. */
  fieldErrors: { name?: string; cafeteriaName?: string; email?: string } = {};

  // ----- Cambio de contraseña -----
  passwordForm: FormGroup;
  /** {@code true} mientras la petición de cambio de contraseña está en curso. */
  passwordSubmitting = false;
  /** Mensaje de error global de la petición (p. ej. 400 contraseña actual inválida). */
  passwordError: string | null = null;
  /** Mensaje de éxito que mostramos de forma transitoria después de un cambio correcto. */
  passwordSuccess: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private translate: TranslateService,
  ) {
    super();
    this.editProfileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cafeteriaName: [''],
      experience: [''],
    });
    this.passwordForm = this.formBuilder.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator() },
    );
    // Reseteamos error/success al editar cualquier campo para que el usuario reciba feedback claro.
    this.passwordForm.valueChanges.subscribe(() => {
      this.passwordError = null;
      this.passwordSuccess = null;
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      const initial: ProfileSnapshot = {
        name: this.currentUser.name || '',
        email: this.currentUser.email || '',
        cafeteriaName: this.currentUser.cafeteriaName || '',
        experience: this.currentUser.experience || '',
      };
      this.originalSnapshot = initial;
      this.editProfileForm.patchValue(initial);
      this.syncCafeteriaFieldState();
    } else {
      this.router.navigate(['/login']);
    }
  }

  private syncCafeteriaFieldState(): void {
    const ctrl = this.editProfileForm.get('cafeteriaName');
    if (!ctrl || !this.currentUser) {
      return;
    }
    const isBarista = this.currentUser.role === 'barista';
    const isFullPlan = this.currentUser.plan === 'full';
    if (isBarista && isFullPlan) {
      ctrl.enable({ emitEvent: false });
      ctrl.setValidators([Validators.required]);
      if (!(ctrl.value as string)?.toString().trim() && this.currentUser.cafeteriaName) {
        ctrl.setValue(this.currentUser.cafeteriaName, { emitEvent: false });
      }
    } else if (isBarista && !isFullPlan) {
      ctrl.disable({ emitEvent: false });
      ctrl.clearValidators();
      ctrl.setValue('', { emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  get isCafeteriaNameRequired(): boolean {
    return (
      this.currentUser?.role === 'barista' && this.currentUser?.plan === 'full'
    );
  }

  /**
   * Calcula los campos modificados respecto al snapshot original (case-insensitive y trim).
   * Sólo incluye los campos que el backend valida por unicidad: email, name, cafeteriaName.
   */
  private detectChangedFields(): ChangedFields {
    if (!this.originalSnapshot) {
      return {};
    }
    const raw = this.editProfileForm.getRawValue() as ProfileSnapshot;
    const result: ChangedFields = {};
    const sameNorm = (a: string, b: string) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
    if (!sameNorm(raw.email, this.originalSnapshot.email)) {
      result.email = (raw.email || '').trim();
    }
    if (!sameNorm(raw.name, this.originalSnapshot.name)) {
      result.name = (raw.name || '').trim();
    }
    if (!sameNorm(raw.cafeteriaName, this.originalSnapshot.cafeteriaName)) {
      result.cafeteriaName = (raw.cafeteriaName || '').trim();
    }
    return result;
  }

  onSubmit(): void {
    this.syncCafeteriaFieldState();
    this.fieldErrors = {};
    if (!this.editProfileForm.valid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }
    if (!this.currentUser) {
      return;
    }

    const changed = this.detectChangedFields();
    this.pendingChangesSummary = changed;

    // Si cambia el email pedimos confirmación explícita en un modal.
    if (changed.email !== undefined) {
      this.openEmailChangeModal();
      return;
    }

    // Si cambian otros campos únicos sin tocar el correo, validamos en backend antes del PATCH.
    if (changed.name !== undefined || changed.cafeteriaName !== undefined) {
      this.emailChangeSubmitting = true;
      this.userService.checkProfileAvailability({
        excludingUserId: this.currentUser.id,
        name: changed.name,
        cafeteriaName: changed.cafeteriaName,
      }).subscribe({
        next: (availability) => {
          this.emailChangeSubmitting = false;
          if (this.applyAvailabilityToFieldErrors(availability, changed)) {
            return;
          }
          this.persistProfileChanges();
        },
        error: () => {
          this.emailChangeSubmitting = false;
          this.fieldErrors.name = this.translate.instant(
            'EDIT_PROFILE.AVAILABILITY.NETWORK_ERROR',
          );
        },
      });
      return;
    }

    this.persistProfileChanges();
  }

  /**
   * Pinta los errores inline correspondientes a los campos colisionados. Devuelve {@code true}
   * si hubo al menos uno (y por tanto no hay que persistir aún).
   */
  private applyAvailabilityToFieldErrors(
    availability: ProfileFieldsAvailability,
    changed: ChangedFields,
  ): boolean {
    let hasError = false;
    if (availability.nameTaken && changed.name !== undefined) {
      this.fieldErrors.name = this.translate.instant('EDIT_PROFILE.AVAILABILITY.NAME_TAKEN');
      hasError = true;
    }
    if (availability.cafeteriaNameTaken && changed.cafeteriaName !== undefined) {
      this.fieldErrors.cafeteriaName = this.translate.instant(
        'EDIT_PROFILE.AVAILABILITY.CAFETERIA_TAKEN',
      );
      hasError = true;
    }
    if (availability.emailTaken && changed.email !== undefined) {
      this.fieldErrors.email = this.translate.instant('EDIT_PROFILE.AVAILABILITY.EMAIL_TAKEN');
      hasError = true;
    }
    return hasError;
  }

  // ----- Modal de confirmación de cambio de correo -----
  openEmailChangeModal(): void {
    this.emailChangeModalError = null;
    this.showEmailChangeModal = true;
  }

  cancelEmailChange(): void {
    this.showEmailChangeModal = false;
    this.emailChangeModalError = null;
    this.emailChangeSubmitting = false;
  }

  /**
   * Confirma el cambio: primero pregunta al backend por la disponibilidad de los campos únicos,
   * y sólo si todos están libres aplica el PATCH. Cualquier colisión se reporta dentro del modal.
   */
  confirmEmailChange(): void {
    if (!this.currentUser || this.emailChangeSubmitting) {
      return;
    }
    this.emailChangeSubmitting = true;
    this.emailChangeModalError = null;
    const changed = this.pendingChangesSummary;
    this.userService.checkProfileAvailability({
      excludingUserId: this.currentUser.id,
      email: changed.email,
      name: changed.name,
      cafeteriaName: changed.cafeteriaName,
    }).subscribe({
      next: (availability) => {
        if (availability.emailTaken) {
          this.emailChangeModalError = this.translate.instant(
            'EDIT_PROFILE.AVAILABILITY.EMAIL_TAKEN_MODAL',
          );
          this.emailChangeSubmitting = false;
          return;
        }
        if (availability.nameTaken) {
          this.emailChangeModalError = this.translate.instant(
            'EDIT_PROFILE.AVAILABILITY.NAME_TAKEN',
          );
          this.emailChangeSubmitting = false;
          return;
        }
        if (availability.cafeteriaNameTaken) {
          this.emailChangeModalError = this.translate.instant(
            'EDIT_PROFILE.AVAILABILITY.CAFETERIA_TAKEN',
          );
          this.emailChangeSubmitting = false;
          return;
        }
        this.persistProfileChanges(true);
      },
      error: () => {
        this.emailChangeModalError = this.translate.instant(
          'EDIT_PROFILE.AVAILABILITY.NETWORK_ERROR',
        );
        this.emailChangeSubmitting = false;
      },
    });
  }

  /**
   * Aplica el PATCH al backend con el formulario completo. Si el backend devuelve 409 (otro
   * cliente ganó la carrera entre la verificación y el PATCH) mostramos el error en el sitio
   * adecuado.
   */
  private persistProfileChanges(closeModalOnSuccess = false): void {
    if (!this.currentUser) {
      return;
    }
    const raw = this.editProfileForm.getRawValue() as ProfileSnapshot;
    const isBarista = this.currentUser.role === 'barista';
    const isFullPlan = this.currentUser.plan === 'full';
    const cafeteriaName =
      isBarista && !isFullPlan ? '' : (raw.cafeteriaName || '').trim();

    const updatedUser: User = {
      ...this.currentUser,
      name: (raw.name || '').trim(),
      email: (raw.email || '').trim(),
      cafeteriaName,
      experience: raw.experience,
    };

    this.userService.updateProfile(this.currentUser.id, updatedUser).subscribe({
      next: (apiUser: User) => {
        const merged = this.userService.mergeProfileResponse(this.currentUser!, apiUser);
        localStorage.setItem('currentUser', JSON.stringify(merged));
        this.emailChangeSubmitting = false;
        if (closeModalOnSuccess) {
          this.showEmailChangeModal = false;
        }
        this.navigateToDashboard(merged);
      },
      error: (err: unknown) => {
        this.emailChangeSubmitting = false;
        if (err instanceof HttpErrorResponse && err.status === 409) {
          const body = err.error as { field?: string; message?: string } | null;
          this.handleConflictResponse(body, closeModalOnSuccess);
          return;
        }
        const fallback = this.translate.instant('EDIT_PROFILE.AVAILABILITY.SERVER_ERROR');
        if (closeModalOnSuccess) {
          this.emailChangeModalError = fallback;
        } else {
          this.fieldErrors.name = fallback;
        }
      },
    });
  }

  private handleConflictResponse(
    body: { field?: string; message?: string } | null,
    inModal: boolean,
  ): void {
    const field = body?.field || '';
    const messageKey =
      field === 'email'
        ? 'EDIT_PROFILE.AVAILABILITY.EMAIL_TAKEN_MODAL'
        : field === 'name'
          ? 'EDIT_PROFILE.AVAILABILITY.NAME_TAKEN'
          : field === 'cafeteriaName'
            ? 'EDIT_PROFILE.AVAILABILITY.CAFETERIA_TAKEN'
            : 'EDIT_PROFILE.AVAILABILITY.SERVER_ERROR';
    const message = this.translate.instant(messageKey);
    if (inModal) {
      this.emailChangeModalError = message;
      return;
    }
    if (field === 'name') {
      this.fieldErrors.name = message;
    } else if (field === 'cafeteriaName') {
      this.fieldErrors.cafeteriaName = message;
    } else {
      this.fieldErrors.email = message;
    }
  }

  // ----- Cambio de contraseña -----

  /**
   * Envía la nueva contraseña al backend exigiendo la contraseña actual como prueba de identidad.
   * Mapea {@code 400} a error en el campo de contraseña actual y cualquier otro fallo a un
   * mensaje genérico del servidor.
   */
  submitPasswordChange(): void {
    this.passwordError = null;
    this.passwordSuccess = null;
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (this.passwordSubmitting) {
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue() as {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    };
    this.passwordSubmitting = true;
    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSubmitting = false;
        this.passwordSuccess = this.translate.instant(
          'EDIT_PROFILE.PASSWORD_CHANGE.SUCCESS',
        );
        this.passwordForm.reset();
      },
      error: (err: unknown) => {
        this.passwordSubmitting = false;
        if (err instanceof HttpErrorResponse && err.status === 400) {
          this.passwordError = this.translate.instant(
            'EDIT_PROFILE.PASSWORD_CHANGE.INVALID_CURRENT',
          );
          return;
        }
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.passwordError = this.translate.instant(
            'EDIT_PROFILE.PASSWORD_CHANGE.UNAUTHORIZED',
          );
          return;
        }
        this.passwordError = this.translate.instant(
          'EDIT_PROFILE.PASSWORD_CHANGE.SERVER_ERROR',
        );
      },
    });
  }

  goToChangePlan(): void {
    this.router.navigate(['/subscription/change-plan']);
  }

  private navigateToDashboard(user: User): void {
    if (user.home) {
      void this.router.navigate([user.home]);
      return;
    }
    switch (user.plan) {
      case 'owner':
        void this.router.navigate(['/dashboard/owner']);
        break;
      case 'barista':
        void this.router.navigate(['/dashboard/barista']);
        break;
      case 'full':
        void this.router.navigate(['/dashboard/complete']);
        break;
      default:
        void this.router.navigate(['/login']);
    }
  }
}

/**
 * Validador a nivel de grupo: marca {@code passwordsMismatch} cuando la nueva contraseña y la
 * confirmación no coinciden. No falla si alguno de los dos campos está vacío para que sus
 * validadores propios (required) puedan reportar antes.
 */
function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirm = group.get('confirmNewPassword')?.value;
    if (!newPassword || !confirm) {
      return null;
    }
    return newPassword === confirm ? null : { passwordsMismatch: true };
  };
}
