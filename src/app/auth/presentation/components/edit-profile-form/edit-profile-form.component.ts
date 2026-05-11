import { Component, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../../../shared/presentation/components/base-form.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../infrastructure/user.service';
import { Router } from '@angular/router';
import { User } from '../../../domain/model/user.entity';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-edit-profile-form',
  templateUrl: './edit-profile-form.component.html',
  styleUrls: ['./edit-profile-form.component.css'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
  ]
})
export class EditProfileFormComponent extends BaseFormComponent implements OnInit {
  editProfileForm: FormGroup;
  currentUser: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    super();
    this.editProfileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cafeteriaName: [''],
    });
  }

  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser) as User;
      this.editProfileForm.patchValue({
        name: this.currentUser.name || '',
        email: this.currentUser.email || '',
        cafeteriaName: this.currentUser.cafeteriaName || '',
      });
      this.syncCafeteriaFieldState();
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

  
  continueToSelectPlan(): void {
    if (!this.currentUser) {
      return;
    }
    this.syncCafeteriaFieldState();
    if (!this.editProfileForm.valid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }
    const raw = this.editProfileForm.getRawValue() as {
      name: string;
      email: string;
      cafeteriaName: string;
    };
    const isBarista = this.currentUser.role === 'barista';
    const isFullPlan = this.currentUser.plan === 'full';
    const cafeteriaName =
      isBarista && !isFullPlan ? '' : (raw.cafeteriaName || '').trim();

    const updatedUser: User = {
      ...this.currentUser,
      name: raw.name.trim(),
      email: raw.email.trim(),
      cafeteriaName,
      experience: this.currentUser.experience,
      isFirstLogin: false,
    };

    this.userService.updateProfile(this.currentUser.id, updatedUser).subscribe({
      next: (apiUser: User) => {
        const merged = this.userService.mergeProfileResponse(this.currentUser!, apiUser);
        this.currentUser = merged;
        localStorage.setItem('currentUser', JSON.stringify(merged));
        this.syncCafeteriaFieldState();
        const planChosen = !!(merged.plan && String(merged.plan).length > 0);
        const next = planChosen ? '/subscription/confirm-plan' : '/subscription/select-plan';
        void this.router.navigate([next]);
      },
      error: (error: unknown) => {
        console.error('Update profile error:', error);
      },
    });
  }
}