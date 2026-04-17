import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from '../api/common.service';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {

  @Input() data: any;
  current = 1;
  totalPages = 0;
  startPage = 1;
  endPage = 1;
  pages: any
  constructor(private common_service: CommonService) {
    this.common_service.change_page.subscribe(page => {
      this.current = page;
    })
    this.common_service.pagination_data.subscribe(data => {
      this.data = data;
      this.set_pagination()
    })
  }

  ngOnInit(): void {
    this.set_pagination()
  }
  set_pagination() {
    if (this.data) {
      this.current = this.data.page;
      this.totalPages = this.data.totalPages;
      if (this.totalPages <= 5) {
        this.startPage = 1;
        this.endPage = this.totalPages;
      }
      else {
        if (this.current <= 3) {
          this.startPage = 1;
          this.endPage = 5;
        } else if (this.current + 2 >= this.totalPages) {
          this.startPage = this.totalPages - 4;
          this.endPage = this.totalPages;
        } else {
          this.startPage = this.current - 2;
          this.endPage = this.current + 2;
        }
      }
      this.pages = Array.from(Array((this.endPage + 1) - this.startPage).keys()).map(i => this.startPage + i);
    }
  }
  get_data(page) {
    if (this.current != page) {
      var data = {}
      data['page'] = page;
      data['section'] = this.data.section
      this.common_service.set_pagination_page(data);
    }
  }
}
