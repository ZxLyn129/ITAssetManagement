import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    userName: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7069/api/Auth';
  private currentUser: any = null;

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch {
        this.currentUser = null;
        localStorage.removeItem('user');
      }
    }
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser = res.user;
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): Observable<any> {
    this.currentUser = null;
    localStorage.removeItem('user');
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  getCurrentUser(): { id: string, role: string } {
    if (!this.currentUser) {
      this.loadUserFromStorage();
    }
    return this.currentUser || { id: '00000000-0000-0000-0000-000000000000', role: 'User' };
  }

  getUserHeaders(): HttpHeaders {
    const user = this.getCurrentUser();
    let headers = new HttpHeaders();
    headers = headers.set('X-User-Id', user.id);
    headers = headers.set('X-User-Role', user.role);

    return headers;
  }

  changePassword(data: { username: string, oldPassword: string, newPassword: string, confirmPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }
}
