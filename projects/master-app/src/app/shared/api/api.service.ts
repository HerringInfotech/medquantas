import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

function getHttpOptions() {
  const token = localStorage.getItem('token') || '';
  return {
    headers: new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    }),
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  urls: Object = {
    register: 'supplier/supplier_signup',
    forgotpassword: 'auth/forgotpassword',
    change_password: 'auth/change_password',
    sign_in: 'auth/sign_in',
    sign_up: 'auth/sign_up',
    speed: 'auth/speed',

    update_module: 'master/update_module',
    get_module: 'master/get_module',
    delete_module: 'master/delete_module',

    update_role: 'master/update_role',
    get_role: 'master/get_role',

    update_role_master: 'master/update_role_master',
    get_role_master: 'master/get_role_master',
    create_role: 'master/create_role',
    check_role: 'master/check_role',


    update_item: 'master/update_item',
    get_item: 'master/get_item',
    delete_item: 'master/delete_item',

    get_conversion_factor: 'master/get_conversion_factor ',
    update_conversion_factor: 'master/update_conversion_factor ',
    get_unique_locations: 'main/get_unique_locations',


    update_rate: 'master/update_rate',
    update_group: 'master/update_group',
    get_rate: 'master/get_rate',
    get_group: 'master/get_group',
    check_price: 'master/check_price',
    delete_rate: 'master/delete_rate',

    get_user: 'auth/get_user',
    update_user: 'auth/update_user',

    change_status: 'auth/change_status',

    update_customer: 'master/update_customer',
    get_customer: 'master/get_customer',
    delete_customer: 'master/delete_customer',

    get_unit: 'master/get_unit',
    update_unit: 'master/update_unit',
    delete_unit: 'master/delete_unit',

    get_bomtype: 'master/get_bomtype',
    update_bomtype: 'master/update_bomtype',

    update_conversion: 'master/update_conversion',
    get_conversion: 'master/get_conversion',
    delete_conversion: 'master/delete_conversion',

    get_packing: 'master/get_packing',
    delete_packing: 'master/delete_packing',

    get_typeitem: 'master/get_typeitem',
    vendor_code: 'master/vendor_code',
    customer_code: 'master/customer_code',


    get_error: 'main/get_error',

    update_pack: 'master/update_pack',
    get_pack: 'master/get_pack',
    delete_pack: 'master/delete_pack',
    pack_code: 'master/pack_code',

    update_brand: 'main/update_brand',
    get_brand: 'main/get_brand',
    delete_brand: 'main/delete_brand',
    fetch_bom: 'main/fetch_bom',

    bulkupdate: 'main/bulkupdate',
    bulk_bomupdate: 'main/bulkbomupdate',
    brand_code: 'main/brand_code',
    brand_name: 'main/brand_name',
    brand_name_suggestions: 'main/brand_name_suggestions',
    get_fg_by_id: 'main/get_fg_by_id',


    get_report: 'main/get_report',
    upload_file: 'main/upload_file',

    update_setting: 'main/update_setting',
    get_setting: 'main/get_setting',
    send_daily_reports: 'main/send_daily_reports',


    fG_sapcode: 'main/fG_sapcode',
    customer_sapcode: 'master/customer_sapcode',

    export_item: 'main/export_item',
    export_log: 'main/export_log',
    export_fgmaster: 'main/export_fgmaster',
    export_supplier: 'main/export_supplier',
    export_customer: 'main/export_customer',
    export_make: 'main/export_make',
    get_price_logs: 'master/get_price_logs',

    generate_code: 'main/generate_code',

    get_view: 'main/get_view',

    get_itemtype: 'master/get_itemtype',
    get_item_suggestions: 'master/get_item_suggestions',
    update_itemtype: 'master/update_itemtype',
    delete_itemtype: 'master/delete_itemtype',

    get_subtype: 'master/get_subtype',

    update_bom: 'main/update_bom',
    update_bom_code: 'migration/update_bom_code',
    get_bom: 'main/get_bom',

    update_sheet: 'main/update_sheet',
    get_sheet: 'main/get_sheet',

    import_data: 'bulk_update/import_data',


    update_stage: 'master/update_stage',
    get_stage: 'master/get_stage',
    delete_stage: 'master/delete_stage',


    migration_log: 'migration/migration_log',
    manual_trigger: 'migration/manual_trigger',
    price_upload: 'bulk_update/price_upload',
    get_bulk_rate: 'master/get_bulk_rate',

    send_mail: 'auth/send_mail',
    get_email_logs: 'main/get_email_logs',
    send_costsheet: 'auth/send_costsheet',
    percentage_bom_upload: 'bulk_update/percentage_bom_upload',

    update_sale_sheet: 'main/update_sale_sheet',
    get_sale_sheet: 'main/get_sale_sheet',
    get_erb_logs: 'master/get_erb_logs',
    get_dashboard_metrics: 'main/get_dashboard_metrics',
    get_unique_currencies: 'main/get_unique_currencies',
    run_backup: 'main/run_backup',

    // User Activity Logs
    get_activity_logs: 'auth/get_activity_logs',
    log_activity: 'auth/log_activity',
    get_activity_summary: 'auth/get_activity_summary',


  };
  restUrl: String = '';
  apiurl: string = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.restUrl = this.apiurl;
  }

  getUrl(urlKey) {
    const uri = this.urls[urlKey];
    const url = this.restUrl + uri;
    return url;
  }

  post(urlKey, params): Observable<any> {
    params = JSON.stringify(params);
    const url = this.getUrl(urlKey);
    return this.http
      .post(url, { params }, getHttpOptions())
      .pipe(map(this.extractData));
  }

  upload(urlKey, formData, params): Observable<any> {
    formData.append('params', JSON.stringify(params));
    const url = this.getUrl(urlKey);
    return this.http
      .post(url, formData, getHttpOptions())
      .pipe(map(this.extractData));
  }

  post_upload(urlKey, params): Observable<any> {
    params = JSON.stringify(params);
    const url = this.getUrl(urlKey);
    return this.http.post(url, params, getHttpOptions()).pipe(map(this.extractData));
  }

  private extractData(res: Response) {
    let body = res;
    return body || {};
  }

  logout(action: string = 'Logout', description: string = 'User logged out successfully') {
    // Log activity before clearing localStorage
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');

    if (userId && userId !== '' && userId !== 'null') {
      const params = {
        userId,
        userName,
        module: 'Authentication',
        action: action,
        description: description,
        status: 'Success'
      };

      // We use a synchronous-like call but it's okay since we are navigating away
      this.post('log_activity', params).subscribe();
    }

    localStorage.setItem('token', '');
    localStorage.setItem('id', '');
    localStorage.setItem('user_id', '');
    localStorage.setItem('role_name', '');
    localStorage.setItem('user_name', '');
    localStorage.setItem('showWelcome', '');
  }

  resetAuthorization() {
    // No-op: headers are now read dynamically per-request via getHttpOptions()
  }
}
