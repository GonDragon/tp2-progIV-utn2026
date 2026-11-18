import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/loading/loading').then((m) => m.Loading),
  },
  {
    path: 'loading',
    loadComponent: () => import('./pages/loading/loading').then((m) => m.Loading),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'publicaciones',
    loadComponent: () => import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'publicacion',
    loadComponent: () => import('./pages/publicacion/publicacion').then((m) => m.Publicacion),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
  },
  {
    path: 'perfil/:usuario',
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
  },
  {
    path: 'panel-de-control',
    loadComponent: () => import('./pages/panel-de-control/panel-de-control').then((m) => m.PanelDeControl),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
