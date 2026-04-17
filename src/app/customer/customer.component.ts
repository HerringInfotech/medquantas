import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../shared/api/common.service';
import { faEdit, faSearch, faSort, faSortUp, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  customer;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  pagination_data;
  search = '';
  sort = '';
  faSortUp = faSortUp;
  faSort = faSort;
  faSearch = faSearch;


  constructor(private api: ApiService, private spinner: NgxSpinnerService, private common: CommonService, private permission: PermissionService) {
    this.common.delete_detail.subscribe(value => {
      if (value.page == 'customer') {
        this.delete(value.id);
      }
    })
    this.common.change_page.subscribe(data => {
      if (data.section == "customer") {
        this.get_customer(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_customer(1)
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`) ? `${column}_desc` : `${column}_asc`;
    this.get_customer(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  get_customer(page) {
    this.spinner.show();
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      search: this.search,
      sort: this.sort
    }
    this.api.post('get_customer', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = false;
      this.customer = response.data.customers.docs
      this.pagination_data = response.data.customers;
      this.common.set_pagination_data(this.pagination_data, 'customer');
    })
  }

  export_customer() {
    this.btn_loading = true;
    let params = {}
    this.api.post('export_customer', params).subscribe(async (response) => {
      var rates = response.data
      await this.convert_excel(rates)
      this.btn_loading = false;
    })
  }

  convert_excel(data) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const priceMasterHeading = ws.getCell('A1');
    priceMasterHeading.value = 'Customer Master';
    priceMasterHeading.font = { bold: true, size: 16 };
    ws.mergeCells('A1:G1');
    priceMasterHeading.alignment = { horizontal: 'center', vertical: 'middle' };

    priceMasterHeading.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    priceMasterHeading.height = 30;

    ws.addRow([]);
    const dataColumnHeading = ws.getRow(2);
    dataColumnHeading.values = [
      'S.No', 'Sap Code', 'Code', 'Name', 'Type', 'GST no', 'Address',
    ];
    dataColumnHeading.font = { bold: true };
    dataColumnHeading.alignment = { horizontal: 'center', vertical: 'middle' };
    dataColumnHeading.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8DB4E2' }
        };
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    ws.columns = [
      { key: 'sno', width: 5 },
      { key: 'customer_sapcode', width: 15 },
      { key: 'code', width: 15 },
      { key: 'name', width: 30 },
      { key: 'type', width: 30 },
      { key: 'gst_no', width: 20 },
      { key: 'address', width: 55 },
    ];

    data.forEach((rate, index) => {
      var validTillDate = null;
      if (rate?.select_date) {
        const dateParts = rate?.select_date.split('-');
        validTillDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      }
      const dataRow = ws.addRow({
        sno: index + 1,
        customer_sapcode: rate.customer_sapcode,
        code: rate.customer_code,
        name: rate.name,
        type: rate.customertype_pop.name,
        gst_no: rate.gst,
        address: rate.address,
      });
      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.style.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    wb.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "customermaster.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    })
  }


  delete(id) {
    let params = {
      id: id
    }
    this.api.post('delete_customer', params).subscribe((response) => {
      this.get_customer(1);
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }

  confirm_delete(data) {
    data.page = "customer";
    data.message = "Are you sure to delete this customer?";
    this.common.set_delete_confirmation_data(data);
  }

}
