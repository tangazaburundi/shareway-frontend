export type UserRole = 'DRIVER' | 'PASSENGER' | 'BOTH';
export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT'

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneVisible?: boolean;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  role: UserRole;
  isVerified?: boolean;
  identityVerified?: boolean;
  preferredLang?: 'fr' | 'ki';
  preferences?: UserTravelPreferences;
  vehicle?: Vehicle;
  createdAt: string;
  systemRole?: SystemRole;
}

export interface UserTravelPreferences {
  music: boolean;
  smoking: boolean;
  pets: boolean;
  talking: boolean;
  smallLuggage: boolean;
  largeLuggage: boolean;
  [key: string]: boolean;
}

export interface Vehicle {
  id?: string;
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  year?: number;
  photoUrl?: string;
}

export interface Notification {
  id: string;
  type: 'BOOKING' | 'CANCELLATION' | 'MESSAGE' | 'REVIEW' | 'SYSTEM';
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface RoleRequest {
  id: string;
  requestedRole: UserRole;
  currentRole: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface DashboardStats {
  totalTrips?: number;
  completedTrips?: number;
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

  totalActiveUsers?: number;
  bookingsToday?: number;
  reviewCount: number;
  completionRate: number;
  upcomingTrips: number;
  cancelledTrips: number;
  monthlyEarnings: { month: string; amount: number }[];
}

/* export interface DashboardStats1 {
  totalActiveUsers: number;
  newUsersToday: number;
  openTrips: number;
  completedTrips: number;
   bookingsToday: number;
   pendingReports: number;
  flaggedReviews: number;
  flaggedMessages: number;
  blockedUsers: number;
  pendingDocuments: number;
} */

