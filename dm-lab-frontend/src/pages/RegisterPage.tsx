import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      login(res.token, res.user);
      toast({ title: "Registrazione completata", description: `Benvenuto, ${res.user.name}!` });
      navigate("/area-riservata", { replace: true });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Registrazione fallita", variant: "destructive" });
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
            <h1 className="text-2xl font-heading font-bold text-foreground">Registrati</h1>
            <p className="text-sm text-muted-foreground mt-1">Crea il tuo profilo DMlab</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Mario Rossi" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Minimo 8 caratteri" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? "Registrazione..." : "Crea account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hai già un account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Accedi</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
