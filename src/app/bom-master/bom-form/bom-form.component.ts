import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { NgForm } from '@angular/forms';
import {
  faEye,
  faTrashAlt,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { ExcelService } from '../../shared/excel/excel.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PermissionService } from '../../shared/permission/permission.service';
import { SocketService } from '../../shared/api/socket.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-bom-form',
  templateUrl: './bom-form.component.html',
  styleUrls: ['./bom-form.component.scss'],
})
export class BomFormComponent implements OnInit {
  bomID;
  modalRef: BsModalRef;
  itemObject: Object = {};
  formValues: object = {};
  bom_list;
  bill_Id;
  rawItems;
  packItems;
  rawMaterials: any = []
  user;
  remark_lists;
  remarkObj = [];
  isremark: boolean = false;
  isEditMode: boolean = false;
  // medquantas
  status_loader: boolean = false;
  faArrowLeft = faArrowLeft;
  faTrashAlt = faTrashAlt;
  rawstage = [];
  packstage = [];
  totalcost: Object = {
    yield: '',
    manufacture_qty: '',
    manufacture_total: '',
    manufacture_matval: '',
    pack_qty: '',
    pack_total: '',
    pack_matval: '',
    analytical_value: '',
    punch_value: '',
    freight: '',
  };
  currentData;
  remarks = '';
  nameExists: boolean = false;

  page_loader: boolean = false;
  btn_loader: boolean = false;
  status_access;
  user_list;
  role_list;
  finalstage: Object = {
    convertrate: '',
  };
  selectedFgLocked = false;
  packtypeList;
  btn_loading: Boolean = false;

  suggestions: string[] = [];
  showSuggestions = false;
  itemList;
  productname
  product_codes: any[] = []
  filtered_product_codes: any[] = []
  productcode: ''
  itemLists: any[] = []
  itemValues: any = {}
  rawValues: any = {}
  raw_list: any[] = []
  finalRaw: any = []
  constructor(
    private api: ApiService,
    private ref: ChangeDetectorRef,
    private modalService: BsModalService,
    private socket: SocketService,
    private permission: PermissionService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private common: CommonService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.get_packtype();

    this.route.params.subscribe((params) => {
      this.bomID = params.id;
      if (this.bomID) {
        this.get_bom(this.bomID);
        this.isEditMode = true;
      } else {
        this.formValues['percentage'] = 2;
      }
    });
    this.page_loader = false;
    this.get_user();
    this.get_role_master();
    this.get_role();
    this.get_current_user();
  }

  displayFn(item: any): string {
    return item?.name || item || '';
  }

  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_item(e) {
    let params = {
      name: e,
    };
    this.api.post('get_item', params).subscribe((response) => {
      if (response.status) {
        this.itemList = response.data.item;
      }
    });
  }

  onItemSelected(e) { }

  get_role_master() {
    let params = {
      role_id: localStorage.getItem('id'),
    };
    this.api.post('get_role_master', params).subscribe((response) => {
      var role_data = response.data.rolemanager[0].status;
    });
  }

  convert_user(data) {
    if (this.user_list) {
      const user = this.user_list.find((item) => item.id === data);
      return user ? user.name : undefined;
    }
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


  formatDateWithoutTimeZone(dateString) {
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

  get_user() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user_list = response.data.users;
    });
  }
  get_role() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_role', params).subscribe((response) => {
      this.role_list = response.data?.roles;
    });
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-dialog-started modal-xl' })
    );
  }


  close_model_ref() {
    this.modalRef.hide();
    this.currentData = null;
  }


  get_bom(id) {
    let params = { id: id };
    this.api.post('get_bom', params).subscribe(async (response) => {
      this.page_loader = true;
      this.bom_list = response.data.boms[0];
      const bomDetail = this.bom_list?.packstage?.[0]?.bomDetail ?? {};
      this.formValues = {
        ...bomDetail,
        name: this.bom_list.name,
        code: this.bom_list.code,
        locCd: this.bom_list.locCd
      };

      this.bom_list.packstage = (this.bom_list.packstage || []).map(stage => {
        const filtered = (stage.ingredients || []).filter(i => i.typeCode !== 'IM');
        return { ...stage, ingredients: filtered };
      });
      this.product_codes = this.bom_list?.packstage || [];
      this.filtered_product_codes = [...this.product_codes];
      this.remark_lists = this.bom_list?.remarks.reverse();
      this.rawstage = this.bom_list?.rawstage;

      this.rawMaterials = this.bom_list?.bomraw;
      this.productcode = this.bom_list.packstage[0].fgCode;
      this.productname = this.bom_list.packstage[0].fgCode;
      this.packstage = (this.bom_list.packstage[0]?.ingredients || []).filter(i => i.typeCode !== 'IM');
      this.page_loader = true;
    });
  }

  onProductSelect(e) {
    if (this.productcode) {
      const prev = this.bom_list.packstage.find(x => x.fgCode === this.productcode);
      if (prev) prev.bomDetail = { ...this.formValues };
    }

    this.productcode = e;
    const selected = this.bom_list.packstage.find(x => x.fgCode === e);

    this.packstage = (selected?.ingredients || []).filter(i => i.typeCode !== 'IM');
    this.formValues = { ...(selected?.bomDetail ?? {}), name: this.bom_list.name, code: this.bom_list.code, locCd: this.bom_list.locCd };
  }

  filterProductCodes(search: string) {
    if (!this.product_codes) return;
    if (!search) {
      this.filtered_product_codes = [...this.product_codes];
      return;
    }
    const lowerSearch = search.toLowerCase();
    this.filtered_product_codes = this.product_codes.filter(type =>
      type.fgName?.toLowerCase().includes(lowerSearch) ||
      type.fgCode?.toLowerCase().includes(lowerSearch)
    );
  }


  get_packtype() {
    let params = {
      pagination: 'false',
    };
    this.api.post('get_pack', params).subscribe((response) => {
      this.packtypeList = response.data.packtype;
    });
  }

  checkBomNameExists() {
    const name = this.formValues['name']?.trim();
    if (!name) return;

    this.api.post('get_bom', { search: name }).subscribe((res: any) => {
      const existingBoms = res?.data?.boms || [];
      const currentId = this.bomID;

      const duplicate = existingBoms.some(
        (b) =>
          b.name?.toLowerCase() === name.toLowerCase() &&
          b._id !== currentId
      );

      this.nameExists = duplicate;
    });
  }

  removeItem(data: any) {
    if (this.rawMaterials.length > 1) {
      this.rawMaterials = this.rawMaterials.filter((item) => item._id !== data._id);
      this.bom_list.bomraw = this.rawMaterials
    } else {
      this.common.alert({
        msg: 'At least one item must remain in API.',
        type: 'danger',
      });
      return;
    }
  }

  removePack(data: any) {
    this.packstage = this.packstage.filter((item) => item.code !== data.code);
    const index = this.bom_list.packstage.findIndex(x => x.fgCode === this.productcode);
    if (index !== -1) {
      this.bom_list.packstage[index].ingredients = this.bom_list.packstage[index].ingredients.filter(i => i.code !== data.code);
    }
  }

  change_remark() {
    this.isremark = false;
  }

  getItem() {
    const search = this.itemValues['name'].trim();
    if (!search || search.length < 3) {
      return;
    }
    const params = {
      search,
      selectedtype: 'PM',
    };
    this.api.post('get_item', params).subscribe((res) => {
      if (res.status && res.data) {
        this.itemLists = res.data.item;
      } else {
        this.itemLists = [];
      }
    });
  }

  selectItem(e) {
    this.itemValues = e
  }

  add_Pack() {
    if (!this.itemValues || Object.keys(this.itemValues).length === 0 || !this.itemValues.code) {
      console.warn("Cannot add empty raw item");
      return;
    }
    const item = { ...this.itemValues };
    let exists = this.packstage.find(x => x.code === item.code);
    if (exists) return;
    this.packstage.push(item);
    const index = this.bom_list.packstage.findIndex(x => x.fgCode === this.productcode);
    if (index !== -1) {
      this.bom_list.packstage[index].ingredients = this.bom_list.packstage[index].ingredients.filter(i => i.typeCode !== 'IM');
      this.bom_list.packstage[index].ingredients.push(item);
    }
  }

  getRawItem() {
    const search = this.rawValues['name'].trim();
    if (!search || search.length < 3) {
      return;
    }
    const params = {
      search,
      selectedtype: 'RM',
    };
    this.api.post('get_item', params).subscribe((res) => {
      if (res.status && res.data) {
        this.raw_list = res.data.item;
      } else {
        this.raw_list = [];
      }
    });

  }

  selectRawItem(e) {
    this.rawValues = e
  }

  add_raw() {
    if (!this.rawValues || Object.keys(this.rawValues).length === 0 || !this.rawValues.code) {
      console.warn("Cannot add empty raw item");
      return;
    }
    const item = { ...this.rawValues };
    let exists = this.rawItems.find(x => x.code === item.code);
    if (exists) return;
    this.rawItems.push(item);
    const lastStageIndex = this.bom_list.rawstage.length - 1;
    if (!this.bom_list.rawstage[lastStageIndex].ingredients) {
      this.bom_list.rawstage[lastStageIndex].ingredients = [];
    }
    this.bom_list.rawstage[lastStageIndex].ingredients.push(item);
    this.finalRaw = this.prepareFinalBOM();
  }

  prepareFinalBOM() {
    const rawstage = (this.bom_list.rawstage || []).map(stage => {
      const items = (stage.ingredients || []).filter(i => i.typeCode !== 'IM');
      return {
        ...stage,
        ingredients: items
      };
    });
    const seen = new Set();
    const stagewiseUnique = rawstage.map(stage => {
      const list = [];
      for (const item of stage.ingredients) {
        if (!seen.has(item.code)) {
          seen.add(item.code);
          list.push(item);
        }
      }
      return {
        ...stage,
        ingredients: list
      };
    });
    const finalStages = stagewiseUnique.filter(stage => stage.ingredients.length > 0);
    return {
      rawstage: finalStages
    };
  }

  saveBom(form: NgForm) {
    const selectedPackStage = this.bom_list.packstage.find(x => x.fgCode === this.productcode);
    if (!selectedPackStage) {
      this.common.alert({
        msg: 'Selected product not found',
        type: 'danger'
      });
      return;
    }
    selectedPackStage.bomDetail = {
      batch: this.formValues['batch'],
      costunit: this.formValues['costunit'],
      manufacture_qty: this.formValues['manufacture_qty'],
      manufacture_total: this.formValues['manufacture_total'],
      manufacture_matval: this.formValues['manufacture_matval'],
      pack_qty: this.formValues['pack_qty'],
      pack_total: this.formValues['pack_total'],
      pack_matval: this.formValues['pack_matval'],
      analytical_value: this.formValues['analytical_value'],
      punch_value: this.formValues['punch_value'],
      freight: this.formValues['freight'],
      percentage: this.formValues['percentage'],
    };

    let params = {
      ...this.bom_list,
      ...this.prepareFinalBOM(),
      ...this.formValues,
      // packstage: this.bom_list.packstage,
      user: this.user,
      role: localStorage.getItem('id'),
    }
    this.api.post('update_bom', params).subscribe(
      (response) => {
        this.btn_loader = false;
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        if (response.status) {
          this.router.navigateByUrl('bom');
        }
      },
      (error) => {
        this.btn_loader = false;
        this.common.alert({
          msg: 'An error occurred while saving the BOM. Please try again later.',
          type: 'danger',
        });
        console.error('Error updating BOM:', error);
      }
    );
  }
}