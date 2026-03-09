import { Phone, Mail, MapPin, User, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Chi siamo", href: "/#chi-siamo" },
  { label: "Servizi", href: "/#servizi" },
  { label: "Sedi", href: "/#sedi" },
  { label: "Contatti", href: "/#contatti" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:06561951" className="flex items-center gap-1 hover:text-accent transition-colors">
              <Phone className="h-3 w-3" />
              <span>06 561951</span>
            </a>
            <a href="mailto:info@dmlab.it" className="hidden sm:flex items-center gap-1 hover:text-accent transition-colors">
              <Mail className="h-3 w-3" />
              <span>info@dmlab.it</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">Roma, Italia</span>
          </div>
        </div>
      </div>

      <nav className="bg-card/95 backdrop-blur-md border-b shadow-sm">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-heading font-bold text-primary tracking-tight">DMLAB</span>
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Amore per la Vita</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!isAdmin && navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                {item.label}
              </a>
            ))}
            {isAdmin && (
              <>
                <Link to="/admin/prenotazioni" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Prenotazioni</Link>
                <Link to="/admin/incassi" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Incassi</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isAdmin && (
              <Link to="/prenota">
                <Button className="bg-accent text-accent-foreground hover:bg-dmlab-gold-light font-semibold">Prenota ora</Button>
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={isAdmin ? "/admin/prenotazioni" : "/area-riservata"}>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    {isAdmin ? <Shield className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                    {user.name.split(" ")[0]}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Area Riservata</Button>
              </Link>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-card animate-fade-in">
            <div className="container py-4 space-y-3">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="block text-sm font-medium text-foreground/80 hover:text-primary py-2" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </a>
              ))}
              {isAdmin && (
                <>
                  <Link to="/admin/prenotazioni" className="block text-sm font-medium text-foreground/80 hover:text-primary py-2" onClick={() => setMobileOpen(false)}>Admin: Prenotazioni</Link>
                  <Link to="/admin/incassi" className="block text-sm font-medium text-foreground/80 hover:text-primary py-2" onClick={() => setMobileOpen(false)}>Admin: Incassi</Link>
                </>
              )}
              <div className="flex gap-3 pt-3 border-t">
                {!isAdmin && (
                  <Link to="/prenota" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-dmlab-gold-light">Prenota ora</Button>
                  </Link>
                )}
                {user ? (
                  <Button variant="outline" className="flex-1 border-primary text-primary" onClick={() => { logout(); setMobileOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Esci
                  </Button>
                ) : (
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-primary text-primary">Area Riservata</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
