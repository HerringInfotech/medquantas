import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: SocketIOClient.Socket;
  apiurl = environment.socketUrl;


  constructor() {
    // this.socket = io(this.apiurl, { secure: true, rejectUnauthorized: false, transports: ['polling'] });
    this.socket = io(this.apiurl, {
      transports: ['websocket', 'polling']
    });


  }

  onNotification(data) {
    this.socket.emit('connected', data);
  }

  itemUploadProgress() {
    return new Observable(observer => {
      this.socket.on('item_upload_progress', (data) => {
        observer.next(data);
      });
    });
  }

  bomUploadProgress() {
    return new Observable(observer => {
      this.socket.on('bom_upload_progress', (data) => {
        observer.next(data);
      });
    });
  }

  grnUploadProgress() {
    return new Observable(observer => {
      this.socket.on('grn_upload_progress', (data) => {
        observer.next(data);
      });
    });
  }

  priceUploadProgress() {
    return new Observable(observer => {
      this.socket.on('price_upload_progress', (data) => {
        observer.next(data);
      });
    });
  }
}