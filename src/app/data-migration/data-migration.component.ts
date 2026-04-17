import { Component, OnInit } from '@angular/core';
import { CommonService } from '../shared/api/common.service';
import { ApiService } from '../shared/api/api.service';
import { Router } from '@angular/router';
import { SocketService } from '../shared/api/socket.service';
import { Subscription } from 'rxjs';
import { faEye } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-data-migration',
  templateUrl: './data-migration.component.html',
  styleUrls: ['./data-migration.component.scss']
})
export class DataMigrationComponent implements OnInit {
  private bomProgressSubscription: Subscription;
  private itemProgressSubscription: Subscription;
  private grnProgressSubscription: Subscription;
  bomProgress: number = 0;
  grnProgress: number = 0;
  itemProgress: number = 0;
  uploadProgress: number = 0;
  bomLoader: boolean = false
  itemLoader: boolean = false
  grnLoader: boolean = false
  lastBomTime: string | null = null;
  lastItemTime: string | null = null;
  lastGrnTime: string | null = null;
  currentMigration: string | null = null;
  bomStatus = 'N/A';
  itemStatus = 'N/A';
  grnStatus = 'N/A';
  selectedFile: File | null = null;
  priceUploadInProgress = false;
  priceUploadStatus = 'Idle';
  lastPriceUploadTime: Date | null = null;
  bomCodeInput: string = '';
  bomCodes: string[] = [];
  bomCodeLoader: boolean = false;
  bomCodeProgress: number = 0;
  bomCodeStatus: string = 'Idle';
  faEye = faEye

  constructor(public common: CommonService, private api: ApiService, private router: Router, private socketService: SocketService,) {
    this.itemProgressSubscription = this.socketService.itemUploadProgress().subscribe((data: number) => {
      this.itemProgress = data;
      if (data && data > 0 && data !== 100) {
        this.itemLoader = true;
      } else {
        this.itemLoader = false;
      }
    });
    this.bomProgressSubscription = this.socketService.bomUploadProgress().subscribe((data: number) => {
      this.bomProgress = data;
      if (data && data > 0 && data !== 100) {
        this.bomLoader = true;
      } else {
        this.bomLoader = false;
      }
    });
    this.grnProgressSubscription = this.socketService.grnUploadProgress().subscribe((data: number) => {
      this.grnProgress = data;
      if (data && data > 0 && data !== 100) {
        this.grnLoader = true;
      } else {
        this.grnLoader = false;
      }
    });

    this.grnProgressSubscription = this.socketService.priceUploadProgress().subscribe((data: number) => {
      this.uploadProgress = data;
      if (data && data > 0 && data !== 100) {
        this.priceUploadInProgress = true;
      } else {
        this.priceUploadInProgress = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadLastMigrations();
  }

  loadLastMigrations() {
    this.api.post('migration_log', {}).subscribe((res: any) => {
      if (res.status) {
        res.data.logs.forEach((log: any) => {
          if (log.type === 'ITEM') {
            this.lastItemTime = log.lastRunAt;
            this.itemStatus = log.status;
          }

          if (log.type === 'BOM') {
            this.lastBomTime = log.lastRunAt;
            this.bomStatus = log.status;
          }

          if (log.type === 'GRN') {
            this.lastGrnTime = log.lastRunAt;
            this.grnStatus = log.status;
          }
        });
      }
    });
  }

  triggerMigration(type: string) {
    if (this.currentMigration) {
      return;
    }
    this.currentMigration = type;
    if (type === 'ITEM') this.itemLoader = true;
    if (type === 'BOM') this.bomLoader = true;
    if (type === 'GRN') this.grnLoader = true;

    this.api.post('manual_trigger', { type }).subscribe({
      next: (res) => {
        if (res.status) {
          this.common.alert({ msg: res.message || `${type} migration completed`, type: 'success' });
        } else {
          this.common.alert({ msg: res.message || `${type} migration failed`, type: 'danger' });
        }
        this.loadLastMigrations();
      },
      error: (err) => console.error(err),
      complete: () => {
        if (type === 'ITEM') this.itemLoader = false;
        if (type === 'BOM') this.bomLoader = false;
        if (type === 'GRN') this.grnLoader = false;
        this.currentMigration = null;
      }
    });
  }

  handleFileInput(event: any) {
    const file: File = event.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
      this.priceUploadStatus = 'Only .xlsx files are allowed.';
      event.target.value = ''; // clear the input
    }
  }

  uploadPriceExcel() {
    if (!this.selectedFile) return;
    var form = new FormData();
    this.priceUploadInProgress = true
    form.append("file", this.selectedFile);
    let params = {}
    this.api.upload('price_upload', form, params).subscribe((response) => {
      this.priceUploadInProgress = false;
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }

  addBomCode(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const code = this.bomCodeInput.trim().replace(/,$/, '');
      if (code && !this.bomCodes.includes(code)) {
        this.bomCodes.push(code);
      }
      this.bomCodeInput = '';
    }
  }

  addBomCodeOnBlur() {
    const code = this.bomCodeInput.trim().replace(/,$/, '');
    if (code && !this.bomCodes.includes(code)) {
      this.bomCodes.push(code);
    }
    this.bomCodeInput = '';
  }

  removeBomCode(index: number) {
    this.bomCodes.splice(index, 1);
  }

  fetchBomByCode() {
    // Flush any pending input before submitting
    const pending = this.bomCodeInput.trim().replace(/,$/, '');
    if (pending && !this.bomCodes.includes(pending)) {
      this.bomCodes.push(pending);
      this.bomCodeInput = '';
    }

    if (!this.bomCodes.length) {
      this.common.alert({ msg: 'Please enter at least one FG Code', type: 'warning' });
      return;
    }

    this.bomCodeLoader = true;
    this.bomCodeStatus = 'Running';
    this.bomCodeProgress = 0;

    const interval = setInterval(() => {
      if (this.bomCodeProgress < 90) this.bomCodeProgress += 10;
    }, 800);

    this.api.post('update_bom_code', { codes: this.bomCodes }).subscribe({
      next: (res: any) => {
        clearInterval(interval);
        this.bomCodeProgress = 100;
        this.bomCodeStatus = res.status ? 'Success' : 'Failed';
        this.common.alert({ msg: res.message || 'FG Code Sync complete', type: res.status ? 'success' : 'danger' });
        if (res.status) this.bomCodes = [];
      },
      error: () => {
        clearInterval(interval);
        this.bomCodeStatus = 'Failed';
        this.common.alert({ msg: 'FG Code Sync failed', type: 'danger' });
      },
      complete: () => {
        this.bomCodeLoader = false;
        setTimeout(() => { this.bomCodeProgress = 0; }, 1000);
      }
    });
  }

  viewMigrationDetails(key: string) {
  }

}