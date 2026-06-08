import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { AiService, ChatMessage } from '../api/ai.service';

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AiChatComponent implements OnInit {
  @ViewChild('messagesEnd') messagesEnd: ElementRef;

  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: ChatMessage[] = [];

  suggestions = [
    'Show me all items in the system',
    'What are the latest prices?',
    'List all customers',
    'Which BOMs have the highest cost?',
  ];

  constructor(private aiService: AiService) {}

  ngOnInit() {
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I am your MedQuantas AI assistant. Ask me anything about items, BOMs, prices, customers, or cost sheets.',
      timestamp: new Date()
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.aiService.chat(text, this.messages).subscribe(
      (res: any) => {
        this.isLoading = false;
        if (res.status) {
          this.messages.push({ role: 'assistant', content: res.data.reply, timestamp: new Date() });
        } else {
          this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() });
        }
        this.scrollToBottom();
      },
      () => {
        this.isLoading = false;
        this.messages.push({ role: 'assistant', content: 'Could not connect to AI service. Please check your connection.', timestamp: new Date() });
        this.scrollToBottom();
      }
    );
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages = [{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date()
    }];
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesEnd) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }
}
