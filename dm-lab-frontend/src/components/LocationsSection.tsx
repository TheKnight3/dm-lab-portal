import { MapPin, Phone, Clock } from "lucide-react";

const locations = [
  {
    name: "Sede Centrale",
    address: "Via Tuscolana 388, 00181 Roma",
    phone: "06 561951",
    hours: "Lun-Ven: 07:00 - 19:00 | Sab: 07:00 - 13:00",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.5!2d12.52!3d41.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDUyJzEyLjAiTiAxMsKwMzEnMTIuMCJF!5e0!3m2!1sit!2sit!4v1600000000000",
  },
  {
    name: "Sede EUR",
    address: "Viale Europa 100, 00144 Roma",
    phone: "06 562000",
    hours: "Lun-Ven: 07:30 - 18:30",
    mapEmbed: null,
  },
  {
    name: "Sede Parioli",
    address: "Via dei Parioli 56, 00197 Roma",
    phone: "06 563000",
    hours: "Lun-Ven: 08:00 - 18:00",
    mapEmbed: null,
  },
];

const LocationsSection = () => {
  return (
    <section id="sedi" className="py-20 bg-muted">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-accent font-heading font-semibold text-sm tracking-widest uppercase mb-3">
            Dove trovarci
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Le nostre sedi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tre centri a Roma per essere sempre vicini ai nostri pazienti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className="bg-card rounded-lg overflow-hidden border card-hover"
            >
              {/* Map placeholder */}
              <div className="h-48 bg-primary/5 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">{loc.name}</span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="font-heading font-bold text-lg text-foreground">{loc.name}</h3>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{loc.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${loc.phone.replace(/\s/g, "")}`} className="hover:text-accent transition-colors">
                    {loc.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{loc.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
