import { Link } from "react-router-dom";
import { servicesData } from "@/data/servicesData";

const ServicesSection = () => {
  return (
    <section id="servizi" className="py-20 section-gradient">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-accent font-heading font-semibold text-sm tracking-widest uppercase mb-3">
            I nostri servizi
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Eccellenza diagnostica e clinica
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Offriamo un'ampia gamma di prestazioni sanitarie con professionisti qualificati e attrezzature di ultima generazione.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesData.map((service) => (
            <Link
              key={service.slug}
              to={`/servizi/${service.slug}`}
              className="bg-card rounded-lg p-6 card-hover border group cursor-pointer block"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                <service.icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{service.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.shortDesc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
