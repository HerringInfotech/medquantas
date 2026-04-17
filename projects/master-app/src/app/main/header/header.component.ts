import { Component, OnInit, EventEmitter, Output, Renderer2, ElementRef, ViewChild, TemplateRef } from '@angular/core';

import { CommonService } from '../../shared/api/common.service';
import { faBars, faEye, faEyeSlash, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Route, Router } from '@angular/router';
import { ApiService } from '../../shared/api/api.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { NgForm } from '@angular/forms';
import { SocketService } from '../../shared/api/socket.service';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']

})

export class HeaderComponent implements OnInit {
  @Output() sidebarToggleRequest: EventEmitter<void> = new EventEmitter<void>();
  modalRef: BsModalRef;
  side_bar_open: Boolean = true;
  role;
  user;
  @ViewChild('change_pass') change_pass: TemplateRef<any>;
  @ViewChild('notice') notice: TemplateRef<any>;
  btn_loading: boolean = false;
  faEyeSlash = faEyeSlash;
  faEye = faEye;

  formValues: Object = {
  }
  confirmpass_type = "password";
  newpass_type = "password";
  oldpass_type = "password";
  faSearch = faSearch;


  private receivedDataSubscription: Subscription;

  bomStatus = "";
  bomName = "";
  type = '';

  verifier
  creator
  approve

  faBars = faBars;
  username = 'John Doe'; // Example username
  constructor(private common: CommonService, private el: ElementRef, private socketService: SocketService, public router: Router, private api: ApiService, private modalService: BsModalService) {
    this.modalService.onHidden.subscribe(() => {
      this.formValues = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    });  
  }

  ngOnInit(): void {
    this.get_role();
    this.get_user();
    this.common.user_updated.subscribe(() => {
      this.get_user();
    });
  }


  triggerSidebar() {
    this.common.set_sidebar_toggle();
  }





  changePassword() {
    // Logic to handle password change
  }


  // get_role_master() {
  //   let params = {
  //     "pagination": "false"
  //   }
  //   this.api.post('get_role_master', params).subscribe((response) => {
  //     var role_data = response.data.rolemanager;
  //     if(response.status) {
  //       var create = [];
  //       var verify = [];
  //       var approve = [];
  //       _.forEach(role_data, (item, i) => {
  //         _.forEach(item.status, (val, j) => {
  //           if (val.name == 'Bom' && this.type == 'BOM') {
  //             var get_cre = val.actions.find(data => data.name == 'Created').isSelected;
  //             var get_per = val.actions.find(data => data.name == 'Verified').isSelected;
  //             var get_appr = val.actions.find(data => data.name == 'Approved').isSelected;
  //             if (get_cre) {
  //               create.push(item.role_id)
  //             }
  //             else if (get_per) {
  //               verify.push(item.role_id)
  //             }
  //             else if (get_appr) {
  //               approve.push(item.role_id)
  //             }
  //           }
  //           else if(val.name == 'Costsheet' && this.type == "Cost Sheet") {
  //             var get_cre = val.actions.find(data => data.name == 'Created').isSelected;
  //             var get_per = val.actions.find(data => data.name == 'Verified').isSelected;
  //             var get_appr = val.actions.find(data => data.name == 'Approved').isSelected;
  //             if (get_cre) {
  //               create.push(item.role_id)
  //             }
  //             else if (get_per) {
  //               verify.push(item.role_id)
  //             }
  //             else if (get_appr) {
  //               approve.push(item.role_id)
  //             }

  //           }
  //         })
  //       })
  //       this.verifier = verify;
  //       this.creator = create;
  //       this.approve = approve;
  //       var check_creator = this.creator.some(id => id === localStorage.getItem('id'));
  //       var check_verify = this.verifier.some(id => id === localStorage.getItem('id'));
  //       var check_approve = this.approve.some(id => id === localStorage.getItem('id'));

  //       if(this.bomStatus == "Created/Declined" && check_creator) {
  //         this.openotice()
  //       }
  //       else if((this.bomStatus == "Created" || this.bomStatus == "Updated" || this.bomStatus == "Verified/Declined") && check_verify) {
  //         this.openotice()
  //       }
  //       else if(this.bomStatus == "Verified" && check_approve) {
  //         this.openotice()
  //       }
  //     }
  //   })
  // }



  openModalForConfirm(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-dialog-centered' })
    );
  }

  get_role() {
    let params =
    {
      id: localStorage.getItem("id"),
    }
    this.api.post('get_role', params).subscribe((response) => {
      this.role = response.data?.roles[0];
    })
  }

  get_user() {
    let params =
    {
      id: localStorage.getItem("user_id"),
    }
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    })
  }


  @Output() toggleClass = new EventEmitter<boolean>();

  openotice() {
    this.openModalForConfirm(this.notice);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  changepass() {
    this.openModalForConfirm(this.change_pass);
  }

  resetPassword(formData: NgForm) {
    if (formData.valid) {
      // Password Strength Policy: Upper, Lower, Numeric, Special
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(this.formValues['newPassword'])) {
        this.common.alert({ 
          msg: "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.", 
          type: 'danger' 
        });
        return;
      }

      this.btn_loading = true;
      this.formValues['userid'] = localStorage.getItem("user_id")
      this.api.post('change_password', this.formValues).subscribe((response) => {
        this.btn_loading = false
        if (response.status) {
          this.common.alert({ msg: response.message, type: 'success' });
          this.modalRef.hide()
        }
        else {
          this.common.alert({ msg: response.message, type: 'danger' });
        }
      })
    }
  }

  logout() {
    this.api.logout();
    this.router.navigateByUrl('auth/login');
    this.common.alert({ msg: "User logged out successfully", type: 'success' });
  }
}
