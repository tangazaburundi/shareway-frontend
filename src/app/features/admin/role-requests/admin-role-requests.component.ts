import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, RoleRequestRow } from '../../../core/services/admin.service';
import { LanguageService } from '../../../core/services/language.service';
import { LucideIconsDirective } from '../../../shared/directives/lucide-icons.directive';

@Component({
  selector: 'app-admin-role-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsDirective],
  templateUrl: './admin-role-requests.component.html',
  styleUrl: './admin-role-requests.component.css'
})
export class AdminRoleRequestsComponent implements OnInit {
  requests:    RoleRequestRow[] = [];
  loading      = false;
  activeFilter = 'ALL';
  page         = 0;
  size         = 20;
  totalPages   = 1;
  total        = 0;
  acting:      string | null = null;
  errors:      Record<string, string> = {};

  filters = [
    { key: 'ALL',      labelKey: 'admin.roleRequests.filter.all' },
    { key: 'PENDING',  labelKey: 'admin.roleRequests.filter.pending' },
    { key: 'APPROVED', labelKey: 'admin.roleRequests.filter.approved' },
    { key: 'REJECTED', labelKey: 'admin.roleRequests.filter.rejected' }
  ];

  constructor(
    private svc: AdminService,
    public langService: LanguageService
  ) {}

  ngOnInit() { this.loadRequests(); }

  loadRequests() {
    this.loading = true;
    const status = this.activeFilter === 'ALL' ? undefined : this.activeFilter;
    this.svc.getRoleRequests(status, this.page, this.size).subscribe({
      next: r => {
        this.requests   = r.data?.content ?? [];
        this.total      = r.data?.totalElements ?? 0;
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(key: string) {
    this.activeFilter = key;
    this.page = 0;
    this.loadRequests();
  }

  approveRequest(id: string) {
    this.acting = id;
    this.svc.approveRoleRequest(id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== id);
        this.total--;
        this.acting = null;
      },
      error: err => {
        this.errors[id] = err.error?.message || 'Erreur';
        this.acting = null;
      }
    });
  }

  rejectRequest(id: string) {
    this.acting = id;
    this.svc.rejectRoleRequest(id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== id);
        this.total--;
        this.acting = null;
      },
      error: err => {
        this.errors[id] = err.error?.message || 'Erreur';
        this.acting = null;
      }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.loadRequests(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.loadRequests(); } }

  statusClass(status: string): string {
    switch (status) {
      case 'PENDING':  return 'pending';
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      default:         return '';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING':  return this.langService.t('admin.roleRequests.status.pending');
      case 'APPROVED': return this.langService.t('admin.roleRequests.status.approved');
      case 'REJECTED': return this.langService.t('admin.roleRequests.status.rejected');
      default:         return status;
    }
  }
}
