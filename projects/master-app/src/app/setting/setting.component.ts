import { NgForm } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../shared/api/common.service';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Location } from "@angular/common";
import { faEnvelope, faTrash, faTimes, faHistory } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
  upload_btn;
  btn_loading;
  send_report_loading = false;
  formValues: any = {};
  setting_data;
  faTrash = faTrash
  faEnvelope = faEnvelope
  faTimes = faTimes
  faHistory = faHistory
  @ViewChild('logsModal') logsModal: TemplateRef<any>;
  modalRef: BsModalRef;
  imageSrc: string | ArrayBuffer | null = null;
  file: File | null = null;
  daily_report_enabled = true;
  daily_report_recipients = '';
  daily_report_time = '08:00';
  backup_time = '00:00';
  backup_loading = false;
  run_backup_loading = false;

  constructor(
    private api: ApiService,
    private location: Location,
    private router: Router,
    private imageCompress: NgxImageCompressService,
    private route: ActivatedRoute,
    private common: CommonService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getsetting()
  }

  formSubmit(formData: NgForm) {
    this.btn_loading = true;
    if (this.setting_data) {
      this.formValues['id'] = this.setting_data.id
    }
    this.api.post('update_setting', this.formValues).subscribe((response) => {
      this.btn_loading = false;
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })

  }

  getsetting() {
    let params = {}
    this.api.post('get_setting', params).subscribe((response) => {
      if (response.data) {
        this.setting_data = response.data.setting[0];
        if (this.setting_data) {
          this.daily_report_enabled = this.setting_data?.alert_enabled !== false;
          this.daily_report_time = this.setting_data?.alert_time || '08:00';
          this.setting_data.alert_emails = this.setting_data?.alert_emails || [];
          this.backup_time = this.setting_data?.backup_time || '00:00';
          this.setting_data.backup_emails = this.setting_data?.backup_emails || [];
          if (this.setting_data.backup_emails.length === 0) {
            this.setting_data.backup_emails = [
              'dhinesh.rajendran@medopharm.com',
              'itms@medopharm.com',
              'usman.kadher@medopharm.com'
            ];
          }
        }
        this.daily_report_recipients = (this.setting_data?.alert_emails || []).join(', ');
        this.formValues = {
          ...this.formValues,
          id: this.setting_data?._id,
        };
      }
    });
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  saveDailyReportSettings(): void {
    const recipients = this.setting_data?.alert_emails || [];
    const payload: any = {
      id: this.setting_data?._id,
      alert_enabled: this.daily_report_enabled,
      alert_time: this.daily_report_time,
      alert_emails: recipients,
    };

    this.btn_loading = true;
    this.api.post('update_setting', payload).subscribe(
      (response) => {
        this.btn_loading = false;
        if (response.status) {
          this.common.alert({ msg: 'Daily report settings saved successfully', type: 'success' });
          this.getsetting();
        } else {
          this.common.alert({ msg: response.message || 'Unable to save settings', type: 'danger' });
        }
      },
      (error) => {
        this.btn_loading = false;
        this.common.alert({ msg: 'Error saving settings', type: 'danger' });
      }
    );
  }

  sendDailyReportNow(): void {
    this.send_report_loading = true;
    this.api.post('send_daily_reports', {}).subscribe(
      (response) => {
        this.send_report_loading = false;
        if (response.status) {
          this.common.alert({ msg: 'Daily report email sent successfully', type: 'success' });
        } else {
          this.common.alert({ msg: response.message || 'Failed to send daily report', type: 'danger' });
        }
      },
      () => {
        this.send_report_loading = false;
        this.common.alert({ msg: 'Error sending daily report', type: 'danger' });
      }
    );
  }

  saveBackupSettings(): void {
    const recipients = this.setting_data?.backup_emails || [];
    const payload: any = {
      id: this.setting_data?._id,
      backup_time: this.backup_time,
      backup_emails: recipients,
    };

    this.backup_loading = true;
    this.api.post('update_setting', payload).subscribe(
      (response) => {
        this.backup_loading = false;
        if (response.status) {
          this.common.alert({ msg: 'Database backup settings saved successfully', type: 'success' });
          this.getsetting();
        } else {
          this.common.alert({ msg: response.message || 'Unable to save backup settings', type: 'danger' });
        }
      },
      (error) => {
        this.backup_loading = false;
        this.common.alert({ msg: 'Error saving backup settings', type: 'danger' });
      }
    );
  }

  runBackupNow(): void {
    this.run_backup_loading = true;
    this.api.post('run_backup', {}).subscribe(
      (response) => {
        this.run_backup_loading = false;
        if (response.status) {
          this.common.alert({ msg: 'Database backup completed and email sent successfully', type: 'success' });
        } else {
          this.common.alert({ msg: response.message || 'Failed to complete database backup', type: 'danger' });
        }
      },
      () => {
        this.run_backup_loading = false;
        this.common.alert({ msg: 'Error running database backup', type: 'danger' });
      }
    );
  }


  removeEmail(index: number, targetList: string = 'alert_emails') {
    if (this.setting_data && this.setting_data[targetList]) {
      this.setting_data[targetList].splice(index, 1);
    }
  }

  addEmail(email: string, targetList: string = 'alert_emails') {
    if (!email || !this.setting_data) return;
    if (!this.setting_data[targetList]) {
      this.setting_data[targetList] = [];
    }
    if (!this.setting_data[targetList].includes(email)) {
      this.setting_data[targetList].push(email);
    }
  }

  emailLogs: any[] = [];
  logs_total = 0;
  logs_page = 1;
  logs_per_page = 10;
  showLogs = false;
  currentLogType = 'DailyAlert';

  toggleLogs(type: string): void {
    this.currentLogType = type;
    this.logs_page = 1;
    this.getEmailLogs();
    this.modalRef = this.modalService.show(this.logsModal, { class: 'modal-lg modal-dialog-centered' });
  }

  getEmailLogs(page: number = 1): void {
    this.logs_page = page;
    let params = {
      page: this.logs_page,
      per_page: this.logs_per_page,
      type: this.currentLogType
    };

    this.api.post('get_email_logs', params).subscribe((response) => {
      if (response.status) {
        this.emailLogs = response.data.logs.docs;
        this.logs_total = response.data.logs.totalDocs;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
