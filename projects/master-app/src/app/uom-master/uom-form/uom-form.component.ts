import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from "@angular/common";

@Component({
  selector: 'app-uom-form',
  templateUrl: './uom-form.component.html',
  styleUrls: ['./uom-form.component.scss']
})
export class UomFormComponent implements OnInit {
  typeId;
  btn_loading: boolean = false;
  formValues: Object = {
  };

  constructor(private api: ApiService, private location: Location, private router: Router, private route: ActivatedRoute, private common: CommonService, private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.typeId = params.id
      if (this.typeId) {
        this.get_unit(this.typeId);
      }

    })
  }

  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;
      this.api.post('update_unit', this.formValues).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
        if (response.status) this.router.navigateByUrl('uom');
      })
    }
  }

  get_unit(id) {
    this.spinner.show()
    let params = {
      id: id,
    }
    this.api.post('get_unit', params).subscribe((response) => {
      this.spinner.hide()
      this.formValues = response.data.units[0]
    })
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}