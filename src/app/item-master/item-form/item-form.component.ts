import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { Location } from "@angular/common";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-item-form',
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss']
})
export class ItemFormComponent implements OnInit {
  formValues: object = {

  }
  btn_loading: Boolean = false;
  itemID;
  faArrowLeft = faArrowLeft
  page_loader: boolean = true;
  role;
  user;
  itemtypeList;

  constructor(private api: ApiService, private location: Location, private router: Router, private route: ActivatedRoute, private common: CommonService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.itemID = params.id
      if (this.itemID) {
        this.get_item(this.itemID);
      }
    })
    this.get_role();
    this.get_user();
    this.loadItemtypes();

  }

  get_item(id) {
    this.page_loader = false;
    let params = {
      id: id,
    }
    this.api.post('get_item', params).subscribe((response) => {

      if (response.status) {
        this.page_loader = true;

        this.formValues = response.data.item[0]
        if (this.formValues['creditDate']) {
          this.formValues['creditDate'] = new Date(this.formValues['creditDate']);
        }
      }
    })
  }
  loadItemtypes(): void {
    const payload = {
      pagination: 'false', // we want full list
    };

    this.api.post('get_itemtype', payload).subscribe({
      next: (res) => {
        this.itemtypeList = res.data.itemtype || [];
      },
      error: (err) => {
        console.error('Error loading itemtypes:', err);
      },
    });
  }

  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;

      const payload = {
        ...this.formValues,
        user: this.user,
        role: this.role
      };

      this.api.post('update_item', payload).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({ msg: response.message, type: response.status ? 'success' : 'danger' });
        if (response.status) this.router.navigateByUrl('item');
      });
    } else {
      this.common.alert({ msg: "Please fill all the data", type: 'danger' });
    }
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

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  enforceBounds(event: any): void {
    if (this.formValues['percentage'] > 100) {
      this.formValues['percentage'] = 100;
    } else if (this.formValues['percentage'] < 0 && this.formValues['percentage'] !== null && this.formValues['percentage'] !== '') {
      this.formValues['percentage'] = 0;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
