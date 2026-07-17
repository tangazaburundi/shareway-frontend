// src/app/core/models/api-response.model.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}



// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLogResponse {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  performedAt: string;
}