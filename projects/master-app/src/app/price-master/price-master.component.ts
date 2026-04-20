import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import {
  faEdit,
  faEye,
  faPlus,
  faSearch,
  faSort,
  faSortUp,
  faTrashAlt,
  faPlug,
  faMoneyBillWave,
  faSync,
  faSpinner,
  faFileExcel,
} from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import { NgxSpinnerService } from 'ngx-spinner';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { CurrencyService } from '../shared/currency.service';
import * as FileSaver from 'file-saver';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrls: ['./price-master.component.scss'],
})
export class PriceMasterComponent implements OnInit {
  btn_loading: Boolean = false;
  search = '';
  sort = '';
  page_loading: Boolean = false;
  pagination_data;
  rate_item;
  permissions;
  faTrashAlt = faTrashAlt;
  faEye = faEye;
  faEdit = faEdit;
  faPlus = faPlus;
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;
  faSearch = faSearch;
  faSortUp = faSortUp;
  faSort = faSort;
  faPlug = faPlug;
  faSync = faSync;
  faMoneyBillWave = faMoneyBillWave;
  selectedtype = '';
  role;
  user;
  isDeleting = false;
  deleteSub: any;
  pageChangeSub: any;
  currentPage: number = 1;
  type_list: any = []
  currency_list: any = [];
  selectedCurrencies: any = [];

  private searchChanged: Subject<string> = new Subject<string>();

  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permission: PermissionService,
    public currencyService: CurrencyService
  ) {
    this.currencyService.fetchConversionFactor();
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.get_rate(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  ngOnInit(): void {
    this.get_rate(1);
    this.get_role();
    this.get_user();
    this.get_type();
    this.get_currencies();
    this.currencyService.fetchConversionFactor();
    this.searchChanged.pipe(debounceTime(300)).subscribe((searchTerm) => {
      this.fetch_items(); // Trigger the API
    });

    this.deleteSub = this.common.delete_detail.subscribe((value) => {
      if (value.page == 'ratemaster') {
        this.delete(value.id);
      }
    });

    this.pageChangeSub = this.common.change_page.subscribe((data) => {
      if (data.section == 'ratemaster') {
        this.get_rate(data.page);
        this.currentPage = data.page;
      }
    });
  }
  ngOnDestroy(): void {
    if (this.deleteSub) this.deleteSub.unsubscribe();
    if (this.pageChangeSub) this.pageChangeSub.unsubscribe();
  }

  onSearchChange(value: string) {
    this.searchChanged.next(value);
  }

  get_type() {
    let params = {};
    this.api.post('get_itemtype', params).subscribe((response) => {
      if (response.status) {
        this.type_list = response.data?.itemtype;
      }
    });
  }


  get_currencies() {
    this.api.post('get_unique_currencies', {}).subscribe((response) => {
      if (response.status) {
        this.currency_list = response.data.currencies
      }
    });
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
  get_rate(page) {
    // this.spinner.show();
    this.page_loading = true;

    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
      type_code: this.selectedtype,
      currency: this.selectedCurrencies
    };
    this.api.post('get_rate', params).subscribe((response) => {
      // this.spinner.hide();
      this.rate_item = response.data?.rate?.docs.map(item => {
        const currency = (item.currency || '').toUpperCase();
        if (currency === 'INR') {
          item.gst = item.gst != null ? parseFloat(item.gst) : 0;
        } else {
          item.gst = 0;
        }
        if (item.grnRate != null) item.grnRate = parseFloat(item.grnRate);
        if (item.rate != null) item.rate = parseFloat(item.rate);
        if (item.convert != null) item.convert = parseFloat(item.convert);
        if (item.bsrt != null) item.bsrt = parseFloat(item.bsrt);
        return item;
      });
      this.pagination_data = response.data.rate;
      this.common.set_pagination_data(this.pagination_data, 'ratemaster');
      this.page_loading = false;
    });
  }

  fetch_items() {
    let params = {
      pagination: 'true',
      page: this.currentPage,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
      type_code: this.selectedtype,
      currency: this.selectedCurrencies
    };
    this.api.post('get_rate', params).subscribe((response) => {
      this.rate_item = response.data?.rate?.docs.map(item => {
        const currency = (item.currency || '').toUpperCase();
        if (currency === 'INR') {
          item.gst = item.gst != null ? parseFloat(item.gst) : 0;
        } else {
          item.gst = 0;
        }
        if (item.grnRate != null) item.grnRate = parseFloat(item.grnRate);
        if (item.rate != null) item.rate = parseFloat(item.rate);
        if (item.convert != null) item.convert = parseFloat(item.convert);
        if (item.bsrt != null) item.bsrt = parseFloat(item.bsrt);
        return item;
      });
      this.pagination_data = response.data.rate;
      this.common.set_pagination_data(this.pagination_data, 'ratemaster');
    });
  }

  async downloadAllRatesExcel() {
    this.btn_loading = true;

    // Inform user
    this.common.alert({
      msg: 'Preparing download. This may take a while. Please wait...',
      type: 'info',
    });

    let allRates: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      console.log('Starting fetch for all rates...');
      do {
        console.log(`Fetching page ${currentPage} of ${totalPages}...`);
        const params = {
          pagination: 'true',
          page: currentPage,
          per_page: 2000,
          language: 'en',
          search: this.search,
          sort: 'code_asc',
          type_code: this.selectedtype,
          currency: this.selectedCurrencies
        };

        const response: any = await this.api.post('get_rate', params).toPromise();

        if (response?.data?.rate?.docs) {
          allRates.push(...response.data.rate.docs);
          totalPages = response.data.rate.totalPages || 1;
        } else {
          break;
        }
        currentPage++;
      } while (currentPage <= totalPages);

      console.log(`Successfully fetched ${allRates.length} rates.`);
      this.btn_loading = false;

      if (!allRates.length) {
        this.common.alert({ msg: 'No data to export!', type: 'warning' });
        return;
      }

      console.log('Generating Excel sheet...');
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Price Master');

      // 🔹 Title Row
      ws.mergeCells('A1:L1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'Price Master Report';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      // 🔹 Timestamp Row
      ws.mergeCells('A2:L2');
      const timestampCell = ws.getCell('A2');
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timestampCell.value = `Exported on: ${dateStr} ${timeStr}`;
      timestampCell.font = { italic: true, size: 10 };
      timestampCell.alignment = { horizontal: 'right', vertical: 'middle' };
      ws.getRow(2).height = 18;

      // 🔹 Column Setup
      ws.columns = [
        { key: 'sno', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { key: 'type', width: 15, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { key: 'name', width: 50, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { key: 'code', width: 20, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { key: 'uom', width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { key: 'bsrt', width: 12, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { key: 'currency', width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { key: 'convert', width: 18, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { key: 'grnRate', width: 15, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { key: 'grnDate', width: 18, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { key: 'rate', width: 18, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { key: 'gst', width: 10, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
      ];

      const headerRow = ws.addRow([
        'S.No',
        'Type Name',
        'Item Name',
        'Item Code',
        'UOM',
        'BsRt',
        'Currency Code',
        'Conversion Rate',
        'GRN Rate in INR',
        'GRN Date',
        'Medquantas Price in INR',
        'GST %'
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      headerRow.height = 25;

      // 🔹 Add Data
      allRates.forEach((item, idx) => {
        let grnDate = '-';
        if (item.grnUpdatedate) {
          const d = new Date(item.grnUpdatedate);
          grnDate = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        }

        const rowData = {
          sno: idx + 1,
          type: item?.item_pop?.typeCode || '-',
          name: item.name || '-',
          code: item.code || '-',
          uom: item?.item_pop?.buyUnit || '-',
          bsrt: item.bsrt != null ? Number(item.bsrt) : 0,
          currency: item.currency || '-',
          convert: item.convert != null ? Number(item.convert) : 0,
          grnRate: item.grnRate != null ? Number(item.grnRate) : 0,
          grnDate: grnDate,
          rate: item.rate != null ? Number(item.rate) : 0,
          gst: item.gst != null ? Number(item.gst) : 0,
        };

        const row = ws.addRow(rowData);
        row.height = 20;
      });

      console.log('Writing Excel file to buffer...');
      // 🔹 Export to Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fileName = `Rate_Master_${new Date().getTime()}.xlsx`;
      FileSaver.saveAs(blob, fileName);

      this.api
        .post('export_log', {
          user: this.user,
          name: 'Price List',
          timestamp: new Date().toISOString(),
          type: 'price',
          format: 'Excel',
        })
        .toPromise()
        .then((res: any) => {
          if (!res.status) {
            console.warn('Logging export failed');
          }
        })
        .catch((err) => {
          console.error('Logging error:', err);
        });

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export Error:', error);
      this.common.alert({
        msg: 'Failed to fetch data for download. Please check the console list for detail error.',
        type: 'danger',
      });
    } finally {
      this.btn_loading = false;
    }
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  convert_to_currency(rate) {
    if (rate) {
      var parts = rate.toString().split('.');
      parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
      return parts.join('.');
    } else {
      return 0;
    }
  }

  delete(id) {
    if (this.isDeleting) return;
    this.isDeleting = true;

    let params = {
      id: id,
      user: this.user,
      role: this.role,
    };
    this.api.post('delete_rate', params).subscribe(
      (response) => {
        this.get_rate(1);
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
    data.page = 'ratemaster';
    data.message = 'Are you sure to delete this Rate?';
    this.common.set_delete_confirmation_data(data);
  }
}
