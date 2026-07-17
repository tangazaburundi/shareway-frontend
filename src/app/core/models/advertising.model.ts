export type AdvertisingPosition = 'SIDEBAR_TOP' | 'SIDEBAR_MIDDLE' | 'SIDEBAR_BOTTOM' | 'TOP_BANNER' | 'BOTTOM_BANNER' | 'POPUP';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FREE';

export interface Advertising {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  position: AdvertisingPosition;
  active: boolean;
  displayStart?: string;
  displayEnd?: string;
  sortOrder: number;
  targetAudience: string;
  clicks: number;
  impressions: number;
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertisingRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  position: string;
  displayStart?: string;
  displayEnd?: string;
  sortOrder?: number;
  targetAudience?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
}

export interface UpdateAdvertisingRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  position?: string;
  displayStart?: string;
  displayEnd?: string;
  sortOrder?: number;
  targetAudience?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
}
