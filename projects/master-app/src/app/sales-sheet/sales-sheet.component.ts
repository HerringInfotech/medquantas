import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import {
  faCheckCircle,
  faEdit,
  faFileExcel,
  faEye,
  faPlus,
  faSearch,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../shared/api/common.service';
import { PermissionService } from '../shared/permission/permission.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-sales-sheet',
  templateUrl: './sales-sheet.component.html',
  styleUrls: ['./sales-sheet.component.scss']
})
export class SalesSheetComponent implements OnInit {
  bom_list;
  faSearch = faSearch;
  faPlus = faPlus;
  faSpinner = faSpinner;
  faCheckCircle = faCheckCircle;
  faFileExcel = faFileExcel;
  faEdit = faEdit;
  faEye = faEye;
  pagination_data;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  search = '';
  uniqueCode = '';
  searchloc = '';
  selectedDateFilter: string = '';
  fromDate: string = '';
  toDate: string = '';
  today: string = '';
  locations = [];


  constructor(
    private api: ApiService,
    private common: CommonService,
    private permission: PermissionService,
  ) {
    this.common.change_page.subscribe((data) => {
      if (data.section == 'sales') {
        this.get_sheet(data.page);
      }
    });
    this.get_locations();
  }

  ngOnInit(): void {
    this.get_sheet(1);
    this.today = new Date().toISOString().split('T')[0];
  }

  get_sheet(page) {
    this.page_loading = false;
    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      searchcode: this.uniqueCode,
      from_date: this.fromDate,
      to_date: this.toDate,
      role_name: localStorage.getItem('role_name'),
      user_id: localStorage.getItem('user_id'),
      searchloc: this.searchloc,
    };
    this.api.post('get_sale_sheet', params).subscribe((response) => {
      this.page_loading = true;
      if (response.status) {
        this.bom_list = response.data?.sheets.docs;
        this.pagination_data = response.data.sheets;
        this.common.set_pagination_data(this.pagination_data, 'sales');
      }
    });
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  get_locations() {
    this.api.post('get_unique_locations', { params: {} }).subscribe((response) => {
      if (response.status) {
        this.locations = response.data.locations;
      }
    });
  }

  onDateFilterChange() {
    const today = new Date();
    if (this.selectedDateFilter === 'today') {
      this.fromDate = this.toDate = this.formatDate(today);
      this.get_sheet(1)
    } else if (this.selectedDateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      this.fromDate = this.toDate = this.formatDate(yesterday);
      this.get_sheet(1)
    } else if (this.selectedDateFilter === 'last7days') {
      const today = new Date();
      const last7Days = new Date();
      last7Days.setDate(today.getDate() - 6);
      this.fromDate = this.formatDate(last7Days);
      this.toDate = this.today;
      this.get_sheet(1)
    } else {
      this.fromDate = '';
      this.toDate = '';
      this.get_sheet(1)
    }

  }

  onRangeDateChange() {
    if (this.toDate && this.fromDate > this.toDate) {
      this.toDate = '';
    }
    if (this.fromDate && this.toDate) {
      this.get_sheet(1)
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateWithoutTimeZone(data: any): string {
    if (!data) return '';
    const date = new Date(data);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = (date.getHours() % 12 || 12).toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`;
  }

  async downloadAllSheetsAsExcel() {
    this.btn_loading = true;
    let params = {
      pagination: 'false',
      search: this.search,
      searchcode: this.uniqueCode,
      from_date: this.fromDate,
      to_date: this.toDate,
      searchloc: this.searchloc,
    };

    this.api.post('get_sale_sheet', params).subscribe(async (response) => {
      this.btn_loading = false;
      if (response.status) {
        const sheetsData = response.data?.sheets;
        const data = (sheetsData || []).map((item, idx) => [
          idx + 1,
          item.productname || '',
          item.productcode || '',
          item.locCd || '',
          item.detailValues?.batch || '',
          `₹ ${item?.medquantas?.rupee}` || '',
          `$ ${item?.medquantas?.doller}` || '',
          this.formatDateWithoutTimeZone(item.createdAt) || ''
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Add main heading row and merge cells
        worksheet.addRow([]);
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = 'Sales Sheet Master';
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
        worksheet.getRow(1).height = 28;

        // Add Timestamp Row
        worksheet.mergeCells('A2:H2');
        const timestampCell = worksheet.getCell('A2');
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timestampCell.value = `Exported on: ${dateStr} ${timeStr}`;
        timestampCell.font = { italic: true, size: 10 };
        timestampCell.alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getRow(2).height = 18;

        // Add header row with style (now row 3)
        worksheet.addRow([
          'S.No', 'Product Name', 'Product Code', 'Location', 'Batch', 'Rate INR', 'Rate in USD', 'Date'
        ]);
        const headerRow = worksheet.getRow(3);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 22;

        // Apply fill only to header cells (A3 to H3)
        for (let i = 1; i <= 8; i++) {
          const cell = worksheet.getRow(3).getCell(i);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
          };
        }

        // Add data rows (start from row 4)
        data.forEach(row => worksheet.addRow(row));

        // Style body cells (from row 4 onwards)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 3) {
            row.alignment = { horizontal: 'left', vertical: 'middle' };
            row.height = 22;

            const isEvenRow = (rowNumber - 3) % 2 === 0;
            for (let i = 1; i <= 8; i++) {
              const cell = row.getCell(i);

              // Apply right alignment only to INR and USD rate columns
              if (i === 6 || i === 7) {
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
              } else if (i === 8 || i === 1 || i === 4) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
              }
              else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
              }


              // Apply border
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
              };

              // Optional: striped row background
              if (isEvenRow) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2F2F2' }
                };
              }
            }
          }
        });

        // Set column widths for better appearance
        worksheet.columns = [
          { width: 10 },
          { width: 50 },
          { width: 30 },
          { width: 25 }, // Location
          { width: 20 },
          { width: 20 },
          { width: 20 },
          { width: 25 }
        ];

        // Export to Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, `SalesSheet_${new Date().getTime()}.xlsx`);
      }
    });
  }
}
