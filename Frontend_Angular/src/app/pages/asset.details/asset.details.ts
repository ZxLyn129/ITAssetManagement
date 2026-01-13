import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asset.details',
  imports: [CommonModule],
  templateUrl: './asset.details.html',
  styleUrl: './asset.details.css',
})
export class AssetDetails implements OnInit {

  asset: any = {};
  logs: any[] = [];
  isAdmin: boolean = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private assetService: AssetService,
    private authService: AuthService,
    private location: Location
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'Admin';

    const assetId = this.route.snapshot.paramMap.get('id');
    if (assetId) {
      this.loadAsset(assetId);
    }
  }

  loadAsset(id: string) {
    this.assetService.getAssetDetails(id).subscribe({
      next: res => {
        this.asset = res.asset;
        const statusObj = this.statusMap[this.asset.status] || { text: this.asset.status, color: 'secondary' };
        this.asset.statusText = statusObj.text;
        this.asset.statusColor = statusObj.color;

        this.logs = res.logs || [];
        this.cd.detectChanges();
      },
      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load asset details',
          confirmButtonColor: '#0d6efd'
        });
        this.router.navigate(['/asset-list']);
      }
    });
  }

  goBack() {
    this.location.back();
  }

}

