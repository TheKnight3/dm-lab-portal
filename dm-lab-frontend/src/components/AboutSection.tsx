import { Shield, Award, Users, HeartPulse } from "lucide-react";

const values = [
  { icon: Shield, title: "Affidabilità", desc: "Risultati precisi e certificati con processi controllati." },
  { icon: Award, title: "Eccellenza", desc: "Strumentazione di ultima generazione e personale altamente qualificato." },
  { icon: Users, title: "Attenzione al Paziente", desc: "Un approccio umano e personalizzato per ogni esigenza." },
  { icon: HeartPulse, title: "Prevenzione", desc: "Percorsi preventivi su misura per ogni fase della vita." },
];

const AboutSection = () => {
  return (
    <section id="chi-siamo" className="py-20">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-accent font-heading font-semibold text-sm tracking-widest uppercase mb-3">
              Chi siamo
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
              Tecnologia e competenza al servizio della vita
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In DMlab, l'innovazione medica incontra l'esperienza clinica. Dalla diagnostica per immagini 
              all'avanguardia ai laboratori di analisi d'eccellenza, offriamo percorsi di prevenzione 
              personalizzati per ogni fase della vita.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In ognuno dei nostri Centri trovi un ecosistema di professionisti pronti a darti risposte 
              qualificate in tempi rapidi, perché la tua salute non può aspettare.
            </p>
          </div>

          {/* Values grid */}
          <div className="grid grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6 rounded-lg bg-muted/50">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
