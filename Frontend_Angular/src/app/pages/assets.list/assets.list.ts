import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';
import { Asset } from '../../interface/asset.interface';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-assets.list',
  imports: [CommonModule, FormsModule],
  templateUrl: './assets.list.html',
  styleUrl: './assets.list.css',
})
export class AssetsList implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  searchTerm: string = '';
  isAdmin: boolean = false;
  private searchChanged = new Subject<string>();

  statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: 'In Use', color: '#4caf50' },       // InUse
    1: { text: 'Available', color: '#2196f3' },   // Available
    2: { text: 'Repair', color: '#ff9800' },      // Repair
    3: { text: 'Damaged', color: '#f44336' },     // Damaged
    4: { text: 'Reserved', color: '#9c27b0' },    // Reserved
    5: { text: 'Retired', color: '#9e9e9e' },     // Retired
    6: { text: 'Disposed', color: '#212529' },    // Disposed
    7: { text: 'Lost', color: '#E7D321FF' },        // Lost
    8: { text: 'Stolen', color: '#991010FF' },      // Stolen
    9: { text: 'Warranty Claim', color: '#00bcd4' } // WarrantyClaim
  };

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isAdmin = user.role === 'Admin';

    // debounce search input so we don’t hit the API on every keystroke
    this.searchChanged
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => this.loadAssets(term));

    // load first time (no search)
    this.loadAssets();
  }

  onSearchInput() {
    this.searchChanged.next(this.searchTerm.trim());
  }

  loadAssets(search: string = '') {
    this.assetService.getAssets(search).subscribe({
      next: (res) => {
        this.assets = res.map((a) => {
          const statusObj =
            this.statusMap[a.status as number] || {
              text: a.status,
              color: 'secondary',
            };
          return {
            ...a,
            statusText: statusObj.text,
            statusColor: statusObj.color,
          };
        });
        this.filteredAssets = this.assets;
        this.cd.detectChanges();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load assets',
          confirmButtonColor: '#0d6efd'
        });
      },
    });
  }

  openDetails(asset: Asset) {
    const role = this.isAdmin ? 'admin' : 'user';
    this.router.navigate([`/${role}/asset-details`, asset.id]);
  }

  exportExcel() {
    const search = this.searchTerm?.trim();
    this.assetService.exportToExcel(search).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Assets_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to export assets',
          confirmButtonColor: '#0d6efd'
        });
      }
    });
  }

  openCreateModal() {
    if (!this.isAdmin) return;
    this.router.navigate(['/admin/asset-form']); // create page
  }

  openDisposed() {
    if (!this.isAdmin) return;
    this.router.navigate(['/admin/disposed-asset']);
  }

  openEditModal(asset: any) {
    if (!this.isAdmin) return;
    this.router.navigate(['/admin/asset-form', asset.id]); // edit page
  }

  deleteAsset(asset: any) {
    if (!this.isAdmin) return;

    Swal.fire({
      title: `Dispose "${asset.name}"?`,
      html: `
      <input id="remark" class="swal2-input" placeholder="Remark (optional)">
      <input id="reason" class="swal2-input" placeholder="Reason for deletion" required>
    `,
      showCancelButton: true,
      confirmButtonText: 'Dispose',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLInputElement)?.value.trim();
        const remark = (document.getElementById('remark') as HTMLInputElement)?.value.trim();
        if (!reason) {
          Swal.showValidationMessage('Reason is required');
        }
        return { reason, remark };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { reason, remark } = result.value;

        this.assetService.deleteAsset(asset.id, reason, remark).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `"${asset.name}" has been deleted.`,
              confirmButtonColor: '#0d6efd'
            }).then(() => this.loadAssets());
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to delete asset',
              confirmButtonColor: '#0d6efd'
            });
          }
        });
      }
    });
  }
}
