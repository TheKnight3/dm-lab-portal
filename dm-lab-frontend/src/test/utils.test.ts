import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { getServiceBySlug, servicesData } from "@/data/servicesData";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// cn() – Tailwind class merge utility
// ---------------------------------------------------------------------------

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });
});

// ---------------------------------------------------------------------------
// getServiceBySlug()
// ---------------------------------------------------------------------------

describe("getServiceBySlug", () => {
  it("returns the correct service for a known slug", () => {
    const svc = getServiceBySlug("cardiologia");
    expect(svc).toBeDefined();
    expect(svc!.name).toBe("Cardiologia");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getServiceBySlug("inesistente")).toBeUndefined();
  });

  it("servicesData contains at least one entry", () => {
    expect(servicesData.length).toBeGreaterThan(0);
  });

  it("every service has slug, name and visits", () => {
    for (const s of servicesData) {
      expect(s.slug).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.visits.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

describe("ApiError", () => {
  it("stores status and body", () => {
    const err = new ApiError(404, "Not found", { detail: "missing" });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.body).toEqual({ detail: "missing" });
  });
});
