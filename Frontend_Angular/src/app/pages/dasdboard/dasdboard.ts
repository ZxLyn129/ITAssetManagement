import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dasdboard',
  imports: [CommonModule],
  templateUrl: './dasdboard.html',
  styleUrl: './dasdboard.css',
})

export class Dasdboard implements OnInit {
  dashboardData: any = {
    totalAssets: 0,
    assignedCount: 0,
    unassignedCount: 0,
    repairCount: 0,
    statusDistribution: [],
    typeDistribution: []
  };

  role:string = '';

  cards: any[] = [];

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.role = user.role;

    this.loadDashboard(this.role);
  }

  loadDashboard(role: string) {
    this.assetService.getDashboardData().subscribe(data => {
      this.dashboardData = data;

      if (role === 'Admin') {
        this.cards = [
          { title: 'Total Assets', value: data.totalAssets, icon: 'bi-box-seam', color: 'primary' },
          { title: 'Assigned', value: data.assignedCount, icon: 'bi-person-check', color: 'success' },
          { title: 'Unassigned', value: data.unassignedCount, icon: 'bi-person-x', color: 'warning' },
          { title: 'Needs Repair', value: data.repairCount, icon: 'bi-wrench-adjustable', color: 'danger' }
        ];
      } else {
        // Filter user-related stats only
        const inUseCount = data.statusDistribution.find((x: any) => x.status === 0)?.count || 0;
        const repairCount = data.statusDistribution.find((x: any) => x.status === 2)?.count || 0;
        const warrantyCount = data.statusDistribution.find((x: any) => x.status === 9)?.count || 0;

        this.cards = [
          { title: 'My Assets', value: data.totalAssets, icon: 'bi-box-seam', color: 'primary' },
          { title: 'In Use', value: inUseCount, icon: 'bi-play-circle', color: 'success' },
          { title: 'Needs Repair', value: repairCount, icon: 'bi-wrench-adjustable', color: 'warning' },
          { title: 'Warranty Claim', value: warrantyCount, icon: 'bi-shield-check', color: 'info' }
        ];
      }

      // Draw charts
      this.renderStatusChart();
      this.renderTypeChart();

      this.cd.detectChanges();
    });
  }

  // Charts
  renderStatusChart() {
    let filteredStatuses = this.dashboardData.statusDistribution;

    if (this.role !== 'Admin') {
      const allowedStatuses = [0, 2, 3, 7, 8, 9];
      filteredStatuses = filteredStatuses.filter((x: any) => allowedStatuses.includes(x.status));
    }


    const statusLabels = filteredStatuses.map((x: any) => this.statusText(x.status));
    const statusData = filteredStatuses.map((x: any) => x.count);
    const statusColors = filteredStatuses.map((x: any) => this.statusColor(x.status));

    new Chart('statusChart', {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: statusData,
          backgroundColor: statusColors,
          hoverOffset: 5
        }]
      },
      options: {
        cutout: '50%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 20, padding: 15 } },
          tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw}` } }
        }
      }
    });
  }

  renderTypeChart() {
    const typeLabels = this.dashboardData.typeDistribution.map((x: any) => this.capitalize(x.type));
    const typeData = this.dashboardData.typeDistribution.map((x: any) => x.count);
    const typeColors = this.generateColors(typeData.length);

    new Chart('typeChart', {
      type: 'bar',
      data: {
        labels: typeLabels,
        datasets: [{
          label: 'Assets by Type',
          data: typeData,
          backgroundColor: typeColors
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  // Helpers
  statusText(status: number): string {
    const map: any = {
      0: 'In Use', 1: 'Available', 2: 'Repair', 3: 'Damaged', 4: 'Reserved',
      5: 'Retired', 6: 'Disposed', 7: 'Lost', 8: 'Stolen', 9: 'Warranty Claim'
    };
    return map[status] || 'Unknown';
  }

  statusColor(status: number): string {
    const map: any = {
      0: '#4caf50', // InUse
      1: '#2196f3', // Available
      2: '#ff9800', // Repair
      3: '#f44336', // Damaged
      4: '#9c27b0', // Reserved
      5: '#9e9e9e', // Retired
      6: '#212529', // Disposed
      7: '#E7D321FF', // Lost
      8: '#991010FF', // Stolen
      9: '#00bcd4'  // WarrantyClaim
    };
    return map[status] || '#cccccc';
  }

  capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateColors(count: number) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${i * (360 / count)}, 70%, 50%)`);
    }
    return colors;
  }
}
