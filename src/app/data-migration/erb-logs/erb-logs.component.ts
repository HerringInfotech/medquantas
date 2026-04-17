import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../../shared/api/common.service';
import { faEdit, faSearch, faSort, faSortUp, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../../shared/permission/permission.service';
import { ActivatedRoute } from '@angular/router';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-erb-logs',
  templateUrl: './erb-logs.component.html',
  styleUrls: ['./erb-logs.component.scss']
})
export class ErbLogsComponent implements OnInit {
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
  type = ''
  currentPage: number = 1;
  searchChanged: Subject<string> = new Subject<string>();
  filterDateRange = '';
  fromDate = '';
  toDate = '';


  constructor(private api: ApiService, private route: ActivatedRoute, private spinner: NgxSpinnerService, private common: CommonService, private permission: PermissionService) {
    this.common.change_page.subscribe(data => {
      if (data.section == "erb") {
        this.get_customer(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.type = params.id
    })
    this.searchChanged.pipe(debounceTime(300)).subscribe((searchTerm) => {
      this.get_customer(1);
    });
    this.get_customer(1)
  }

  onSearchChange(value: string) {
    this.searchChanged.next(value.trim());
  }

  export_log() {
    this.btn_loading = true;
    let params = {
      type: this.type,
      pagination: "false",
      language: "en",
      search_customer: this.search ? this.search.trim() : '',
      sort: this.sort,
      from_date: this.fromDate,
      to_date: this.toDate
    }
    this.api.post('get_erb_logs', params).subscribe((response) => {
      this.btn_loading = false;
      if (response.status && response.data?.docs?.length) {
        this.convert_excel(response.data.docs);
      } else {
        this.common.alert({ msg: 'No logs found for export.', type: 'danger' });
      }
    }, () => {
      this.btn_loading = false;
    });
  }

  convert_excel(data) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('ERP Logs');

    // 🔹 Title Row
    ws.mergeCells('A1:J1');
    const logHeading = ws.getCell('A1');
    logHeading.value = `ERP ${this.type} Update Status Report`;
    logHeading.font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
    logHeading.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // 🔹 Timestamp Row
    ws.mergeCells('A2:J2');
    const timestampCell = ws.getCell('A2');
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestampCell.value = `Exported on: ${dateStr} ${timeStr}`;
    timestampCell.font = { italic: true, size: 10 };
    timestampCell.alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getRow(2).height = 18;

    const dataColumnHeading = ws.getRow(3);
    if (this.type === 'BOM') {
      dataColumnHeading.values = ['S.No', 'Date', 'Bom Code', 'Bom Name', 'Item Code', 'Item Name', 'Stand Qty', 'Request Qty'];
      ws.columns = [
        { key: 'sno', width: 8 },
        { key: 'date', width: 25 },
        { key: 'bomcode', width: 15 },
        { key: 'bomname', width: 25 },
        { key: 'code', width: 15 },
        { key: 'itemname', width: 35 },
        { key: 'standQty', width: 15 },
        { key: 'requestQty', width: 15 },
      ];
    } else if (this.type === 'ITEM') {
      dataColumnHeading.values = ['S.No', 'Date', 'Code', 'Name', 'Type', 'Subtype', 'Buy Unit', 'Convert Unit'];
      ws.columns = [
        { key: 'sno', width: 8 },
        { key: 'date', width: 25 },
        { key: 'code', width: 15 },
        { key: 'name', width: 35 },
        { key: 'type', width: 15 },
        { key: 'subtype', width: 15 },
        { key: 'buyunit', width: 15 },
        { key: 'convertunit', width: 15 },
      ];
    } else {
      dataColumnHeading.values = ['S.No', 'Date', 'Code', 'Name', 'BsRt','Currency Code', 'Conversion Rate', 'GRN Rate in INR', 'GST %'];
      ws.columns = [
        { key: 'sno', width: 8 },
        { key: 'date', width: 25 },
        { key: 'code', width: 15 },
        { key: 'name', width: 40 },
        { key: 'rate', width: 15 },
        { key: 'currency', width: 16 },
        { key: 'convert', width: 16 },
        { key: 'grnrate', width: 15 },
        { key: 'gst', width: 10 },
      ];
    }

    dataColumnHeading.eachCell((cell) => {
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
    dataColumnHeading.height = 25;

    data.forEach((item, index) => {
      let dataRow;
      const dateVal = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
      if (this.type === 'BOM') {
        dataRow = ws.addRow({
          sno: index + 1,
          date: dateVal,
          bomcode: item.bomcode || '',
          bomname: item.bomname || '',
          code: item.code || '',
          itemname: item.itemname || '',
          standQty: item.standQty || '',
          requestQty: item.requestQty || '',
        });
      } else if (this.type === 'ITEM') {
        dataRow = ws.addRow({
          sno: index + 1,
          date: dateVal,
          code: item.code || '',
          name: item.name || '',
          type: item.type || '',
          subtype: item.subtype || '',
          buyunit: item.buyunit || '',
          convertunit: item.convertUnit || '',
        });
      } else {
        dataRow = ws.addRow({
          sno: index + 1,
          date: dateVal,
          code: item.code || '',
          name: item.name || '',
          rate: item.rate || '',
          currency: item.currency || '',
          convert: item.convert || '',
          grnrate: item.grnRate || '',
          gst: item.gst || '',
        });
      }

      dataRow.height = 20;

      // Alignments & Number formats
      dataRow.getCell('sno').alignment = { horizontal: 'center' };
      dataRow.getCell('date').alignment = { horizontal: 'center' };
      dataRow.getCell('code').alignment = { horizontal: 'center' };

      if (this.type === 'BOM') {
        dataRow.getCell('bomcode').alignment = { horizontal: 'center' };
        dataRow.getCell('standQty').alignment = { horizontal: 'right' };
        dataRow.getCell('requestQty').alignment = { horizontal: 'right' };
      } else if (this.type === 'ITEM') {
        dataRow.getCell('type').alignment = { horizontal: 'center' };
        dataRow.getCell('subtype').alignment = { horizontal: 'center' };
        dataRow.getCell('buyunit').alignment = { horizontal: 'center' };
        dataRow.getCell('convertunit').alignment = { horizontal: 'center' };
      } else {
        dataRow.getCell('rate').alignment = { horizontal: 'right' };
        dataRow.getCell('convert').alignment = { horizontal: 'right' };
        dataRow.getCell('grnrate').alignment = { horizontal: 'right' };
        dataRow.getCell('gst').alignment = { horizontal: 'right' };
        dataRow.getCell('currency').alignment = { horizontal: 'center' };
      }

      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (index % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        }
      });
    });

    wb.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ERB_${this.type}_Logs.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    });
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

  onDateRangeChange() {
    const today = new Date();
    this.toDate = this.formatDate(today);

    if (this.filterDateRange === 'today') {
      this.fromDate = this.formatDate(today);
    } else if (this.filterDateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      this.fromDate = this.formatDate(yesterday);
      this.toDate = this.formatDate(yesterday);
    } else if (this.filterDateRange === 'weekly') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      this.fromDate = this.formatDate(lastWeek);
    } else if (this.filterDateRange === 'monthly') {
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      this.fromDate = this.formatDate(lastMonth);
    } else if (this.filterDateRange === '') {
      this.fromDate = '';
      this.toDate = '';
    }

    // Only call get_customer if it's not custom, as custom dates are bound to custom input fields
    if (this.filterDateRange !== 'custom') {
      this.get_customer(1);
    }
  }

  onCustomDateChange() {
    this.filterDateRange = 'custom';
    if (this.fromDate && this.toDate) {
      this.get_customer(1);
    } else if (!this.fromDate && !this.toDate) {
      this.filterDateRange = '';
      this.get_customer(1);
    }
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  get_customer(page) {
    this.spinner.show();
    let params = {
      type: this.type,
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      search_customer: this.search ? this.search.trim() : '',
      sort: this.sort,
      from_date: this.fromDate,
      to_date: this.toDate
    }
    this.api.post('get_erb_logs', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = false;
      this.customer = response.data.docs
      this.pagination_data = response.data;
      this.common.set_pagination_data(this.pagination_data, 'erb');
    })
  }
}