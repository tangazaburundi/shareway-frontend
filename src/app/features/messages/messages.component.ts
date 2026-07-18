import { Component, OnInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../core/services/message.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Message } from '../../core/models/message.model';
import { mapConversation, mapMessage } from '../../core/mappers/message.mapper';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { LanguageService } from '../../core/services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TimeAgoPipe],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesList') private messagesList!: ElementRef;

  private messageService = inject(MessageService);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private wsSub!: Subscription;

  langService = inject(LanguageService);

  conversations: Conversation[] = [];
  messages: Message[] = [];

  activeUserId: string | null = null;
  newMessage = '';

  loadingConvs = true;
  loadingMessages = false;
  sending = false;

  get currentUserId(): string {
    return this.authService.currentUser()?.id || '';
  }

  get activeConv(): Conversation | undefined {
    return this.conversations.find(
      c => c.participant.id === this.activeUserId
    );
  }

  ngOnInit(): void {
    this.loadConversations();

    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) {
        this.openConversation(userId);
      }
    });

    this.wsSub = this.chatService.onNewMessage().subscribe(msg => {
      if (msg.senderId === this.activeUserId || msg.receiverId === this.activeUserId) {
        this.messages.push(mapMessage(msg));
        if (msg.senderId === this.activeUserId) {
          this.chatService.markAsRead(this.activeUserId);
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.messagesList) {
      const el = this.messagesList.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (res) => {
        this.conversations = (res.data || []).map(mapConversation);
        this.loadingConvs = false;
      },
      error: () => {
        this.loadingConvs = false;
      }
    });
  }

  openConversation(userId: string): void {
    this.activeUserId = userId;
    this.loadingMessages = true;

    this.messageService.getMessages(userId).subscribe({
      next: (res) => {
        const page = res.data;
        const messages = page?.content ?? [];
        this.messages = messages.map(mapMessage);
        this.loadingMessages = false;
        this.chatService.markAsRead(userId);
      },
      error: () => {
        this.loadingMessages = false;
      }
    });
  }

  onTyping(): void {
    if (this.activeUserId) {
      this.chatService.startTyping(this.activeUserId);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeUserId) {
      return;
    }

    this.sending = true;
    const content = this.newMessage;
    this.newMessage = '';

    this.chatService.sendMessage(this.activeUserId, content).subscribe({
      next: (res) => {
        if (res?.data) {
          this.messages.push(mapMessage(res.data));
        }
        this.sending = false;
      },
      error: () => {
        this.newMessage = content;
        this.sending = false;
      }
    });
  }
}
