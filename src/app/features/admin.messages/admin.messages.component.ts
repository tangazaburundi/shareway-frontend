import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { MessageResponse, PageResponse } from '../../core/models';

@Component({
  selector: 'app-admin.messages',
  standalone: true,
  imports: [
    FormsModule,CommonModule
  ],
  templateUrl: './admin.messages.component.html',
  styleUrl: './admin.messages.component.css'
})
export class MessagesComponent implements OnInit {
loading = signal(true);
page = signal<PageResponse<MessageResponse> | null>(null);
    currentPage = signal(0);

    constructor(private adminService: AdminService) {}

    ngOnInit() { this.loadPage(0); }

    loadPage(p: number) {
    this.loading.set(true);
    this.currentPage.set(p);
    this.adminService.getFlaggedMessages(p, 20).subscribe({
    next: data => { this.page.set(data); this.loading.set(false); },
    error: () => this.loading.set(false)
    });
    }

    truncate(s: string, max: number) { return s?.length > max ? s.substring(0, max) + '…' : s; }
    }
