import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { faEdit, faFileExcel, faPlus, faSearch, faSort, faSortUp, faSpinner, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { Router } from '@angular/router';


@Component({
  selector: 'app-fg-master',
  templateUrl: './fg-master.component.html',
  styleUrls: ['./fg-master.component.scss']
})
export class FgMasterComponent implements OnInit {
  page = 1;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  brand;
  pagination_data;
  search = '';
  sort = "";
  permissions;
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faPlus = faPlus;
  faSearch = faSearch;
  faSortUp = faSortUp;
  faSort = faSort;
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;
  customer = ''
  customer_list;
  user;
  deleteSub: any;

  constructor(private api: ApiService, private router: Router, private common: CommonService, private spinner: NgxSpinnerService, private permission: PermissionService) {
    
    this.common.change_page.subscribe(data => {
      if (data.section == "brand") {
        this.get_brand(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_brand(1);
    this.get_customer();
        this.get_current_user();
        this.deleteSub = this.common.delete_detail.subscribe((value) => {
      if (value.page == 'brand') {
        this.delete(value.id);
      }
    });

  }
  ngOnDestroy(): void {
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
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

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`) ? `${column}_desc` : `${column}_asc`;
    this.get_brand(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  get_customer() {
    let params = {
      pagination: "false",
    }
    this.api.post('get_customer', params).subscribe((response) => {
      this.customer_list = response.data.customers
    })
  }

  get_brand(page) {
    // this.spinner.show();
    this.page_loading = true;
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      customer: this.customer,
      search: this.search,
      sort: this.sort
    }
    this.api.post('get_brand', params).subscribe((response) => {
      this.page_loading = false;
      // this.spinner.hide();
      this.brand = response.data.brand.docs
      this.pagination_data = response.data.brand;
      this.common.set_pagination_data(this.pagination_data, 'brand');
    })
  }


  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  exportFGmaster() {
    this.btn_loading = true;
    let params = {}
    this.api.post('export_fgmaster', params).subscribe(async (response) => {
      var fgmaster = response.data
      await this.convert_excel(fgmaster)
      this.btn_loading = false;
    })
  }

  convert_excel(data) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const fgMasterHeading = ws.getCell('A1');
    fgMasterHeading.value = 'FG Master';
    fgMasterHeading.font = { bold: true, size: 16 };
    ws.mergeCells('A1:H1');
    fgMasterHeading.alignment = { horizontal: 'center', vertical: 'middle' };

    fgMasterHeading.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    fgMasterHeading.height = 30;

    ws.addRow([]);
    const dataColumnHeading = ws.getRow(2);
    dataColumnHeading.values = [
      'S.No', 'Customer Name', 'SAP Code', 'FG Code', 'FG Name', 'FG Type', 'FG Subtype', 'FG Packtype'
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
      { key: 'customer', width: 35 },
      { key: 'fg_sapcode', width: 15 },
      { key: 'brand_code', width: 15 },
      { key: 'name', width: 35 },
      { key: 'fg_type', width: 20 },
      { key: 'fg_subtype', width: 20 },
      { key: 'pack_type', width: 20 },
    ];

    data.forEach((datum, index) => {
      var validTillDate = null;
      if (datum?.select_date) {
        const dateParts = datum?.select_date.split('-');
        validTillDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      }
      const dataRow = ws.addRow({
        sno: index + 1,
        customer: datum.Customer_pop.name,
        fg_sapcode: datum.fg_sapcode,
        brand_code: datum.brand_code,
        name: datum.name,
        fg_type: datum.Fgtype_pop.name,
        fg_subtype: datum.Fgsubtype_pop.name,
        pack_type: datum.Pack_pop.name,
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
      a.download = "fgmaster.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    })
  }


  async downloadAllFGMasterExcel() {
  this.btn_loading = true;
  const params = {
    pagination: "false",
    language: "en",
    customer: this.customer,
    search: this.search,
    sort: this.sort
  };
  this.api.post('get_brand', params).subscribe(async (response) => {
    this.btn_loading = false;
    const allBrands = response.data?.brand?.docs || response.data?.brand || [];
    if (!allBrands.length) {
      this.common.alert({ msg: 'No data to export!', type: 'warning' });
      return;
    }
 
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('FG Master');
 
    // Heading
    ws.mergeCells('A1:K1');
    ws.getCell('A1').value = 'FG Master';
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    ws.getRow(1).height = 30;
 
    // Column headers (added Status, BOM, Costsheet)
    ws.addRow([]);
    const headerRow = ws.addRow([
      'S.No', 'Customer Name', 'SAP Code', 'FG Code', 'FG Name', 'FG Type', 'FG Subtype', 'FG Packtype', 'Status', 'BOM', 'Costsheet'
    ]);
    headerRow.font = { bold: true };
    headerRow.height = 24; // Set header row height
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8DB4E2' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
 
    ws.columns = [
      { key: 'sno', width: 5 },
      { key: 'customer', width: 35 },
      { key: 'fg_sapcode', width: 15 },
      { key: 'brand_code', width: 15 },
      { key: 'name', width: 40 },
      { key: 'fg_type', width: 20 },
      { key: 'fg_subtype', width: 20 },
      { key: 'pack_type', width: 20 },
      { key: 'status', width: 15 },
      { key: 'bom', width: 15 },
      { key: 'costsheet', width: 15 },
    ];
 
    allBrands.forEach((datum, index) => {
      const row = ws.addRow({
        sno: index + 1,
        customer: datum.Customer_pop?.name || '',
        fg_sapcode: datum.fg_sapcode || '',
        brand_code: datum.brand_code || '',
        name: datum.name || '',
        fg_type: datum.Fgtype_pop?.name || '',
        fg_subtype: datum.Fgsubtype_pop?.name || '',
        pack_type: datum.Pack_pop?.name || '',
        status: datum.status || '',
        bom: datum.bom || '',
        costsheet: datum.costsheet || '',
      });
      row.height = 20; // Set body row height
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      row.allignment = { horizontal: 'left', vertical: 'middle' };
    });
 
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "fgmaster.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, error => {
    this.btn_loading = false;
    this.common.alert({ msg: 'Failed to fetch data for download.', type: 'danger' });
  });
}


  delete(id) {
    let params =
    {
      id: id,
            user: this.user,

    }
    this.api.post('delete_brand', params).subscribe((response) => {
      this.get_brand(1);
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }
  confirm_delete(data) {
    data.page = "brand";
    data.message = "Are you sure to delete this brand?";
    this.common.set_delete_confirmation_data(data);
  }

  viewform(id) {
    this.router.navigate([`/fg_master/view/${id}`]);
  }
}