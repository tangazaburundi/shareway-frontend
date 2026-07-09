

export type Currency = 'FBU' | 'USD' | 'EUR';
export type TripFrequency = 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
/*
export interface Trip {
  id: string;
  driver: TripUser;
  departureCity: string;
  arrivalCity: string;
  departureAddress?: string;
  arrivalAddress?: string;
  departureTime: string;
  arrivalTime?: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  currency: Currency;
  description?: string;
  status: 'OPEN' | 'FULL' | 'CANCELLED' | 'COMPLETED';
  passengers: TripPassenger[];
  stopPoints?: StopPoint[];
  // Récurrence
  isRecurring: boolean;
  frequency?: TripFrequency;
  recurringDays?: WeekDay[];
  recurringEndDate?: string;
  // Préférences conducteur
  preferences?: TripPreferences;
  shareToken?: string;
  createdAt: string;
}

export interface TripUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating?: number;
  phone?: string;
  isVerified?: boolean;
  vehicle?: {
    brand: string;
    model: string;
    color: string;
    licensePlate: string;
    year?: number;
  };
}

export interface TripPassenger {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  bookingId: string;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'COMPLETED';
  bookedAt: string;
}

export interface StopPoint {
  id?: string;
  city: string;
  address?: string;
  order: number;
  arrivalTime?: string;
}

export interface TripPreferences {
  music: boolean;
  smoking: boolean;
  pets: boolean;
  talking: boolean;
  airConditioning: boolean;
}

export interface TripSearchParams {
  departureCity: string;
  arrivalCity: string;
  date: string;
  seats?: number;
  maxPrice?: number;
  currency?: Currency;
  minRating?: number;
  departureTimeFrom?: string;
  departureTimeTo?: string;
  music?: boolean;
  smoking?: boolean;
  pets?: boolean;
}

export interface CreateTripRequest {
  departureCity: string;
  arrivalCity: string;
  departureAddress?: string;
  arrivalAddress?: string;
  departureTime: string;
  arrivalTime?: string;
  totalSeats: number;
  pricePerSeat: number;
  currency: Currency;
  description?: string;
  stopPoints?: Omit<StopPoint, 'id'>[];
  isRecurring: boolean;
  frequency?: TripFrequency;
  recurringDays?: WeekDay[];
  recurringEndDate?: string;
  preferences?: TripPreferences;
}


 export interface UpdateTripRequest {

    departureCity?: string;
    arrivalCity?: string;
    departureAddress?: string;
    arrivalAddress?: string;
    departureLat?: number;
    departureLngt?: number;
    arrivalLatt?: number;
    arrivalLngt?: number;
    departureTime?: string;
    arrivalTime?: string;
    totalSeats?: number;
    pricePerSeat?: number;
    currency?: string;
    description?: string;
    preferences?:TripPreferences;
    stopPoints?:StopPointRequest;
    notificationMessage?: string
 }
 */

export interface StopPointRequest {
    city?: string;
    address?: string;
    lat?: number;
    lng?: number;
    order?: number;
    arrivalTime?: string;
}

export interface BookingCancellation {
  tripId: string;
  reason: string;
  notifyDriver: boolean;
}

export interface TripCancellation {
  tripId: string;
  reason: string;
  notifyPassengers: boolean;
}

export const EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  FBU: { FBU: 1, USD: 0.00034, EUR: 0.00031 },
  USD: { FBU: 2900, USD: 1, EUR: 0.92 },
  EUR: { FBU: 3200, USD: 1.09, EUR: 1 }
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  FBU: 'FBU', USD: '$', EUR: '€'
};

// ── Modèles Trajet ─────────────────────────────────────────────────────────

export interface TripPreferences {
  music:          boolean;
  smoking:        boolean;
  pets:           boolean;           // animaux autorisés
  talking:        boolean;
  airConditioning:boolean;
  smallLuggage:   boolean;           // petite valise acceptée
  largeLuggage:   boolean;           // grande valise acceptée
}

export interface StopPoint {
  id?:          string;
  city:         string;
  address?:     string;
  order:        number;
  arrivalTime?: string;
}

export interface TripDriver {
  id:         string;
  firstName:  string;
  lastName:   string;
  avatarUrl?: string;
  rating?:    number;
  isVerified:   boolean;
  phone?:     string;
  vehicle?: {
    brand: string;
    model: string;
    color: string;
    licensePlate: string;
    year?: number;
  };
}




export interface TripPassenger {
  id:            string;
  firstName:     string;
  lastName:      string;
  avatarUrl?:    string;
  phone?:        string;
  bookingId:     string;
  bookingStatus: BookingStatus;
  bookedAt:      string;
}

export interface Trip {
  id:               string;
  driver:           TripDriver;
  departureCity:    string;
  arrivalCity:      string;
  departureAddress?: string;
  arrivalAddress?:  string;
  departureTime:    string;
  arrivalTime?:     string;
  availableSeats:   number;
  totalSeats:       number;
  pricePerSeat:     number;
  currency:         'FBU' | 'USD' | 'EUR';
  description?:     string;
  status:           TripStatus;
  shareToken?:      string;
  isRecurring:      boolean;
  recurringDays?:   WeekDay[];
  frequency?:       'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  stopPoints:       StopPoint[];
  passengers:       TripPassenger[];
  preferences?:     TripPreferences;
  createdAt:        string;
}

export type TripStatus = 'OPEN' | 'FULL' | 'CANCELLED' | 'COMPLETED' | 'PENDING' | 'REJECTED';

// ── Modèles Réservation ────────────────────────────────────────────────────

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id:                  string;
  tripId:              string;
  status:              BookingStatus;
  seatsBooked:         number;
  amountPaid?:         number;
  currency:            string;
  cancelReason?:       string;
  driverRejectReason?: string;     // raison du refus conducteur
  driverResponseAt?:   string;
  createdAt:           string;
  tripStatus:          string;
  driverId:            string;

  // Infos trajet résumées
  departureCity:       string;
  arrivalCity:         string;
  departureTime:       string;
  pricePerSeat:        number;

  // Profil passager (vue conducteur)
  passenger?:          PassengerPublic;
  canReview?:          boolean;
}

export interface PassengerPublic {
  id:               string;
  firstName:        string;
  lastName:         string;
  avatarUrl?:       string;
  rating?:          number;
  reviewCount:      number;
  identityVerified: boolean;
  phone?:           string;
}

// ── DTOs requêtes ──────────────────────────────────────────────────────────

export interface CreateTripRequest {
  departureCity:    string;
  arrivalCity:      string;
  departureAddress?: string;
  arrivalAddress?:  string;
  departureLat?:    number;
  departureLng?:    number;
  arrivalLat?:      number;
  arrivalLng?:      number;
  departureTime:    string;
  arrivalTime?:     string;
  totalSeats:       number;
  pricePerSeat:     number;
  currency:         string;
  description?:     string;
  isRecurring:      boolean;
  frequency?:       string;
  recurringDays?: WeekDay[];
  recurringEndDate?: string;
  stopPoints?:      StopPoint[];
  preferences?:     TripPreferences;
}

export interface UpdateTripRequest {
  departureCity?:      string;
  arrivalCity?:        string;
  departureAddress?:   string;
  arrivalAddress?:     string;
  departureTime?:      string;
  arrivalTime?:        string;
  totalSeats?:         number;
  pricePerSeat?:       number;
  currency?:           string;
  description?:        string;
  preferences?:        TripPreferences;
  stopPoints?:         StopPoint[];
  notificationMessage?: string;     // message envoyé aux passagers

  departureLat?: number;
  departureLngt?: number;
  arrivalLatt?: number;
  arrivalLngt?: number;

}



export interface BookTripRequest {
  seats:      number;
   currency: Currency;
  couponCode?: string;
}
export interface CancelActionRequest {
  reason: string;
  notify: boolean;
}
export interface LeaveTripRequest {
  tripId?: string;
  reason?: string;
  currency?:  string;
  notifyDriver?: boolean;
}

export interface RespondBookingRequest {
  action: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  notifyDriver?: boolean;
}


export interface TripSearchRequest {
  departureCity?:  string;          // seul champ vraiment requis
  arrivalCity?:    string;
  date?:           string;          // yyyy-MM-dd
  seats?:          number;
  maxPrice?:       number;
  music?:          boolean;
  smoking?:        boolean;
  currency?:       string;
  minRating?:      number;
  pets?:           boolean;
  smallLuggage?:   boolean;
  largeLuggage?:   boolean;
  airConditioning?: boolean;
  departureTime?:   string;
  arrivalTime?:   string;
}
