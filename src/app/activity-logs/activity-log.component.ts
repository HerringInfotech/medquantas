import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import {
  faCalculator,
  faBoxes,
  faSearch,
  faTag,
  faCubes,
  faTruckLoading,
  faBoxOpen,
  faUserClock,  
  faUserShield, 
  faCogs 
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-logs',
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent implements OnInit {
  logs: any[] = [];
  loading = false;
  selectedTab = 'ItemLogs';
  search = '';
  selectedAction = '';
  faSearch = faSearch;
  user_list;
  pagination_data;
  selecteduser = '';
  role_data;
  logSections = [];

  // logSections = [
  //   { key: 'ItemLogs', label: 'Item Logs', icon: faCubes },
  //   { key: 'PriceLogs', label: 'Price Logs', icon: faTag },
  //   { key: 'CostLogs', label: 'Cost Logs', icon: faCalculator },
  //   { key: 'BomLogs', label: 'BOM Logs', icon: faBoxes },
  //   { key: 'FGLogs', label: 'FG Logs', icon: faBoxOpen  },
  //   { key: 'UserLogs', label: 'User Logs', icon: faBoxOpen  },
  //   { key: 'RoleLogs', label: 'Role Logs', icon: faBoxOpen  },
  //   { key: 'ModuleLogs', label: 'Module Logs', icon: faBoxOpen  },
  // ];

  actions = ['Create', 'Update', 'Delete', 'Export', 'StatusChange'];

  constructor(private api: ApiService, private common: CommonService) {
    this.common.change_page.subscribe((data) => {
      if (data.section === 'activitylogs') {
        this.fetchLogs(this.selectedTab, data.page);
      }
    });
  }

  ngOnInit() {
    
    this.fetchLogs(this.selectedTab);
    this.get_user();
    this.get_role();
  }

  get_user() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user_list = response.data.users;
    });
  }

  // get_user() {
  //   let params = {
  //     id: localStorage.getItem('user_id'),
  //   };
  //   this.api.post('get_user', params).subscribe((response) => {
  //     this.user = response.data?.users[0];
  //   });
  // }

   get_role() {
  let params = {
    id: localStorage.getItem('id'),
  };
  this.api.post('get_role', params).subscribe((response) => {
    this.role_data = response.data.roles[0];

    this.updateLogSectionsBasedOnRole();
  });
}



  updateLogSectionsBasedOnRole() {
  const baseSections = [
    { key: 'ItemLogs', label: 'Item Logs', icon: faCubes },
    { key: 'PriceLogs', label: 'Price Logs', icon: faTag },
    { key: 'CostLogs', label: 'Cost Logs', icon: faCalculator },
    { key: 'BomLogs', label: 'BOM Logs', icon: faBoxes },
    { key: 'FGLogs', label: 'FG Logs', icon: faBoxOpen },
  ];

  const adminSections = [
  { key: 'UserLogs', label: 'User Logs', icon: faUserClock }, 
  { key: 'RoleLogs', label: 'Role Logs', icon: faUserShield },    
  { key: 'ModuleLogs', label: 'Module Logs', icon: faCogs },        ];

  this.logSections = [...baseSections];

  if (this.role_data?.name === 'Admin') {
    this.logSections.push(...adminSections);
  }
}


  fetchLogs(section: string, page = 1) {
    this.loading = true;

    const params = {
      pagination: true,
      page: page,
      per_page: 10,
      action: this.selectedAction.toLocaleLowerCase(),
      selecteduser: this.selecteduser,
    };

    this.api.post(`get${section}`, params).subscribe({
      next: (res: any) => {
        this.logs = res.status ? res.data.logs.docs : [];
        this.pagination_data = res.data.logs;
        this.common.set_pagination_data(this.pagination_data, 'activitylogs');
        this.loading = false;
      },
      error: () => {
        this.logs = [];
        this.loading = false;
      },
    });
  }

  onTabChange(tab: string) {
    this.selectedTab = tab;
    this.fetchLogs(tab);
  }
}
