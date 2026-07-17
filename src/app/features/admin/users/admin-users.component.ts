import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users:      UserRow[] = [];
  loading     = false;
  search      = '';
  page        = 0;
  size        = 20;
  total       = 0;
  totalPages  = 1;
  acting:     string | null = null;
  actionError: string | null = null;

  showBlockModal  = false;
  showDeleteModal = false;
  targetUser:     UserRow | null = null;
  blockReason     = '';

  constructor(private svc: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getUsers(this.page, this.size, this.search || undefined).subscribe({
      next: r => {
        this.users      = r.data?.content ?? [];
        this.total      = r.data?.totalElements ?? 0;
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  verifyIdentity(u: UserRow) {
    this.acting = u.id;
    this.svc.verifyIdentity(u.id).subscribe({
      next: r => {
        const idx = this.users.findIndex(x => x.id === u.id);
        if (idx >= 0 && r.data) this.users[idx] = r.data;
        this.acting = null;
      },
      error: () => { this.acting = null; }
    });
  }

  openBlock(u: UserRow)  { this.targetUser = u; this.blockReason = ''; this.actionError = null; this.showBlockModal  = true; }
  openDelete(u: UserRow) { this.targetUser = u; this.actionError  = null; this.showDeleteModal = true; }
  closeBlock()  { this.showBlockModal  = false; this.targetUser = null; }

  closeDelete() { this.showDeleteModal = false; this.targetUser = null; }

  confirmBlock() {
    if (!this.targetUser || !this.blockReason.trim()) return;
    this.acting = this.targetUser.id;
    this.actionError = null;
    this.svc.blockUser(this.targetUser.id, this.blockReason).subscribe({
      next: r => {
        const idx = this.users.findIndex(x => x.id === this.targetUser!.id);
        if (idx >= 0 && r.data) this.users[idx] = r.data;
        this.acting = null; this.closeBlock();
      },
      error: err => { this.actionError = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  unblock(u: UserRow) {
    this.acting = u.id;
    this.svc.unblockUser(u.id).subscribe({
      next: r => {
        const idx = this.users.findIndex(x => x.id === u.id);
        if (idx >= 0 && r.data) this.users[idx] = r.data;
        this.acting = null;
      },
      error: () => { this.acting = null; }
    });
  }

  confirmDelete() {
    if (!this.targetUser) return;
    this.acting = this.targetUser.id;
    this.actionError = null;
    this.svc.deleteUser(this.targetUser.id).subscribe({
      next: () => {
        this.users = this.users.filter(x => x.id !== this.targetUser!.id);
        this.total--;
        this.acting = null; this.closeDelete();
      },
      error: err => { this.actionError = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  exportCsv()   { this.svc.exportUsersCsv().subscribe(b => this.svc.downloadBlob(b, 'users.csv')); }
  exportExcel() { this.svc.exportUsersExcel().subscribe(b => this.svc.downloadBlob(b, 'users.xlsx')); }
}
