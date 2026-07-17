export interface Review {
  id: string;
  tripId: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl?: string; };
  targetUserId: string;
  rating: number;
  comment?: string;
  type: 'DRIVER_TO_PASSENGER' | 'PASSENGER_TO_DRIVER';
  createdAt: string;
}

export interface CreateReviewRequest {
  tripId: string;
  targetUserId: string;
  rating: number;
  comment?: string;
}
