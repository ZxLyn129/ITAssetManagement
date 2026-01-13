import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from "../sidebar/sidebar";
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard.layout',
  imports: [
    CommonModule,
    RouterModule,      
    Sidebar,
  ],
  templateUrl: './dashboard.layout.html',
  styleUrl: './dashboard.layout.css',
})
export class DashboardLayout {
  user: any;

  constructor(private authService: AuthService) {
    this.user = this.authService.getCurrentUser();
  }
}
