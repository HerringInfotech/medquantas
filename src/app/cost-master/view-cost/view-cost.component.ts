import {
  Component,
  ElementRef,
  ChangeDetectorRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import {
  faArrowLeft,
  faEye,
  faTrashAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import * as _ from 'lodash';
import { PermissionService } from '../../shared/permission/permission.service';
import { SocketService } from '../../shared/api/socket.service';
import { Subscription } from 'rxjs';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { hasAlignedHourOffset } from 'ngx-bootstrap/chronos/units/offset';
import { CurrencyService } from '../../shared/currency.service';

@Component({
  selector: 'app-view-cost',
  templateUrl: './view-cost.component.html',
  styleUrls: ['./view-cost.component.scss'],
})
export class ViewCostComponent implements OnInit {
  sheetID;
  sheetData;
  page_loader: boolean = false;
  btn_loader_excel: boolean = false;
  btn_loader_pdf: boolean = false;
  status_loader: boolean = false;

  formValues: Object = {};

  rawstage = [];
  packstage = [];
  user_list;
  cost_data;
  convertrate;
  ObjValues: Object = {};
  selectPack = [];
  packtype;
  product;
  productList = [];
  packtypeList;
  totalcost;
  percentage;
  finalstage;
  faArrowLeft = faArrowLeft;
  totalRaws: any[] = [];
  faFilePdf = faFilePdf;
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;
  isActive: boolean = false;
  private currencySub: Subscription;
  user;
  setting_data: any;

  medopharm;
  system;
  detailValues: any = {};
  constructor(
    private api: ApiService,
    private ref: ChangeDetectorRef,
    private location: Location,
    private socket: SocketService,
    private permission: PermissionService,
    private modalService: BsModalService,
    private router: Router,
    private route: ActivatedRoute,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    public currencyService: CurrencyService
  ) {
    this.currencyService.fetchConversionFactor();
  }

  // ngOnInit(): void {
  //   this.get_packtype();
  //   this.route.params.subscribe((params) => {
  //     this.sheetID = params.id;
  //     if (this.sheetID) {
  //       this.get_sheet(this.sheetID);
  //     }
  //   });
  //   this.isActive = this.currencyService.isActive;
  //   this.get_user();
  //   this.get_current_user();
  //       this.currencyService.fetchConversionFactor();

  // }

  async ngOnInit() {
    this.get_packtype();

    // Fetch conversion factor first
    const factor = await this.currencyService.fetchConversionFactor();
    this.convertrate = factor;
    this.route.params.subscribe((params) => {
      this.sheetID = params.id;
      if (this.sheetID) {
        this.get_sheet(this.sheetID);
      }
    });

    this.isActive = this.currencyService.isActive;
    this.get_user();
    this.get_current_user();

    this.currencySub = this.currencyService.isConversionActive$.subscribe(
      (val) => {
        this.isActive = val;
        if (this.percentage && this.percentage['factorycost']) {
          this.changePrice();
        }
      }
    );
  }


  ngOnDestroy(): void {
    if (this.currencySub) this.currencySub.unsubscribe();
  }

  async generateExcel() {
    try {
      this.btn_loader_excel = true;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Cost Analysis Report');
      ws.views = [{ showGridLines: false }];

      // Royal Colors
      const COLORS = {
        navy: 'FF1E3A8A', // Deep Navy
        gold: 'FFD4AF37', // Metallic Gold
        softGold: 'FFFFFBEB', // Very light gold for backgrounds
        textMain: 'FF1F2937',
        border: 'FFE5E7EB'
      };

      let currentRow = 1;

      // 1. ROYAL HEADER (Letterhead Style)
      ws.getRow(currentRow).height = 15;
      currentRow++;

      const logoUrl = 'assets/images/logo.png';
      try {
        const logoBase64 = await this.getImageBase64(logoUrl);
        if (logoBase64) {
          const excelLogoImage = (workbook as any).addImage({
            base64: logoBase64,
            extension: 'png',
          });
          (ws as any).addImage(excelLogoImage, {
            tl: { col: 0.3, row: 0.2 },
            ext: { width: 100, height: 70 },
          });
        }
      } catch (err) {
        console.warn('Excel Logo Load Failed', err);
      }

      // Title & Branding
      ws.mergeCells(currentRow, 6, currentRow + 1, 15);
      const titleCell = ws.getCell(currentRow, 6);
      titleCell.value = 'COST ANALYSIS & VALUATION REPORT';
      titleCell.font = { bold: true, size: 22, color: { argb: COLORS.navy } };
      titleCell.alignment = { horizontal: 'right', vertical: 'middle' };
      currentRow += 2;

      ws.mergeCells(currentRow, 6, currentRow, 15);
      const subTitleCell = ws.getCell(currentRow, 6);
      subTitleCell.value = `Exported by ${this.user?.name || 'Authorized User'} on ${new Date().toLocaleString()}`;
      subTitleCell.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
      subTitleCell.alignment = { horizontal: 'right' };
      currentRow += 2;

      // Royal Separator
      ws.mergeCells(currentRow, 1, currentRow, 15);
      ws.getCell(currentRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
      ws.getRow(currentRow).height = 5;
      currentRow++;
      ws.mergeCells(currentRow, 1, currentRow, 15);
      ws.getCell(currentRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gold } };
      ws.getRow(currentRow).height = 2;
      currentRow += 2;

      // === Helper for Section Headers ===
      const addRoyalHeader = (text: string, color: string) => {
        ws.mergeCells(currentRow, 1, currentRow, 15);
        const cell = ws.getCell(currentRow, 1);
        cell.value = `    ${text.toUpperCase()}`;
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'medium', color: { argb: COLORS.gold } },
          left: { style: 'medium', color: { argb: COLORS.navy } }
        };
        ws.getRow(currentRow).height = 30;
        currentRow++;
      };

      const renderHtmlTableToExcel = (tableId: string, heading?: string, headingColor?: string) => {
        const table = document.getElementById(tableId) as HTMLTableElement;
        if (!table) return;
        if (heading && headingColor) addRoyalHeader(heading, headingColor);

        const isDetails = tableId === 'costsheet-details-excel';

        for (let i = 0; i < table.rows.length; i++) {
          const htmlRow = table.rows[i];
          let excelCol = 1;

          for (let j = 0; j < htmlRow.cells.length; j++) {
            const cell = htmlRow.cells[j];
            const colspan = cell.colSpan || 1;
            const excelCell = ws.getCell(currentRow, excelCol);
            excelCell.value = cell.textContent?.trim() || '';

            const isRight = cell.classList.contains('text-end');
            const isCenter = cell.classList.contains('text-center');
            excelCell.alignment = {
              horizontal: isRight ? 'right' : isCenter ? 'center' : 'left',
              vertical: 'middle',
              indent: (isRight || isCenter) ? 0 : 2,
              wrapText: true
            };

            if (cell.tagName.toLowerCase() === 'th' || cell.classList.contains('font-weight-bold')) {
              excelCell.font = { bold: true, size: 10, color: { argb: COLORS.navy } };
              excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDetails ? COLORS.softGold : 'FFE5E7EB' } };
            } else {
              excelCell.font = { size: 10, color: { argb: COLORS.textMain } };
            }

            excelCell.border = {
              top: { style: 'thin', color: { argb: COLORS.border } },
              left: { style: 'thin', color: { argb: COLORS.border } },
              bottom: { style: 'thin', color: { argb: COLORS.border } },
              right: { style: 'thin', color: { argb: COLORS.border } },
            };

            if (colspan > 1) {
              ws.mergeCells(currentRow, excelCol, currentRow, excelCol + colspan - 1);
            }
            excelCol += colspan;
          }

          if (i % 2 === 1 && !isDetails) {
            ws.getRow(currentRow).eachCell(cell => {
              if (!cell.fill || (cell.fill as any).fgColor?.argb === 'FFFFFFFF') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
              }
            });
          }
          ws.getRow(currentRow).height = 26;
          currentRow++;
        }
        currentRow++;
      };

      // RUN SEQUENCE
      renderHtmlTableToExcel('costsheet-details-excel');
      renderHtmlTableToExcel('api-table', 'Material Procurement & API Analysis', COLORS.navy);
      renderHtmlTableToExcel('packing-table', 'Packaging Components Analysis', 'FF166534');
      renderHtmlTableToExcel('total-material-table', 'Consolidated Material Valuation', 'FF581C87');
      renderHtmlTableToExcel('systematic-cost-table', 'Standard System Costing', COLORS.navy);
      renderHtmlTableToExcel('medopharam-cost-table', 'Medopharm Internal Valuation', 'FF1E1B4B');

      ws.columns = [
        { width: 45 }, // 1. S.No & Name (Combined)
        { width: 15 }, // 2. Code
        { width: 12 }, // 4. Qty
        { width: 10 }, // 5. UOM
        { width: 12 }, // 6. STD Rate
        { width: 12 }, // 7. Rate
        { width: 10 }, // 8. GST%
        { width: 12 }, // 9. Excise
        { width: 12 }, // 10. Cess
        { width: 12 }, // 11. CST
        { width: 12 }, // 12. TOTAL
        { width: 12 }, // 13. Value
        { width: 12 }, // 14. ITC
        { width: 15 }, // 15. Net AMT
        { width: 15 }  // 16. Cost
      ];

      // File Management
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
      const fileName = `${this.sheetData?.name || 'CostSheet'}-${dateStr}`;
      FileSaver.saveAs(blob, `${fileName}.xlsx`);

      this.api.post('export_log', {
        user: this.user, name: this.sheetData?.name || '', timestamp: new Date().toISOString(), type: 'cost', format: 'Excel'
      }).toPromise().then((res: any) => { if (!res.status) console.warn('Logging export failed'); }).catch(err => console.error('Logging error:', err));
    } catch (e) {
      console.error(e);
    } finally {
      this.btn_loader_excel = false;
    }
  }

  async generatePDF() {
    try {
      this.btn_loader_pdf = true;
      const doc = new jsPDF('landscape', 'pt', 'a4');
      const pageMargins = { top: 40, bottom: 40, left: 30, right: 30 };
      let y = pageMargins.top;

      const COLORS = {
        primary: '#1E3A8A',
        header: '#F8FAFC',
        textMain: '#1F2937',
        textLight: '#64748B',
        tableHead: '#1E40AF',
        tableStriped: '#F8FAFC'
      };

      // 1. BRANDED HEADER SECTION
      doc.setFillColor(COLORS.header);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 100, 'F');

      const logoUrl = 'assets/images/logo.png';
      try {
        const logoBase64 = await this.getImageBase64(logoUrl);
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', pageMargins.left, 15, 100, 70);
        }
      } catch (err) {
        console.warn('PDF Logo Load Failed', err);
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary);
      doc.text('COST ANALYSIS REPORT', pageWidth - pageMargins.right, 45, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - pageMargins.right, 60, { align: 'right' });
      doc.text(`${this.sheetData?.name || 'N/A'} [${this.sheetData?.code || 'N/A'}]`, pageWidth - pageMargins.right, 72, { align: 'right' });

      // Royal blue line separator
      doc.setDrawColor(COLORS.primary);
      doc.setLineWidth(2);
      doc.line(pageMargins.left, 90, pageWidth - pageMargins.right, 90);

      y = 110;

      const renderHtmlTable = (elementId: string, title: string, color: string = COLORS.tableHead) => {
        const table = document.getElementById(elementId) as HTMLTableElement;
        if (table) {
          // Check for page break
          if (y > doc.internal.pageSize.getHeight() - 150) {
            doc.addPage();
            y = 50;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(color);
          doc.text(title.toUpperCase(), pageMargins.left, y);
          y += 10;

          let tableToParse = table as any;
          if (elementId === 'systematic-cost-table' || elementId === 'medopharam-cost-table') {
            tableToParse = table.cloneNode(true);
            const cells = tableToParse.querySelectorAll('th, td');
            for (let i = 0; i < cells.length; i++) {
              cells[i].removeAttribute('colspan');
            }
          }

          autoTable(doc, {
            html: tableToParse,
            startY: y,
            margin: pageMargins,
            includeHiddenHtml: true,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 4, halign: 'left' },
            headStyles: { fillColor: color, textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: '#F9FAFB' },
            columnStyles: elementId === 'total-material-table' ? {
              0: { cellWidth: 50 },
              1: { cellWidth: 50 }
            } : elementId === 'api-table' || elementId === 'packing-table' ? {
              0: { cellWidth: 80 }
            } : {},
            didParseCell: (data) => {
              const cell = data.cell.raw as HTMLTableCellElement;
              if (cell && cell.classList) {
                if (cell.classList.contains('text-end')) data.cell.styles.halign = 'right';
                if (cell.classList.contains('text-center')) data.cell.styles.halign = 'center';
                if (cell.tagName.toLowerCase() === 'th' || cell.classList.contains('font-weight-bold')) {
                  data.cell.styles.fontStyle = 'bold';
                }
              }
              if (data.cell.text && Array.isArray(data.cell.text)) {
                data.cell.text = data.cell.text.map(t => t.replace(/₹/g, 'Rs. '));
              }
            },
          });
          y = (doc as any).lastAutoTable.finalY + 35;
        }
      };

      // TABLE SEQUENCE
      renderHtmlTable('costsheet-details-excel', 'Product Overview', COLORS.primary);

      if (this.rawstage?.length) {
        renderHtmlTable('api-table', 'Raw Material & API Analysis', COLORS.primary);
      }

      if (this.packstage?.length) {
        renderHtmlTable('packing-table', 'Packing Material Analysis', '#065F46');
      }

      renderHtmlTable('total-material-table', 'Material Cost Summary', '#6B21A8');
      renderHtmlTable('systematic-cost-table', 'Systematic Cost', '#0369A1');
      renderHtmlTable('medopharam-cost-table', 'Medopharm Cost', '#166534');

      // 4. FOOTER & PAGE NUMBERS
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${totalPages}`,
          doc.internal.pageSize.getWidth() - pageMargins.right,
          doc.internal.pageSize.getHeight() - 15,
          { align: 'right' }
        );
      }

      // === Save PDF ===
      const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
      const fileName = `${this.sheetData?.name || 'CostSheet'}-${dateStr}`;
      doc.save(`${fileName}.pdf`);

      await this.api
        .post('export_log', {
          user: this.user,
          name: this.sheetData?.name || '',
          timestamp: new Date().toISOString(),
          type: 'cost',
          format: 'PDF',
        })
        .toPromise();
    } catch (e) {
      console.error(e);
    } finally {
      this.btn_loader_pdf = false;
    }
  }

  async getImageBase64(url: string): Promise<string | null> {
    if (url.startsWith('data:')) return url;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Limit logo size to max 800px to avoid OOM
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
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

  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  convert_to_currency(rate) {
    if (rate) {
      var num = parseFloat(rate);
      var parts = num.toFixed(2).toString().split('.');
      parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
      return parts.join('.');
    } else {
      return '0.00';
    }
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

  onproductChange(e) {
    const val = e.value;
    this.packstage.forEach((stage) => {
      if (stage.fgCode === val) {
        stage.isSelect = true;
        this.packtype = stage.stageName;
      } else {
        stage.isSelect = false;
      }
    });
    this.update_data();
  }

  get_packtype() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_pack', params).subscribe((response) => {
      this.packtypeList = response.data.packtype;
      this.get_sheet(this.sheetID);
    });
  }

  get_sheet(id) {
    // this.spinner.show();
    this.page_loader = false;
    let params = {
      id: id,
    };
    this.api.post('get_sheet', params).subscribe(async (response) => {
      // this.spinner.hide();
      if (response.status) {
        this.sheetData = response.data.sheets[0];
        this.rawstage = this.sheetData?.medo_raw;
        this.packstage = this.sheetData?.medo_pack;
        this.detailValues = this.sheetData?.detailValues;
        this.percentage = this.sheetData?.percentage;
        this.system = this.sheetData?.system;
        this.medopharm = this.sheetData?.medopharm;
        this.page_loader = true;
        this.ref.detectChanges();
      }
    });
  }

  mergeRaws() {
    const ingredientMap = new Map<string, any>();
    this.rawstage?.forEach((stage) => {
      stage.ingredients?.forEach((ingredient) => {
        if (ingredient.typeCode === 'RM') {
          const key = `${ingredient.code}_${ingredient.name}`;
          if (ingredientMap.has(key)) {
            let existing = ingredientMap.get(key);
            existing.requestQty = (
              parseFloat(existing.requestQty) +
              parseFloat(ingredient.requestQty)
            ).toFixed(3);
          } else {
            ingredientMap.set(key, {
              ...ingredient,
              requestQty: parseFloat(ingredient.requestQty).toFixed(3),
            });
          }
        }
      });
    });
    this.totalRaws = Array.from(ingredientMap.values());
    setTimeout(() => {
      this.totalRaws.forEach((ingredient) => this.updatePrice(ingredient));
    }, 2000);
  }

  updatePrice(data: any) {
    const rate = parseFloat(data.rate) || 0;
    const gst = parseFloat(data.gst) || 0;
    const acess = parseFloat(data.acess) || 0;
    const percentage = parseFloat(data.percentage) || 0;
    const requestQty = parseFloat(data.requestQty) || 0;
    const cess = parseFloat(data.cess) || 0;
    if (!isNaN(rate) && !isNaN(gst)) {
      data.excise = (rate * (gst / 100)).toFixed(2);
    } else {
      data.excise = '0.00';
    }

    if (
      !isNaN(rate) &&
      !isNaN(parseFloat(data.excise)) &&
      !isNaN(acess) &&
      !isNaN(percentage)
    ) {
      data.cst = (
        (rate + parseFloat(data.excise) + acess) *
        (percentage / 100)
      ).toFixed(2);
    } else {
      data.cst = '0.00';
    }

    if (
      !isNaN(rate) &&
      !isNaN(parseFloat(data.excise)) &&
      !isNaN(acess) &&
      !isNaN(parseFloat(data.cst))
    ) {
      data.total = (
        rate +
        parseFloat(data.excise) +
        acess +
        parseFloat(data.cst)
      ).toFixed(2);
    } else {
      data.total = '0.00';
    }

    if (!isNaN(requestQty) && !isNaN(parseFloat(data.total))) {
      data.value = (requestQty * parseFloat(data.total)).toFixed(2);
    } else {
      data.value = '0.00';
    }
    if (!isNaN(parseFloat(data.excise)) && !isNaN(cess) && !isNaN(requestQty)) {
      data.modvat = ((parseFloat(data.excise) + cess) * requestQty).toFixed(2);
    } else {
      data.modvat = '0.00';
    }

    if (!isNaN(parseFloat(data.value)) && !isNaN(parseFloat(data.modvat))) {
      data.netamt = (parseFloat(data.value) - parseFloat(data.modvat)).toFixed(
        2
      );
    } else {
      data.netamt = '0.00';
    }
    if (
      !isNaN(parseFloat(data.netamt)) &&
      this.totalcost?.yieldvalue &&
      this.totalcost?.costunit
    ) {
      data.cost = (
        parseFloat(data.netamt) /
        (this.totalcost.yieldvalue / this.totalcost.costunit)
      ).toFixed(2);
    } else {
      data.cost = '0.00';
    }
    this.update_data();
  }


  updateData(data: any) {
    const rate = parseFloat(data.rate) || 0;
    const gst = parseFloat(data.gst) || 0;
    const acess = parseFloat(data.acess) || 0;
    const percentage = parseFloat(data.percentage) || 0;
    const requestQty = parseFloat(data.requestQty) || 0;
    const cess = parseFloat(data.cess) || 0;
    const convertrate = 81;

    if (!isNaN(rate) && !isNaN(gst)) {
      data.excise = (rate * (gst / 100)).toFixed(2);
    } else {
      data.excise = '0.00';
    }

    if (
      !isNaN(rate) &&
      !isNaN(parseFloat(data.excise)) &&
      !isNaN(acess) &&
      !isNaN(percentage)
    ) {
      data.cst = (
        (rate + parseFloat(data.excise) + acess) *
        (percentage / 100)
      ).toFixed(2);
    } else {
      data.cst = '0.00';
    }

    if (
      !isNaN(rate) &&
      !isNaN(parseFloat(data.excise)) &&
      !isNaN(acess) &&
      !isNaN(parseFloat(data.cst))
    ) {
      data.total = (
        rate +
        parseFloat(data.excise) +
        acess +
        parseFloat(data.cst)
      ).toFixed(2);
    } else {
      data.total = '0.00';
    }

    if (!isNaN(requestQty) && !isNaN(parseFloat(data.total))) {
      data.value = (requestQty * parseFloat(data.total)).toFixed(2);
    } else {
      data.value = '0.00';
    }
    if (!isNaN(parseFloat(data.excise)) && !isNaN(cess) && !isNaN(requestQty)) {
      data.modvat = ((parseFloat(data.excise) + cess) * requestQty).toFixed(2);
    } else {
      data.modvat = '0.00';
    }

    if (!isNaN(parseFloat(data.value)) && !isNaN(parseFloat(data.modvat))) {
      data.netamt = (parseFloat(data.value) - parseFloat(data.modvat)).toFixed(
        2
      );
    } else {
      data.netamt = '0.00';
    }
    if (
      !isNaN(parseFloat(data.netamt)) &&
      this.totalcost?.yieldvalue &&
      this.totalcost?.costunit
    ) {
      data.cost = (
        parseFloat(data.netamt) /
        (this.totalcost.yieldvalue / this.totalcost.costunit)
      ).toFixed(2);
    } else {
      data.cost = '0.00';
    }
    (this.finalstage['api'] = this.totalRaws[0]?.rate),
      this.finalstage['rupee'] = parseFloat(
        parseFloat(this.percentage['factorycost']).toFixed(2)
      );
    this.finalstage['doller'] = parseFloat(
      (parseFloat(this.percentage['factorycost']) * this.convertrate).toFixed(2)
    );
    this.finalstage['convertrate'] = this.convertrate;
    (this.finalstage['name'] = this.rawstage[0]?.fgName),
      (this.finalstage['packtype'] = this.packstage.find(
        (data) => data.isSelect
      )?.stageName),
      (this.medopharm['api'] = this.totalRaws[0]?.rate),
      (this.medopharm['name'] = this.rawstage[0]?.fgName),
      this.medopharm['rupee'] = parseFloat(this.percentage['factorycost']).toFixed(2);
    this.medopharm['doller'] = (parseFloat(this.percentage['factorycost']) * this.convertrate).toFixed(2);
    this.medopharm['convertrate'] = this.convertrate;
    (this.medopharm['packtype'] = this.packstage.find(
      (data) => data.isSelect
    )?.stageName),

      data.convertrate = convertrate;

    this.update_data();
  }

  update_data() {
    this.percentage = this.percentage || {};
    this.finalstage = this.finalstage || {};
    this.totalcost = this.totalcost || {};
    const filterpack = this.packstage?.find((data) => data.isSelect);

    if (filterpack && Array.isArray(filterpack.ingredients)) {
      this.percentage['packTotalNet'] = filterpack.ingredients
        .reduce((sum, item) => {
          return sum + (parseFloat(item.netamt) || 0);
        }, 0)
        .toFixed(2);

      this.percentage['pmcost'] = filterpack.ingredients
        .reduce((sum, item) => {
          return sum + (parseFloat(item.cost) || 0);
        }, 0)
        .toFixed(2);
    } else {
      this.percentage['packTotalNet'] = '0.00';
      this.percentage['pmcost'] = '0.00';
    }

    if (this.totalRaws && Array.isArray(this.totalRaws)) {
      const totalRmCost = this.totalRaws.reduce((sum, item) => {
        return sum + (parseFloat(item.cost) || 0);
      }, 0);

      const totalRawNet = this.totalRaws.reduce((sum, item) => {
        return sum + (parseFloat(item.netamt) || 0);
      }, 0);

      this.percentage['rmcost'] = totalRmCost.toFixed(2);
      this.percentage['rawTotalNet'] = totalRawNet.toFixed(2);
    } else {
      this.percentage['rmcost'] = '0.00';
      this.percentage['rawTotalNet'] = '0.00';
    }
    const manufactureQty = parseFloat(this.totalcost['manufacture_qty']) || 0;
    const manufacture_total =
      parseFloat(this.totalcost['manufacture_total']) || 0;
    const yieldValue = parseFloat(this.totalcost['yieldvalue']) || 1;
    const costUnit = parseFloat(this.totalcost['costunit']) || 0;
    const manufactureMatval =
      parseFloat(this.totalcost['manufacture_matval']) || 0;
    this.totalcost['manufacture_value'] = manufactureQty * manufacture_total;
    this.totalcost['manufacture_netamt'] = (
      manufactureMatval * this.totalcost['manufacture_value']
    ).toFixed(2);
    this.totalcost['manufacture_cost'] = (
      this.totalcost['manufacture_netamt'] /
      (yieldValue / costUnit)
    ).toFixed(2);
    const packQty = parseFloat(this.totalcost['pack_qty']) || 0;
    const pack_total = parseFloat(this.totalcost['pack_total']) || 0;
    const packMatval = parseFloat(this.totalcost['pack_matval']) || 0;
    this.totalcost['pack_value'] = packQty * pack_total;
    this.totalcost['pack_netamt'] = packMatval * this.totalcost['pack_value'];
    this.totalcost['pack_cost'] = (
      this.totalcost['pack_netamt'] /
      (yieldValue / costUnit)
    ).toFixed(2);
    const analyticalValue = parseFloat(this.totalcost['analytical_value']) || 0;
    const punchValue = parseFloat(this.totalcost['punch_value']) || 0;
    this.totalcost['analytical_cost'] = (
      (analyticalValue / yieldValue) *
      costUnit
    ).toFixed(2);
    this.totalcost['punch_cost'] = (
      (punchValue / yieldValue) *
      costUnit
    ).toFixed(2);
    this.percentage['materialcost'] = (
      parseFloat(this.percentage['rmcost']) +
      parseFloat(this.percentage['pmcost'])
    ).toFixed(2);
    this.percentage['convcost'] = (
      parseFloat(this.totalcost['manufacture_cost']) +
      parseFloat(this.totalcost['pack_cost'])
    ).toFixed(2);
    this.percentage['analyticalcost'] = this.totalcost['analytical_cost'];
    this.percentage['punchcost'] = this.totalcost['punch_cost'];
    this.percentage['freightcost'] = (
      parseFloat(this.percentage['materialcost']) *
      (this.totalcost['freight'] / 100)
    ).toFixed(2);
    this.percentage['factorycost'] = [
      this.percentage['materialcost'],
      this.percentage['convcost'],
      this.percentage['analyticalcost'],
      this.percentage['punchcost'],
      parseFloat(this.percentage['freightcost']),
    ]
      .reduce((acc, cost) => acc + parseFloat(cost), 0)
      .toFixed(2);
    this.percentage['rmcostPercentage'] = parseFloat(
      (
        (this.percentage['rmcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['pmcostPercentage'] = parseFloat(
      (
        (this.percentage['pmcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['materialcostPercentage'] = parseFloat(
      (
        (this.percentage['materialcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['convcostPercentage'] = parseFloat(
      (
        (this.percentage['convcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['analyticalcostPercentage'] = parseFloat(
      (
        (this.percentage['analyticalcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['punchcostPercentage'] = parseFloat(
      (
        (this.percentage['punchcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['freightcostPercentage'] = parseFloat(
      (
        (this.percentage['freightcost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.percentage['factorycostPercentage'] = parseFloat(
      (
        (this.percentage['factorycost'] * 100) /
        this.percentage['factorycost']
      ).toFixed(2)
    );
    this.finalstage['rupee'] = parseFloat(
      parseFloat(this.percentage['factorycost']).toFixed(2)
    );

    this.finalstage['doller'] = parseFloat(
      (parseFloat(this.percentage['factorycost']) / this.convertrate).toFixed(2)
    );
    this.finalstage['convertrate'] = this.convertrate;
    this.finalstage['name'] = this.formValues["name"];
    this.finalstage['batchsize'] = parseFloat(this.formValues['batch']) / 100000;

    this.finalstage['packtype'] = this.selectPack[0]?.name;
    this.finalstage['api'] = this.totalRaws?.[0]?.rate || '0.00';
    this.changePrice();
  }

  changePrice() {
    this.medopharm = this.medopharm || {};

    this.medopharm['api'] = this.totalRaws?.[0]?.rate || '0.00';
    this.medopharm['rupee'] = parseFloat(
      parseFloat(this.percentage['factorycost']).toFixed(2)
    );
    this.medopharm['convertrate'] = this.convertrate;

    this.medopharm['name'] = this.formValues['name'];
    this.medopharm['packtype'] = this.selectPack[0]?.name;
    this.medopharm['doller'] = parseFloat(
      (parseFloat(this.percentage['factorycost']) / this.convertrate).toFixed(2)
    );
    this.medopharm['batchsize'] = parseFloat(this.formValues['batch']) / 100000;
  }

  calculatePrice() {
    const batch = parseFloat(this.formValues['batch']);
    const packQty = parseFloat(this.totalcost['pack_qty']);
    const yieldValue = parseFloat(this.totalcost['yield']);
    const fgSubtype = this.totalcost['fgSubtype'];
    const subtypesToUsePackQty = ['MP1-DRYSRP', 'CNP-DRYSRP', 'MP1-DRY'];

    const baseValue = subtypesToUsePackQty.includes(fgSubtype) ? packQty : batch;

    if (!isNaN(baseValue) && !isNaN(yieldValue) && yieldValue > 0) {
      this.totalcost['yieldvalue'] = baseValue * (yieldValue / 100);
    } else {
      this.totalcost['yieldvalue'] = 0;
      console.warn('Invalid batch/pack_qty or yield value.');
    }
    this.update_data();
  }

  getTotal(field: string): number {
    return (
      this.packstage
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
  }

  getTotalRaw(field: string): number {
    return (
      this.rawstage
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
  }

  goBack(): void {
    this.location.back();
  }
}