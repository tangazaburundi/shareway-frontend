/*
import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Message } from '../../core/models/message.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TimeAgoPipe],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesList') private messagesList!: ElementRef;

  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  langService = inject(LanguageService);

  conversations: Conversation[] = [];
  messages: Message[] = [];
  activeUserId: string | null = null;
  newMessage = '';
  loadingConvs = true;
  loadingMessages = false;
  sending = false;

  get currentUserId(): string { return this.authService.currentUser()?.id || ''; }
  get activeConv(): Conversation | undefined {
    return this.conversations.find(c => c.participant.id === this.activeUserId);
  }

  ngOnInit(): void {
    this.loadConversations();
    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) this.openConversation(userId);
    });
  }

  ngAfterViewChecked(): void {
    if (this.messagesList) {
      const el = this.messagesList.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (res) => { this.conversations = res.data || []; this.loadingConvs = false; },
      error: () => { this.loadingConvs = false; }
    });
  }

  openConversation(userId: string): void {
    this.activeUserId = userId;
    this.loadingMessages = true;
    this.messageService.getMessages(userId).subscribe({
      next: (res) => {
        this.messages = res.data || [];
        this.loadingMessages = false;
      //  this.messageService.markAsRead(userId).subscribe();
      },
      error: () => { this.loadingMessages = false; }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeUserId) return;
    this.sending = true;
    this.messageService.sendMessage({ receiverId: this.activeUserId, content: this.newMessage }).subscribe({
      next: (res) => {
        this.messages.push(res.data!);
        this.newMessage = '';
        this.sending = false;
      },
      error: () => { this.sending = false; }
    });
  }
}
 */

import { Component,OnInit,AfterViewChecked,ViewChild,ElementRef,inject} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';

import { Conversation, Message } from '../../core/models/message.model';
import { mapConversation, mapMessage } from '../../core/mappers/message.mapper';

import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { LanguageService } from '../../core/services/language.service';


@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TimeAgoPipe],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesList') private messagesList!: ElementRef;

  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

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
  }

  ngAfterViewChecked(): void {
    if (this.messagesList) {
      const el = this.messagesList.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
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

        //this.messages = (res.data?.content || []).map(mapMessage);
        this.loadingMessages = false;
        this.messageService.markAsRead(userId).subscribe();
      },
      error: () => {
        this.loadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeUserId) {
      return;
    }

    this.sending = true;

    this.messageService.sendMessage({
      receiverId: this.activeUserId,
      content: this.newMessage
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.messages.push(mapMessage(res.data));
        }

        this.newMessage = '';
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      }
    });
  }
}