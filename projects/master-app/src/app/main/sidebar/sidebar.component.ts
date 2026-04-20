import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import {
  faThLarge,
  faClipboardList,
  faFileInvoiceDollar,
  faChartLine,
  faLayerGroup,
  faDatabase,
  faBoxes,
  faTags,
  faSitemap,
  faIndustry,
  faArchive,
  faSyncAlt,
  faUserClock,
  faUsersCog,
  faUserCheck,
  faKey,
  faSlidersH,
  faBell,
  faDoorOpen,
  faAngleDown,
  faAngleUp,
  faSignOutAlt,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../../shared/permission/permission.service';
import { NavigationEnd, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() isExpanded: boolean = false;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();

  handleSidebarToggle() {
    this.isExpanded = !this.isExpanded;
    this.toggleSidebar.emit(this.isExpanded);
  }

  setting_data;
  faBars = faBars;
  faAngleDown = faAngleDown;
  faAngleUp = faAngleUp;
  permissions: any[] = [];
  current_url;
  faSignOutAlt = faSignOutAlt;
  faSyncAlt = faSyncAlt;
  faDoorOpen = faDoorOpen;

  constructor(
    private common: CommonService,
    private api: ApiService,
    public router: Router,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.current_url = evt.url.split('/');
        setTimeout(() => {
          if (localStorage.getItem('token') !== '') {
            this.checkPermission();
          }
        }, 1000);
      }
    });
    this.common.toggle_sidebar.subscribe((value) => {
      this.handleSidebarToggle();
    });
  }

  ngOnInit(): void {
    this.getsetting();
    setTimeout(() => {
      if (localStorage.getItem('token') !== '') {
        this.checkPermission();
      }
    }, 1000);
  }

  getsetting() {
    let params = {};
    this.api.post('get_setting', params).subscribe((response) => {
      if (response.data) {
        this.setting_data = response.data.setting[0];
      }
    });
  }

  isActiveMenu(item: any): boolean {
    const currentPath = '/' + this.current_url[1];
    if (item.path) {
      if (item.path == currentPath.trim()) {
        return true;
      }
    } else if (item.submenu && item.submenu.length) {
      const hasMatchingSubItem = item.submenu.some(
        (subItem) => subItem.path === currentPath
      );
      if (hasMatchingSubItem) {
        item.isSubMenuOpen = true;
      }
      return hasMatchingSubItem;
    }
    return false;
  }

  isActiveMenuItem(item: any): boolean {
    const currentPath = '/' + this.current_url[1];
    return item.path === currentPath;
  }

  checkPermission() {
    let params = {
      toke: localStorage.getItem('token'),
    };
    this.api.post('speed', params).subscribe((response) => {
      if (response.status) {
        this.permissions = response.data?.user_access;
        this.permissions.forEach((permission) => {
          this.permissionService.addUserPermission(permission);
        });
      }
    });
  }

  toggleSubMenu(item: any) {
    if (item.submenu && item.submenu.length) {
      this.menuItem.forEach((menu) => {
        if (menu !== item && menu.submenu && menu.submenu.length) {
          menu.isSubMenuOpen = false;
        }
      });
      item.isSubMenuOpen = !item.isSubMenuOpen;
    }
    this.cdr.detectChanges();
  }

  goHome() {
    const roleName = localStorage.getItem('role_name')?.trim().toLowerCase();
    console.log(roleName);
    if (roleName && roleName.includes('sale')) {
      this.router.navigateByUrl('/sales');
    } else {
      this.router.navigateByUrl('/');
    }
  }

  logout() {
    this.api.logout();
    this.router.navigateByUrl('auth/login');
  }

  hasPermission(item: any): boolean {
    const roleName = localStorage.getItem('role_name')?.trim().toLowerCase();
    if (roleName && roleName.includes('sale')) {
      return (item.path && item.path.includes('sales')) || (item.path && item.path.includes('profile'));
    }
    if (this.permissions) {
      return this.permissions.some(
        (permission) =>
          permission.name === item.permission && permission.isSelected
      );
    }
    this.cdr.detectChanges();
    return false;
  }

  hasPermissionMenu(item: any): boolean {
    const roleName = localStorage.getItem('role_name')?.trim().toLowerCase();
    if (roleName && roleName.includes('sale')) {
      return (item.path && item.path.includes('sales')) || (item.path && item.path.includes('profile'));
    }
    if (this.permissions) {
      if (item.submenu) {
        for (let data of item.submenu) {
          var val = this.permissions.some(
            (permission) =>
              permission.name === data.permission && permission.isSelected
          );
          if (val) {
            return true;
          }
        }
        return false;
      } else {
        return this.permissions.some(
          (permission) =>
            permission.name === item.permission && permission.isSelected
        );
      }
    }
    this.cdr.detectChanges();
    return false;
  }

  menuItem: any[] = [
    {
      path: '/',
      icon: faThLarge,
      title: 'Dashboard',
      permission: 'BOM.List',
    },
    {
      path: '/bom',
      icon: faClipboardList,
      title: 'Bill of Material',
      permission: 'BOM.List',
    },
    {
      path: '/costsheet',
      icon: faFileInvoiceDollar,
      title: 'Cost Sheet',
      permission: 'CostSheet.List',
    },
    {
      path: '/sales',
      icon: faChartLine,
      title: 'Sales Sheet',
      permission: 'SaleSheet.List',
    },
    // {
    //   path: '/type',
    //   title: 'Type Master',
    //   icon: faLayerGroup,
    //   permission: 'ItemTypeMaster.List',
    // },
    {
      path: '/migration',
      title: 'Data Migration',
      icon: faDatabase,
      permission: 'ItemMaster.List',
    },
    {
      path: '/item',
      title: 'Item Master',
      icon: faBoxes,
      permission: 'ItemMaster.List',
    },
    {
      path: '/price',
      title: 'Price Master',
      icon: faTags,
      permission: 'Pricemaster.List',
    },
    // {
    //   path: '/group',
    //   title: 'Item Group Master',
    //   icon: faSitemap,
    //   permission: 'Groupmaster.List',
    // },
    // {
    //   path: '/fg_master',
    //   title: 'FG Master',
    //   icon: faIndustry,
    //   permission: 'FGmaster.List',
    // },
    {
      path: '/pack',
      icon: faArchive,
      title: 'Pack Master',
      permission: 'Packmaster.List',
    },
    {
      path: '/conversionfactor',
      icon: faSyncAlt,
      title: 'Conversion Factor Master',
      permission: 'ConversionFactorMaster.List',
    },
    {
      path: '/user-activity',
      icon: faUserClock,
      title: 'User Activity',
      permission: 'ActivityLogs.List',
    },
    {
      title: 'User & Roles',
      icon: faUsersCog,
      submenu: [
        {
          path: '/user',
          icon: faUserCheck,
          title: 'User Administration',
          permission: 'User.List',
        },
        {
          path: '/access',
          icon: faKey,
          title: 'Access Rights',
          permission: 'Access.List',
        },
        {
          path: '/module',
          icon: faSlidersH,
          title: 'Module Access',
          permission: 'Module.List',
        },
        {
          path: '/setting',
          icon: faBell,
          title: 'Daily Alert Settings',
          permission: 'Setting.List',
        },
      ],
      isSubMenuOpen: false,
    },
  ];
}