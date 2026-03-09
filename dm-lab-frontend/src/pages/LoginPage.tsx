import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.token, res.user);
      toast({ title: "Accesso effettuato", description: `Benvenuto, ${res.user.name}!` });
      navigate(res.user.role === "ADMIN" ? "/admin/prenotazioni" : from, { replace: true });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Credenziali errate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-muted py-16">
        <div className="w-full max-w-md bg-card border rounded-lg p-8 shadow-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">Accedi</h1>
            <p className="text-sm text-muted-foreground mt-1">Inserisci le tue credenziali per accedere</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@email.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Non hai un account?{" "}
            <Link to="/registrati" className="text-primary font-medium hover:underline">
              Registrati
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
