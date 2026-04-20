import { Component, OnInit } from '@angular/core';
import { faArrowLeft, faMailBulk } from '@fortawesome/free-solid-svg-icons';
import { Location } from '@angular/common';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyService } from '../../shared/currency.service';

@Component({
  selector: 'app-sales-form',
  templateUrl: './sales-form.component.html',
  styleUrls: ['./sales-form.component.scss']
})

export class SalesFormComponent implements OnInit {
  sheetID = ''
  sheetValues: any = { searchloc: '' }
  selectProductList: any = []
  locations: any[] = []
  faArrowLeft = faArrowLeft;
  faMailBulk = faMailBulk;
  selectSheet: any
  onselectSheet: boolean = false;
  btn_loader: boolean = false
  convertrate
  showMailModal = false;
  email = '';
  mailStatus = '';
  mailSuccess = false;
  nameError = ''
  roleName = '';
  rawstage: any[] = [];
  packstage = [];
  detailValues: any = {}
  percentage: any = {}

  isActive: boolean = false;
  isEditMode: boolean = false;


  constructor(private location: Location, private route: ActivatedRoute,
    private api: ApiService, private common: CommonService, private router: Router, public currencyService: CurrencyService) { }

  async ngOnInit(): Promise<void> {
    this.roleName = localStorage.getItem('role_name') || '';
    this.isActive = this.currencyService.isActive;
    this.convertrate = await this.currencyService.fetchConversionFactor();
    this.route.params.subscribe((params) => {
      this.sheetID = params.id;
      if (this.sheetID) {
        this.get_sheet(this.sheetID);
      }
    });
    this.get_locations();
  }

  get_sheet(id) {
    let params = {
      id: id,
    };
    this.api.post('get_sale_sheet', params).subscribe((response) => {
      this.selectSheet = response.data.sheets[0];
      // Ensure remarks is always an array
      if (!Array.isArray(this.selectSheet.remarks)) {
        this.selectSheet.remarks = this.selectSheet.remarks ? [this.selectSheet.remarks] : [];
      }
      this.onselectSheet = true
      this.sheetValues['productname'] = this.selectSheet.productname
      this.sheetValues['name'] = this.selectSheet.name
      this.sheetValues['productcode'] = this.selectSheet.productcode
      this.sheetValues['code'] = this.selectSheet.code
      this.sheetValues['locCd'] = this.selectSheet.locCd
      this.rawstage = this.selectSheet?.medo_raw;
      this.packstage = this.selectSheet?.medo_pack;
      this.detailValues = this.selectSheet?.detailValues;
      this.percentage = this.selectSheet?.percentage;
    });
  }

  get_locations() {
    this.api.post('get_unique_locations', {}).subscribe((response) => {
      if (response.status) {
        this.locations = response.data.locations;
      }
    });
  }

  getProductList() {
    this.onselectSheet = false
    this.sheetValues['productcode'] = ''
    this.nameError = ''
    this.selectSheet = null
    let params = {
      pagination: 'false',
      product: this.sheetValues['productname'],
      searchloc: this.sheetValues['searchloc'],
    };
    this.api.post('get_sheet', params).subscribe((response) => {
      if (response.status) {
        const sheets = response.data?.sheets || [];
        const uniqueSheets = [];
        const seenCodes = new Set();
        for (const sheet of sheets) {
          const key = sheet.productcode + '_' + sheet.locCd;
          if (!seenCodes.has(key)) {
            seenCodes.add(key);
            uniqueSheets.push(sheet);
          }
        }
        this.selectProductList = uniqueSheets;
      }
    });
  }

  hasValidRateAndGrn(list: any[] | undefined): boolean {
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.every(item =>
      +item?.rate > 0 && +item?.grnRate > 0
    );
  }

  hasAnyValidRate(items): boolean {
    return (
      this.hasValidRateAndGrn(items?.system_raw) ||
      this.hasValidRateAndGrn(items?.system_pack) ||
      this.hasValidRateAndGrn(items?.medo_raw) ||
      this.hasValidRateAndGrn(items?.medo_pack)
    );
  }

  onProductSelect(e) {
    this.sheetValues.productname = e.productname;
    const hasValidPrice = this.hasAnyValidRate(e);
    if (!hasValidPrice) {
      this.nameError = '*** Cost Sheet has some items whose price is not updated'
      return;
    }
    this.sheetValues.productcode = e.productcode;
    this.sheetValues.locCd = e.locCd;
    this.selectSheet = e;
    // Ensure remarks is always an array
    if (!Array.isArray(this.selectSheet.remarks)) {
      this.selectSheet.remarks = this.selectSheet.remarks ? [this.selectSheet.remarks] : [];
    }
    this.onselectSheet = true;
    const rate = parseFloat(this.convertrate) || 1;
    this.selectSheet.system = this.selectSheet.system || {};
    this.selectSheet.medquantas = this.selectSheet.medquantas || {};
    this.selectSheet.percentage = this.selectSheet.percentage || {};

    const systemFactory = parseFloat(this.selectSheet.percentage.system_factorycost) || 0;
    this.selectSheet.system.doller = parseFloat((systemFactory / rate).toFixed(2));
    this.selectSheet.system.convertrate = rate;

    const medFactory = parseFloat(this.selectSheet.percentage.factorycost) || 0;
    this.selectSheet.medquantas.doller = parseFloat((medFactory / rate).toFixed(2));
    this.selectSheet.medquantas.convertrate = rate;
  }


  saveSheet() {
    this.btn_loader = true;
    let sheet = { ...this.selectSheet };
    if (!this.sheetID) {
      const originalCostsheetId = sheet._id;
      delete sheet._id;
      delete sheet.id;
      delete sheet.createdAt;
      delete sheet.updatedAt;
      var params = {
        ...sheet,
        userID: localStorage.getItem('user_id'),
        sheetID: originalCostsheetId,
      };
    } else {
      var params = {
        ...sheet,
      };
    }

    this.api.post('update_sale_sheet', params).subscribe((response) => {
      this.btn_loader = false;
      this.common.alert({
        msg: response.message,
        type: response.status ? 'success' : 'danger',
      });
      if (response.status) {
        this.router.navigateByUrl('sales');
      }
    });
  }


  getTotalRaw(field: string): number {
    return (
      this.rawstage
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
  }

  getTotal(field: string): number {
    return (
      this.packstage
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
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

  goBack(): void {
    this.location.back();
  }

  addRemark() {
    if (!Array.isArray(this.selectSheet.remarks)) {
      this.selectSheet.remarks = [];
    }
    this.selectSheet.remarks.push('');
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.recalculateAll();
    }
  }

  onValueChange() {
    this.recalculateAll();
  }

  recalculateAll() {
    if (!this.selectSheet) return;

    // 1. Update prices for all ingredients
    if (this.rawstage) {
      this.rawstage.forEach(item => this.updateItemPrice(item));
    }
    if (this.packstage) {
      this.packstage.forEach(item => this.updateItemPrice(item));
    }

    // 2. System stage might also need update if they are visible/used
    if (this.selectSheet.system_raw) {
      this.selectSheet.system_raw.forEach(item => this.updateItemPrice(item));
    }
    if (this.selectSheet.system_pack) {
      this.selectSheet.system_pack.forEach(item => this.updateItemPrice(item));
    }

    // 3. Update detailValues (manufacture/pack values)
    const dv = this.detailValues;
    const yieldVal = parseFloat(dv.yield) || 97.7;
    const yieldValue = (parseFloat(dv.batch) || 0) * (yieldVal / 100);
    dv.yieldvalue = yieldValue;

    const costUnit = parseFloat(dv.costunit) || 0;

    dv.manufacture_value = (parseFloat(dv.manufacture_qty) || 0) * (parseFloat(dv.manufacture_total) || 0);
    dv.manufacture_netamt = ((parseFloat(dv.manufacture_matval) || 0) * dv.manufacture_value).toFixed(3);
    dv.manufacture_cost = costUnit > 0 && yieldValue > 0 ? (parseFloat(dv.manufacture_netamt) / (yieldValue / costUnit)).toFixed(3) : '0.000';

    dv.pack_value = (parseFloat(dv.pack_qty) || 0) * (parseFloat(dv.pack_total) || 0);
    dv.pack_netamt = (parseFloat(dv.pack_matval) || 0) * dv.pack_value;
    dv.pack_cost = costUnit > 0 && yieldValue > 0 ? (dv.pack_netamt / (yieldValue / costUnit)).toFixed(3) : '0.000';

    const analyticalValue = parseFloat(dv.analytical_value) || 0;
    const punchValue = parseFloat(dv.punch_value) || 0;
    dv.analytical_cost = yieldValue > 0 ? ((analyticalValue / yieldValue) * costUnit).toFixed(3) : '0.000';
    dv.punch_cost = yieldValue > 0 ? ((punchValue / yieldValue) * costUnit).toFixed(3) : '0.000';

    // 4. Calculate Percentage object
    this.calculateOverallPercentage();

    // 5. Update main medquantas/System displays
    const rate = parseFloat(this.convertrate) || 1;
    this.selectSheet.medquantas.rupee = Number(parseFloat(this.percentage.factorycost).toFixed(3));
    this.selectSheet.medquantas.doller = Number((this.selectSheet.medquantas.rupee / rate).toFixed(3));
    this.selectSheet.medquantas.api = this.rawstage?.[0]?.rate || '0.00';

    if (this.selectSheet.system) {
      this.selectSheet.system.rupee = Number(parseFloat(this.percentage.system_factorycost).toFixed(3));
      this.selectSheet.system.doller = Number((this.selectSheet.system.rupee / rate).toFixed(3));
      this.selectSheet.system.api = this.selectSheet.system_raw?.[0]?.rate || '0.00';
    }
  }

  updateItemPrice(item) {
    const rate = parseFloat(item.rate) || 0;
    const gst = parseFloat(item.gst) || 0;
    const acess = parseFloat(item.acess) || 0;
    const percentage = parseFloat(this.detailValues.percentage) || 2;
    const requestQty = parseFloat(item.requestQty) || 0;
    const cess = parseFloat(item.cess) || 0;

    item.excise = (rate * (gst / 100)).toFixed(3);
    item.cst = ((rate + parseFloat(item.excise) + acess) * (percentage / 100)).toFixed(3);
    item.total = (rate + parseFloat(item.excise) + acess + parseFloat(item.cst)).toFixed(3);
    item.value = (requestQty * parseFloat(item.total)).toFixed(3);
    item.modvat = ((parseFloat(item.excise) + cess) * requestQty).toFixed(3);
    item.netamt = (parseFloat(item.value) - parseFloat(item.modvat)).toFixed(3);

    const yieldValue = parseFloat(this.detailValues.yieldvalue) || 0;
    const costUnit = parseFloat(this.detailValues.costunit) || 0;
    item.cost = yieldValue > 0 && costUnit > 0 ? (parseFloat(item.netamt) / (yieldValue / costUnit)).toFixed(3) : '0.000';
  }

  calculateOverallPercentage() {
    const p = this.percentage;
    const dv = this.detailValues;

    const totalPmCost = this.packstage?.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) || 0;
    const totalSystemPmCost = this.selectSheet.system_pack?.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) || 0;
    const totalPmNet = this.packstage?.reduce((sum, item) => sum + (parseFloat(item.netamt) || 0), 0) || 0;
    const totalSystemPmNet = this.selectSheet.system_pack?.reduce((sum, item) => sum + (parseFloat(item.netamt) || 0), 0) || 0;

    p.pmcost = totalPmCost.toFixed(3);
    p.system_pmcost = totalSystemPmCost.toFixed(3);
    p.packTotalNet = totalPmNet.toFixed(3);
    p.system_packTotalNet = totalSystemPmNet.toFixed(3);

    const totalRmCost = this.rawstage?.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) || 0;
    const totalSystemRmCost = this.selectSheet.system_raw?.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) || 0;
    const totalRawNet = this.rawstage?.reduce((sum, item) => sum + (parseFloat(item.netamt) || 0), 0) || 0;
    const totalSystemRawNet = this.selectSheet.system_raw?.reduce((sum, item) => sum + (parseFloat(item.netamt) || 0), 0) || 0;

    p.rmcost = totalRmCost.toFixed(3);
    p.system_rmcost = totalSystemRmCost.toFixed(3);
    p.rawTotalNet = totalRawNet.toFixed(3);
    p.system_rawTotalNet = totalSystemRawNet.toFixed(3);

    p.materialcost = (parseFloat(p.rmcost) + parseFloat(p.pmcost)).toFixed(3);
    p.system_materialcost = (parseFloat(p.system_rmcost) + parseFloat(p.system_pmcost)).toFixed(3);

    p.convcost = (parseFloat(dv.manufacture_cost) + parseFloat(dv.pack_cost)).toFixed(3);
    p.analyticalcost = dv.analytical_cost;
    p.punchcost = dv.punch_cost;
    p.freightcost = (parseFloat(p.materialcost) * ((parseFloat(dv.freight) || 0) / 100)).toFixed(3);

    p.factorycost = [p.materialcost, p.convcost, p.analyticalcost, p.punchcost, p.freightcost]
      .reduce((acc, cost) => acc + (parseFloat(cost) || 0), 0).toFixed(3);

    p.system_factorycost = [p.system_materialcost, p.convcost, p.analyticalcost, p.punchcost, p.freightcost]
      .reduce((acc, cost) => acc + (parseFloat(cost) || 0), 0).toFixed(3);

    const factCost = parseFloat(p.factorycost) || 1;
    p.rmcostPercentage = ((parseFloat(p.rmcost) * 100) / factCost).toFixed(3);
    p.pmcostPercentage = ((parseFloat(p.pmcost) * 100) / factCost).toFixed(3);
    p.materialcostPercentage = ((parseFloat(p.materialcost) * 100) / factCost).toFixed(3);
    p.convcostPercentage = ((parseFloat(p.convcost) * 100) / factCost).toFixed(3);
    p.analyticalcostPercentage = ((parseFloat(p.analyticalcost) * 100) / factCost).toFixed(3);
    p.punchcostPercentage = ((parseFloat(p.punchcost) * 100) / factCost).toFixed(3);
    p.freightcostPercentage = ((parseFloat(p.freightcost) * 100) / factCost).toFixed(3);
    p.factorycostPercentage = ((parseFloat(p.factorycost) * 100) / factCost).toFixed(3);
  }
}