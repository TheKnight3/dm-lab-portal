// ============================================================
// Centralized API client for the DMlab Flask backend
// Base URL is configurable; defaults to localhost:5000/api/v1
// ============================================================

import type {
  AuthResponse,
  UserRegister,
  UserLogin,
  User,
  Service,
  Location,
  Doctor,
  Availability,
  BookingCreate,
  BookingUpdate,
  AdminBookingUpdate,
  Booking,
  Report,
  FinanceParams,
  FinanceItem,
  AdminBookingsFilter,
} from "@/types/api";

// Base URL for the API. Use a relative path by default so that API calls are
// proxied correctly in development (via Vite proxy) and in production (via Nginx).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

/* ─── helpers ─── */

function getToken(): string | null {
  return localStorage.getItem("dmlab_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText, body);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res as unknown as T;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/* ─── Auth ─── */

export const authApi = {
  register(data: UserRegister) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: UserLogin) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  me() {
    return request<User>("/auth/me");
  },
};

/* ─── Services ─── */

export const servicesApi = {
  list() {
    return request<Service[]>("/services");
  },

  get(id: number) {
    return request<Service>(`/services/${id}`);
  },
};

/* ─── Locations / Doctors / Availability ─── */

export const locationsApi = {
  list() {
    return request<Location[]>("/locations");
  },

  doctors(params?: { service_id?: number; location_id?: number }) {
    const qs = new URLSearchParams();
    if (params?.service_id) qs.set("service_id", String(params.service_id));
    if (params?.location_id) qs.set("location_id", String(params.location_id));
    const q = qs.toString();
    return request<Doctor[]>(`/locations/doctors${q ? `?${q}` : ""}`);
  },

  availabilities(doctor_id: number) {
    return request<Availability[]>(`/locations/availabilities?doctor_id=${doctor_id}`);
  },
};

/* ─── Bookings ─── */

export const bookingsApi = {
  create(data: BookingCreate) {
    return request<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  mine() {
    return request<Booking[]>("/bookings/me");
  },

  cancel(id: number) {
    return request<Booking>(`/bookings/${id}`, {
      method: "DELETE",
    });
  },

  update(id: number, data: BookingUpdate) {
    return request<Booking>(`/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

/* ─── Reports ─── */

export const reportsApi = {
  mine() {
    return request<Report[]>("/reports/me");
  },

  async download(id: number): Promise<Blob> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, "Download fallito");
    return res.blob();
  },

  async updateFile(id: number, file: File): Promise<Report> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message ?? "Aggiornamento fallito", body);
    }
    return res.json();
  },
};

/* ─── Admin ─── */

export const adminApi = {
  bookings(filters?: AdminBookingsFilter) {
    const qs = new URLSearchParams();
    if (filters?.start) qs.set("start", filters.start);
    if (filters?.end) qs.set("end", filters.end);
    if (filters?.status) qs.set("status", filters.status);
    if (filters?.email) qs.set("email", filters.email);
    if (filters?.service) qs.set("service", filters.service);
    const q = qs.toString();
    return request<Booking[]>(`/admin/bookings${q ? `?${q}` : ""}`);
  },

  updateBooking(id: number, data: AdminBookingUpdate) {
    return request<Booking>(`/admin/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async uploadReport(bookingId: number, file: File): Promise<Report> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/admin/reports/${bookingId}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message ?? "Upload fallito", body);
    }
    return res.json();
  },

  finance(params: FinanceParams) {
    const qs = new URLSearchParams({ period: params.period });
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    return request<FinanceItem[]>(`/admin/finance?${qs.toString()}`);
  },
};
