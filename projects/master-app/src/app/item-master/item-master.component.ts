import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
// import { MigrationService } from '../shared/api/migration.service';
import {
  faEdit,
  faPlus,
  faSearch,
  faSort,
  faSortUp,
  faTrashAlt,
  faUpload,
  faFileExcel,
  faSpinner,
  faSync,
  faPlug,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import { NgxSpinnerService } from 'ngx-spinner';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-item-master',
  templateUrl: './item-master.component.html',
  styleUrls: ['./item-master.component.scss'],
})
export class ItemMasterComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  page = 1;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  item;
  pagination_data;
  permissions;
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faSearch = faSearch;
  sort = '';
  faSortUp = faSortUp;
  faSort = faSort;
  faPlus = faPlus;
  faUpload = faUpload;
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;

  selectedtype = ''
  selectedsubtype = ''
  role;
  user;
  currentPage: number = 1;
  isDeleting = false;
  deleteSub: any;
  search: string = '';
  searchChanged: Subject<string> = new Subject<string>();

  // Add ERP Sync related properties
  isSyncingItems = false;
  isTestingConnection = false;
  isSyncingGRN = false; // NEW - for GRN price sync
  type: ''
  type_list = []
  subtype_list = []

  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permission: PermissionService // private migrationService: MigrationService // Add this injection
  ) {
    this.common.change_page.subscribe((data) => {
      if (data.section == 'item') {
        this.get_item(data.page);
        this.currentPage = data.page;
      }
    });
  }

  ngOnInit(): void {
    this.get_type()
    this.get_subtype()
    this.searchChanged.pipe(debounceTime(300)).subscribe((searchTerm) => {
      this.fetch_items();
    });
    this.get_item(1);
    this.get_role();
    this.get_user();
    this.deleteSub = this.common.delete_detail.subscribe((value) => {
      if (value.page == 'item') {
        this.delete(value.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
    }
  }

  onSearchChange(value: string) {
    this.searchChanged.next(value.trim());
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.get_item(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  get_role() {
    let params = {
      id: localStorage.getItem('id'),
    };
    this.api.post('get_role', params).subscribe((response) => {
      this.role = response.data?.roles[0];
    });
  }

  get_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_type() {
    let params = {};
    this.api.post('get_itemtype', params).subscribe((response) => {
      if (response.status) {
        this.type_list = response.data?.itemtype;
      }
    });
  }

  get_subtype() {
    let params = {};
    this.api.post('get_subtype', params).subscribe((response) => {
      if (response.status) {
        this.subtype_list = response.data?.subtypes;
      }
    });
  }

  get_item(page) {
    this.page_loading = true;
    this.spinner.show();

    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
      selectedtype: this.selectedtype,
      selectedsubtype: this.selectedsubtype
    };
    this.api.post('get_item', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = false;
      this.item = response.data.item.docs;
      this.pagination_data = response.data.item;
      this.common.set_pagination_data(this.pagination_data, 'item');
    });
  }

  fetch_items() {
    const params = {
      pagination: 'true',
      page: 1,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
      selectedtype: this.selectedtype,
      selectedsubtype: this.selectedsubtype
    };
    this.api.post('get_item', params).subscribe((response) => {
      this.item = response.data.item.docs;
      this.pagination_data = response.data.item;
      this.common.set_pagination_data(this.pagination_data, 'item');
    });
  }

  export_item() {
    this.btn_loading = true;
    const page = this.currentPage || 1;
    const params = {
      page,
      limit: 10,
      search: this.search,
      sort: this.sort,
      user: this.user,
    };

    this.api
      .post('export_item', params)
      .toPromise()
      .then((response: any) => {
        if (response.status && response.data?.items?.length) {
          this.convert_excel(response.data.items);
        } else {
          console.warn('No items found for export.');
        }
      })
      .catch((error) => {
        console.error('Export failed:', error);
      })
      .finally(() => {
        this.btn_loading = false;
      });
  }

  convert_excel(data) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    const itemMasterHeading = ws.getCell('A1');
    itemMasterHeading.value = 'Item Master';
    itemMasterHeading.font = { bold: true, size: 16 };
    ws.mergeCells('A1:J1');
    itemMasterHeading.alignment = { horizontal: 'center', vertical: 'middle' };
    itemMasterHeading.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    ws.addRow([]);

    const dataColumnHeading = ws.getRow(2);
    dataColumnHeading.values = [
      'S.No',
      'Item Type',
      'Sub Type',
      'Percentage',
      'Item Code',
      'Item Name',
      'Purchase Unit',
      'UOM',
      'Conversion Unit',
    ];
    dataColumnHeading.font = { bold: true };
    dataColumnHeading.alignment = { horizontal: 'center', vertical: 'middle' };
    dataColumnHeading.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8DB4E2' },
        };
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    ws.columns = [
      { key: 'sno', width: 5 },
      { key: 'item_type', width: 15 },
      { key: 'sub_type', width: 15 },
      { key: 'percentage', width: 15 },
      { key: 'item_code', width: 15 },
      { key: 'item_name', width: 40 },
      { key: 'purchase_unit', width: 15 },
      { key: 'uom', width: 15 },
      { key: 'conversion', width: 15 },
    ];

    data.forEach((item, index) => {
      const makeNames =
        item.assign_Makes?.map((data) => data.name).join(', ') || '';

      const dataRow = ws.addRow({
        sno: index + 1,
        item_type: item.typeCode || '',
        sub_type: item.subtypeCode || '',
        percentage: item.percentage || '',
        item_sapcode: item.hsnCode || '',
        item_code: item.code || '',
        item_name: item.name || '',
        purchase_unit: item.buyUnit || '',
        uom: item.convertUnit || '',
        conversion: item.convertRate || '',
        make_name: makeNames,
      });

      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.style.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    wb.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itemmaster.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  delete(id) {
    if (this.isDeleting) return;
    this.isDeleting = true;

    let params = {
      id: id,
      user: this.user,
      role: this.role,
    };

    this.api.post('delete_item', params).subscribe(
      (response) => {
        this.get_item(1);
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        this.isDeleting = false;
      },
      () => {
        this.isDeleting = false;
      }
    );
  }

  confirm_delete(data) {
    data.page = 'item';
    data.message = 'Are you sure to delete this Item?';
    this.common.set_delete_confirmation_data(data);
  }

  import_percentage() {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.btn_loading = true;
      this.spinner.show();
      const formData = new FormData();
      formData.append('file', file);
      console.log(file)
      let params = {}
      this.api.upload('percentage_bom_upload', formData, params).subscribe((response) => {
        this.btn_loading = false;
        this.spinner.hide();
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        if (response.status) {
          this.get_item(1);
        }
        // Reset file input
        this.fileInput.nativeElement.value = '';
      },
        (error) => {
          this.btn_loading = false;
          this.spinner.hide();
          this.common.alert({
            msg: 'Error uploading file',
            type: 'danger',
          });
          this.fileInput.nativeElement.value = '';
        }
      );
    }
  }
}
