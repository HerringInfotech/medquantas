import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/api/api.service';
import { Location } from "@angular/common";

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  btn_loading: Boolean = false;
  formValues: object = {
    customtype_id: ''
  };
  customerId;
  codeError= '';


  constructor( private common: CommonService, private location: Location, private router: Router, private api: ApiService, private route: ActivatedRoute ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.customerId = params.id
      if(this.customerId) {
        this.get_customer(this.customerId);
      }

    })
  }

  formSubmit(formData: NgForm) {
    if(formData.valid && this.codeError == '')
    {
      this.btn_loading=true;
      this.api.post('update_customer',this.formValues).subscribe((response) => {
        this.btn_loading=false;
        this.common.alert({msg:response.message,type:(response.status)?'success':'danger'});
        if(response.status) this.router.navigateByUrl('customer');
      })
    }
  }

  get_customer(id) {
    let params = {
      id: id,
    }
    this.api.post('get_customer',params).subscribe((response) => {
      this.formValues = response.data.customers[0]
    })
  }

  customer_code() {
    this.codeError = '';
    let params = {
      code: this.formValues['customer_code']
    };
    this.api.post('customer_code', params).subscribe(response => {   
      if(!response.status)
      {
        this.codeError = response.message
      }
    });
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}
