import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asset.form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset.form.html',
  styleUrls: ['./asset.form.css'],
})
export class AssetForm implements OnInit {

  @Input() asset: any = {};
  @Output() formSubmitted = new EventEmitter<void>();

  isEditMode: boolean = false;
  users: any[] = [];
  statusOptions = [
    { value: 0, text: 'In Use' },
    { value: 1, text: 'Available' },
    { value: 2, text: 'Repair' },
    { value: 3, text: 'Damaged' },
    { value: 4, text: 'Reserved' },
    { value: 5, text: 'Retired' },
    { value: 6, text: 'Disposed' },
    { value: 7, text: 'Lost' },
    { value: 8, text: 'Stolen' },
    { value: 9, text: 'Warranty Claim' }
  ];

  constructor(
    private assetService: AssetService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadAssetById();
  }

  loadUsers() {
    // load list of users for assignment dropdown
    this.assetService.getAssignableUsers().subscribe({
      next: res => {
        this.users = res;
        this.cd.detectChanges();
      },

      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load users',
          confirmButtonColor: '#0d6efd'
        });
      }
    });
  }

  loadAssetById() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.assetService.getAssetById(id).subscribe({
        next: (res: any) => {
          // Format dates so they show in <input type="date">
          if (res.purchaseDate) {
            res.purchaseDate = res.purchaseDate.split('T')[0];
          }
          if (res.warrantyExpiry) {
            res.warrantyExpiry = res.warrantyExpiry.split('T')[0];
          }

          this.asset = res;
          this.cd.detectChanges();
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to load asset',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
    } else {
      this.isEditMode = false;
      this.asset = {
        name: '',
        type: '',
        status: null,
        assignedTo: null,
        purchaseDate: '',
        warrantyExpiry: '',
        remarks: ''
      };
    }
  }

  submitForm() {
    const payload = { ...this.asset };

    payload.status = Number(payload.status);
    payload.purchaseDate = payload.purchaseDate ? new Date(payload.purchaseDate).toISOString() : new Date().toISOString();
    payload.warrantyExpiry = payload.warrantyExpiry ? new Date(payload.warrantyExpiry).toISOString() : new Date().toISOString();

    if (this.isEditMode) {
      this.assetService.updateAsset(payload.id, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Asset updated successfully',
            confirmButtonColor: '#0d6efd'
          }).then(() => this.router.navigate(['/admin/asset-list']));
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to update asset',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
    } else {
      this.assetService.createAsset(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Asset created successfully',
            confirmButtonColor: '#0d6efd'
          }).then(() => this.router.navigate(['/admin/asset-list']));
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to create asset',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
    }
  }

  closeForm() {
    this.router.navigate(['/admin/asset-list']);
  }
}
