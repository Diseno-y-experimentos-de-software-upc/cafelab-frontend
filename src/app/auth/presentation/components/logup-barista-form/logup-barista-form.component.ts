import { Component } from '@angular/core';
import { BaseFormComponent } from '../../../../shared/presentation/components/base-form.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../infrastructure/user.service';
import {
  classifyLogupRegistrationError,
  type LogupRegistrationError,
} from '../../../infrastructure/resolve-logup-api-error';
import { AuthService } from '../../../infrastructure/AuthService';
import { Router } from '@angular/router';
import { User } from '../../../domain/model/user.entity';
import {NgClass, NgIf} from '@angular/common';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-logup-barista-form',
  templateUrl: './logup-barista-form.component.html',
  styleUrls: ['./logup-barista-form.component.css'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    NgIf,
    NgClass
  ]
})
export class LogupBaristaFormComponent extends BaseFormComponent {
  logupForm: FormGroup;
  submitError: LogupRegistrationError | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    super();
    this.logupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/)]],
      experience: ['', Validators.required],
    });
  }

  onSubmit() {
    this.submitError = null;
    if (this.logupForm.valid) {
      const { name, email, password, experience } = this.logupForm.value;
      const newUser: User = {
        id: 0,
        name,
        email,
        password,
        experience,
        role: 'barista',
        cafeteriaName: '',
        profilePicture: '',
        paymentMethod: '',
        isFirstLogin: true,
        plan: '',
        hasPlan: false
      };

      this.userService
        .createProfile(newUser)
        .pipe(
          switchMap((user: User) =>
            this.authService.login(email, password).pipe(map(() => user)),
          ),
        )
        .subscribe({
          next: (user: User) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            void this.router.navigate(['/logup/barista/success']);
          },
          error: (error: unknown) => {
            this.submitError = classifyLogupRegistrationError(error);
          },
        });
    }
  }

  selectExperience(experience: string): void {
    this.logupForm.get('experience')?.setValue(experience);
  }
}