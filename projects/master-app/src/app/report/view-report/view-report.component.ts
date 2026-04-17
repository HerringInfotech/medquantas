import { Component, OnInit } from '@angular/core';
import { faFileExcel, faFilePdf, faMailBulk } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
// import * as XLSX from 'xlsx';
// import * as JSZip from 'jszip';
import html2pdf from 'html2pdf.js';
import { DatePipe } from '@angular/common';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { NgxSpinnerService } from 'ngx-spinner';
import * as _ from 'lodash';






@Component({
  selector: 'app-view-report',
  templateUrl: './view-report.component.html',
  styleUrls: ['./view-report.component.scss'],
  providers: [DatePipe],
})
export class ViewReportComponent implements OnInit {
  faFileExcel = faFileExcel;
  faFilePdf = faFilePdf;
  faMail = faMailBulk;
  btn_loading: boolean = false;



  sheet_id;
  cost_sheet;
  master_raw;
  master_pack;
  total_cost;
  total_value;
  currentDate;
  quillContent;
  bomtype;


  table1: boolean = true;
  table2: boolean = true;
  table3: boolean = true;
  table4: boolean = true;
  table5: boolean = true;

  selectAllRawMaterial: boolean = true;

  row_select: boolean = true;
  excipient_select: boolean = true;
  intermed_select: boolean = true;
  packing_select: boolean = true;

  isRaw: boolean = true;
  isExcipient: boolean = true;
  isInter: boolean = true;
  isIntermed: boolean = true;
  isPack: boolean = true;
  isRawmaterial: boolean = true;
  setting_data
  page_loading: boolean = false;
  packmaster: boolean = true;
  raw_value;
  pack_value;
  user_list;
  select_pack;


  pageloading: boolean = false;
  select_api;
  less_Value;
  total_costs;


  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private spinner: NgxSpinnerService, private common: CommonService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sheet_id = params.id
      if (this.sheet_id) {
        this.get_sheet(this.sheet_id);
      }
    })
    this.getsetting();
    this.get_Alluser();
  }

  get_sheet(id) {
    this.spinner.show();
    this.page_loading = false;
    let params = {
      id: id
    }
    this.api.post('get_sheet', params).subscribe((response) => {
      this.spinner.hide();

      if (response.status) {
        this.page_loading = true;

        this.cost_sheet = response.data.sheets[0];
        this.toggleSelectAll();
        this.updatepack();
        this.bomtype = this.cost_sheet?.select_bom?.name;

        this.quillContent = this.cost_sheet?.details?.claim;

        this.master_raw = this.cost_sheet?.master_raw;
        this.master_pack = this.cost_sheet?.master_pack;
        this.total_cost = this.cost_sheet?.total_cost;
        this.total_value = this.cost_sheet?.total_value;

        this.select_pack = this.cost_sheet.master_array.find(data => data.packing_name == this.cost_sheet?.sel_pack && data.packing_type == this.cost_sheet?.sel_type)


        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear() % 100;
        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedMonth = month < 10 ? `0${month}` : month;
        this.currentDate = `${formattedDay}.${formattedMonth}.${year}`;
      }
    })
  }

  split_number(data) {
    if (data) {
      const splitResult = data.split('/');
      return splitResult;
    }
  }



  convert_only_currency(rate) {
    if (rate) {
      var parts = rate.toString().split('.');
      parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
      return parts.join('.');
    } else {
      return 0;
    }
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

  // select option start 

  toggleSelectAll() {
    var data = this.cost_sheet;
    if (data.raw.length !== 0) {
      for (var i = 0; i < data.raw.length; i++) {
        var dat = data.raw[i]
        dat.isSelected = this.isRawmaterial ? true : false;
      }
    }
    if (data.excipient.length !== 0) {
      for (var i = 0; i < data.excipient.length; i++) {
        var dat = data.excipient[i]
        dat.isSelected = this.isRawmaterial ? true : false;
      }
    }
    if (data.intermed.length !== 0) {
      for (var i = 0; i < data.intermed.length; i++) {
        var dat = data.intermed[i]
        dat.isSelected = this.isRawmaterial ? true : false;
      }
    }

    this.isRaw = this.cost_sheet.raw.some(obj => obj.isSelected);
    this.isExcipient = this.cost_sheet.excipient.some(obj => obj.isSelected);
    this.isIntermed = this.cost_sheet.intermed.some(obj => obj.isSelected)
    this.update_status()
  }

  updatepack() {
    var data = this.cost_sheet;
    if (data.master_array.length !== 0) {
      for (var i = 0; i < data.master_array.length; i++) {
        const item = data.master_array[i];
        if (item && item.pack) {
          for (let j = 0; j < item.pack.length; j++) {
            const dat = item.pack[j];
            dat.isSelected = !dat.isSelected
          }
          item.isSelected = item.pack.some(obj => obj.isSelected);
        }
      }
    }
    this.update_other()
  }




  update_raw() {
    if (this.cost_sheet.raw.length !== 0) {
      for (var i = 0; i < this.cost_sheet.raw.length; i++) {
        var dat = this.cost_sheet.raw[i]
        dat.isSelected = this.isRaw ? true : false
      }
      this.update_status()
    }
  }

  update_excipient() {
    if (this.cost_sheet.excipient.length !== 0) {
      for (var i = 0; i < this.cost_sheet.excipient.length; i++) {
        var dat = this.cost_sheet.excipient[i]
        dat.isSelected = this.isExcipient ? true : false
      }
      this.update_status()
    }
  }

  update_inter() {
    if (this.cost_sheet.intermed.length !== 0) {
      for (var i = 0; i < this.cost_sheet.intermed.length; i++) {
        var dat = this.cost_sheet.intermed[i]
        dat.isSelected = this.isIntermed ? true : false
      }
      this.update_status()
    }
  }






  update_status() {
    this.isRaw = this.cost_sheet.raw.some(obj => obj.isSelected);
    this.isExcipient = this.cost_sheet.excipient.some(obj => obj.isSelected);
    this.isIntermed = this.cost_sheet.intermed.some(obj => obj.isSelected)
    if (this.isRaw || this.isExcipient || this.isIntermed) {
      this.isRawmaterial = true
    }
    else {
      this.isRawmaterial = false
    }
    this.update_other();
  }



  update_packraw() {
    var pack_val = this.cost_sheet.master_array
    for (let j = 0; j < pack_val.length; j++) {
      pack_val[j].isSelected = pack_val[j].pack.some(obj => obj.isSelected);
    }
    this.update_other()
  }


  update_pack(data) {
    if (data && data.pack) {
      for (let j = 0; j < data.pack.length; j++) {
        const dat = data.pack[j];
        dat.isSelected = data.isSelected ? true : false;
      }
    }
    this.update_other()
  }



  update_other() {
    var other = {
      total_value: 0.00,
      Itc: 0.00,
      batch: 0.00,
      basic: 0.00,
      percentage: 0.00
    };

    var raws = this.cost_sheet?.raw;
    var excipient = this.cost_sheet?.excipient;
    var intermed = this.cost_sheet?.intermed;
    var master_array = this.cost_sheet?.master_array;

    _.forEach(raws, (item, i) => {
      if (!item.isSelected) {
        const numericValue1 = parseFloat(item.total_value);
        const numericValue2 = parseFloat(item.Itc);
        const numericValue3 = parseFloat(item.batch);
        const numericValue4 = parseFloat(item.basic);
        const numericValue5 = parseFloat(item.percentage);
        other['total_value'] += numericValue1;
        other['Itc'] += numericValue2;
        other['batch'] += numericValue3;
        other['basic'] += numericValue4;
        other['percentage'] += numericValue5;
      }
    });

    _.forEach(excipient, (item, i) => {
      if (!item.isSelected) {
        const numericValue1 = parseFloat(item.total_value);
        const numericValue2 = parseFloat(item.Itc);
        const numericValue3 = parseFloat(item.batch);
        const numericValue4 = parseFloat(item.basic);
        const numericValue5 = parseFloat(item.percentage);
        other['total_value'] += numericValue1;
        other['Itc'] += numericValue2;
        other['batch'] += numericValue3;
        other['basic'] += numericValue4;
        other['percentage'] += numericValue5;
      }
    });

    _.forEach(intermed, (item, i) => {
      if (!item.isSelected) {
        const numericValue1 = parseFloat(item.total_value);
        const numericValue2 = parseFloat(item.Itc);
        const numericValue3 = parseFloat(item.batch);
        const numericValue4 = parseFloat(item.basic);
        const numericValue5 = parseFloat(item.percentage);
        other['total_value'] += numericValue1;
        other['Itc'] += numericValue2;
        other['batch'] += numericValue3;
        other['basic'] += numericValue4;
        other['percentage'] += numericValue5;
      }
    });

    if (master_array.length !== 0) {
      _.forEach(master_array, (item, i) => {
        if (item && item.pack) {
          _.forEach(item.pack, (items, j) => {
            if (!items.isSelected) {
              const numericValue1 = parseFloat(items.total_value);
              const numericValue2 = parseFloat(items.Itc);
              const numericValue3 = parseFloat(items.batch);
              const numericValue4 = parseFloat(items.basic);
              const numericValue5 = parseFloat(items.percentage);
              other['total_value'] += numericValue1;
              other['Itc'] += numericValue2;
              other['batch'] += numericValue3;
              other['basic'] += numericValue4;
              other['percentage'] += numericValue5;
            }
          })
        }
      })
    }

    this.packmaster = master_array.some(obj => obj.isSelected);

    this.raw_value = other;
  }



  generatePDF(dat) {
    try {
      this.btn_loading = true;
      const content = document.getElementById('pdf-con');
      var page_width = content.offsetWidth;

      // Add margin and border dimensions
      var margin = 40;
      var borderLineWidth = 2;

      var doc = new jsPDF('l', 'pt', [page_width + 2 * margin, page_width + 2 * margin]);

      var date = this.datePipe.transform(new Date(), 'ddMMMyyyy');
      var username = this.cost_sheet?.sheet_name + "-" + date;

      var width = doc.internal.pageSize.getWidth();
      var height = doc.internal.pageSize.getHeight();

      // Draw borders at the top and bottom of each page
      // for (let i = 0; i < doc.getNumberOfPages(); i++) {
      //   doc.setPage(i + 1);

      //   // Top border
      //   doc.setLineWidth(borderLineWidth);
      //   doc.rect(margin, margin, width - 2 * margin, borderLineWidth);

      //   // Bottom border
      //   doc.rect(margin, height - margin - borderLineWidth, width - 2 * margin, borderLineWidth);
      // }

      doc.html(content, {
        callback: (doc) => {
          const pdfBlob = doc.output('blob');
          var form = new FormData();
          form.append('file', pdfBlob, `${username}.pdf`);
          if (dat == 'mail') {
            this.upload_file(form);
          } else {
            doc.save(`${username}.pdf`);
          }
        },
        x: margin,
        y: margin,
        margin: [0, 0, 0, 0]
      });
    } catch (error) {
      console.error('PDF generation error:', error);
    }
    setTimeout(() => {
      this.btn_loading = false;
    }, 5000);
  }



  generatePDF1(dat) {
    try {
      this.btn_loading = true;
      const content = document.getElementById('content');
      var page_width = content.offsetWidth;
      var doc = new jsPDF('l', 'pt', [page_width + 200, page_width]);
      var date = this.datePipe.transform(new Date(), 'ddMMMyyyy');
      var username = this.cost_sheet?.sheet_name + "-" + date;
      var width = doc.internal.pageSize.getWidth();
      var height = doc.internal.pageSize.getHeight();
      doc.setLineWidth(2);
      doc.rect(40, 40, width - 80.00, height - 100.00);




      doc.html(content, {
        callback: (doc) => {

          const pdfBlob = doc.output('blob');
          var form = new FormData();
          form.append('file', pdfBlob, `${username}.pdf`);
          if (dat == 'mail') {
            this.upload_file(form);
          } else {
            doc.save(`${username}.pdf`);
          }
        },
        x: 100,
        y: 100,
        margin: [0, 0, 100, 0],
      });
    } catch (error) {
      console.error('PDF generation error:', error);
    }
    setTimeout(() => {
      this.btn_loading = false;
    }, 5000);
  }

  upload_file(formData) {
    let params = {
      name: this.cost_sheet?.sheet_name,
      to: this.cost_sheet?.customer_pop?.email,
    };
    this.api.upload('upload_file', formData, params).subscribe((response) => {
    });
  }


  exportToExcel(value) {
    try {
      this.btn_loading = true;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sheet1');
      const excelContent = document.getElementById('excelcontent');
      const tables = excelContent.querySelectorAll('#table1, #table2, #table3, #table4, #table5');
      var date = this.datePipe.transform(new Date(), 'ddMMMyyyy');
      var username = this.cost_sheet?.sheet_name + "-" + date;


      const logoImage = new Image();
      logoImage.crossOrigin = 'anonymous';
      logoImage.src = this.setting_data.original_image

      logoImage.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = logoImage.width;
          canvas.height = logoImage.height;
          context.drawImage(logoImage, 0, 0, logoImage.width, logoImage.height);

          const base64Data = canvas.toDataURL('image/png');
          const excelLogoImage = wb.addImage({
            base64: base64Data,
            extension: 'png',
          });
          const logoWidth = 230; // Change this to your desired width
          const logoHeight = 50;

          const logoPosition = {
            tl: { col: 1, row: 0.2 },
            ext: { width: logoWidth, height: logoHeight },
          };

          ws.addImage(excelLogoImage, logoPosition);
          ws.mergeCells(1, 1, 3, 4);


          ws.mergeCells(1, 9, 1, 11);
          ws.getCell(1, 9).alignment = { horizontal: 'right', indent: 1 };

          ws.mergeCells(1, 12, 1, 14);
          ws.getCell(1, 12).alignment = { horizontal: 'right', indent: 1 };
          ws.mergeCells(2, 9, 2, 11);
          ws.getCell(2, 9).alignment = { indent: 1 };
          ws.mergeCells(2, 12, 2, 14);
          ws.getCell(2, 12).alignment = { indent: 1 };
          ws.mergeCells(3, 10, 3, 11);
          ws.getCell(3, 10).alignment = { indent: 1 };
          ws.mergeCells(3, 13, 3, 14);
          ws.getCell(3, 13).alignment = { indent: 1 };


          // ws.mergeCells(4, 1, 4, 3);
          // ws.getCell(4, 1).alignment = { indent: 1 };
          // ws.mergeCells(4, 4, 4, 14);
          // ws.getCell(4, 4).alignment = { indent: 1 };
          ws.mergeCells(4, 1, 4, 3);
          ws.getCell(4, 1).alignment = { indent: 1 };
          ws.mergeCells(4, 4, 4, 9);
          ws.getCell(4, 4).alignment = { indent: 1 };
          ws.mergeCells(4, 12, 4, 14);
          ws.getCell(4, 12).alignment = { indent: 1 };


          ws.mergeCells(5, 1, 5, 3);
          ws.getCell(5, 1).alignment = { indent: 1 };
          ws.mergeCells(5, 4, 5, 9);
          ws.getCell(5, 4).alignment = { indent: 1 };
          ws.mergeCells(5, 13, 5, 14);
          ws.getCell(5, 13).alignment = { indent: 1 };

          ws.mergeCells(6, 1, 6, 3);
          ws.getCell(6, 1).alignment = { indent: 1 };
          ws.mergeCells(6, 4, 6, 11);
          ws.getCell(6, 4).alignment = { indent: 1 };
          ws.mergeCells(6, 12, 6, 13);
          ws.getCell(6, 12).alignment = { indent: 1 };

          ws.mergeCells(7, 1, 7, 3);
          ws.getCell(7, 1).alignment = { indent: 1 };
          ws.mergeCells(7, 4, 7, 14);
          ws.getCell(7, 4).alignment = { indent: 1 };

          ws.mergeCells(8, 1, 8, 3);
          ws.getCell(8, 1).alignment = { indent: 1 };
          ws.mergeCells(8, 4, 8, 9);
          ws.getCell(8, 4).alignment = { indent: 1 };
          ws.mergeCells(8, 12, 8, 14);
          ws.getCell(8, 12).alignment = { indent: 1 };

          // ws.mergeCells(29, 5, 29, 9);
          // ws.getCell(29, 5).alignment = { indent: 1 };

          // ws.mergeCells(30, 5, 30, 9);
          // ws.getCell(30, 5).alignment = { indent: 1 };

          // ws.mergeCells(31, 5, 31, 9);
          // ws.getCell(31, 5).alignment = { indent: 1 };





          const commonCellStyle = {
            border: {
              top: { style: 'thin', color: { argb: '000000' } },
              left: { style: 'thin', color: { argb: '000000' } },
              bottom: { style: 'thin', color: { argb: '000000' } },
              right: { style: 'thin', color: { argb: '000000' } },
            },
            alignment: {
              vertical: 'middle',
            },
          };




          const thCellStyle = {
            ...commonCellStyle,
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0070C0' },
            },
            font: {
              color: { argb: 'FFFFFF' }, // White text color
            },
            alignment: {
              wrapText: true, // Enable text wrapping
              vertical: 'middle',
              horizontal: 'center',
            },
          };





          // Set the width for each column
          ws.getColumn(1).width = 4; // Column A
          ws.getColumn(2).width = 50; // Column B
          ws.getColumn(3).width = 14; // Column C
          ws.getColumn(4).width = 10; // Column D
          ws.getColumn(5).width = 10; // Column E
          ws.getColumn(6).width = 10; // Column F
          ws.getColumn(7).width = 10; // Column G
          ws.getColumn(8).width = 10; // Column H
          ws.getColumn(9).width = 15; // Column I
          ws.getColumn(10).width = 15; // Column J
          ws.getColumn(11).width = 15; // Column K
          ws.getColumn(12).width = 10; // Column L
          ws.getColumn(13).width = 10; // Column M
          ws.getColumn(14).width = 8; // Column N
          // Add more columns as needed

          let rowIndex = 1;
          let dataRowIndex = 1; // Track the row index for data cells

          const tableBorderStyle = {
            border: {
              top: { style: 'thin', color: { argb: '000000' } },
              left: { style: 'thin', color: { argb: '000000' } },
              bottom: { style: 'thin', color: { argb: '000000' } },
              right: { style: 'thin', color: { argb: '000000' } },
            },
          };
          const checkboxes = {
            table1: document.getElementById('table1Checkbox'),
            table2: document.getElementById('table2Checkbox'),
            table3: document.getElementById('table3Checkbox'),
            table4: document.getElementById('table4Checkbox'),
            table5: document.getElementById('table5Checkbox'),
          };

          tables.forEach((table, index) => {
            const checkbox = checkboxes[`table${index + 1}`];
            if (checkbox && checkbox.checked) {
              const rows = table.querySelectorAll('tr');
              rows.forEach((row) => {
                const cells = row.querySelectorAll('td, th');
                let cellIndex = 1;
                let isRawMaterialRow = false;
                let isExcipientRow = false;
                let isIntermediateRow = false;
                let isNameOfItemRow = false;
                var isPackItemRow = false;
                var isProduct = false

                cells.forEach((cell) => {
                  const cellValue = cell.textContent;
                  const excelCell = ws.getCell(rowIndex, dataRowIndex);
                  excelCell.style = commonCellStyle;

                  if (rowIndex === 1 || rowIndex === rows.length) {
                    excelCell.style = tableBorderStyle;
                  }

                  if (dataRowIndex === 1 || dataRowIndex === cells.length) {
                    excelCell.style = tableBorderStyle;
                  }

                  if (rowIndex === 4 && cellIndex === 6) {
                    excelCell.value = cellValue;


                    excelCell.font = { bold: true, color: { argb: 'FF0000' } };
                    excelCell.value = cellValue;
                    excelCell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FFFF00' },
                    };
                  } else {
                    excelCell.value = cellValue;
                  }

                  if (cell.tagName === 'TH') {
                    excelCell.style = thCellStyle;
                    ws.getRow(rowIndex).height = 45;
                  } else {
                    if (cell.tagName === 'TD') {

                      if (cell.classList.contains('rightalign')) {
                        excelCell.style = {
                          alignment: { vertical: 'middle', horizontal: 'right' },
                        };
                        ws.getRow(rowIndex).height = 22

                      }
                      else {
                        excelCell.style = {
                          alignment: { vertical: 'middle', horizontal: 'left' },
                        };
                        ws.getRow(rowIndex).height = 22

                      }

                    }

                  }

                  if (cellValue === 'RAW MATERIAL') {
                    isRawMaterialRow = true;
                  }

                  if (cellValue === 'EXCIPIENTS') {
                    isExcipientRow = true;
                  }
                  if (cellValue === 'INTERMEDIATE') {
                    isIntermediateRow = true;
                  }
                  if (cellValue === 'PRODUCT COMPOSITION :') {
                    isProduct = true;
                  }
                  if (cellValue === 'NAME OF THE CUSTOMER :') {
                  }

                  if (row.classList.contains('packitem')) {
                    isPackItemRow = true;
                    if (!ws.getCell(rowIndex, 2).isMerged) {
                      ws.mergeCells(rowIndex, 2, rowIndex, 4);
                      ws.getCell(rowIndex, 2).alignment = { indent: 1 };
                    }
                    if (!ws.getCell(rowIndex, 5).isMerged) {
                      ws.mergeCells(rowIndex, 5, rowIndex, 14);
                      ws.getCell(rowIndex, 5).alignment = { indent: 1 };
                    }
                  }
                  cellIndex++;
                  dataRowIndex++;
                });

                if (isRawMaterialRow) {
                  ws.mergeCells(rowIndex, 3, rowIndex, 14);
                  ws.getCell(rowIndex, 3).alignment = { indent: 1 };
                }
                if (isExcipientRow) {
                  ws.mergeCells(rowIndex, 3, rowIndex, 14);
                  ws.getCell(rowIndex, 3).alignment = { indent: 1 };
                }
                if (isIntermediateRow) {
                  ws.mergeCells(rowIndex, 3, rowIndex, 14);
                  ws.getCell(rowIndex, 3).alignment = { indent: 1 };
                }
                if (isProduct) {
                  ws.getRow(rowIndex).height = 150;
                }
                rowIndex++;
                dataRowIndex = 1; // Reset data row index
              });
            }
          });

          wb.xlsx.writeBuffer().then((data) => {
            if (value == 'excel') {
              const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${username}.xlsx`;
              a.click();
              URL.revokeObjectURL(url);
            }
            else {
              const excelBlob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const excelFile = new File([excelBlob], `${username}.xlsx`, { type: excelBlob.type });
              const formData = new FormData();
              formData.append('file', excelFile);
              this.upload_file(formData);
            }

          });
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
    }
    setTimeout(() => {
      this.btn_loading = false;
    }, 5000);
  }

  getsetting() {
    let params = {}
    this.api.post('get_setting', params).subscribe((response) => {
      if (response.data) {
        this.setting_data = response.data.setting[0]
      }
    })
  }

  get_Alluser() {
    let params = {}
    this.api.post('get_user', params).subscribe((response) => {
      if (response.data) {
        this.user_list = response.data?.users;
        this.pageloading = true;
      }
    })
  }

  convert_user(data) {
    var user = this.user_list.filter(item => item._id == data);
    return user[0]?.name
  }
}