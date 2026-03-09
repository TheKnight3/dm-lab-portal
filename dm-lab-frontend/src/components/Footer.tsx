import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground" id="contatti">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-heading font-bold mb-2">DMLAB</h3>
            <p className="text-xs tracking-[0.2em] uppercase mb-4 text-primary-foreground/70">Amore per la Vita</p>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Da oltre 60 anni custodiamo e proteggiamo la vita prendendoci cura della salute dei nostri pazienti.
            </p>
          </div>

          {/* Contatti */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contatti</h4>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <a href="tel:06561951" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="h-4 w-4" />
                06 561951
              </a>
              <a href="mailto:info@dmlab.it" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="h-4 w-4" />
                info@dmlab.it
              </a>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lun-Ven: 07:00 - 19:00
              </div>
            </div>
          </div>

          {/* Sedi */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Le nostre sedi</h4>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Sede Centrale - Via Tuscolana, Roma</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Sede EUR - Viale Europa, Roma</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Sede Parioli - Via dei Parioli, Roma</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Link utili</h4>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <a href="/#servizi" className="block hover:text-accent transition-colors">Servizi</a>
              <a href="/prenota" className="block hover:text-accent transition-colors">Prenota online</a>
              <a href="/#chi-siamo" className="block hover:text-accent transition-colors">Chi siamo</a>
              <a href="#" className="block hover:text-accent transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-6 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} DMlab S.r.l. — Tutti i diritti riservati — P.IVA 00000000000</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
