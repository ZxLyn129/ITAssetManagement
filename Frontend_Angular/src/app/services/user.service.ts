import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../interface/user.interface';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://localhost:7069/api/User';

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): HttpHeaders {
        const user = this.authService.getCurrentUser();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'x-user-role': user?.role || ''
        });
    }

    getUsers(search?: string): Observable<User[]> {
        const headers = this.getHeaders();

        let params = new HttpParams();
        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<User[]>(this.apiUrl, { headers, params });
    }


    getUserById(id: string): Observable<User> {
        const headers = this.getHeaders();
        return this.http.get<User>(`${this.apiUrl}/${id}`, { headers });
    }

    createUser(user: User): Observable<any> {
        const headers = this.getHeaders();
        return this.http.post<any>(this.apiUrl, user, { headers });
    }

    updateUser(id: string, user: User): Observable<any> {
        const headers = this.getHeaders();
        return this.http.put<any>(`${this.apiUrl}/${id}`, user, { headers });
    }

    deleteUser(id: string): Observable<any> {
        const headers = this.getHeaders();
        return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
    }

    exportUsers(search?: string): Observable<Blob> {
        const headers = this.getHeaders();
        let params = new HttpParams();
        if (search) params = params.set('search', search);
        return this.http.get(`${this.apiUrl}/export`, { headers, params, responseType: 'blob' });
    }

    downloadUsersExcel(): void {
        this.exportUsers().subscribe((blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Users_${new Date().toISOString().slice(0, 19)}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        });
    }
}