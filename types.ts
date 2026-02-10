
export type BookingShift = 'day' | 'night';

export interface Booking {
  id: string;
  date: string; // ISO string (YYYY-MM-DD)
  shift: BookingShift;
  pickupAddress: string;
  dropAddress: string;
  totalPayment: number;
  advancePayment: number;
  duePayment: number;
  createdAt: number;
}

export type BookingTab = 'active' | 'expired';

export interface DailySummary {
  totalBookings: number;
  totalRevenue: number;
  totalDue: number;
}
