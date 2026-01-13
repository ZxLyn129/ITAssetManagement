import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';
import { AssetsList } from './pages/assets.list/assets.list';
import { DashboardLayout } from './pages/dashboard.layout/dashboard.layout';
import { AssetDetails } from './pages/asset.details/asset.details';
import { AssetForm } from './pages/asset.form/asset.form';
import { DisposedAssetList } from './pages/disposed-asset.list/disposed-asset.list';
import { Dasdboard } from './pages/dasdboard/dasdboard';
import { UserList } from './pages/user.list/user.list';


export const routes: Routes = [
  { path: '', component: Login },
  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [AuthGuard],
    data: { role: 'Admin' },
    children: [
      { path: 'asset-list', component: AssetsList },
      { path: 'asset-details/:id', component: AssetDetails },
      { path: 'asset-form', component: AssetForm },        
      { path: 'asset-form/:id', component: AssetForm },    
      { path: 'disposed-asset', component: DisposedAssetList },
      { path: 'dashboard', component: Dasdboard },
      { path: 'user-list', component: UserList }
    ]
  },

  {
    path: 'user',
    component: DashboardLayout,
    canActivate: [AuthGuard],
    data: { role: 'User' },
    children: [
      { path: 'asset-list', component: AssetsList },
      { path: 'asset-details/:id', component: AssetDetails },
        { path: 'dashboard', component: Dasdboard }
    ]
  },
];
