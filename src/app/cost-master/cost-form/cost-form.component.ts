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
import {
  faArrowLeft,
  faDollarSign,
  faEnvelope,
  faFileAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import * as _ from 'lodash';
import { PermissionService } from '../../shared/permission/permission.service';
import { SocketService } from '../../shared/api/socket.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from '../../shared/currency.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-cost-form',
  templateUrl: './cost-form.component.html',
  styleUrls: ['./cost-form.component.scss'],
})
export class CostFormComponent implements OnInit {
  sheetID;
  sheetData;
  page_loader: boolean = false;
  btn_loader: boolean = false;
  status_loader: boolean = false;
  user;
  user_list;
  role_list;
  selectedItem;
  rawstage = [];
  packstage = [];
  modalRef: BsModalRef;
  modalRef1: BsModalRef;
  selectPack = [];
  packtype;
  product;
  productList = [];
  totalcost;
  percentage;
  system: any = {};
  medopharm: any = {};
  faArrowLeft = faArrowLeft;
  faDollarSign = faDollarSign;
  faFileAlt = faFileAlt
  faSpinner = faSpinner;
  faEnvelope = faEnvelope;
  selectedBom;
  isActive: boolean = false;
  btn_loading: boolean = false;
  isLoadingPrice: boolean = false;
  remarks = '';
  isremark: boolean = false;
  convertrate;
  page_loading: Boolean = false;
  private currencySub: Subscription;
  selectedTypeName: string = '';
  filteredPackstage: any[] = [];
  selectedProduct: string = '';
  // value;
  // ingredient;
  remark_lists;
  remarkObj = [];
  status_access;
  ObjValues: Object = {};
  costdata;
  Showbrand;
  customerdata;
  Showcustomer: boolean = false;
  searchCustomer = [];
  isModified: boolean = false;

  rawstageData;
  adminEmails;
  bomList;
  isEditMode: boolean = false;
  selectedIndex: number = 0

  @ViewChild('remark_status') remark_status: TemplateRef<any>;
  @ViewChild('select_user') select_user: TemplateRef<any>;


  medo_raw: any[] = []
  medo_pack: any[] = []

  system_raw: any[] = []
  system_pack: any[] = []

  selectedUser: any = null;
  loading: boolean = false


  onPackSelect: boolean = false
  masterProductList: any[] = []
  selectProductList: any[] = []
  detailValues: any = {}
  sheetValues: any = { searchloc: '' }
  locations: any[] = []
  uniqueRawstage: any[] = []
  selectPackstage: any[] = []
  finalValues: any = {}
  fieldError: String = ''
  itemSubtypeList: any[] = []

  constructor(
    private api: ApiService,
    private ref: ChangeDetectorRef,
    private location: Location,
    private modalService: BsModalService,
    private router: Router,
    private route: ActivatedRoute,
    private common: CommonService,
    public currencyService: CurrencyService
  ) {
    this.currencyService.fetchConversionFactor();
  }
  // medopharm

  async ngOnInit() {
    const factor = await this.currencyService.fetchConversionFactor();
    this.convertrate = factor;
    this.route.params.subscribe((params) => {
      this.sheetID = params.id;
      if (this.sheetID) {
        this.get_sheet(this.sheetID);
        this.isEditMode = true;
      }
    });

    this.currencySub = this.currencyService.isConversionActive$.subscribe(
      (val) => {
        this.isActive = val;
        this.get_role_master();
        this.get_user();
        this.get_role();
        this.get_current_user();
        this.get_locations();
      }
    );
  }

  ngOnDestroy(): void {
    if (this.currencySub) this.currencySub.unsubscribe();
  }

  // loadItemSubtypes method removed

  get_role_master() {
    let params = {
      role_id: localStorage.getItem('id'),
    };
    this.api.post('get_role_master', params).subscribe((response) => {
      var role_data = response.data.rolemanager[0].status;
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

  changestatus() {
    this.openModalForConfirm(this.remark_status);
  }

  openModalForConfirm(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-dialog-started modal-xl' })
    );
  }

  close_model_ref() {
    this.modalRef.hide();
  }

  change_remark() {
    this.isremark = false;
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

  get_user() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user_list = response.data.users;
      this.adminEmails = this.user_list
        .filter((user) => user.role_pop?.name === 'Admin')
        .map((user) => user.email)
        .filter((email) => !!email); // remove empty
      this.convert_user(localStorage.getItem('user_id'));
    });
  }

  convert_user(data) {
    if (this.user_list) {
      const user = this.user_list.find((item) => item.id === data);
      return user ? user.name : undefined;
    }
  }

  get_role() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_role', params).subscribe((response) => {
      this.role_list = response.data?.roles;
    });
  }

  get_locations() {
    this.api.post('get_unique_locations', {}).subscribe((response) => {
      if (response.status) {
        this.locations = response.data.locations;
      }
    });
  }

  convert_role(data) {
    if (this.role_list && data) {
      const role = this.role_list.find(
        (item) => item._id === data || item.id === data
      );
      return role ? role.name : data;
    }
    return data;
  }

  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  goBack(): void {
    this.location.back();
  }

  get_sheet(id) {
    this.page_loader = false;
    let params = {
      id: id,
    };
    this.api.post('get_sheet', params).subscribe(async (response) => {
      if (response.status) {
        this.sheetData = response.data.sheets[0];
        this.page_loader = true;
        this.detailValues = this.sheetData?.detailValues
        this.sheetValues = {
          fgcode: this.sheetData.code,
          name: this.sheetData.name,
          productname: this.sheetData.productname,
          productcode: this.sheetData.productcode,
          locCd: this.sheetData.locCd,
          packID: this.sheetData.packID,
        }

        this.medo_raw = this.sheetData?.medo_raw
        this.medo_raw = this.medo_raw.filter(i => i.typeCode !== 'IM');
        this.medo_pack = this.sheetData?.medo_pack
        this.medo_pack = this.medo_pack.filter(i => i.typeCode !== 'IM');


        this.system_raw = this.sheetData?.system_raw
        this.system_raw = this.system_raw.filter(i => i.typeCode !== 'IM');

        this.system_pack = this.sheetData?.system_pack
        this.system_pack = this.system_pack.filter(i => i.typeCode !== 'IM');
        // for (const data of [...this.medo_raw, ...this.medo_pack, ...this.system_raw, ...this.system_pack]) {
        // this.updatePrice(data)
        // }


        this.system = this.sheetData?.system
        this.medopharm = this.sheetData?.medopharm
        this.convertrate = this.system['convertrate'];

        this.percentage = this.sheetData?.percentage
        this.onPackSelect = true
      }
    })
  }


  saveSheet() {
    this.btn_loader = true
    this.finalValues['id'] = this.sheetID;
    this.finalValues['code'] = this.sheetValues.fgcode;
    this.finalValues['name'] = this.sheetValues.name;
    this.finalValues['productname'] = this.sheetValues.productname;
    this.finalValues['productcode'] = this.sheetValues.productcode;
    this.finalValues['locCd'] = this.sheetValues.locCd;
    this.finalValues['packID'] = this.sheetValues.packID;
    this.finalValues['medo_raw'] = this.medo_raw;
    this.finalValues['medo_pack'] = this.medo_pack;

    this.finalValues['system_raw'] = this.system_raw;
    this.finalValues['system_pack'] = this.system_pack;

    this.finalValues['detailValues'] = this.detailValues;

    this.finalValues['percentage'] = this.percentage;
    this.finalValues['system'] = this.system;
    this.finalValues['medopharm'] = this.medopharm;
    const payload = {
      ...this.finalValues,
      user: this.user,
      userName: localStorage.getItem('id'),
      role: localStorage.getItem('id'),
      // adminEmails: this.adminEmails,
    };
    this.api.post('update_sheet', payload).subscribe((response) => {
      this.btn_loader = false;
      this.common.alert({
        msg: response.message,
        type: response.status ? 'success' : 'danger',
      });

      if (response.status) {
        this.router.navigateByUrl('costsheet');
      }
    });
  }

  sendMail() {
    this.openModalForPop(this.select_user);
  }

  openModalForPop(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-dialog-started modal-md' })
    );
  }

  confirmSendMail() {
    this.loading = true;
    const params = {
      email: this.selectedUser.email,
      user: this.selectedUser.name,
      sheetID: this.sheetID
    };
    this.api.post('send_mail', params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          this.common.alert({ msg: response.message, type: 'success' });
          this.router.navigateByUrl('costsheet');
        } else {
          this.common.alert({ msg: response.message, type: 'danger' });
        }
        this.modalRef.hide();
        this.selectedUser = null
      },
      error: (err) => {
        this.loading = false;
        this.common.alert({ msg: 'Something went wrong while sending the email.', type: 'danger' });
        console.error(err);
        this.modalRef.hide();
      }
    });
  }

  getBOMList() {
    this.onPackSelect = false
    this.sheetValues['fgcode'] = ''
    this.sheetValues['productname'] = ''
    const query = this.sheetValues['name']?.trim();
    if (query.length < 3) {
      this.bomList = [];
      return;
    }
    const params = {
      search: query,
      searchloc: this.sheetValues['searchloc']
    };
    this.api.post('fetch_bom', params).subscribe((res: any) => {
      if (!res.status) return;
      this.bomList = res.data.boms
    });
  }

  onBomSelect(data: any) {
    this.selectedBom = data;
    this.sheetValues['name'] = data.name;
    this.sheetValues['productname'] = '';
    this.sheetValues['productcode'] = '';
    this.fieldError = '';
    this.onPackSelect = false;

    if (!data.batch && !data.yield) {
      const message = "Some data missing";
      this.common.alert({ msg: message, type: 'danger' });
      this.sheetValues['fgcode'] = '';
      this.masterProductList = [];
      this.selectProductList = [];
      this.rawstage = [];
      return
    }
    this.sheetValues['fgcode'] = data.code;
    this.sheetValues['locCd'] = data.locCd;

    let clonedPackstage = JSON.parse(JSON.stringify(data.packstage || []));
    this.masterProductList = clonedPackstage;
    this.selectProductList = this.masterProductList;

    let clonedRawstage = (data?.bomraw || []).map((item: any) => {
      const normalizedItem = { ...item };
      // Normalize casing and ensure they are Numbers to avoid concatenation
      normalizedItem.requestQty = Number(item.requestQty || item.RequestQty || item.ReqQty || 0);
      normalizedItem.standQty = Number(item.standQty || item.StandQty || item.StdOutQty || 0);
      // Round for UI consistency
      normalizedItem.requestQty = Math.round(normalizedItem.requestQty * 1000) / 1000;
      normalizedItem.standQty = Math.round(normalizedItem.standQty * 1000) / 1000;
      return normalizedItem;
    });
    this.rawstage = clonedRawstage;
  }

  applySubtypePercentage(item: any) {
    if (item.percentage && Number(item.percentage) > 0) {
      const percentageValue = Number(item.percentage);
      if (item.requestQty && !item.originalRequestQty) {
        item.originalRequestQty = Number(item.requestQty);
      }
      if (item.standQty && !item.originalStandQty) {
        item.originalStandQty = Number(item.standQty);
      }

      // Convert to Number to avoid string concatenation
      const originalReq = Number(item.originalRequestQty);
      const originalStand = Number(item.originalStandQty);

      if (!isNaN(originalReq)) {
        item.requestQty = originalReq + (originalReq * (percentageValue / 100));
        item.requestQty = Math.round(item.requestQty * 1000) / 1000;
      }
      if (!isNaN(originalStand)) {
        item.standQty = originalStand + (originalStand * (percentageValue / 100));
        item.standQty = Math.round(item.standQty * 1000) / 1000;
      }
    }
    return item;
  }

  getProductList() {
    this.onPackSelect = false
    this.selectProductList = []
    const search = (this.sheetValues['productname'] || '').toLowerCase().trim();
    if (search) {
      const result = this.masterProductList.filter((item: any) => {
        const code = item.fgCode?.toLowerCase() || '';
        const name = item.fgName?.toLowerCase() || '';
        return code.includes(search) || name.includes(search);
      });
      this.selectProductList = result
    }
    else {
      this.selectProductList = this.masterProductList
    }
  }

  onProductSelect(e) {
    this.fieldError = '';
    this.onPackSelect = false;
    const requiredFields = ['batch', 'costunit', 'manufacture_qty', 'manufacture_total', 'manufacture_matval', 'pack_qty', 'pack_total', 'pack_matval', 'analytical_value'];
    this.sheetValues['productname'] = e.fgName
    this.sheetValues['productcode'] = e.fgCode
    this.sheetValues['packID'] = e.packID
    this.system['packtype'] = e.stageName
    this.medopharm['packtype'] = e.stageName
    this.system['name'] = e.fgName;
    this.medopharm['name'] = e.fgName;
    const selectPack = (e.ingredients || []).map((item: any) => {
      const normalizedItem = { ...item };
      normalizedItem.requestQty = Number(item.requestQty || item.RequestQty || item.ReqQty || 0);
      normalizedItem.standQty = Number(item.standQty || item.StandQty || item.StdOutQty || 0);
      normalizedItem.requestQty = Math.round(normalizedItem.requestQty * 1000) / 1000;
      normalizedItem.standQty = Math.round(normalizedItem.standQty * 1000) / 1000;
      return normalizedItem;
    });
    this.selectPackstage = selectPack.filter(item => item.typeCode !== 'IM');
    let productYield = 97.7;
    if (!e?.bomDetail) {
      this.fieldError = 'BOM Details are missing';
      return;
    }
    for (const field of requiredFields) {
      if (!e.bomDetail?.[field]) {
        this.fieldError = `${field.replace('_', ' ')} is required`;
        return;
      }
    }
    const subtypesToUsePackQty = ['MP1-DRYSRP', 'CNP-DRYSRP', 'MP1-DRY'];
    const usePackQty = subtypesToUsePackQty.includes(e.fgSubtype);

    this.detailValues = {
      batch: e.bomDetail?.batch,
      yield: productYield,
      costunit: Number(e.bomDetail?.costunit),
      yieldvalue: usePackQty
        ? Number(e.bomDetail?.pack_qty) * (Number(productYield) / 100)
        : Number(e.bomDetail?.batch) * (Number(productYield) / 100),
      fgSubtype: e.fgSubtype || '',
      manufacture_qty: e.bomDetail?.manufacture_qty,
      manufacture_total: e.bomDetail?.manufacture_total,
      manufacture_matval: e.bomDetail?.manufacture_matval,
      pack_qty: e.bomDetail?.pack_qty,
      pack_total: e.bomDetail?.pack_total,
      pack_matval: e.bomDetail?.pack_matval,
      analytical_value: e.bomDetail?.analytical_value,
      punch_value: e.bomDetail?.punch_value,
      freight: e.bomDetail?.freight,
      percentage: e.bomDetail?.percentage,
    }




    this.onPackSelect = true
    this.onGetRawPrice()

    this.onGetPackPrice()
  }

  onGetPackPrice() {
    const packCodes = this.selectPackstage.map(item => item.code).filter(code => !!code);
    const codes = Array.from(new Set([...packCodes]));
    const payload = { codes };
    this.api.post('get_bulk_rate', payload).subscribe(
      (res: any) => {
        if (res.status) {
          const latestRates = res.data.rate as Array<{ code: string, rate: any, gst: any, grnRate: any }>;
          const rateMap = new Map(latestRates.map(item => [item.code, item]));

          // medopharm pack
          this.medo_pack = this.selectPackstage.map((item: any) => {
            const matched: any = rateMap.get(item.code);
            return this.applySubtypePercentage({
              ...item,
              rate: matched?.rate ?? item.rate,
              gst: matched?.gst ?? item.gst,
              grnRate: matched?.grnRate ?? item.grnRate,
              percentage: matched?.percentage ?? item.percentage
            });
          });
          this.medo_pack.forEach((ingredient) => {
            this.updatePrice(ingredient);
          });

          // system pack 
          this.system_pack = this.selectPackstage.map((item: any) => {
            const matched: any = rateMap.get(item.code);
            return this.applySubtypePercentage({
              ...item,
              rate: matched?.grnRate ?? item.grnRate,
              gst: matched?.gst ?? item.gst,
              percentage: matched?.percentage ?? item.percentage
            });
          });
          this.system_pack.forEach((ingredient) => {
            this.updatePrice(ingredient);
          });
        } else {
          console.warn('No matching prices found');
        }
      }
    )
  }

  onGetRawPrice() {
    this.isLoadingPrice = true;
    const codes = this.rawstage.map(item => item.code);
    const payload = { codes };
    this.api.post('get_bulk_rate', payload).subscribe(
      (res: any) => {
        if (res.status) {
          const latestRates = res.data.rate as Array<{ code: string, rate: any, gst: any, grnRate: any }>;
          const rateMap = new Map(latestRates.map(item => [item.code, item]));
          // medopharm raw material
          this.medo_raw = this.rawstage.map((item: any) => {
            const matched: any = rateMap.get(item.code);
            return this.applySubtypePercentage({
              ...item,
              rate: matched?.rate ?? item.rate,
              gst: matched?.gst ?? item.gst,
              grnRate: matched?.grnRate ?? item.grnRate,
              percentage: matched?.percentage ?? item.percentage
            });
          });
          this.medo_raw.forEach((ingredient) => {
            this.updatePrice(ingredient);
          });

          // system raw material
          this.system_raw = this.rawstage.map((item: any) => {
            const matched: any = rateMap.get(item.code);
            return this.applySubtypePercentage({
              ...item,
              rate: matched?.grnRate ?? item.grnRate,
              gst: matched?.gst ?? item.gst,
              percentage: matched?.percentage ?? item.percentage
            });
          });

          this.system_raw.forEach((ingredient) => {
            this.updatePrice(ingredient);
          });
        } else {
          console.warn('No matching prices found');
        }
        this.isLoadingPrice = false;
      },
      (error) => {
        console.error('Error fetching latest prices', error);
        this.isLoadingPrice = false;
      }
    );
  }

  updateRate(data: any) {
    this.updatePrice(data)
    this.system_raw.forEach((ingredient) => {
      if (ingredient.id === data.id) {
        ingredient.gst = data.gst;
        ingredient.requestQty = data.requestQty;
        this.updatePrice(ingredient);
      }
    });
    this.system_pack.forEach((ingredient) => {
      if (ingredient.id === data.id) {
        ingredient.gst = data.gst;
        ingredient.requestQty = data.requestQty;
        this.updatePrice(ingredient);
      }
    });
  }

  updatePrice(data: any) {
    const rate = parseFloat(data.rate) || 0;
    const gst = parseFloat(data.gst) || 0;
    const acess = parseFloat(data.acess) || 0;
    const percentage = parseFloat(this.detailValues.percentage) || 2;
    const requestQty = parseFloat(data.requestQty) || 0;
    const cess = parseFloat(data.cess) || 0;

    // Excise
    data.excise = !isNaN(rate) && !isNaN(gst) ? (rate * (gst / 100)).toFixed(2) : '0.00';

    // CST
    data.cst = ((rate + parseFloat(data.excise) + acess) * (percentage / 100)).toFixed(2);

    // Total
    data.total = (rate + parseFloat(data.excise) + acess + parseFloat(data.cst)).toFixed(2);

    // Value
    data.value = !isNaN(requestQty) && !isNaN(parseFloat(data.total)) ? (requestQty * parseFloat(data.total)).toFixed(2) : '0.00';

    // Modvat
    data.modvat = !isNaN(parseFloat(data.excise)) && !isNaN(cess) && !isNaN(requestQty) ? ((parseFloat(data.excise) + cess) * requestQty).toFixed(2) : '0.00';
    // Net Amount
    data.netamt = !isNaN(parseFloat(data.value)) && !isNaN(parseFloat(data.modvat)) ? (parseFloat(data.value) - parseFloat(data.modvat)).toFixed(2) : '0.00';
    // Cost calculation (guard against division by zero)
    if (!isNaN(parseFloat(data.netamt)) && this.detailValues.yieldvalue > 0 && this.detailValues.costunit > 0) {
      data.cost = (parseFloat(data.netamt) / (parseFloat(this.detailValues.yieldvalue) / parseFloat(this.detailValues.costunit))).toFixed(4);
    } else {
      data.cost = '0.00';
    }
    console.log(data)
    data.convertrate = this.convertrate;
    this.update_data();
  }

  update_data() {
    this.percentage = this.percentage || {};
    this.totalcost = this.totalcost || {};

    if (this.medo_pack && Array.isArray(this.medo_pack)) {
      const totalPmCost = this.medo_pack.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
      const totalSystemRmCost = this.system_pack.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);

      const totalPmNet = this.medo_pack.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);
      const totalSystemPmNet = this.system_pack.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);

      this.percentage['pmcost'] = totalPmCost.toFixed(2);
      this.percentage['system_pmcost'] = totalSystemRmCost.toFixed(2);
      this.percentage['packTotalNet'] = totalPmNet.toFixed(2);
      this.percentage['system_packTotalNet'] = totalSystemPmNet.toFixed(2);
    } else {
      this.percentage['pmcost'] = '0.00';
      this.percentage['system_pmcost'] = '0.00';
      this.percentage['packTotalNet'] = '0.00';
      this.percentage['system_packTotalNet'] = '0.00';
    }
    if (this.medo_raw && Array.isArray(this.medo_raw)) {
      const totalRmCost = this.medo_raw.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
      const totalSystemRmCost = this.system_raw.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
      const totalRawNet = this.medo_raw.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);
      const totalSystemRawNet = this.system_raw.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);
      this.percentage['rmcost'] = totalRmCost.toFixed(2);
      this.percentage['system_rmcost'] = totalSystemRmCost.toFixed(2);
      this.percentage['rawTotalNet'] = totalRawNet.toFixed(2);
      this.percentage['system_rawTotalNet'] = totalSystemRawNet.toFixed(2);
    } else {
      this.percentage['rmcost'] = '0.00';
      this.percentage['system_rmcost'] = '0.00';
      this.percentage['rawTotalNet'] = '0.00';
      this.percentage['system_rawTotalNet'] = '0.00';
    }

    // for MANUFACTURING
    const yieldValue = parseFloat(this.detailValues['yieldvalue']) || 1;
    const costUnit = parseFloat(this.detailValues['costunit']) || 0;
    const manufactureMatval = parseFloat(this.detailValues['manufacture_matval']) || 0;
    const manufacture_qty = parseFloat(this.detailValues['manufacture_qty']) || 1;
    const manufacture_total = parseFloat(this.detailValues['manufacture_total']) || 1;
    this.detailValues['manufacture_value'] = manufacture_qty * manufacture_total
    this.detailValues['manufacture_netamt'] = (manufactureMatval * this.detailValues['manufacture_value']).toFixed(2);
    this.detailValues['manufacture_cost'] = (this.detailValues['manufacture_netamt'] / (yieldValue / costUnit)).toFixed(2);

    // for PACKING
    const packQty = parseFloat(this.detailValues['pack_qty']) || 0;
    const pack_total = parseFloat(this.detailValues['pack_total']) || 0;
    const packMatval = parseFloat(this.detailValues['pack_matval']) || 0;
    this.detailValues['pack_value'] = packQty * pack_total;
    this.detailValues['pack_netamt'] = packMatval * this.detailValues['pack_value'];
    this.detailValues['pack_cost'] = (this.detailValues['pack_netamt'] / (yieldValue / costUnit)).toFixed(2);

    // for ANALYTICAL CHARGES && PUNCHES
    const analyticalValue = parseFloat(this.detailValues['analytical_value']) || 0;
    const punchValue = parseFloat(this.detailValues['punch_value']) || 0;
    this.detailValues['analytical_cost'] = ((analyticalValue / yieldValue) * costUnit).toFixed(2);
    this.detailValues['punch_cost'] = ((punchValue / yieldValue) * costUnit).toFixed(2);

    this.percentage['materialcost'] = (parseFloat(this.percentage['rmcost']) + parseFloat(this.percentage['pmcost'])).toFixed(2);
    this.percentage['system_materialcost'] = (parseFloat(this.percentage['system_rmcost']) + parseFloat(this.percentage['system_pmcost'])).toFixed(2);
    this.percentage['convcost'] = (parseFloat(this.detailValues['manufacture_cost']) + parseFloat(this.detailValues['pack_cost'])).toFixed(2);
    this.percentage['analyticalcost'] = this.detailValues['analytical_cost'];
    this.percentage['punchcost'] = this.detailValues['punch_cost'];
    this.percentage['freightcost'] = (parseFloat(this.percentage['materialcost']) * (this.detailValues['freight'] / 100)).toFixed(2);
    this.percentage['factorycost'] = [this.percentage['materialcost'], this.percentage['convcost'],
    this.percentage['analyticalcost'], this.percentage['punchcost'], parseFloat(this.percentage['freightcost']),
    ].reduce((acc, cost) => acc + parseFloat(cost), 0).toFixed(2);

    this.percentage['system_factorycost'] = [this.percentage['system_materialcost'], this.percentage['convcost'],
    this.percentage['analyticalcost'], this.percentage['punchcost'], parseFloat(this.percentage['freightcost']),
    ].reduce((acc, cost) => acc + parseFloat(cost), 0).toFixed(2);

    this.percentage['rmcostPercentage'] = parseFloat(((this.percentage['rmcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['pmcostPercentage'] = parseFloat(((this.percentage['pmcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['materialcostPercentage'] = parseFloat(((this.percentage['materialcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['convcostPercentage'] = parseFloat(((this.percentage['convcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['analyticalcostPercentage'] = parseFloat(((this.percentage['analyticalcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['punchcostPercentage'] = parseFloat(((this.percentage['punchcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['freightcostPercentage'] = parseFloat(((this.percentage['freightcost'] * 100) / this.percentage['factorycost']).toFixed(2));
    this.percentage['factorycostPercentage'] = parseFloat(((this.percentage['factorycost'] * 100) / this.percentage['factorycost']).toFixed(2));

    this.system['rupee'] = parseFloat(parseFloat(this.percentage['system_factorycost']).toFixed(2));
    this.system['doller'] = parseFloat((parseFloat(this.percentage['system_factorycost']) / this.convertrate).toFixed(2));
    this.system['convertrate'] = this.convertrate;
    this.system['batchsize'] = parseFloat(this.detailValues['batch']) / 100000;
    this.system['api'] = this.system_raw?.[0]?.rate || '0.00';
    this.changePrice();
  }

  changePrice() {
    this.medopharm['api'] = this.medo_raw?.[0]?.rate || '0.00';
    this.medopharm['rupee'] = parseFloat(parseFloat(this.percentage['factorycost']).toFixed(2));
    this.medopharm['convertrate'] = this.convertrate;
    this.medopharm['doller'] = parseFloat((parseFloat(this.percentage['factorycost']) / this.convertrate).toFixed(2));
    this.medopharm['batchsize'] = parseFloat(this.detailValues['batch']) / 100000;
  }

  // raw and pack total
  getTotalRaw(field: string): number {
    return (
      this.medo_raw
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
  }

  getTotalPack(field: string): number {
    return (
      this.medo_pack
        ?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
        .toFixed(2) || '0.00'
    );
  }
}