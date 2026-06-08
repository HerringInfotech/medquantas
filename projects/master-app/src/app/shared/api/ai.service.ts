import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private api: ApiService) {}

  chat(message: string, history: ChatMessage[]): Observable<any> {
    const historyPayload = history.map(h => ({ role: h.role, content: h.content }));
    return this.api.post('ai_chat', { message, history: historyPayload });
  }
}
