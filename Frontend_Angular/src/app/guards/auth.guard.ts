// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router, private location: Location) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const user = this.authService.getCurrentUser();

        if (!user) {
            // Not logged in
            this.router.navigate(['']);
            return false;
        }

        const requiredRole = route.data['role'];

        if (requiredRole && user.role !== requiredRole) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You do not have permission to access this page.',
                confirmButtonColor: '#0d6efd'
            }).then(() => {
                if (window.history.length > 1) {
                    this.location.back();
                } else {
                    this.router.navigate(['']);
                }
            });
            return false;
        }

        return true; // User is logged in and has permission
    }
}
