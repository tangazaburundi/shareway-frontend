export type RideStatus = 'SEARCHING' | 'DRIVER_FOUND' | 'ACCEPTED' | 'DRIVER_EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type RidePaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
export type DriverAvailabilityStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'ON_TRIP';

export interface Ride {
  id: string;
  passengerId: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerAvatarUrl?: string;
  passengerRating?: number;
  driverId?: string;
  driverFirstName?: string;
  driverLastName?: string;
  driverAvatarUrl?: string;
  driverRating?: number;
  driverPhone?: string;
  driverLicenseId?: string;
  driverVehicleBrand?: string;
  driverVehicleModel?: string;
  driverVehicleColor?: string;
  driverVehiclePlate?: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress?: string;
  estimatedDistanceKm?: number;
  estimatedDurationMin?: number;
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;
  status: RideStatus;
  createdAt: string;
  driverNotifiedAt?: string;
  driverRespondedAt?: string;
  pickupAt?: string;
  startedAt?: string;
  completedAt?: string;
  paymentStatus?: RidePaymentStatus;
  platformFeeAmount?: number;
  driverEarnings?: number;
  notes?: string;
  passengerCount: number;
  cancelReason?: string;
  cancelledBy?: string;
  surgeMultiplier?: number;
}

export interface RideEstimate {
  distanceKm: number;
  durationMin: number;
  estimatedPrice: number;
  surgeMultiplier: number;
  currency: string;
  basePrice: number;
  pricePerKm: number;
  pricePerMin: number;
  platformFeePercent: number;
  surgeActive: boolean;
  nearbyDriversCount: number;
}

export interface DriverAvailability {
  id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  rating?: number;
  available: boolean;
  status: DriverAvailabilityStatus;
  currentLat?: number;
  currentLng?: number;
  currentHeading?: number;
  maxDistanceKm: number;
  autoAccept: boolean;
  lastLocationUpdate?: string;
}

export interface NearbyDriver {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount: number;
  distanceKm: number;
  currentLat: number;
  currentLng: number;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
}

export interface CreateRideRequest {
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress?: string;
  currency?: string;
  passengerCount?: number;
  notes?: string;
  driverId?: string;
}

export interface RideRating {
  id: string;
  rideRequestId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PricingConfig {
  id: string;
  name: string;
  currency: string;
  basePrice: number;
  pricePerKm: number;
  pricePerMin: number;
  minimumPrice: number;
  surgeMultiplier: number;
  surgeThreshold: number;
  platformFeePercent: number;
  freeCancellationMinutes: number;
  active: boolean;
}

export type SmsProvider = 'TWILIO' | 'AFRICAS_TALKING' | 'DISABLED';

export interface SmsConfig {
  id: string;
  provider: SmsProvider;
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  senderNumber: string;
  senderName: string;
}
