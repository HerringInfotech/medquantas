import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  submenus: { [key: string]: boolean } = {};
  userRole = localStorage.getItem('role_name');
  bom_list;
  sheet_list;
  user;
  Isshow: boolean = false;
  intervalOptions: string[] = ['week', 'month', 'year'];
  selectedInterval: string = 'week';
  chart_list;
  usereport
  // role_list;
  // user_list;
  // type_list
  columnchart: any = {
    animationEnabled: true,
    theme: 'light2',
    backgroundColor: "transparent",
    title: {
      text: '', // Handled in HTML
    },
    axisX: {
      title: '',
      interval: 1,
      labelAngle: -45,
      labelFontFamily: 'Inter',
      labelFontColor: '#a3aed1',
    },
    axisY: {
      title: '',
      labelFontFamily: 'Inter',
      labelFontColor: '#a3aed1',
      gridColor: '#e0e5f2',
    },
    axisY2: {
      title: '',
      labelFontFamily: 'Inter',
      labelFontColor: '#a3aed1',
    },
    toolTip: {
      shared: true,
      fontFamily: 'Inter',
    },
    legend: {
      cursor: 'pointer',
      fontFamily: 'Inter',
      fontColor: '#1b2559',
      itemclick: function (e: any) {
        if (typeof e.dataSeries.visible === 'undefined' || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        }
        e.chart.render();
      },
    },
    data: [
      {
        type: 'column',
        name: 'Generic',
        legendText: 'Generic',
        showInLegend: true,
        color: '#4318ff',
        dataPoints: [],
      },
      {
        type: 'column',
        name: 'Brand',
        legendText: 'Brand',
        showInLegend: true,
        color: '#0dcaf0',
        dataPoints: [],
      },
    ],
  };

  chartOptions: any;
  chartline;
  selectedYear: number;
  availableYears: number[] = [];



  constructor(private api: ApiService, private router: Router, private spinner: NgxSpinnerService, private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.generateAvailableYears();
    this.get_metrics();
    this.get_user();
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // Adjust the range as needed
    const endYear = currentYear + 5;
    for (let year = startYear; year <= endYear; year++) {
      this.availableYears.push(year);
    }
    this.selectedYear = currentYear;
  }

  toggleSubmenu(item): void {
    for (const key in this.submenus) {
      this.submenus[key] = false;
    }
    this.submenus[item] = true;
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  }

  select_data(data) {
    this.router.navigate(['/report', { search: data }]);
  }

  metricsData: any = {};

  get_metrics() {
    if (this.userRole && this.userRole.toLowerCase().includes('sale')) {
      this.router.navigate(['/sales']);
      return;
    }
    let params = {};
    this.api.post('get_dashboard_metrics', params).subscribe((response) => {
      if (response.status) {
        this.metricsData = response.data;
      }
    });
  }

  get_user() {
    let params =
    {
      id: localStorage.getItem("user_id"),
    }
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    })
  }



}


