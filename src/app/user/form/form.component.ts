import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faEye, faEyeSlash, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { Location } from "@angular/common";
import { NgxImageCompressService } from 'ngx-image-compress';
import { BsModalService } from 'ngx-bootstrap/modal';


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  faEye = faEye
  faEyeSlash = faEyeSlash
  faMapMarkedAlt = faMapMarkedAlt
  formValues: Object = {
    role: '',
    image: ''
  };
  profile
  password_type = "password";
  newpassword_type = "newpassword";

  btn_loading;
  userId;
  role_data;
  user_data;
  isRole: Boolean = false;
  isPass: Boolean = false;
  new_password = ''
  user;
  isAdmin: boolean = false;
  isProfilePage: boolean = false;

  image_upload_btn;
  imgResultBeforeCompress: string;
  imgResultAfterCompress: string;
  imgSizeBeforeCompress: string;
  imgSizeAfterCompress: string;
  modalRef: any;

  get isReadOnly(): boolean {
    return this.isProfilePage && !this.isAdmin;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  constructor(private route: ActivatedRoute, private modalService: BsModalService, private imageCompress: NgxImageCompressService, private location: Location, private api: ApiService, private common: CommonService, private router: Router) { }

  ngOnInit(): void {
    const roleName = localStorage.getItem('role_name');
    this.isAdmin = roleName === 'Admin';
    this.isProfilePage = this.router.url.includes('/profile');

    this.route.params.subscribe(params => {
      if (this.isProfilePage) {
        this.userId = localStorage.getItem('user_id');
      } else {
        this.userId = params.id;
      }
      if (this.userId) {
        this.get_user(this.userId);
      }
    })
    this.get_role();
    this.get_current_user();
  }

  compressFile() {
    this.imageCompress.uploadFile().then(({ image, orientation }) => {
      this.image_upload_btn = true;
      this.imgResultBeforeCompress = image;
      this.imgSizeBeforeCompress = this.formatBytes(this.imageCompress.byteCount(image))
      this.imageCompress.compressFile(image, orientation, 50, 90).then(
        result => {
          this.image_upload_btn = false;
          this.imgResultAfterCompress = result;
          this.imgSizeAfterCompress = this.formatBytes(this.imageCompress.byteCount(result))
        }
      );
    });
  }

  onRoleChange() {
    this.isRole = false;
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  change_pass() {
    this.isPass = false
  }

  ChangePassword() {
    if (this.new_password.trim() !== '') {
      let params = {
        userid: this.userId,
        admin: 1,
        password: this.new_password
      }
      this.api.post('change_password', params).subscribe((response) => {
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
    else {
      this.isPass = true
    }
  }
  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  formSubmit(formData: NgForm) {
    if (formData.valid) {
      if (!this.formValues['role']) {
        this.isRole = true;
        return;
      } else {
        this.isRole = false;
      }

      const form = new FormData();
      if (this.imgResultAfterCompress) {
        form.append("image", this.imgResultAfterCompress);
      }

      this.btn_loading = true;

      const payload = {
        ... this.formValues,
        user: this.user,
      };

      this.api.upload('update_user', form, payload).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        if (response.status) {
          this.common.set_user_updated();
          if (this.router.url.includes('/profile')) {
            this.router.navigateByUrl('');
          } else {
            this.router.navigateByUrl('user');
          }
        }
      }, (err) => {
        this.btn_loading = false;
        this.common.alert({ msg: 'Upload failed', type: 'danger' });
      });
    } else {
      formData.form.markAllAsTouched();
    }
  }


  get_user(id) {
    let params = {
      id: id,
    }
    this.api.post('get_user', params).subscribe((response) => {
      this.formValues = response.data.users[0];
      this.user_data = response.data.users[0];
    })
  }

  get_role() {
    let params = {
      pagination: "false"
    }
    this.api.post('get_role', params).subscribe((response) => {
      this.role_data = response.data.roles;
    })
  }

  goBack(): void {
    this.location.back();
  }
}
