import { useParams, useNavigate, Link } from "react-router-dom";
import { getServiceBySlug } from "@/data/servicesData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, CalendarPlus } from "lucide-react";

const ServiceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const service = slug ? getServiceBySlug(slug) : undefined;

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Servizio non trovato</h1>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna alla Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="bg-primary py-16 md:py-20">
          <div className="container">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
              <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/#servizi" className="hover:text-primary-foreground transition-colors">Servizi</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary-foreground">{service.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground">
                  {service.name}
                </h1>
                <p className="text-primary-foreground/80 mt-1">{service.heroDescription}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-accent mb-4">Che cos'è</h2>
                  <p className="text-muted-foreground leading-relaxed">{service.whatIs}</p>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-accent mb-4">A cosa serve</h2>
                  <p className="text-muted-foreground leading-relaxed">{service.whenNeeded}</p>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-accent mb-4">Come si svolge</h2>
                  <p className="text-muted-foreground leading-relaxed">{service.howItWorks}</p>
                </div>

                {service.preparation && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-accent mb-4">Preparazione</h2>
                    <p className="text-muted-foreground leading-relaxed">{service.preparation}</p>
                  </div>
                )}

                {/* Visits list */}
                <div>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-accent mb-6">
                    Prestazioni disponibili
                  </h2>
                  <div className="space-y-3">
                    {service.visits.map((visit) => (
                      <div
                        key={visit.name}
                        className="bg-card border rounded-lg p-5 flex items-center justify-between gap-4 group hover:border-accent/40 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-foreground">{visit.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{visit.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate("/prenota")}
                          className="shrink-0"
                        >
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Prenota
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-primary rounded-xl p-8 text-primary-foreground">
                  <h3 className="text-2xl font-heading font-bold mb-3">Prenota ora</h3>
                  <p className="text-primary-foreground/80 text-sm mb-6">
                    Check-up studiati per ogni esigenza di prevenzione
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate("/prenota")}
                  >
                    Prenota una visita
                  </Button>
                </div>

                <div className="bg-card border rounded-xl p-8">
                  <h3 className="text-xl font-heading font-bold text-foreground mb-4">Contatti</h3>
                  <div className="h-px bg-accent/30 mb-4" />
                  <div className="space-y-3 text-sm">
                    <p className="text-foreground font-semibold text-lg">06 1234 5678</p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">CUP</span> 06 1234 5678</p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">WhatsApp</span> 345 678 9012</p>
                    <p className="text-muted-foreground">info@dmlab.it</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
