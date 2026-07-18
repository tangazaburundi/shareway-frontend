import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse, AuditLogResponse } from '../models/api-response.model';
import { DashboardStats } from '../models/user.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';




export interface UserRow {
  id: string; firstName: string; lastName: string; email: string; phone?: string;
  role: string; active: boolean; blocked: boolean; blockReason?: string;
  emailVerified: boolean; identityVerified: boolean; rating?: number; reviewCount: number;
  createdAt: string; lastLoginAt?: string;
}

export interface ReviewRow {
  id: string; tripId: string; rating: number; comment?: string;
  type: string; flagged: boolean; approved: boolean; createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  targetUserId: string;
}

export interface ReportRow {
  id: string; targetType: string; targetId: string; reason: string;
  description?: string; status: string; actionTaken?: string; createdAt: string;
  reporter?: { id: string; firstName: string; lastName: string };
}

export interface MessageRow {
  id: string; senderId: string; receiverId: string; content: string;
  flagged: boolean; flagReason?: string; createdAt: string;
}

export interface DocumentRow {
  id: string; type: string; fileUrl: string; fileName?: string;
  status: string; rejectionReason?: string; expiresAt?: string; createdAt: string;
  user?: { id: string; firstName: string; lastName: string };
}

export interface RoleRequestRow {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentRole: string;
  requestedRole: string;
  status: string; // PENDING, APPROVED, REJECTED
  reason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorEmail?: string;
  actorRole?: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;

  /////////
    adminId: string;
    adminName: string;
    targetId?: string;
    targetType?: string;
    details?: string;
    performedAt: string;
}





export interface AdminLoginRequest { email: string; password: string; }
export interface AdminUser {
  id: string; firstName: string; lastName: string; email: string;
  systemRole: string; // ADMIN, SUPER_ADMIN, MODERATOR
}
export interface AdminAuthResponse { token: string; user: AdminUser; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  login(req: AdminLoginRequest): Observable<ApiResponse<AdminAuthResponse>> {
    return this.http.post<ApiResponse<AdminAuthResponse>>(`${this.API}/auth/login`, req).pipe(
      tap(r => {
        if (r.data?.token) {
          localStorage.setItem('admin_token', r.data.token);
          localStorage.setItem('admin_user', JSON.stringify(r.data.user));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  getToken(): string | null {
  return localStorage.getItem('admin_token'); }

  getUser(): AdminUser | null {
  //  const raw = localStorage.getItem('admin_user');

    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  }

  isAdmin(): boolean {
    const u = this.getUser();
    return !!u && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(u.systemRole);
  }

  // ── Dashboard ──────────────────────────────────────────────────────
/*   getDashboard(): Observable<ApiResponse<Record<string, number>>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.API}/admin/dashboard`);
  } */

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard(): Observable<DashboardStats> {
    return this.unwrap(this.http.get<ApiResponse<DashboardStats>>(`${this.API}/admin/dashboard`));
  }
  getUsers(page = 0, size = 20, search?: string): Observable<ApiResponse<any>> {
    let url = `${this.API}/admin/users?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<ApiResponse<any>>(url);
  }

  blockUser(id: string, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/users/${id}/block`, { reason });
  }

  unblockUser(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/users/${id}/unblock`, {});
  }

  verifyIdentity(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/users/${id}/verify-identity`, {});
  }

  getFlaggedReviews(page = 0, size = 20): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/admin/reviews/flagged?page=${page}&size=${size}`);
  }

  approveReview(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/reviews/${id}/approve`, {});
  }

  rejectReview(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/reviews/${id}/reject`, {});
  }

  getReports(status?: string, page = 0, size = 20): Observable<ApiResponse<any>> {
    let url = `${this.API}/admin/reports?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    return this.http.get<ApiResponse<any>>(url);
  }

  exportUsersCsv(): Observable<Blob> {
    return this.http.get(`${this.API}/admin/export/users/csv`, { responseType: 'blob' });
  }

  exportUsersExcel(): Observable<Blob> {
    return this.http.get(`${this.API}/admin/export/users/excel`, { responseType: 'blob' });
  }
  //TODO A VERIFIER

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/admin/users/${id}`);
  }
  //TODO A VERIFIER
      // ── Audit ──────────────────────────────────────────────────────────────────
  getAuditLogs(userId?: string, page = 0, size = 50): Observable<PageResponse<AuditRow>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (userId) params = params.set('userId', userId);
    return this.unwrap(this.http.get<ApiResponse<PageResponse<AuditRow>>>(`${this.API}/admin/audit`, { params }));
  }



    private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
      return obs.pipe(
        map(response => response.data )
      );
    }


      downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }


  reviewReport(id: string, status: string, actionTaken?: string): Observable<ApiResponse<ReportRow>> {
    return this.http.post<ApiResponse<ReportRow>>(`${this.API}/admin/reports/${id}/review`, { status, actionTaken });
  }

  // ═══════════════════════════════════════════════════════════
  // TRIPS
  // ═══════════════════════════════════════════════════════════

  getTrips(status?: string, page = 0, size = 20, search?: string): Observable<ApiResponse<PageResponse<any>>> {
    let url = `${this.API}/admin/trips?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<ApiResponse<PageResponse<any>>>(url);
  }

  changeTripStatus(id: string, status: string): Observable<ApiResponse<any>> {
    if (status === 'CANCELLED') {
      return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/reject`, { reason: 'Annulé par l\'administrateur' });
    }
    const action = status === 'COMPLETED' || status === 'OPEN' ? 'approve' : 'reject';
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/${action}`, {});
  }

  approveTrip(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/approve`, {});
  }

  rejectTrip(id: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/reject`, { reason });
  }

  suspendTrip(id: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/suspend`, { reason });
  }

  reactivateTrip(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/admin/trips/${id}/reactivate`, {});
  }

  deleteTrip(id: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/admin/trips/${id}`, { body: { reason } });
  }

    // ═══════════════════════════════════════════════════════════
    // MESSAGES SIGNALÉS
    // ═══════════════════════════════════════════════════════════

    getFlaggedMessages(page = 0, size = 20): Observable<ApiResponse<PageResponse<MessageRow>>> {
      const p = new HttpParams().set('page', page).set('size', size);
      return this.http.get<ApiResponse<PageResponse<MessageRow>>>(`${this.API}/admin/messages/flagged`, { params: p });
    }


  // ═══════════════════════════════════════════════════════════
  // DOCUMENTS À VALIDER
  // ═══════════════════════════════════════════════════════════

      getPendingDocuments(): Observable<ApiResponse<DocumentRow[]>> {
        return this.http.get<ApiResponse<DocumentRow[]>>(`${this.API}/admin/documents/pending`);
      }

      approveDocument(id: string): Observable<ApiResponse<DocumentRow>> {
        return this.http.post<ApiResponse<DocumentRow>>(`${this.API}/admin/documents/${id}/approve`, {});
      }

      rejectDocument(id: string, reason: string): Observable<ApiResponse<DocumentRow>> {
        return this.http.post<ApiResponse<DocumentRow>>(`${this.API}/admin/documents/${id}/reject`, { reason });
      }

  // ═══════════════════════════════════════════════════════════
  // DEMANDES DE RÔLE
  // ═══════════════════════════════════════════════════════════

  getRoleRequests(status?: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<RoleRequestRow>>> {
    let url = `${this.API}/admin/role-requests?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    return this.http.get<ApiResponse<PageResponse<RoleRequestRow>>>(url);
  }

  approveRoleRequest(id: string): Observable<ApiResponse<RoleRequestRow>> {
    return this.http.post<ApiResponse<RoleRequestRow>>(`${this.API}/admin/role-requests/${id}/approve`, {});
  }

  rejectRoleRequest(id: string, reason?: string): Observable<ApiResponse<RoleRequestRow>> {
    return this.http.post<ApiResponse<RoleRequestRow>>(`${this.API}/admin/role-requests/${id}/reject`, { reason });
  }
}
