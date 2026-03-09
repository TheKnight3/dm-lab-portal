import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-lab.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0 hero-gradient" />

      <div className="relative container py-20 md:py-32">
        <div className="max-w-2xl animate-fade-in-up">
          <p className="text-accent font-heading font-semibold text-sm tracking-widest uppercase mb-4">
            Da oltre 60 anni al tuo fianco
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight mb-6">
            Custodiamo e proteggiamo la{" "}
            <span className="text-accent">vita</span>
          </h1>
          <p className="text-lg text-primary-foreground/85 leading-relaxed mb-8 max-w-xl">
            Tecnologia e competenza al servizio della salute. Diagnostica d'eccellenza,
            percorsi personalizzati di prevenzione e cura in ognuno dei nostri centri.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/prenota">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-dmlab-gold-light font-semibold text-base px-8">
                Prenota ora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
