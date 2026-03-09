// ============================================================
// TypeScript interfaces matching the DMlab OpenAPI 3.0.3 spec
// ============================================================

/* ─── Auth ─── */

export interface UserRegister {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface AuthResponse {
  token: string;
  user: User;
}

/* ─── Services ─── */

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
}

/* ─── Locations / Doctors / Availability ─── */

export interface Location {
  id: number;
  name: string;
  address: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty?: string;
  location: Location;
}

export interface Availability {
  id: number;
  doctor: Doctor;
  service: Service;
  available_at: string; // ISO date-time
}

/* ─── Bookings ─── */

export interface BookingCreate {
  service_id: number;
  doctor_id: number;
  scheduled_at: string; // ISO date-time
  notes?: string;
}

export interface BookingUpdate {
  service_id?: number;
  doctor_id?: number;
  scheduled_at?: string;
  notes?: string;
}

export interface AdminBookingUpdate {
  status?: Booking["status"];
  service_id?: number;
  doctor_id?: number;
  scheduled_at?: string;
  notes?: string;
}

export interface Booking {
  id: number;
  user?: User;
  service?: Service;
  doctor?: Doctor;
  scheduled_at: string;
  status: "BOOKED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

/* ─── Reports ─── */

export interface Report {
  id: number;
  booking: Booking;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

/* ─── Finance ─── */

export type FinancePeriod = "daily" | "weekly" | "monthly";

export interface FinanceItem {
  period: string;
  total_amount: number;
}

export interface FinanceParams {
  period: FinancePeriod;
  from?: string; // YYYY-MM-DD
  to?: string;
}

/* ─── Admin bookings filter ─── */

export interface AdminBookingsFilter {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  status?: Booking["status"];
  email?: string;
  service?: string;
}
