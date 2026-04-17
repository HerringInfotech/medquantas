import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { Location } from "@angular/common";

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  btn_loading: boolean = false;
  formValues: Object = {
    name: ''
  };
  itemtypeId

  constructor(private api: ApiService, private location: Location, private router: Router, private route: ActivatedRoute, private common: CommonService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.itemtypeId = params.id
      if (this.itemtypeId) {
        this.get_itemtype(this.itemtypeId);
      }

    })
  }


  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;
      this.api.post('update_itemtype', this.formValues).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
        if (response.status) this.router.navigateByUrl('type');
      })
    }
  }

  get_itemtype(id) {
    let params = {
      id: id,
    }
    this.api.post('get_itemtype', params).subscribe((response) => {
      this.formValues = response.data.itemtype[0]
    })
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}
