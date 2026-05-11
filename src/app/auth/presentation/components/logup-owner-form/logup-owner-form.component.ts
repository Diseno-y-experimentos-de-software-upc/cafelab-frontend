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
  selector: 'app-logup-owner-form',
  templateUrl: './logup-owner-form.component.html',
  styleUrls: ['./logup-owner-form.component.css'],
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
export class LogupOwnerFormComponent extends BaseFormComponent {
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
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
      cafeteriaName: ['', Validators.required],
      experience: ['', Validators.required],
    });
  }

  onSubmit() {
    this.submitError = null;
    if (this.logupForm.valid) {
      const { name, email, password, cafeteriaName, experience } = this.logupForm.value;
      const newUser: User = {
        id: 0,
        name,
        email,
        password,
        role: 'owner',
        cafeteriaName,
        experience,
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
            void this.router.navigate(['/logup/owner/success']);
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