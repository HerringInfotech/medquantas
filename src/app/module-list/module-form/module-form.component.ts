import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-module-form',
  templateUrl: './module-form.component.html',
  styleUrls: ['./module-form.component.scss'],
})
export class ModuleFormComponent implements OnInit {
  formValues: Object = {
    name: '',
  };
  user;
  moduleId;
  btn_loading: Boolean = false;
  actions = [
    { name: 'List', isSelected: false },
    { name: 'Create', isSelected: false },
    { name: 'Update', isSelected: false },
    { name: 'Delete', isSelected: false },
  ];

  constructor(
    private api: ApiService,
    private location: Location,
    private common: CommonService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.moduleId = params.id;
      if (this.moduleId) {
        this.get_module(this.moduleId);
      }
    });
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
  formSubmit(formData: NgForm) {
    this.btn_loading = true;
    if (formData.valid) {
      this.moduleId == undefined
        ? (this.formValues['actions'] = this.actions)
        : '';
      this.btn_loading = true;
      const payload = {
        ...this.formValues,
        user: this.user,
      };
      this.api.post('update_module', payload).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        if (response.status) this.router.navigateByUrl('module');
      });
    }
  }

  get_module(id) {
    let param = {
      id: id,
      pagination: 'false',
    };
    this.api.post('get_module', param).subscribe((response) => {
      this.formValues = response.data.modules[0];
    });
  }

  goBack(): void {
    this.location.back();
  }
}
