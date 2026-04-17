import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissions: string[] = [];

  constructor() {
    this.loadUserPermissions();
  }

  private loadUserPermissions() {
    this.userPermissions = [];
  }


  hasPermission(item: any): boolean {
    return this.userPermissions.some(permission => permission['name'] === item);
  }


  addUserPermission(permission: string) {
    if (!this.userPermissions.includes(permission)) {
      this.userPermissions.push(permission);
    }
  }

  removeUserPermission(permission: string) {
    const index = this.userPermissions.indexOf(permission);
    if (index !== -1) {
      this.userPermissions.splice(index, 1);
    }
  }
}
