import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-price-logs',
  templateUrl: './price-logs.component.html',
  styleUrls: ['./price-logs.component.scss']
})
export class PriceLogsComponent implements OnInit {
  page_loading: Boolean = false;
  table_loading: Boolean = false;
  pagination_data;
  page = 1
  priceLog: any[] = []
  currentPage: number = 1;
  search: string = ''
  private searchChanged: Subject<string> = new Subject<string>();
  faSearch = faSearch;





  constructor(private api: ApiService,
    private common: CommonService,
  ) {
    this.common.change_page.subscribe((data) => {
      if (data.section == 'logs') {
        this.get_price_logs();
        this.page = data.page;
      }
    });
  }

  ngOnInit(): void {
    // First load → full page loader
    this.get_price_logs(false);

    // Debounced search → only table loader
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.get_price_logs(true);
    });
  }

  onSearchChange(value: string) {
    this.searchChanged.next(value);
  }

  get_price_logs(isSearch: boolean = false) {
    if (isSearch) {
      this.table_loading = true;   // Show only table loader
    } else {
      this.page_loading = true;    // Show full-page loader on first load or page change
    }

    let params = {
      pagination: 'true',
      page: this.page,
      per_page: 10,
      language: 'en',
      search: this.search,
    };

    this.api.post('get_price_logs', params).subscribe({
      next: (response) => {
        this.page_loading = false;
        this.table_loading = false;

        this.priceLog = response.data.logs.docs;
        this.pagination_data = response.data.logs;
        this.common.set_pagination_data(this.pagination_data, 'logs');
      },
      error: () => {
        this.page_loading = false;
        this.table_loading = false;
        this.priceLog = [];
      }
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
}
