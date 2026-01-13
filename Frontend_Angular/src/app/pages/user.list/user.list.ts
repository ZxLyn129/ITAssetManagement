import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interface/user.interface';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-user.list',
  imports: [CommonModule, FormsModule],
  templateUrl: './user.list.html',
  styleUrls: ['./user.list.css'],
})
export class UserList implements OnInit, AfterViewInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  isAdmin = false;

  isEditMode = false;
  currentUser: User = { id: '', userName: '', email: '', role: 'User', password: '', isTerminated: false };
  modalInstance!: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'Admin';
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('userModal');
    if (modalEl) {
      this.modalInstance = new Modal(modalEl, { backdrop: 'static', keyboard: false });
    }
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.filteredUsers = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load asset',
          confirmButtonColor: '#0d6efd'
        });
      }
    });
  }

  onSearchInput(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const roleStr = typeof u.role === 'number' ? (u.role === 0 ? 'Admin' : 'User') : u.role;
      return (
        u.userName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        roleStr.toLowerCase().includes(term)
      );
    });
  }

  // Open add user modal
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUser = {
      id: '',
      userName: '',
      email: '',
      role: 'User',
      password: '',
      isTerminated: false
    };

    // Show modal
    if (!this.modalInstance) {
      const modalEl = document.getElementById('userModal');
      if (modalEl) {
        this.modalInstance = new Modal(modalEl, { backdrop: 'static', keyboard: false });
      }
    }
    this.modalInstance.show();
  }
  openEditModal(user: User): void {
    this.isEditMode = true;
    this.currentUser = { ...user }; // copy user data
    this.currentUser.password = user.password;

    if (!this.modalInstance) {
      const modalEl = document.getElementById('userModal');
      if (modalEl) {
        this.modalInstance = new Modal(modalEl, { backdrop: 'static', keyboard: false });
      }
    }
    this.modalInstance.show();
  }

  saveUser(form: NgForm): void {
    if (!form.valid) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill all required fields with valid data.' });
      return;
    }

    // Email regex validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.currentUser.email)) {
      Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
      return;
    }

    if (!this.isEditMode) {
      // Add new user
      const payload = {
        userName: this.currentUser.userName,
        email: this.currentUser.email,
        role: this.currentUser.role === 'Admin' ? 0 : 1,
        password: 'ItAsset123',
        isTerminated: false
      };
      payload.password = 'ItAsset123';
      this.userService.createUser(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Success', text: 'User added successfully.' });
          this.modalInstance.hide();
          this.loadUsers();
        },
        error: err => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message })
      });
    } else {
      // Edit user 
      const payload = { ...this.currentUser, role: this.currentUser.role === 'Admin' ? 0 : 1 };
      this.userService.updateUser(payload.id!, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Success', text: 'User updated successfully.' });
          this.modalInstance.hide();
          this.loadUsers();
        },
        error: err => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message })
      });
    }
  }

  deleteUser(user: User): void {
    Swal.fire({
      title: `Delete user "${user.userName}"?`,
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(user.id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `User "${user.userName}" has been deleted.`,
              timer: 1500,
              showConfirmButton: false
            });
            this.loadUsers();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Failed to delete user.'
            });
          }
        });
      }
    });
  }

  exportExcel(): void {
    const search = this.searchTerm?.trim();
    this.userService.exportUsers(search).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Users_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to export users' });
      },
    });
  }
}
