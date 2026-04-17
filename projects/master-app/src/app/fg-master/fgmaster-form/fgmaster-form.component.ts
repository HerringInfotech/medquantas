import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { Location } from "@angular/common";

@Component({
  selector: 'app-fgmaster-form',
  templateUrl: './fgmaster-form.component.html',
  styleUrls: ['./fgmaster-form.component.scss']
})
export class FgmasterFormComponent implements OnInit {
  btn_loading: boolean = false;
  formValues: Object = {
    'customer_id': '',
    'type_id': '',
    'subtype_id': '',
    'pack_id': '',
    'status': 'Active',
  };
  brandId;
  customer_data;
  type_data;
  subtype_data;
  pack_data;
  isCustomer: boolean = false;
  page_loader: boolean = false;
  isType: boolean = false;
  isSubtype: boolean = false;
  isPack: boolean = false;
  nameError = '';
  sapError = '';
  brandData
  statusList = ["Active", "Inactive"]
  typelist
  user;


  constructor(private api: ApiService, private location: Location, private router: Router, private route: ActivatedRoute, private common: CommonService, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.brandId = params.id
      if (this.brandId) {
        this.get_brand(this.brandId);
      }
      else {
        this.generateFGCode();

      }

    })

    this.get_customer();
    this.get_fgsubtype();
    this.get_packtype();
    this.get_current_user();

  }

  generateFGCode() {
    this.api.post('generate_code', {}).subscribe(response => {
      if (response.status) {
        this.formValues['brand_code'] = response.data.code;
      }
    });
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
    if (formData.valid && this.formValues['pack_id'] !== '' && this.nameError == '') {
      this.btn_loading = true;
      const payload = {
        ...this.formValues,
        user: this.user,
      };
      this.api.post('update_brand', payload).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
        if (response.status) this.router.navigateByUrl('fg_master');
      })
    }
    else {

      if (this.formValues['pack_id'] == '') {
        this.isPack = true;
      }

    }
  }




  get_brand(id) {
    this.page_loader = true
    let params = {
      id: id,
    }
    this.api.post('get_brand', params).subscribe((response) => {
      this.page_loader = false
      this.formValues = response.data.brand[0];
      this.brandData = response.data.brand[0]
    })
  }

  ontypeChange() {
    this.isType = false;
  }

  onsubtypeChange() {
    this.isSubtype = false;
  }

  onpackChange() {
    this.isPack = false
  }

  get_customer() {
    let params = {
      pagination: "false",
      sort: "name_asc"
    }
    this.api.post('get_customer', params).subscribe((response) => {
      this.customer_data = response.data.customers;
    })
  }



  get_fgsubtype() {
    let params = {
      pagination: "false",
    }
    this.api.post('get_fgsubtype', params).subscribe((response) => {
      this.subtype_data = response.data.subtype;
    })
  }

  get_packtype() {
    let params = {
      pagination: "false",
    }
    this.api.post('get_pack', params).subscribe((response) => {
      this.pack_data = response.data.packtype;
    })
  }

  oncustomerChange() {
    this.isCustomer = false;
    // this.formValues['name'] = ''
    this.nameError = ''
    let params = {
      customerID: this.formValues['customer_id']
    };
    this.api.post('generate_code', params).subscribe(response => {
      if (response.status) {
        this.formValues['brand_code'] = response.data.code
      }
    });
  }

  brand_name() {
    this.nameError = '';

    const params = {
      name: this.formValues['name']
    };

    this.api.post('brand_name', params).subscribe(response => {
      if (!response.status) {
        this.nameError = response.message;
      }
    });
  }

  fg_sapcode() {
    let params = {
      code: this.formValues['fg_sapcode'],
    }
    this.api.post('fG_sapcode', params).subscribe((response) => {
      if (!response.status) {
        this.sapError = response.message
      }
      else {
        this.sapError = '';
      }
    })
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}
