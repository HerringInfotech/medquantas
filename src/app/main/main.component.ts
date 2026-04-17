import { Component, OnInit, NgModule } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ApiService } from '../shared/api/api.service';
import {
  faBars, faBox, faCubes, faList, faLock, faDollarSign, faSignOutAlt,
  faUser, faUserTie, faStar, faFolder, faPercentage, faTrademark, faWrench, faBuilding,
  faRuler, faSyncAlt, faMapMarkerAlt, faFileAlt, faLayerGroup, faTags, faPrescriptionBottleAlt,
  faUsers, faCube, faCog, faReceipt, faMoneyBillAlt, faChartBar, faIdCard, faBoxOpen, faListAlt, faArchive, faUserFriends, faClipboardList, faUserCircle, faRupeeSign, faFile, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../shared/api/common.service';
import * as _ from 'lodash';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AlertComponent } from 'ngx-bootstrap/alert/alert.component';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { PermissionService } from '../shared/permission/permission.service';
import { HttpHeaders } from '@angular/common/http';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit {
  sidebarExpanded = true;
  userRole = localStorage.getItem('role_name');
  todayYear = new Date().getFullYear();
  public gfg = false;
  current_url;
  faBars = faBars
  permissions: any[] = [];
  side_bar_open: boolean = true;
  alerts: any[] = [];
  faList = faList;
  faBox = faBox;
  faDollarSign = faDollarSign;
  faLock = faLock;
  faCubes = faCubes;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  subscriptions = [];
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  SubmenuIndex: number = -1;

  faStar = faStar;
  faFile = faFile;
  faChartLine = faChartLine;
  faFolder = faFolder;
  faPercentage = faPercentage;
  faTrademark = faTrademark;
  faWrench = faWrench;
  faBuilding = faBuilding;
  faRuler = faRuler;
  faSyncAlt = faSyncAlt;
  faMapMarkerAlt = faMapMarkerAlt;
  faFileAlt = faFileAlt;
  faLayerGroup = faLayerGroup;
  faTags = faTags;
  faPrescriptionBottleAlt = faPrescriptionBottleAlt;
  faUsers = faUsers;
  faCube = faCube;
  faCog = faCog;


  rolelist;
  faReceipt = faReceipt;
  faMoneyBillAlt = faMoneyBillAlt;
  faChartBar = faChartBar
  faUserCircle = faUserCircle
  faIdCard = faIdCard;
  faBoxOpen = faBoxOpen;
  faListAlt = faListAlt;
  faArchive = faArchive;
  faUserFriends = faUserFriends;
  faClipboardList = faClipboardList;
  faRupeeSign = faRupeeSign
  setting_data
  user: any;
  modalRef: BsModalRef;
  @ViewChild('welcomeTemplate') welcomeTemplate: TemplateRef<any>;



  menuItem: any[] = [
    {
      title: 'Bom Reports',
      icon: faReceipt,
      submenu: [
        {
          path: '/bom_generic_report',
          icon: faFile,
          title: 'Generic Wise Reports',
          permission: 'BomGenericReport.List',
        },
        {
          path: '/bom_customer_report',
          icon: faUserCircle,
          title: 'Customer Wise Reports',
          permission: 'BomCustomerReport.List',
        },
      ]
    },
    {
      title: 'Cost Reports',
      icon: faReceipt,
      submenu: [
        {
          path: '/report',
          icon: faChartBar,
          title: 'Commercial Reports',
          permission: 'Commercial.List',
        },
        {
          path: '/variance',
          icon: faMoneyBillAlt,
          title: 'Cost Wise analysis',
          permission: 'Variation.List',
        },
        {
          path: '/customer_report',
          icon: faUserCircle,
          title: 'Customer Wise analysis',
          permission: 'CustomerAnalysis.List',
        },
        {
          path: '/analysis_report',
          icon: faChartLine,
          title: 'Analysis Reports',
          permission: 'AnalysisReport.List',
        },
      ]
    },
    {
      title: 'Setup',
      icon: faCog,
      submenu: [
        {
          path: '/location',
          icon: faMapMarkerAlt,
          title: 'Location Master',
          permission: 'Location.List',
        },
        {
          path: '/licence',
          icon: faIdCard,
          title: 'Licence Master',
          permission: 'Licence.List',
        },
        {
          path: '/uom',
          icon: faRuler,
          title: 'UOM',
          permission: 'UOM.List',
        },
        {
          path: '/data_import',
          icon: faSyncAlt,
          title: 'Bulk Upload',
          permission: 'DataImport.List',
        }
      ],
      isSubMenuOpen: false,
    },
    {
      title: 'Item Master',
      icon: faCube,
      submenu: [
        {
          path: '/itemtype',
          title: 'Item Type Master (Inward)',
          icon: faBoxOpen,
          permission: 'Itemtype.List',
        },
        // {
        //   path: '/subtype',
        //   title: 'Subtype Master',
        //   icon: faListAlt,
        //   permission: 'Subtype.List',
        // },

        {
          path: '/item',
          title: 'Item Master',
          icon: faBox,
          permission: 'ItemMaster.List',
        },
        {
          path: '/price',
          title: 'Price Master',
          icon: faRupeeSign,
          permission: 'Pricemaster.List',
        }

      ],
      isSubMenuOpen: false,
    },
    {
      title: 'FG Master',
      icon: faCubes,
      submenu: [
        {
          path: '/fg_type',
          icon: faCube,
          title: 'FG Type',
          permission: 'FGtype.List',
        },
        {
          path: '/fg_Subtype',
          icon: faLayerGroup,
          title: 'FG Sub Type Master',
          permission: 'FGSubtype.List',
        },
        {
          path: '/dosage',
          icon: faPrescriptionBottleAlt,
          title: 'Dosage Specification Master',
          permission: 'Dosage.List',
        },
        {
          path: '/packtype',
          icon: faArchive,
          title: 'Pack Type Master',
          permission: 'Packtype.List',
        },
        {
          path: '/fg_master',
          title: 'FG Master',
          icon: faTrademark,
          permission: 'FGmaster.List',
        }

      ],
      isSubMenuOpen: false,
    },
    {
      title: 'Supplier / Customer Master',
      icon: faUserFriends,
      submenu: [
        {
          path: '/manufacturer',
          icon: faWrench,
          title: 'Manufacturer / Make (Inward)',
          permission: 'Manufacturer.List',
        },
        {
          path: '/supplier',
          icon: faBuilding,
          title: 'Supplier Master',
          permission: 'Supplier.List',
        },
        {
          path: '/customer',
          icon: faUser,
          title: 'Customer Master',
          permission: 'Customer.List',
        },
        {
          path: '/customer_type',
          icon: faUsers,
          title: 'Customer Type Master',
          permission: 'Customertype.List',
        },
      ],
      isSubMenuOpen: false,
    },
    {
      title: 'User & Roles',
      icon: faUser,
      submenu: [
        {
          path: '/user',
          icon: faUserTie,
          title: 'User Administration',
          permission: 'User.List',
        },
        {
          path: '/access',
          icon: faLock,
          title: 'Access Rights',
          permission: 'Access.List',
        },
        {
          path: '/module',
          icon: faCube,
          title: 'Module Access',
          permission: 'Module.List',
        },
      ],
      isSubMenuOpen: false,
    },
  ];

  private httpOptions = {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    })
  };



  constructor(public router: Router, private api: ApiService, private common: CommonService, private _snackBar: MatSnackBar, private permissionService: PermissionService, private modalService: BsModalService) {
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.current_url = evt.url.split('/');
        setTimeout(() => {
          if (localStorage.getItem('token') !== '') {
            this.checkPermission();
          }
          this.checkWelcome();
        }, 1000);
      }
    })

    this.common.delete_confirmation.subscribe(value => {
      this.open_delete_confirmation(value);
    })
  }

  toggleSubMenu(item: any, index: number) {
    if (this.SubmenuIndex === index) {
      this.SubmenuIndex = -1;
    } else {
      this.SubmenuIndex = index;
    }
  }


  showSnackBar(message: string) {
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.duration = 5000;
    snackBarConfig.horizontalPosition = this.horizontalPosition;
    snackBarConfig.verticalPosition = this.verticalPosition;
    snackBarConfig.panelClass = ['custom-snackbar'];
    this._snackBar.open(message, 'Close', snackBarConfig);
    const snackBarElement = document.querySelector('.mat-snack-bar-container') as HTMLElement;
    if (snackBarElement) {
      snackBarElement.style.zIndex = '9999';
    }
  }

  ngOnInit(): void {
    this.getsetting()
    this.get_user();
    
    // Fallback if full user object isn't loaded yet
    if (!this.user && localStorage.getItem('user_name')) {
      this.user = { name: localStorage.getItem('user_name') };
    }

    setTimeout(() => {
      if (localStorage.getItem('token') !== '') {
        this.checkPermission();
      }
      this.checkWelcome();
    }, 1000);
  }

  get_user() {
    const userId = localStorage.getItem("user_id");
    if (!userId || userId === '' || userId === 'null') return;
    
    let params = { id: userId }
    this.api.post('get_user', params).subscribe((response) => {
      if (response.data?.users?.length) {
        this.user = response.data.users[0];
      }
    })
  }

  checkWelcome() {
    if (localStorage.getItem('showWelcome') === 'true') {
      // Re-fetch name just in case
      if (!this.user?.name && localStorage.getItem('user_name')) {
        this.user = { ...this.user, name: localStorage.getItem('user_name') };
      }
      
      this.modalRef = this.modalService.show(this.welcomeTemplate, {
        class: 'modal-dialog-centered modal-lg welcome-modal-premium',
        ignoreBackdropClick: false,
        keyboard: true
      });
      localStorage.removeItem('showWelcome');
    }
  }

  @ViewChild('autoShownModal', { static: false }) confirmation_model: ModalDirective;
  is_delete_confirmation = false;
  delete_data;
  open_delete_confirmation(value): void {
    this.delete_data = value;
    this.is_delete_confirmation = true;
  }
  close_delete_confirmation(): void {
    this.delete_data = null
    this.is_delete_confirmation = false;
    this.confirmation_model.hide();
    this.cancel_delete();
  }
  onConfirmationModelHidden(): void {
    this.is_delete_confirmation = false;
    this.cancel_delete();
  }
  confirm_delete() {
    this.common.set_delete_data(this.delete_data);
    this.confirmation_model.hide();
  }

  cancel_delete() {
    this.common.set_cancel_delete_data(this.is_delete_confirmation);
  }

  toggle_sidebar() {
    this.side_bar_open = !this.side_bar_open
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter(alert => alert !== dismissedAlert);
  }

  checkPermission() {
    let params = {
      toke: localStorage.getItem('token')
    }
    this.api.post('speed', params).subscribe((response) => {
      if (response.status) {
        this.permissions = response.data?.user_access;
        this.permissions.forEach((permission) => {
          this.permissionService.addUserPermission(permission);
        });
      }
    })
  }

  hasPermission(item: any): boolean {
    return this.permissions.some(permission => permission.name === item.permission);
  }

  bomPermission(item: any): boolean {
    return this.permissions.some(permission => permission.name === item);
  }

  getsetting() {
    let params = {}
    this.api.post('get_setting', params).subscribe((response) => {
      if (response.data) {
        this.setting_data = response.data.setting[0]
      }
    })
  }

  logout() {
    this.api.logout();
    this.router.navigateByUrl('auth/login');
    this.common.alert({ msg: "User logged out successfully", type: 'success' });
  }
}
