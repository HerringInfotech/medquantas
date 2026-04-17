import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import {
  faCheckCircle,
  faEdit,
  faEllipsisV,
  faEye,
  faFileExcel,
  faPlus,
  faSearch,
  faSort,
  faSortUp,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../shared/api/common.service';
import * as _ from 'lodash';
import { NgxSpinnerService } from 'ngx-spinner';
import { PermissionService } from '../shared/permission/permission.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-cost-master',
  templateUrl: './cost-master.component.html',
  styleUrls: ['./cost-master.component.scss'],
})
export class CostMasterComponent implements OnInit {
  bom_list;
  faSearch = faSearch;
  faPlus = faPlus;
  faCheckCircle = faCheckCircle;
  faEllipsisV = faEllipsisV;
  faEye = faEye;
  pagination_data;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  selectedbom = '';
  search = '';
  searchcode = '';
  searchloc = '';
  searchbomcode = '';
  faEdit = faEdit;
  sort = '';
  selectedstatus = '';
  faSortUp = faSortUp;
  faSort = faSort;
  faSpinner = faSpinner;
  faFileExcel = faFileExcel;
  locations = [];
  user;
  @ViewChild('select_user') select_user: TemplateRef<any>;
  modalRef: any;

  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permission: PermissionService,
    private modalService: BsModalService,
  ) {
    this.common.change_page.subscribe((data) => {
      if (data.section == 'sheet') {
        this.get_sheet(data.page);
      }
    });
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.get_sheet(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  ngOnInit(): void {
    this.get_sheet(1);
    this.get_user();
    this.get_locations();
  }

  get_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_locations() {
    this.api.post('get_unique_locations', { params: {} }).subscribe((response) => {
      if (response.status) {
        this.locations = response.data.locations;
      }
    });
  }

  get_sheet(page) {
    // this.spinner.show();
    this.page_loading = false;
    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      searchcode: this.searchcode,
      bomCode: this.searchbomcode,
      status: this.selectedstatus,
      searchloc: this.searchloc,
    };
    this.api.post('get_sheet', params).subscribe((response) => {
      // this.spinner.hide();
      this.page_loading = true;
      if (response.status) {
        this.bom_list = response.data?.sheets.docs;
        this.pagination_data = response.data.sheets;
        this.common.set_pagination_data(this.pagination_data, 'sheet');
      }
    });
  }

  formatDateWithoutTimeZone(dateString) {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', options);
  }

  downloadAllSheetsAsExcel() {
    const params = {
      pagination: "false",
      language: "en",
      search: this.search,
      searchcode: this.searchcode,
      bomCode: this.searchbomcode,
    };

    this.btn_loading = true;
    this.api.post('get_sheet', params).subscribe(async (response: any) => {
      try {
        const sheets = response.data?.sheets || [];
        const data = sheets.map((item, idx) => [
          idx + 1,
          item.productname || '',
          item.productcode || '',
          item.locCd || '',
          item.detailValues?.batch || '',
          `₹ ${item?.medopharm?.rupee}` || '',
          `$ ${item?.medopharm?.doller}` || '',
          this.formatDateWithoutTimeZone(item.createdAt) || ''
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Add main heading row and merge cells
        worksheet.addRow([]);
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = 'Cost Sheet';
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
        FileSaver.saveAs(blob, `CostSheet_${new Date().getTime()}.xlsx`);
      } catch (error) {
        console.error('Cost Excel generation error:', error);
      } finally {
        this.btn_loading = false;
      }
    }, (error) => {
      this.btn_loading = false;
    });
    this.api
      .post('export_log', {
        user: this.user,
        name: 'Cost List',
        timestamp: new Date().toISOString(),
        type: 'cost',
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
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }
}
