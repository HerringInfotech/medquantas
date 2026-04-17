import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';

interface ActivityLog {
  _id: string;
  timestamp: string;
  userId: any;
  userName: string;
  userEmail: string;
  module: string;
  action: string;
  description: string;
  referenceId: string;
  referenceName: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
}

@Component({
  selector: 'app-user-activity',
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.scss']
})
export class UserActivityComponent implements OnInit {

  logs: ActivityLog[] = [];
  loading = false;
  totalRecords = 0;
  currentPage = 1;
  pageSize = 50;
  totalPages = 1;

  // Filters
  filters = {
    search: '',
    module: 'All',
    action: 'All',
    status: 'All',
    startDate: '',
    endDate: ''
  };

  modules = [
    'All', 'Authentication', 'BOM', 'Cost Sheet', 'Sales Sheet',
    'Item Master', 'FG Master', 'Price Master', 'Pack Master',
    'Stage Master', 'UOM Master', 'Customer Master',
    'Conversion Factor', 'Item Group', 'Item Type', 'User Management',
    'Settings', 'Other'
  ];

  actions = [
    'All', 'Login', 'Logout', 'Automatic Logout', 'Create', 'Update', 'Delete',
    'View', 'Export', 'Email Sent', 'Password Change', 'Other'
  ];

  statuses = ['All', 'Success', 'Failed'];

  summary: any = null;
  showSummary = false;

  constructor(private api: ApiService, private common: CommonService) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs() {
    this.loading = true;
    const params = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };
    this.api.post('get_activity_logs', params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status) {
          this.logs = res.data.logs;
          this.totalRecords = res.data.total;
          this.totalPages = res.data.totalPages;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.fetchLogs();
  }

  resetFilters() {
    this.filters = { search: '', module: 'All', action: 'All', status: 'All', startDate: '', endDate: '' };
    this.currentPage = 1;
    this.fetchLogs();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchLogs();
  }

  get pages(): number[] {
    const range = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  fetchSummary() {
    this.api.post('get_activity_summary', {}).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.summary = res.data;
          this.showSummary = true;
        }
      }
    });
  }

  getActionBadgeClass(action: string): string {
    const map: any = {
      'Login': 'badge-login',
      'Logout': 'badge-logout',
      'Automatic Logout': 'badge-logout',
      'Create': 'badge-create',
      'Update': 'badge-update',
      'Delete': 'badge-delete',
      'Password Change': 'badge-password',
      'Email Sent': 'badge-email',
      'Export': 'badge-export',
      'View': 'badge-view',
    };
    return map[action] || 'badge-other';
  }

  getModuleIcon(module: string): string {
    const map: any = {
      'Authentication': '🔐', 'BOM': '📋', 'Cost Sheet': '💰',
      'Sales Sheet': '📊', 'Item Master': '📦', 'FG Master': '🏭',
      'Price Master': '💲', 'Pack Master': '📫', 'Stage Master': '🔧',
      'UOM Master': '📏', 'Customer Master': '👥', 'Conversion Factor': '🔄',
      'Item Group': '🗂', 'Item Type': '🏷', 'User Management': '👤',
      'Settings': '⚙', 'Other': '📌'
    };
    return map[module] || '📌';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }
}
