import { useEffect, useState, useMemo, useRef } from "react";
import { adminApi } from "@/lib/api";
import type { Booking, AdminBookingsFilter } from "@/types/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, RefreshCw, ArrowUpDown, Upload, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STATUSES = ["BOOKED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
const statusLabels: Record<string, string> = {
  BOOKED: "Prenotata",
  CONFIRMED: "Confermata",
  COMPLETED: "Completata",
  CANCELLED: "Cancellata",
};
const statusColors: Record<string, string> = {
  BOOKED: "bg-primary/10 text-primary",
  CONFIRMED: "bg-accent/10 text-accent",
  COMPLETED: "bg-primary/20 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
};

type SortKey = "scheduled_at" | "user" | "service" | "doctor" | "status" | "price";
type SortDir = "asc" | "desc";

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdminBookingsFilter>({});
  const [sortKey, setSortKey] = useState<SortKey>("scheduled_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Report upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadBookingId, setUploadBookingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .bookings(filters)
      .then(setBookings)
      .catch(() =>
        toast({
          title: "Errore",
          description: "Impossibile caricare le prenotazioni",
          variant: "destructive",
        })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (bookingId: number, newStatus: Booking["status"]) => {
    // EXTRA SAFETY: prevent changing status if booking is already COMPLETED
    const current = bookings.find((b) => b.id === bookingId);
    if (current?.status === "COMPLETED") {
      toast({
        title: "Operazione non consentita",
        description: "Una prenotazione completata non può più cambiare stato.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = await adminApi.updateBooking(bookingId, { status: newStatus });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast({ title: "Aggiornato", description: `Stato cambiato in ${statusLabels[newStatus]}` });
    } catch {
      toast({ title: "Errore", description: "Aggiornamento fallito", variant: "destructive" });
    }
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadBookingId === null) return;
    try {
      await adminApi.uploadReport(uploadBookingId, file);
      toast({ title: "Caricato", description: "Referto caricato con successo" });
    } catch {
      toast({ title: "Errore", description: "Upload fallito", variant: "destructive" });
    } finally {
      setUploadBookingId(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...bookings];
    copy.sort((a, b) => {
      // numeric sort only for price
      if (sortKey === "price") {
        const na = a.service?.price ?? 0;
        const nb = b.service?.price ?? 0;
        const cmp = na - nb;
        return sortDir === "asc" ? cmp : -cmp;
      }

      let va = "";
      let vb = "";
      switch (sortKey) {
        case "scheduled_at":
          va = a.scheduled_at;
          vb = b.scheduled_at;
          break;
        case "user":
          va = a.user?.name ?? "";
          vb = b.user?.name ?? "";
          break;
        case "service":
          va = a.service?.name ?? "";
          vb = b.service?.name ?? "";
          break;
        case "doctor":
          va = a.doctor?.name ?? "";
          vb = b.doctor?.name ?? "";
          break;
        case "status":
          va = a.status;
          vb = b.status;
          break;
      }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [bookings, sortKey, sortDir]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (price?: number) =>
    typeof price === "number"
      ? price.toLocaleString("it-IT", { style: "currency", currency: "EUR" })
      : "—";

  const SortHeader = ({ label, keyName }: { label: string; keyName: SortKey }) => (
    <th
      className="text-left p-4 font-semibold text-foreground cursor-pointer select-none hover:text-primary"
      onClick={() => toggleSort(keyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted">
        <div className="bg-primary py-10">
          <div className="container">
            <h1 className="text-3xl font-heading font-bold text-primary-foreground">Prenotazioni</h1>
            <p className="text-primary-foreground/80">Gestisci le prenotazioni</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="bg-card border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dal</label>
              <Input
                type="date"
                value={filters.start ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value || undefined }))}
              />
            </div>
            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Al</label>
              <Input
                type="date"
                value={filters.end ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value || undefined }))}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stato</label>
              <Select onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "ALL" ? undefined : (v as Booking["status"]) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email utente</label>
              <Input
                placeholder="Cerca per email..."
                value={filters.email ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value || undefined }))}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Servizio</label>
              <Input
                placeholder="Cerca per servizio..."
                value={filters.service ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value || undefined }))}
              />
            </div>
            <Button onClick={load} className="bg-primary text-primary-foreground">
              <RefreshCw className="mr-2 h-4 w-4" /> Filtra
            </Button>
          </div>

          <input type="file" accept=".pdf" ref={fileRef} className="hidden" onChange={handleUploadReport} />

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna prenotazione trovata.</p>
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <SortHeader label="Data/Ora" keyName="scheduled_at" />
                      <SortHeader label="Paziente" keyName="user" />
                      <SortHeader label="Servizio" keyName="service" />
                      <SortHeader label="Prezzo" keyName="price" />
                      <SortHeader label="Medico" keyName="doctor" />
                      <SortHeader label="Stato" keyName="status" />
                      <th className="text-left p-4 font-semibold text-foreground">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((b) => {
                      const isCompleted = b.status === "COMPLETED";
                      return (
                        <tr key={b.id} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-medium text-foreground">{formatDateTime(b.scheduled_at)}</td>
                          <td className="p-4">
                            <p className="text-foreground">{b.user?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{b.user?.email ?? ""}</p>
                          </td>
                          <td className="p-4 text-foreground">{b.service?.name ?? "—"}</td>
                          <td className="p-4 text-foreground">{formatPrice(b.service?.price)}</td>
                          <td className="p-4 text-foreground">{b.doctor?.name ?? "—"}</td>
                          <td className="p-4">
                            <Badge className={statusColors[b.status] ?? ""}>{statusLabels[b.status] ?? b.status}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Select
                                disabled={isCompleted}
                                onValueChange={(v) => handleStatusChange(b.id, v as Booking["status"])}
                              >
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                  <SelectValue placeholder={isCompleted ? "Stato bloccato" : "Cambia stato"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUSES.filter((s) => s !== b.status).map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {statusLabels[s]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {isCompleted ? (
                                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Lock className="h-3 w-3" /> Completata
                                </div>
                              ) : null}

                              {b.status === "COMPLETED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setUploadBookingId(b.id);
                                    fileRef.current?.click();
                                  }}
                                >
                                  <Upload className="mr-1 h-3 w-3" /> Referto
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminBookingsPage;