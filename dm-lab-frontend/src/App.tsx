import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserAreaPage from "./pages/UserAreaPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminFinancePage from "./pages/AdminFinancePage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/servizi/:slug" element={<ServiceDetailPage />} />
            <Route path="/prenota" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registrati" element={<RegisterPage />} />
            <Route path="/area-riservata" element={<ProtectedRoute><UserAreaPage /></ProtectedRoute>} />
            <Route path="/admin/prenotazioni" element={<ProtectedRoute requiredRole="ADMIN"><AdminBookingsPage /></ProtectedRoute>} />
            <Route path="/admin/incassi" element={<ProtectedRoute requiredRole="ADMIN"><AdminFinancePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
