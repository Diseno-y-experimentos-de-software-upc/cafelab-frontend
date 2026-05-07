import { Component } from '@angular/core';
import { BaseFormComponent } from '../../../../shared/presentation/components/base-form.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../infrastructure/user.service';
import { Router } from '@angular/router';
import { User } from '../../../domain/model/user.entity';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../infrastructure/AuthService';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    NgIf
  ]
})
export class LoginFormComponent extends BaseFormComponent {
  loginForm: FormGroup;
  /** Mensaje del backend (p. ej. 404 + {@code MessageResource} en sign-in). */
  apiLoginError = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private translateService: TranslateService,
  ) {
    super();
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.apiLoginError = '';
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => {
          this.userService.getUserByEmail(email).subscribe({
            next: (user: User) => {
              if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                if (user.hasPlan) {
                  this.router.navigate(['login/success']);
                } else {
                  this.router.navigate(['/select-plan']);
                }
              } else {
                this.apiLoginError = this.translateService.instant('LOGIN.ERROR_PROFILE');
              }
            },
            error: (error: unknown) => {
              console.error('Error obteniendo usuario por email:', error);
              const fallback = this.translateService.instant('LOGIN.ERROR_PROFILE');
              this.apiLoginError = getUserFacingApiMessage(error, fallback, fallback);
            },
          });
        },
        error: (error: unknown) => {
          console.error('Login error:', error);
          const fallback = this.translateService.instant('LOGIN.ERROR_FAILED');
          this.apiLoginError = getUserFacingApiMessage(error, fallback, fallback);
        },
      });
    }
  }

  onRegisterBarista() {
    this.router.navigate(['/register/barista']);
  }

  onRegisterOwner() {
    this.router.navigate(['/register/owner']);
  }

}