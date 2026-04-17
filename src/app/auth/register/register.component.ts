import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { faEye, faEyeSlash, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';

import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  submitLoading = false;
  showPassword = false;
  faEye = faEye
  faEyeSlash = faEyeSlash
  role_data;
  btn_loading = false;
  password_type = "password";
  formValues: Object = {

  }

  constructor(private api: ApiService, private common: CommonService, private router: Router) { }

  ngOnInit(): void {
    this.get_role();
  }

  formSubmit(registerForm: NgForm) {
    if (registerForm.valid) {
      this.btn_loading = true;
      this.api.post('sign_up', this.formValues).subscribe((response) => {
        this.btn_loading = false;
        if (response.status) {
          var token = response.data?.token;
          localStorage.setItem("token", token);
          this.router.navigateByUrl('');
        }
        this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
      })
    }
  }

  get_role() {
    let params = {
      pagination: "false"
    }
    this.api.post('get_role', params).subscribe((response) => {
      this.role_data = response.data.roles;
      this.role_data = this.role_data.filter(data => data.name !== 'Admin');
    })
  }
}
