import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Asset } from '../../interface/asset.interface';

@Component({
  selector: 'app-disposed-asset.list',
  imports: [CommonModule, FormsModule],
  templateUrl: './disposed-asset.list.html',
  styleUrl: './disposed-asset.list.css',
})
export class DisposedAssetList implements OnInit {

  disposedAssets: any[] = [];
  filteredAssets: any[] = [];
  searchTerm: string = '';

  constructor(private assetService: AssetService, private cd: ChangeDetectorRef, private router: Router,) { }

  ngOnInit(): void {
    this.loadDisposedAssets();
  }

  loadDisposedAssets() {
    this.assetService.getDisposedAssets(this.searchTerm).subscribe({
      next: (res) => {
        this.disposedAssets = res;
        this.filteredAssets = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Failed to load disposed assets', 'error');
      }
    });
  }

  onSearchInput() {
    const term = this.searchTerm.toLowerCase();
    this.filteredAssets = this.disposedAssets.filter(a =>
      (a.name?.toLowerCase().includes(term) ?? false) ||
      (a.type?.toLowerCase().includes(term) ?? false) ||
      (a.remarks?.toLowerCase().includes(term) ?? false)
    );
  }

  goBack() {
    this.router.navigate(['/admin/asset-list']);
  }

    openDetails(asset: Asset) {
      this.router.navigate([`/admin/asset-details`, asset.id]);
    }
}