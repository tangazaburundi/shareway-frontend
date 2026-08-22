import { Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { Message } from '../models/message.model';
import { environment } from '../../../environments/environment';

interface StompMessage {
  body: string;
  headers: Record<string, string>;
}

type StompFrame = { command: string; headers: Record<string, string>; body: string };

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private readonly WS_URL = environment.apiUrl.replace('https', 'wss').replace('http', 'ws') + '/ws';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscriptions = new Map<string, Subject<any>>();
  private pendingSubscriptions: Array<{ destination: string; callback: (msg: any) => void }> = [];
  private connected = signal(false);

  private stompSendQueue: string[] = [];

  isConnected = this.connected.asReadonly();

  connect(token: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.ws = new WebSocket(`${this.WS_URL}?token=${token}`);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
      this.sendStomp('CONNECT', {
        'accept-version': '1.1,1.2',
        'heart-beat': '10000,10000',
        'Authorization': `Bearer ${token}`
      });
    };

    this.ws.onmessage = (event) => this.handleMessage(event.data);

    this.ws.onclose = () => {
      this.connected.set(false);
      this.tryReconnect(token);
    };

    this.ws.onerror = () => {};
  }

  disconnect(): void {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendStomp('DISCONNECT', {});
      }
      this.ws.close();
      this.ws = null;
    }
    this.connected.set(false);
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.subscriptions.forEach(s => s.complete());
    this.subscriptions.clear();
  }

  subscribe<T>(destination: string): Observable<T> {
    const existing = this.subscriptions.get(destination);
    if (existing) return existing.asObservable();

    const subject = new Subject<T>();
    this.subscriptions.set(destination, subject);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendStomp('SUBSCRIBE', { id: destination, destination });
    } else {
      this.pendingSubscriptions.push({ destination, callback: (msg) => subject.next(msg) });
    }

    return subject.asObservable();
  }

  send(destination: string, body: any): void {
    const json = typeof body === 'string' ? body : JSON.stringify(body);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendStomp('SEND', { destination }, json);
    }
  }

  private sendStomp(command: string, headers: Record<string, string>, body = ''): void {
    let frame = command + '\n';
    for (const [key, val] of Object.entries(headers)) {
      frame += `${key}:${val}\n`;
    }
    frame += '\n' + body + '\0';
    this.ws?.send(frame);
  }

  private handleMessage(data: string): void {
    if (data.startsWith('CONNECTED')) {
      this.flushPendingSubscriptions();
      return;
    }

    const frame = this.parseStompFrame(data);
    if (!frame || frame.command === 'RECEIPT') return;

    const subId = frame.headers?.['subscription'];
    const dest = frame.headers?.['destination'];
    const subject = (subId && this.subscriptions.get(subId)) || (dest && this.subscriptions.get(dest));
    if (subject) {
      try {
        const parsed = frame.body ? JSON.parse(frame.body) : null;
        subject.next(parsed);
      } catch {
        subject.next(frame.body);
      }
    }
  }

  private parseStompFrame(data: string): StompFrame | null {
    const lines = data.split('\n');
    const command = lines[0];
    if (!command) return null;

    const headers: Record<string, string> = {};
    let i = 1;
    while (i < lines.length && lines[i].includes(':')) {
      const idx = lines[i].indexOf(':');
      headers[lines[i].substring(0, idx).trim()] = lines[i].substring(idx + 1).trim();
      i++;
    }

    const bodyStart = data.indexOf('\n\n') + 2;
    const body = bodyStart > 1 ? data.substring(bodyStart).replace(/\0$/, '') : '';

    return { command, headers, body };
  }

  private flushPendingSubscriptions(): void {
    for (const sub of this.pendingSubscriptions) {
      this.sendStomp('SUBSCRIBE', { id: sub.destination, destination: sub.destination });
    }
    this.pendingSubscriptions = [];
  }

  private tryReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.connected()) return;
      this.connect(token);
    }, 2000 * this.reconnectAttempts);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
