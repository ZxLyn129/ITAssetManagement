import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule,
    RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  @Input() user: any;
  role: string = 'User';

  constructor(private router: Router, private authService: AuthService, private location: Location) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user.role == 'Admin') {
      this.role = 'Admin'
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['']);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load asset',
          confirmButtonColor: '#0d6efd'
        });
        // Still redirect user
        this.location.back();
      }
    });
  }

}
