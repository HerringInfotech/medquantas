import { Component, OnInit, Input } from '@angular/core';
import { AiService } from '../api/ai.service';

export interface PriceAlert {
  field: string;
  previous: number;
  current: number;
  change_pct: number;
  direction: 'increase' | 'decrease';
  updated_on: string | null;
}

export interface PriceAnomaly {
  item_code: string;
  item_name: string;
  currency: string;
  alerts: PriceAlert[];
}

@Component({
  selector: 'app-price-anomaly',
  templateUrl: './price-anomaly.component.html',
  styleUrls: ['./price-anomaly.component.scss']
})
export class PriceAnomalyComponent implements OnInit {
  @Input() threshold: number = 10;

  anomalies: PriceAnomaly[] = [];
  loading = false;
  dismissed = false;
  showModal = false;
  total = 0;

  constructor(private aiService: AiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.aiService.getPriceAnomalies(this.threshold).subscribe(
      (res: any) => {
        this.loading = false;
        if (res.status) {
          this.anomalies = res.data.anomalies;
          this.total = res.data.total;
        }
      },
      () => { this.loading = false; }
    );
  }

  dismiss() {
    this.dismissed = true;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  maxChange(anomaly: PriceAnomaly): number {
    return Math.max(...anomaly.alerts.map(a => Math.abs(a.change_pct)));
  }

  reload(threshold: number) {
    this.threshold = threshold;
    this.dismissed = false;
    this.load();
  }
}
