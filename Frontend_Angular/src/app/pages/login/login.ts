import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';

  changePasswordData = { username: '', oldPassword: '', newPassword: '', confirmPassword: '' };
  changePasswordModal!: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  onSubmit(loginForm: any) {
    if (!loginForm.valid) return;

    this.errorMessage = '';
    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: (res) => {
          if (res.success && res.user) {
            // Navigate to dashboard
            if (res.user.role === 'Admin') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/user']);
            }
          } else {
            this.errorMessage = res.message || 'Login failed.';
            this.cd.detectChanges();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Invalid credentials.';
          this.cd.detectChanges();
        }
      });
  }

  openChangePasswordModal(event: Event) {
    event.preventDefault();
    const modalEl = document.getElementById('changePasswordModal');
    if (modalEl) {
      this.changePasswordModal = new Modal(modalEl, { backdrop: 'static', keyboard: false });
      this.changePasswordModal.show();
    }
  }

  submitChangePassword(form: any) {
    if (!form.valid) return;

    if (this.changePasswordData.newPassword !== this.changePasswordData.confirmPassword) {
      Swal.fire('Error', 'New password and confirm password do not match', 'error');
      return;
    }

    // Password style validation: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(this.changePasswordData.newPassword)) {
      Swal.fire('Error', 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character', 'error');
      return;
    }

    this.authService.changePassword(this.changePasswordData).subscribe({
      next: (res) => {
        Swal.fire('Success', res.message || 'Password changed successfully', 'success');
        this.changePasswordModal.hide();
        this.changePasswordData = { username: '', oldPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'Failed to change password', 'error');
      }
    });
  }
}