import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';
import { FormBuilder, NgForm, Validators } from '@angular/forms';
import { faEye, faEyeSlash, faEnvelope, faLock, faKey, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  submitLoading = false;
  showPassword = false;
  faEye = faEye
  faEyeSlash = faEyeSlash
  faEnvelope = faEnvelope
  faLock = faLock
  faKey = faKey
  faCheckCircle = faCheckCircle
  btn_loading = false;
  password_type = "password";
  formValues: Object = {
    password: "",
    email: ""
  }
  current_url;
  setting_data;
  modalRef: BsModalRef;
  @ViewChild('expiredPassTemplate') expiredPassTemplate: TemplateRef<any>;
  expiredUserId: string = '';
  newPassValues = {
    newPassword: '',
    confirmPassword: ''
  };
  newPassVisible = false;
  confirmPassVisible = false;
  passComplexityError = false;
  passMismatchError = false;


  ngOnInit(): void {
    this.getsetting();
  }

  constructor(
    private router: Router, 
    private api: ApiService, 
    private common: CommonService, 
    private route: ActivatedRoute,
    private modalService: BsModalService
  ) {
    this.current_url = this.router.url.split('/');
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.current_url = evt.url.split('/');
      }
    })
  }

  go_forgot() {
    this.router.navigateByUrl('auth/forgot-password');
  }


  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;
      this.api.post('sign_in', this.formValues).subscribe((response) => {
        this.btn_loading = false;
        
        if (response.data?.expired) {
          this.expiredUserId = response.data.userId;
          this.openExpiredPassModal();
          return;
        }

        if (response.status) {
          var user = response.data?.user_detail?.role;
          var role_name = response.data?.user_detail?.role_pop?.name;
          var token = response.data?.token;
          localStorage.setItem("token", token);
          localStorage.setItem("id", user);
          localStorage.setItem("user_id", response.data?.user_detail?.id);
          if (role_name) {
            localStorage.setItem("role_name", role_name.trim());
          }
          localStorage.setItem("user_name", response.data?.user_detail?.name);
          const isFirstLogin = !!response.data?.firstLogin; 
          if (isFirstLogin) {
            localStorage.setItem("showWelcome", "true");
            const userName = response.data?.user_detail?.name || '';
            this.common.alert({ msg: `Welcome ${userName}! Thanks for logging in for the first time.`, type: 'success', category: 'Login' });
          } else {
            this.common.alert({ msg: response.message, type: 'success', category: 'Login' });
          }
          this.api.resetAuthorization();
          if (role_name && role_name.trim().toLowerCase() === 'sale') {
            this.router.navigateByUrl('/sales');
          } else {
            this.router.navigateByUrl('');
          }
        }
        else {
          this.common.alert({ msg: response.message, type: 'danger' });
        }
      })
    }
  }

  forgot() {
    if (this.formValues['email'] !== '') {
      this.btn_loading = true;
      let params = {
        email: this.formValues['email']
      }
      this.api.post('forgotpassword', params).subscribe((response) => {
        this.btn_loading = false;
        if (response.status) {
          this.router.navigateByUrl('');
          this.common.alert({ msg: response.message, type: 'success' });
        }
        else {
          this.common.alert({ msg: response.message, type: 'danger' });
        }
      })
    }
  }

  getsetting() {
    let params = {}
    this.api.post('get_setting', params).subscribe((response) => {
      if (response.data) {
        this.setting_data = response.data.setting[0]
      }
    })
  }

  openExpiredPassModal() {
    this.modalRef = this.modalService.show(this.expiredPassTemplate, { 
      class: 'modal-dialog-centered modal-md',
      ignoreBackdropClick: true,
      keyboard: false
    });
  }

  resetExpiredPassword(form: NgForm) {
    this.passComplexityError = false;
    this.passMismatchError = false;
    form.form.markAllAsTouched();
    if (form.invalid) return;
    
    // Frontend Complexity Check (Sync with Backend)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(this.newPassValues.newPassword)) {
      this.passComplexityError = true;
      return;
    }

    if (this.newPassValues.newPassword !== this.newPassValues.confirmPassword) {
      this.passMismatchError = true;
      return;
    }

    this.submitLoading = true;
    const params = {
      userid: this.expiredUserId,
      newPassword: this.newPassValues.newPassword,
      isExpiredChange: true
    };

    this.api.post('change_password', params).subscribe((response) => {
      this.submitLoading = false;
      if (response.status) {
        this.common.alert({ msg: "Password changed successfully. Please login again.", type: 'success' });
        this.modalRef.hide();
        this.newPassValues = { newPassword: '', confirmPassword: '' };
      } else {
        this.common.alert({ msg: response.message, type: 'danger' });
      }
    });
  }
}
