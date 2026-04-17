import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { PermissionService } from '../shared/permission/permission.service';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-access-manager',
  templateUrl: './access-manager.component.html',
  styleUrls: ['./access-manager.component.scss'],
})
export class AccessManagerComponent implements OnInit {
  module_list;
  status_list;
  module_id;
  role_data;
  role_id;
  btn_loading: boolean = false;
  user;
  faPlus = faPlus;
  faSpinner = faSpinner;
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private common: CommonService,
    private permission: PermissionService
  ) { }

  ngOnInit(): void {
    this.get_role();
    this.get_user();
  }
  get_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_role_master(id) {
    let params = {
      role_id: id,
    };
    this.api.post('get_role_master', params).subscribe((response) => {
      if (response.status) {
        var res_data = response.data.rolemanager[0];
        this.module_list = res_data?.permission;
        this.module_list.sort((a, b) => a.name.localeCompare(b.name));
        this.status_list = res_data?.status;
        if (res_data?.user?.name !== 'Admin') {
          this.module_list = this.module_list.filter(
            (data) =>
              data.name !== 'Access' &&
              data.name !== 'Setting' &&
              data.name !== 'Module' &&
              data.name !== 'User'
          );
        }
        this.module_id = res_data?.id;
      }
    });
  }

  get_role() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_role', params).subscribe((response) => {
      if (response.status) {
        this.role_data = response.data?.roles;
        // this.role_data = this.role_data.filter(data => data.name !== 'Admin');
        this.role_id = response.data?.roles[0]?._id;
        this.get_role_master(this.role_id);
      }
    });
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  save_data() {
    this.btn_loading = true;
    if (this.role_id != undefined) {
      let params = {
        id: this.module_id,
        permission: this.module_list,
        status: this.status_list,
        user: this.user,
      };
      this.api.post('update_role_master', params).subscribe((response) => {
        this.btn_loading = false;
        if (response.status) {
          this.common.alert({
            msg: response.message,
            type: response.status ? 'success' : 'danger',
          });
          // location.reload();
        }
      });
    }
  }

  select_role() {
    this.get_role_master(this.role_id);
  }

  selectAllRowActions(module) {
    const selectAll = module.isSelected;
    for (const action of module.actions) {
      action.isSelected = selectAll;
    }
  }

  change_creator(data) {
    const updateActions = (moduleName) => {
      this.cdr.detectChanges();
      setTimeout(() => {
        const isActionSelected = data.actions[0].isSelected;
        this.module_list.forEach((d) => {
          if (d.name === moduleName) {
            d.actions[0].isSelected =
              data.actions[1].isSelected || data.actions[2].isSelected
                ? true
                : isActionSelected;
            d.actions[1].isSelected = isActionSelected;
            d.actions[2].isSelected = isActionSelected;
            d.actions[3].isSelected = isActionSelected;
            d.isSelected = d.actions.every((action) => action.isSelected);
          }
        });
        data.isSelected = data.actions.every((action) => action.isSelected);
      }, 0);
    };
    if (data.name === 'Bom') {
      updateActions('BOM');
    } else if (data.name === 'Costsheet') {
      updateActions('CostSheet');
    } else if (data.name === 'Instantsheet') {
      updateActions('InstantCostsheet');
    }
  }

  change_verifier(data) {
    const updateModuleActions = (moduleName) => {
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!data.actions[0].isSelected && !data.actions[2].isSelected) {
          const isActionSelected = data.actions[1].isSelected;
          this.module_list.forEach((d) => {
            if (d.name === moduleName) {
              d.actions[0].isSelected = isActionSelected;
              d.actions[1].isSelected = false;
              d.actions[2].isSelected = false;
              d.actions[3].isSelected = false;
              d.isSelected = d.actions.every((action) => action.isSelected);
            }
          });
        }
        data.isSelected = data.actions.every((action) => action.isSelected);
      }, 0);
    };
    if (data.name === 'Bom') {
      updateModuleActions('BOM');
    } else if (data.name === 'Costsheet') {
      updateModuleActions('CostSheet');
    } else if (data.name === 'Instantsheet') {
      updateModuleActions('InstantCostsheet');
    }
  }

  change_approver(data) {
    const updateModuleActions = (moduleName) => {
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!data.actions[0].isSelected && !data.actions[1].isSelected) {
          const isActionSelected = data.actions[2].isSelected;
          this.module_list.forEach((d) => {
            if (d.name === moduleName) {
              d.actions[0].isSelected = isActionSelected;
              d.actions[1].isSelected = false;
              d.actions[2].isSelected = false;
              d.actions[3].isSelected = false;
              d.isSelected = d.actions.every((action) => action.isSelected);
            }
          });
        }
        data.isSelected = data.actions.every((action) => action.isSelected);
      }, 0);
    };
    if (data.name === 'Bom') {
      updateModuleActions('BOM');
    } else if (data.name === 'Costsheet') {
      updateModuleActions('CostSheet');
    } else if (data.name === 'Instantsheet') {
      updateModuleActions('InstantCostsheet');
    }
  }
}
