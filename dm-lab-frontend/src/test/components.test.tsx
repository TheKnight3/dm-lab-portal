import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./helpers";

// Mock authApi.me so AuthProvider doesn't make real HTTP calls
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      me: vi.fn().mockRejectedValue(new Error("no token")),
      login: vi.fn(),
      register: vi.fn(),
    },
  };
});

import { authApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProtectedRoute from "@/components/ProtectedRoute";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ===========================================================================
// Navbar
// ===========================================================================

describe("Navbar", () => {
  it("renders brand name DMLAB", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("DMLAB")).toBeInTheDocument();
  });

  it("shows 'Prenota ora' button for unauthenticated users", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Prenota ora")).toBeInTheDocument();
  });

  it("shows 'Area Riservata' link when not logged in", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Area Riservata")).toBeInTheDocument();
  });

  it("renders navigation items (Chi siamo, Servizi, Sedi, Contatti)", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Chi siamo")).toBeInTheDocument();
    expect(screen.getByText("Servizi")).toBeInTheDocument();
    expect(screen.getByText("Sedi")).toBeInTheDocument();
    expect(screen.getByText("Contatti")).toBeInTheDocument();
  });

  it("renders contact info", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("06 561951")).toBeInTheDocument();
  });
});

// ===========================================================================
// Footer
// ===========================================================================

describe("Footer", () => {
  it("renders brand and copyright", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("DMLAB")).toBeInTheDocument();
    expect(screen.getByText(/Tutti i diritti riservati/i)).toBeInTheDocument();
  });

  it("renders contact section", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("Contatti")).toBeInTheDocument();
    expect(screen.getByText("06 561951")).toBeInTheDocument();
    expect(screen.getByText("info@dmlab.it")).toBeInTheDocument();
  });

  it("renders locations section", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("Le nostre sedi")).toBeInTheDocument();
    expect(screen.getByText(/Sede Centrale/)).toBeInTheDocument();
  });

  it("renders useful links", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("Link utili")).toBeInTheDocument();
    expect(screen.getByText("Prenota online")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });
});

// ===========================================================================
// NotFound (404 page)
// ===========================================================================

describe("NotFound", () => {
  it("renders 404 heading and link to home", () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to Home/i)).toBeInTheDocument();
  });
});

// ===========================================================================
// ProtectedRoute
// ===========================================================================

describe("ProtectedRoute", () => {
  it("redirects to /login when user is not authenticated", async () => {
    renderWithProviders(
      <ProtectedRoute><p>Secret content</p></ProtectedRoute>,
      { route: "/area-riservata" },
    );
    await waitFor(() => {
      expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// LoginPage
// ===========================================================================

describe("LoginPage", () => {
  it("renders login form with email and password fields", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Accedi")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders link to registration page", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Registrati")).toBeInTheDocument();
  });

  it("submit button is present", () => {
    renderWithProviders(<LoginPage />);
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("Accedi"));
    expect(submitBtn).toBeDefined();
  });
});

// ===========================================================================
// RegisterPage
// ===========================================================================

describe("RegisterPage", () => {
  it("renders registration form fields", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    renderWithProviders(<RegisterPage />, { route: "/registrati" });
    // The link text "Accedi" inside the "Hai già un account?" paragraph
    const loginLink = screen.getByRole("link", { name: "Accedi" });
    expect(loginLink).toBeInTheDocument();
  });

  it("submit button shows 'Crea account'", () => {
    renderWithProviders(<RegisterPage />);
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("Crea account"));
    expect(submitBtn).toBeDefined();
  });
});
