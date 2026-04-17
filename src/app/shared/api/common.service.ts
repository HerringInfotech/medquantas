import { Injectable, Output, EventEmitter, Input } from '@angular/core'
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})


export class CommonService {

	constructor() { }
	isClassToggled = false;

	toggleClass() {
		this.isClassToggled = !this.isClassToggled;
	}
	@Output() url_updated: EventEmitter<String> = new EventEmitter();
	set_current_url(value) {
		this.url_updated.emit(value);
	}

	@Output() on_alert: EventEmitter<String> = new EventEmitter();
	alert(value) {
		this.on_alert.emit(value);
	}

	@Output() toggle_sidebar: EventEmitter<String> = new EventEmitter();
	set_sidebar_toggle(value = "") {
		this.toggle_sidebar.emit(value);
	}

	@Output() delete_confirmation: EventEmitter<String> = new EventEmitter();
	set_delete_confirmation_data(value) {
		this.delete_confirmation.emit(value);
	}

	@Output() delete_detail: EventEmitter<String> = new EventEmitter();
	set_delete_data(value) {
		//alert types = success, info, warning, danger
		this.delete_detail.emit(value);
	}

	@Output() open_sidebar: EventEmitter<String> = new EventEmitter();
	set_sidebar_open(value = "") {
		this.open_sidebar.emit(value);
	}

	@Output() manual_triggered_status: EventEmitter<String> = new EventEmitter();
	set_manual_trigger(value = "") {
		this.manual_triggered_status.emit(value);
	}

	@Output() hover_triggered_status: EventEmitter<String> = new EventEmitter();
	set_hover_trigger(value = "") {
		this.hover_triggered_status.emit(value);
	}

	@Output() close_sidebar: EventEmitter<String> = new EventEmitter();
	set_sidebar_close(value = "") {
		this.close_sidebar.emit(value);
	}

	@Output() cancel_delete_detail: EventEmitter<String> = new EventEmitter();
	set_cancel_delete_data(value) {
		this.cancel_delete_detail.emit(value);
	}

	@Output() change_page: EventEmitter<String> = new EventEmitter();
	set_pagination_page(value) {
		this.change_page.emit(value);
	}

	@Output() pagination_data: EventEmitter<String> = new EventEmitter();
	set_pagination_data(value, section) {
		value.section = section;
		this.pagination_data.emit(value);
	}

	@Output() user_updated: EventEmitter<void> = new EventEmitter();
	set_user_updated() {
		this.user_updated.emit();
	}


}
