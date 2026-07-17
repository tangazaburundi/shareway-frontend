import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit.component.html',
  styleUrl: './admin-audit.component.css'
})
export class AdminAuditComponent implements OnInit {
  logs:         AuditRow[] = [];
  loading       = false;
  page          = 0;
  size          = 50;
  totalPages    = 1;
  searchUserId  = '';

  constructor(private svc: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAuditLogs(this.searchUserId || undefined, this.page, this.size).subscribe({
      next: r => {
        this.logs       = r.content ?? [];
        this.totalPages = r.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  actionClass(action: string): string {
    if (action.includes('LOGIN'))  return 'action-badge action-login';
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'action-badge action-create';
    if (action.includes('UPDATE') || action.includes('EDIT'))     return 'action-badge action-update';
    if (action.includes('DELETE') || action.includes('CANCEL'))   return 'action-badge action-delete';
    if (action.includes('BLOCK'))  return 'action-badge action-block';
    if (action.includes('VERIFY') || action.includes('APPROVED')) return 'action-badge action-verify';
    return 'action-badge action-default';
  }
}
