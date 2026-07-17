// ─── Generic wrappers ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED' | 'PENDING';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  identityVerified: boolean;
  rating?: number;
  ridesCount?: number;
  createdAt: string;
  blockedAt?: string;
  blockReason?: string;
}

export interface AdminBlockUserRequest {
  reason: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewResponse {
  id: string;
  authorId: string;
  authorName: string;
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  flagReason?: string;
  flaggedAt?: string;
  createdAt: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface MessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  flagReason?: string;
  flaggedAt?: string;
  sentAt: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'RESOLVED';

export interface ReportResponse {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  targetType: string;
  reason: string;
  status: ReportStatus;
  resolution?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AdminReviewReportRequest {
  status: ReportStatus;
  resolution?: string;
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

// ─── Dashboard ───────────────────────────────────────────────────────────────


export interface DashboardStats {
  totalTrips?: number;
  totalPassengers?: number;
  totalEarnings?: number;
  earningsByCurrency?: Record<string, number>;
  totalUsers?: number;
  activeUsers?: number;
  blockedUsers?: number;
  newUsersToday?: number;
  totalRides?: number;
  ridesThisMonth?: number;
  pendingReports?: number;
  flaggedReviews?: number;
  flaggedMessages?: number;
  revenueThisMonth?: number;
  userGrowth?: any;//GrowthPoint[];
  ridesGrowth?: any;//GrowthPoint[];
  [key: string]: any;
  rating: number;

  reviewCount: number;
  completionRate: number;
  upcomingTrips: number;
  cancelledTrips: number;
  monthlyEarnings: { month: string; amount: number }[];
}