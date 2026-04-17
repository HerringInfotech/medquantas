import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Location } from "@angular/common";
import * as _ from 'lodash';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';

@Component({
  selector: 'app-access-form',
  templateUrl: './access-form.component.html',
  styleUrls: ['./access-form.component.scss']
})
export class AccessFormComponent implements OnInit {
  formValues: Object = {
    name: '',
  };
  btn_loading;
  module_list;
  status_list;
  codeError = '';
  user;

  constructor(public router: Router, private cdr: ChangeDetectorRef, private api: ApiService, private common: CommonService, private route: ActivatedRoute, private location: Location) { }

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

  get_role() {
    let param = {}
    this.api.post('create_role', param).subscribe((response) => {
      this.status_list = response.data?.status;
      this.module_list = response.data?.permission;
      this.module_list.sort((a, b) => a.name.localeCompare(b.name));
    })
  }

  check_role() {
    this.codeError = '';
    let params = {
      name: this.formValues['name']
    };
    this.api.post('check_role', params).subscribe(response => {
      if (!response.status) {
        this.codeError = response.message
      }
    });
  }

  save_data() {
    if (this.formValues['name'] != '' && this.codeError == '') {
      this.btn_loading = true;
      let params = {
        user: this.user,
        name: this.formValues['name'],
        permission: this.module_list,
        status: this.status_list,
      }
      this.api.post('update_role_master', params).subscribe((response) => {
        this.btn_loading = false;
        if (response.status) {
          this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
          if (response.status) this.router.navigateByUrl('access');
        }
      })
    }
    else {
      let message = " please fill all the data"
      this.common.alert({ msg: message, type: 'danger' });
    }
  }

  selectAllRowActions(module: any) {
    const selectAll = module.isSelected;
    for (const action of module.actions) {
      action.isSelected = selectAll;
    }
  }

  goBack() {
    this.location.back();
  }

  change_creator(data) {
    const updateActions = (moduleName) => {
      this.cdr.detectChanges();
      setTimeout(() => {
        const isActionSelected = data.actions[0].isSelected;
        this.module_list.forEach(d => {
          if (d.name === moduleName) {
            d.actions[0].isSelected = (data.actions[1].isSelected || data.actions[2].isSelected) ? true : isActionSelected;
            d.actions[1].isSelected = isActionSelected;
            d.actions[2].isSelected = isActionSelected;
            d.actions[3].isSelected = isActionSelected;
            d.isSelected = d.actions.every(action => action.isSelected);
          }
        });
        data.isSelected = data.actions.every(action => action.isSelected);
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
          this.module_list.forEach(d => {
            if (d.name === moduleName) {
              d.actions[0].isSelected = isActionSelected;
              d.actions[1].isSelected = false;
              d.actions[2].isSelected = false;
              d.actions[3].isSelected = false;
              d.isSelected = d.actions.every(action => action.isSelected);
            }
          });
        }
        data.isSelected = data.actions.every(action => action.isSelected);
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
          this.module_list.forEach(d => {
            if (d.name === moduleName) {
              d.actions[0].isSelected = isActionSelected;
              d.actions[1].isSelected = false;
              d.actions[2].isSelected = false;
              d.actions[3].isSelected = false;
              d.isSelected = d.actions.every(action => action.isSelected);
            }
          });
        }
        data.isSelected = data.actions.every(action => action.isSelected);
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
