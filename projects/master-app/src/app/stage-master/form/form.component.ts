import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { Location } from "@angular/common";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  formValues: object = {

  }
  btn_loading: Boolean = false;
  stageID;
  faArrowLeft = faArrowLeft
  typeList

  constructor(private api: ApiService, private location: Location, private router: Router, private route: ActivatedRoute, private common: CommonService) { }

  ngOnInit(): void {
    this.get_type()
    this.route.params.subscribe(params => {
      this.stageID = params.id
      if (this.stageID) {
        this.get_stage(this.stageID);
      }
    })
  }

  get_type() {
    let params = {
      pagination: "false",
    }
    this.api.post('get_itemtype', params).subscribe((response) => {
      this.typeList = response.data.itemtype
    })
  }

  ontypeChange(e) {

  }

  get_stage(id) {
    let params = {
      id: id,
    }
    this.api.post('get_stage', params).subscribe((response) => {
      if (response.status) {
        this.formValues = response.data.stage[0]
      }
    })
  }

  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;
      this.api.post('update_stage', this.formValues).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
        if (response.status) this.router.navigateByUrl('stage');
      })
    }
    else {
      let message = " please fill all the data"
      this.common.alert({ msg: message, type: 'danger' });
    }
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}