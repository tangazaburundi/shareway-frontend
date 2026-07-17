// src/app/core/services/message.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, Message, SendMessageRequest } from '../models/message.model';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly API = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.API}/conversations`);
  }

  getMessages(userId: string): Observable<ApiResponse<PageResponse<Message>>> {
    return this.http.get<ApiResponse<PageResponse<Message>>>(`${this.API}/conversation/${userId}`);
  }

  sendMessage(data: SendMessageRequest): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(this.API, data);
  }

  markAsRead(userId: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/read/${userId}`, {});
  }
}
