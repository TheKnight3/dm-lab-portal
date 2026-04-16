/**
 * Shared test utilities: renderWithProviders wraps components with
 * MemoryRouter and a controllable AuthContext so that tests do not
 * depend on real API calls or browser history.
 */

import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactElement } from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

interface WrapperOptions {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: WrapperOptions = {},
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    ),
    ...renderOptions,
  });
}
