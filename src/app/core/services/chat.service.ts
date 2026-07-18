import { Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { Message, TypingIndicator, MessageReadReceipt } from '../models/message.model';
import { MessageService } from './message.service';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private typingTimeouts = new Map<string, any>();
  private subscriptions = new Subscription();
  private _typingUsers = signal<Map<string, boolean>>(new Map());
  typingUsers = this._typingUsers.asReadonly();
  private wsConnected = false;

  constructor(
    private messageService: MessageService,
    private ws: WebSocketService,
    private auth: AuthService
  ) {}

  private ensureConnected(): void {
    if (this.wsConnected) return;
    const token = this.auth.getToken();
    if (!token) return;
    this.wsConnected = true;
    this.connectWebSocket(token);
  }

  private connectWebSocket(token: string): void {
    this.ws.connect(token);

    this.subscriptions.add(
      this.ws.subscribe<TypingIndicator>('/topic/typing').subscribe(indicator => {
        const map = this._typingUsers();
        if (indicator.typing) {
          map.set(indicator.senderId, true);
        } else {
          map.delete(indicator.senderId);
        }
        this._typingUsers.set(new Map(map));
      })
    );

    this.subscriptions.add(
      this.ws.subscribe<Message>('/topic/messages').subscribe(msg => {
        this.onNewMessage$.next(msg);
      })
    );

    this.subscriptions.add(
      this.ws.subscribe<MessageReadReceipt>('/topic/read-receipts').subscribe(receipt => {
        this.onReadReceipt$.next(receipt);
      })
    );
  }

  private onNewMessage$ = new Subject<Message>();

  private onReadReceipt$ = new Subject<MessageReadReceipt>();

  onNewMessage(): Observable<Message> {
    return this.onNewMessage$;
  }

  onReadReceipt(): Observable<MessageReadReceipt> {
    return this.onReadReceipt$;
  }

  sendTypingIndicator(receiverId: string, typing: boolean): void {
    this.ensureConnected();
    const user = this.auth.currentUser();
    if (!user) return;
    this.ws.send('/app/typing', {
      senderId: user.id,
      conversationWith: receiverId,
      typing
    } as TypingIndicator);
  }

  startTyping(receiverId: string): void {
    this.sendTypingIndicator(receiverId, true);

    const existing = this.typingTimeouts.get(receiverId);
    if (existing) clearTimeout(existing);

    this.typingTimeouts.set(receiverId, setTimeout(() => {
      this.sendTypingIndicator(receiverId, false);
      this.typingTimeouts.delete(receiverId);
    }, 3000));
  }

  stopTyping(receiverId: string): void {
    this.sendTypingIndicator(receiverId, false);
    const existing = this.typingTimeouts.get(receiverId);
    if (existing) {
      clearTimeout(existing);
      this.typingTimeouts.delete(receiverId);
    }
  }

  sendMessage(receiverId: string, content: string): Observable<any> {
    this.ensureConnected();
    this.stopTyping(receiverId);
    this.ws.send('/app/chat.send', { receiverId, content });
    return this.messageService.sendMessage({ receiverId, content });
  }

  markAsRead(conversationUserId: string): void {
    this.ensureConnected();
    this.messageService.markAsRead(conversationUserId).subscribe();
    this.ws.send('/app/chat.read', { conversationWith: conversationUserId });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.typingTimeouts.forEach(t => clearTimeout(t));
  }
}
