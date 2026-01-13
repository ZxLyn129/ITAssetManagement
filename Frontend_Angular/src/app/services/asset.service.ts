import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Asset } from '../interface/asset.interface';
import { AssetDetails } from '../interface/assetDetails.interface';

@Injectable({
    providedIn: 'root'
})
export class AssetService {
    private apiUrl = 'https://localhost:7069/api/Asset';

    constructor(private http: HttpClient, private authService: AuthService) { }

    getAssets(search?: string): Observable<Asset[]> {
        let params = new HttpParams();
        if (search) params = params.set('search', search);
        const headers = this.authService.getUserHeaders();
        return this.http.get<Asset[]>(this.apiUrl, { params, headers });
    }

    getDisposedAssets(search?: string): Observable<Asset[]> {
        let params = new HttpParams();
        if (search) params = params.set('search', search);

        const headers = this.authService.getUserHeaders();
        return this.http.get<Asset[]>(`${this.apiUrl}/disposed`, { params, headers });
    }


    getAssetDetails(id: string): Observable<AssetDetails> {
        const headers = this.authService.getUserHeaders();
        return this.http.get<AssetDetails>(`${this.apiUrl}/${id}`, { headers });
    }

    getAssignableUsers(): Observable<any[]> {
        const headers = {
            'x-user-id': this.authService.getCurrentUser()?.id,
            'x-user-role': this.authService.getCurrentUser()?.role
        };
        return this.http.get<any[]>(`${this.apiUrl}/assignable-users`, { headers });
    }

    getAssetById(id: string): Observable<Asset> {
        const headers = this.authService.getUserHeaders();
        return this.http.get<Asset>(`${this.apiUrl}/getById/${id}`, { headers });
    }

    createAsset(asset: Asset): Observable<Asset> {
        const headers = this.authService.getUserHeaders();
        return this.http.post<Asset>(this.apiUrl, asset, { headers });
    }

    updateAsset(id: string, asset: Asset): Observable<Asset> {
        const headers = this.authService.getUserHeaders();
        return this.http.put<Asset>(`${this.apiUrl}/${id}`, asset, { headers });
    }

    deleteAsset(id: string, reason: string, remark: string): Observable<any> {
        const params = new HttpParams()
            .set('reason', reason || '')
            .set('remark', remark || '');
        const headers = this.authService.getUserHeaders();
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, params });
    }

    exportToExcel(search?: string): Observable<Blob> {
        const headers = this.authService.getUserHeaders();
        let params = new HttpParams();
        if (search) params = params.set('search', search);
        return this.http.get(`${this.apiUrl}/export`, { headers, params, responseType: 'blob' });
    }

    getDashboardData(): Observable<any> {
        const headers = this.authService.getUserHeaders();
        return this.http.get(`${this.apiUrl}/dashboard`, { headers });
    }
}

