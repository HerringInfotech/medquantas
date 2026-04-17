import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { PermissionService } from '../permission/permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private permissionService: PermissionService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const isAuthenticated = this.authService.isAuthenticated()
    if (!isAuthenticated) {
      this.router.navigate(['auth/login'])
      return false
    }

    const roleName = localStorage.getItem('role_name')?.trim().toLowerCase();
    if (roleName && roleName.includes('sale') && !state.url.startsWith('/sales') && !state.url.startsWith('/profile')) {
      this.router.navigate(['/sales']);
      return false;
    }

    const requiredPermission = next.data.permission;
    if (requiredPermission) {
      setTimeout(() => {
        if (!this.permissionService.hasPermission(requiredPermission)) {
          this.router.navigate(['error']);
        }
      }, 1500);
    }
    return true;
  }

}
