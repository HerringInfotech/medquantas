import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import {
  faArrowLeft,
  faFilePdf,
  faFileExcel,
} from '@fortawesome/free-solid-svg-icons';
import { Location } from '@angular/common';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-view-bom',
  templateUrl: './view-bom.component.html',
  styleUrls: ['./view-bom.component.scss'],
})
export class ViewBomComponent implements OnInit {
  bomID: string;
  formValues: any = {};
  bom_list: any;
  rawItems: any[] = [];
  packItems: any[] = [];
  faArrowLeft = faArrowLeft;
  page_loader: boolean = false;
  faFileExcel = faFileExcel;
  faFilePdf = faFilePdf;
  user_list;
  user;
  fgName: string = 'N/A';

  constructor(
    private api: ApiService,
    private ref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private common: CommonService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.bomID = params.id;
      if (this.bomID) {
        this.get_bom(this.bomID);
      }
    });
    this.page_loader = false;
    this.get_user();
    this.get_current_user();
  }

  getFGName(fg_id: string) {
    const params = { id: fg_id };
    this.api.post('get_fg_by_id', params).subscribe((res) => {
      if (res.status && res.data) {
        this.fgName = res.data.name || 'N/A';
      }
    });
  }

  get_bom(id: string) {
    let params = { id: id };
    this.api.post('get_bom', params).subscribe((response) => {
      this.page_loader = true;
      this.bom_list = response.data.boms[0];
      this.formValues = this.bom_list;
      if (this.bom_list?.fg_id) {
        this.getFGName(this.bom_list.fg_id);
      }
      // Handle rawstage
      const rawstage = this.bom_list?.rawstage;
      if (Array.isArray(rawstage)) {
        if (rawstage.length && rawstage[0]?.ingredients) {
          this.rawItems = rawstage.reduce((acc, stage) => {
            return acc.concat(stage.ingredients || []);
          }, []);
        } else {
          this.rawItems = rawstage;
        }
      } else {
        this.rawItems = [];
      }

      // Handle packstage
      const packstage = this.bom_list?.packstage;
      if (Array.isArray(packstage)) {
        if (packstage.length && packstage[0]?.ingredients) {
          this.packItems = packstage.reduce((acc, stage) => {
            return acc.concat(stage.ingredients || []);
          }, []);
        } else {
          this.packItems = packstage;
        }
      } else {
        this.packItems = [];
      }

      this.page_loader = true;
    });
  }
  get_user() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user_list = response.data.users;
    });
  }

  convert_user(data) {
    if (this.user_list) {
      const user = this.user_list.find((item) => item.id === data);
      return user ? user.name : undefined;
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

  exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('BOM Details');
    let rowIdx = 1;

    // Main Title
    ws.mergeCells('A1:F1');
    ws.getCell('A1').value = 'Bill of Material Details';
    ws.getCell('A1').font = {
      size: 16,
      bold: true,
      color: { argb: 'FF4472C4' },
    };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 28;
    rowIdx += 2;

    // BOM Name
    ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = `BOM Name: ${this.bom_list?.name || ''}`;
    ws.getCell(`A${rowIdx}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getRow(rowIdx).height = 25;
    rowIdx++;

    // BOM Code and Batch Size
    ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws.mergeCells(`C${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = `BOM Code: ${this.bom_list?.code || ''}`;
    ws.getCell(`C${rowIdx}`).value = `Batch Size: ${
      this.bom_list?.batch || ''
    }`;
    ws.getCell(`C${rowIdx}`).value = `FG Name: ${
      this.fgName || ''
    }`;
    // doc.text(` ${this.fgName || ''}`, 90, currentY);

    ws.getCell(`A${rowIdx}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getCell(`C${rowIdx}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getRow(rowIdx).height = 25;
    rowIdx++;

    // Helper to render HTML table by ID
    function renderHtmlTableToExcel(
      tableId: string,
      ws: any,
      startRow: number
    ): number {
      const table = document.getElementById(tableId) as HTMLTableElement;
      if (!table) return startRow;
      for (let i = 0; i < table.rows.length; i++) {
        const htmlRow = table.rows[i];
        const excelRow = ws.addRow(
          Array.from(htmlRow.cells).map((cell) => cell.innerText)
        );
        // Set row height: taller for header, slightly tall for body
        excelRow.height = i === 0 ? 30 : 25;
        for (let j = 0; j < htmlRow.cells.length; j++) {
          const cell = excelRow.getCell(j + 1);
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          };
          if (i === 0) {
            // Header row
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center',
              wrapText: true,
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4472C4' },
            };
          }
        }
        startRow++;
      }
      return startRow;
    }

    // API Items Table (from HTML)
    ws.addRow([]);
    rowIdx++;
    ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = 'API Items';
    ws.getCell(`A${rowIdx}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getCell(`A${rowIdx}`).font = { bold: true, size: 14 };
    ws.getRow(rowIdx).height = 25;
    rowIdx++;
    rowIdx = renderHtmlTableToExcel('api-items-table', ws, rowIdx);

    // Packing Materials Table (from HTML)
    ws.addRow([]);
    rowIdx++;
    ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = 'Packing Materials';
    ws.getCell(`A${rowIdx}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getCell(`A${rowIdx}`).font = { bold: true, size: 14 };
    ws.getRow(rowIdx).height = 25;
    rowIdx++;
    rowIdx = renderHtmlTableToExcel('packing-material-table', ws, rowIdx);

    // Approver Status Table (fixed)
    ws.addRow([]);
    rowIdx++;
    ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
    ws.mergeCells(`E${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = 'Creator';
    ws.getCell(`C${rowIdx}`).value = 'Verifier';
    ws.getCell(`E${rowIdx}`).value = 'Approver';
    [1, 3, 5].forEach((col) => {
      const cell = ws.getRow(rowIdx).getCell(col);
      cell.font = { bold: true, color: { argb: 'FFFF0000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFDE9D9' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });
    ws.getRow(rowIdx).height = 28;
    rowIdx++;

    ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
    ws.mergeCells(`E${rowIdx}:F${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = `${
      this.convert_user(this.bom_list?.create_user) || ''
    }\n${this.formatDateWithoutTimeZone(this.bom_list?.create_time) || ''}`;
    ws.getCell(`C${rowIdx}`).value = `${
      this.convert_user(this.bom_list?.verified_user) ||
      this.convert_user(this.bom_list?.create_decline) ||
      ''
    }\n${this.formatDateWithoutTimeZone(this.bom_list?.verified_time) || ''}`;
    ws.getCell(`E${rowIdx}`).value = `${
      this.convert_user(this.bom_list?.approve_user) ||
      this.convert_user(this.bom_list?.verified_decline) ||
      ''
    }\n${this.formatDateWithoutTimeZone(this.bom_list?.approve_time) || ''}`;
    [1, 3, 5].forEach((col) => {
      const cell = ws.getRow(rowIdx).getCell(col);
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });
    ws.getRow(rowIdx).height = 38;

    // Set column widths
    ws.columns = [
      { width: 8 }, // S.No
      { width: 55 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    // Download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      FileSaver.saveAs(blob, `BOM_${this.bom_list?.code || 'Sheet'}.xlsx`);
    });

    this.api
      .post('export_log', {
        user: this.user,
        name: this.formValues?.['name'] || '',
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

  downloadPDF() {
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDF & { lastAutoTable?: any };
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(68, 114, 196);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill of Material Details', pageWidth / 2, 18, {
      align: 'center',
    });

    let currentY = 28;

    // BOM Details Section
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('BOM Details', 14, currentY);

    currentY += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
doc.text(`BOM Name: ${this.bom_list?.name || ''}`, 14, currentY);
currentY += 7;
doc.text(`Batch Size: ${this.bom_list?.batch || ''}`, 14, currentY);
doc.text(`FG Name: ${this.fgName || ''}`, 90, currentY);
currentY += 7;
doc.text(`BOM Code: ${this.bom_list?.code || ''}`, 14, currentY);
currentY += 10;
    currentY += 10;

    // API Items Section
    if (this.rawItems?.length) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('API Items', 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY + 2,
        head: [
          [
            'S.No',
            'Item Name',
            'Item Code',
            'Type',
            'StandOut Qty',
            'Request Qty',
          ],
        ],
        body: this.rawItems.map((item, idx) => [
          idx + 1,
          item?.name || '',
          item?.code || '',
          item?.typeCode || '',
          item?.standQty || '',
          item?.requestQty || '',
        ]),
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 11,
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3,
          valign: 'middle',
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          halign: 'left',
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        theme: 'grid',
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Packing Materials Section
    if (this.packItems?.length) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Packing Materials', 14, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        head: [
          [
            'S.No',
            'Item Name',
            'Item Code',
            'Type',
            'StandOut Qty',
            'Request Qty',
          ],
        ],
        body: this.packItems.map((item, idx) => [
          idx + 1,
          item?.name || '',
          item?.code || '',
          item?.typeCode || '',
          item?.standQty || '',
          item?.requestQty || '',
        ]),
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 11,
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3,
          valign: 'middle',
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          halign: 'left',
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        theme: 'grid',
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Status Table Section
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Approver Status', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY + 2,
      head: [
        [
          {
            content: 'Creator',
            styles: {
              textColor: [255, 0, 0],
              fontStyle: 'bold',
              halign: 'center',
            },
          },
          {
            content: 'Verifier',
            styles: {
              textColor: [255, 0, 0],
              fontStyle: 'bold',
              halign: 'center',
            },
          },
          {
            content: 'Approver',
            styles: {
              textColor: [255, 0, 0],
              fontStyle: 'bold',
              halign: 'center',
            },
          },
        ],
      ],
      body: [
        [
          `${this.convert_user(this.bom_list?.create_user) || ''}\n${
            this.formatDateWithoutTimeZone(this.bom_list?.create_time) || ''
          }`,
          `${
            this.convert_user(this.bom_list?.verified_user) ||
            this.convert_user(this.bom_list?.create_decline) ||
            ''
          }\n${
            this.formatDateWithoutTimeZone(this.bom_list?.verified_time) || ''
          }`,
          `${
            this.convert_user(this.bom_list?.approve_user) ||
            this.convert_user(this.bom_list?.verified_decline) ||
            ''
          }\n${
            this.formatDateWithoutTimeZone(this.bom_list?.approve_time) || ''
          }`,
        ],
      ],
      headStyles: {
        fillColor: [253, 233, 217],
        textColor: [255, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 12,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 11,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        halign: 'center',
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    doc.save(`${this.bom_list?.name || 'BOM Details'}.pdf`);
    this.api
      .post('export_log', {
        user: this.user,
        name: this.formValues?.['name'] || '',
        timestamp: new Date().toISOString(),
        type: 'bom',
        format: 'PDF',
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

  formatDateWithoutTimeZone(dateString: string) {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', options);
  }

  goBack(): void {
    this.location.back();
  }
}
