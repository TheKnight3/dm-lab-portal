import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MapPin, User, Clock, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { servicesApi, locationsApi, bookingsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Service, Location, Doctor, Availability } from "@/types/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { label: "Prestazione", icon: Search },
  { label: "Sede", icon: MapPin },
  { label: "Medico", icon: User },
  { label: "Data e Ora", icon: Clock },
  { label: "Conferma", icon: Check },
];

const BookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState("");

  // API data
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);

  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load services on mount
  useEffect(() => {
    servicesApi.list().then(setServices).catch(() => {});
  }, []);

  // Load locations when service selected
  useEffect(() => {
    if (selectedService) {
      locationsApi.list().then(setLocations).catch(() => {});
    }
  }, [selectedService]);

  // Load doctors when location selected
  useEffect(() => {
    if (selectedLocation && selectedService) {
      setLoadingData(true);
      locationsApi
        .doctors({ service_id: selectedService.id, location_id: selectedLocation.id })
        .then(setDoctors)
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [selectedLocation, selectedService]);

  // Load availabilities when doctor selected
  useEffect(() => {
    if (selectedDoctor) {
      setLoadingData(true);
      locationsApi
        .availabilities(selectedDoctor.id)
        .then(setAvailabilities)
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [selectedDoctor]);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group availabilities by date
  const slotsByDate = availabilities.reduce<Record<string, Availability[]>>((acc, a) => {
    const date = a.available_at.split("T")[0];
    (acc[date] = acc[date] || []).push(a);
    return acc;
  }, {});

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedLocation;
    if (step === 2) return !!selectedDoctor;
    if (step === 3) return !!selectedSlot;
    return true;
  };

  const handleConfirm = async () => {
    if (!user) {
      toast({ title: "Accesso richiesto", description: "Effettua il login per completare la prenotazione", variant: "destructive" });
      navigate("/login", { state: { from: { pathname: "/prenota" } } });
      return;
    }
    if (!selectedService || !selectedDoctor || !selectedSlot) return;

    setSubmitting(true);
    try {
      await bookingsApi.create({
        service_id: selectedService.id,
        doctor_id: selectedDoctor.id,
        scheduled_at: selectedSlot.available_at,
        notes: notes || undefined,
      });
      setBooked(true);
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Prenotazione fallita", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  if (booked) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-3">Prenotazione confermata!</h2>
            <p className="text-muted-foreground mb-2">
              <strong>{selectedService?.name}</strong> presso <strong>{selectedLocation?.name}</strong>
            </p>
            <p className="text-muted-foreground mb-1">{selectedDoctor?.name}</p>
            {selectedSlot && (
              <p className="text-muted-foreground mb-6">
                {formatDate(selectedSlot.available_at)} alle {formatTime(selectedSlot.available_at)}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-8">Riceverai una conferma via email con tutti i dettagli.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/area-riservata")} className="bg-primary text-primary-foreground">
                Le mie prenotazioni
              </Button>
              <Button variant="outline" onClick={() => { setBooked(false); setStep(0); setSelectedService(null); setSelectedLocation(null); setSelectedDoctor(null); setSelectedSlot(null); setNotes(""); }}>
                Nuova prenotazione
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted">
        <div className="bg-primary py-10">
          <div className="container">
            <h1 className="text-3xl font-heading font-bold text-primary-foreground mb-2">Prenota online</h1>
            <p className="text-primary-foreground/80">Trova e prenota la tua prestazione in pochi passaggi.</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-between max-w-3xl mx-auto mb-10">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${i < step ? "bg-primary" : "bg-muted-foreground/20"}`} />}
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto bg-card rounded-lg border p-6 md:p-8 animate-fade-in">
            {/* Step 0: Search service */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">Cerca la prestazione</h2>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Cerca per nome o categoria..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredServices.map((s) => (
                    <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full text-left p-4 rounded-lg border transition-all ${selectedService?.id === s.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                        </div>
                        <span className="font-heading font-bold text-primary">€{s.price.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                  {filteredServices.length === 0 && <p className="text-muted-foreground text-center py-4">Nessun risultato trovato.</p>}
                </div>
              </div>
            )}

            {/* Step 1: Choose location */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">Scegli la sede</h2>
                <div className="space-y-3">
                  {locations.map((l) => (
                    <button key={l.id} onClick={() => setSelectedLocation(l)} className={`w-full text-left p-5 rounded-lg border transition-all ${selectedLocation?.id === l.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                      <div className="flex items-center gap-4">
                        <MapPin className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">{l.name}</p>
                          <p className="text-sm text-muted-foreground">{l.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Choose doctor */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">Scegli il medico</h2>
                {loadingData ? (
                  <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                ) : doctors.length === 0 ? (
                  <p className="text-muted-foreground">Nessun medico disponibile per questa sede.</p>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((d) => (
                      <button key={d.id} onClick={() => setSelectedDoctor(d)} className={`w-full text-left p-5 rounded-lg border transition-all ${selectedDoctor?.id === d.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{d.name}</p>
                            <p className="text-sm text-muted-foreground">{d.specialty}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date & time from API availabilities */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">Scegli data e orario</h2>
                {loadingData ? (
                  <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <p className="text-muted-foreground">Nessuna disponibilità trovata.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => (
                      <div key={date}>
                        <p className="font-semibold text-foreground mb-3 capitalize">{formatDate(date)}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {slots.sort((a, b) => a.available_at.localeCompare(b.available_at)).map((slot) => (
                            <button key={slot.id} onClick={() => setSelectedSlot(slot)} className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${selectedSlot?.id === slot.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/30"}`}>
                              {formatTime(slot.available_at)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-6">Riepilogo prenotazione</h2>
                <div className="space-y-4 bg-muted rounded-lg p-6">
                  <div className="flex justify-between"><span className="text-muted-foreground">Prestazione</span><span className="font-semibold text-foreground">{selectedService?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sede</span><span className="font-semibold text-foreground">{selectedLocation?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Medico</span><span className="font-semibold text-foreground">{selectedDoctor?.name}</span></div>
                  {selectedSlot && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span className="font-semibold text-foreground capitalize">{formatDate(selectedSlot.available_at)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Orario</span><span className="font-semibold text-foreground">{formatTime(selectedSlot.available_at)}</span></div>
                    </>
                  )}
                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-semibold text-foreground">Totale</span>
                    <span className="text-xl font-heading font-bold text-primary">€{selectedService?.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Note (opzionale)</label>
                  <Textarea placeholder="Eventuali note o richieste particolari..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                {!user && (
                  <p className="text-sm text-destructive mt-4">⚠ Devi effettuare il login per confermare la prenotazione.</p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="border-primary text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
              </Button>

              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-primary text-primary-foreground">
                  Avanti <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleConfirm} disabled={submitting} className="bg-accent text-accent-foreground hover:bg-dmlab-gold-light font-semibold">
                  {submitting ? "Invio in corso..." : "Conferma prenotazione"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
