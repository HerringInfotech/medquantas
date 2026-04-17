import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { PermissionService } from '../shared/permission/permission.service';
import {
  faEdit,
  faPlus,
  faSort,
  faSortUp,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { CurrencyService } from '../shared/currency.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversion-factor-master',
  templateUrl: './conversion-factor-master.component.html',
  styleUrls: ['./conversion-factor-master.component.scss'],
})
export class ConversionFactorMasterComponent implements OnInit {
  page_loading = false;
  conversionFactors = [];
  pagination_data;
  sort = '';
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faPlus = faPlus;
  faSortUp = faSortUp;
  faSort = faSort;
  isActive: boolean = false;
  private isActiveSub: Subscription;

  constructor(
    private api: ApiService,
    private permission: PermissionService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.getConversionFactors();
  }

  ngOnDestroy(): void {
    this.isActiveSub?.unsubscribe();
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.getConversionFactors();
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  getConversionFactors() {
    this.page_loading = true;
    this.api.post('get_conversion_factor', {}).subscribe((response) => {
      this.page_loading = false;
      this.conversionFactors = response?.data || [];
    });
  }

  hasPermission(permissionName: string): boolean {
    return this.permission.hasPermission(permissionName);
  }
}