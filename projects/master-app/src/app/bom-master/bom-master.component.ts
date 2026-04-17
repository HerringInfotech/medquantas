import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { faCheckCircle, faFileExcel, faClipboard, faEdit, faEllipsisV, faEye, faPlus, faSearch, faSort, faSortUp, faSpinner, faTrashAlt, faUpload } from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PermissionService } from '../shared/permission/permission.service';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';



@Component({
  selector: 'app-bom-master',
  templateUrl: './bom-master.component.html',
  styleUrls: ['./bom-master.component.scss']
})
export class BomMasterComponent implements OnInit {
  bom_list;
  faTrashAlt = faTrashAlt
  faPlus = faPlus
  faUpload = faUpload;
  faSearch = faSearch;
  faEllipsisV = faEllipsisV;
  faClipboard = faClipboard;
  faCheckCircle = faCheckCircle;
  pagination_data;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  locations = [];
  selectedbom = '';
  search = '';
  searchcode = '';
  searchFgCode = '';
  searchloc = '';
  faEdit = faEdit;
  sort = '';
  role;
  selectedstatus = '';
  statuslist = ['Created', "Verified", "Approved", "Created/Declined", "Verified/Declined"];
  faSortUp = faSortUp;
  faSort = faSort;
  faEye = faEye;
  isSearch = false;
  generic_Code: '';
  search_customer: '';
  search_formtype = '';
  generic_type = ["OWN", "Tech Transfer"]
  selectedVersion
  popupData
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;
  user;
  import_loading: boolean = false;

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private renderer: Renderer2, private el: ElementRef, private common: CommonService, private spinner: NgxSpinnerService, private permission: PermissionService) {
    this.common.change_page.subscribe(data => {
      if (data.section == "bommaster") {
        this.get_bom(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_bom(1);
    this.get_locations();
    this.get_user();

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

  get_bom(page) {
    // this.spinner.show();
    this.page_loading = false;
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      search: this.search,
      searchcode: this.searchcode,
      status: this.selectedstatus,
      fgCode: this.searchFgCode,
      searchloc: this.searchloc,
    }
    this.api.post('get_bom', params).subscribe((response) => {
      // this.spinner.hide();
      this.page_loading = true;
      this.bom_list = response.data.boms.docs
      this.pagination_data = response.data.boms;
      this.common.set_pagination_data(this.pagination_data, 'bommaster');
    })
  }


  downloadAllSheetsAsExcel() {
    const params = {
      pagination: "false",
      language: "en",
    };

    this.btn_loading = true;
    this.api.post('get_bom', params).subscribe(async (response: any) => {
      try {
        const sheets = response.data.boms || [];
        const data = sheets.map((item, idx) => [
          idx + 1, // S.No
          item.name || '',
          item.code || '',
          item.locCd || '',
          item.batch || '',
          item.packstage?.length || 0,
          this.formatDateWithoutTimeZone(item.createdAt) || '',
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Add main heading row and merge cells (A1:F1 for 6 columns)
        worksheet.addRow([]);
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'BOM Sheet';
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
        worksheet.getRow(1).height = 28;

        // Add Timestamp Row
        worksheet.mergeCells('A2:G2');
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
          'S.No', 'Name', 'Code', 'Location', 'Batch', 'No of Packs', 'Date'
        ]);
        const headerRow = worksheet.getRow(3);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 22;

        // Apply fill only to header cells (A3 to G3)
        for (let i = 1; i <= 7; i++) {
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
            row.height = 22;
            const isEvenRow = (rowNumber - 3) % 2 === 0;
            for (let i = 1; i <= 7; i++) {
              const cell = row.getCell(i);

              // Alignment: center for S.No, Location, No of Packs, Date; left for others
              if (i === 1 || i === 4 || i === 6 || i === 7) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
              } else {
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
          { width: 10 },  // S.No
          { width: 60 },  // Name
          { width: 25 },  // Code
          { width: 25 },  // Location
          { width: 20 },  // Batch
          { width: 20 },  // No of Packs
          { width: 25 },  // Date
        ];

        // Export to Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, `BOM_Sheet_${new Date().getTime()}.xlsx`);
      } catch (error) {
        console.error('Excel generation error:', error);
      } finally {
        this.btn_loading = false;
      }
    }, (error) => {
      this.btn_loading = false;
    });
    this.api
      .post('export_log', {
        user: this.user,
        name: 'BOM List',
        timestamp: new Date().toISOString(),
        type: 'bom',
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
  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`) ? `${column}_desc` : `${column}_asc`;
    this.get_bom(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  formatDateWithoutTimeZone(dateString) {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.import_loading = true;
    const form = new FormData();
    form.append("file", file);
    this.api.upload('import_data', form, {}).subscribe((response) => {
      this.import_loading = false;
      event.target.value = '';
      if (response.status) {
        this.common.alert({ msg: response.message, type: 'success' });
        this.get_bom(1);
      } else {
        this.common.alert({ msg: response.message, type: 'danger' });
      }
    }, (error) => {
      this.import_loading = false;
      event.target.value = '';
      this.common.alert({ msg: 'Import failed', type: 'danger' });
    });
  }
}
