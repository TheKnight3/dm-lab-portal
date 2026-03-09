import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi, reportsApi } from "@/lib/api";
import type { Booking, Report } from "@/types/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, FileText, LogOut, Pencil, Trash2, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  BOOKED: "bg-primary/10 text-primary",
  CONFIRMED: "bg-accent/10 text-accent",
  COMPLETED: "bg-primary/20 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  BOOKED: "Prenotata",
  CONFIRMED: "Confermata",
  COMPLETED: "Completata",
  CANCELLED: "Cancellata",
};

const UserAreaPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Cancel dialog state
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  // Report update
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([bookingsApi.mine(), reportsApi.mine()])
      .then(([b, r]) => {
        setBookings(b);
        setReports(r);
      })
      .catch(() => toast({ title: "Errore", description: "Impossibile caricare i dati", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDownload = async (reportId: number, filename: string) => {
    try {
      const blob = await reportsApi.download(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Errore", description: "Download fallito", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openEdit = (b: Booking) => {
    setEditBooking(b);
    setEditDate(b.scheduled_at.slice(0, 16));
    setEditNotes(b.notes ?? "");
  };

  const handleEditSave = async () => {
    if (!editBooking) return;
    setEditSaving(true);
    try {
      const updated = await bookingsApi.update(editBooking.id, {
        scheduled_at: toIsoFromDatetimeLocal(editDate),
        notes: editNotes || undefined,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast({ title: "Aggiornata", description: "Prenotazione modificata con successo" });
      setEditBooking(null);
    } catch {
      toast({ title: "Errore", description: "Modifica fallita", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const handleCancel = async () => {
    if (cancelBookingId === null) return;
    setCancelSaving(true);
    try {
      const updated = await bookingsApi.cancel(cancelBookingId);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast({ title: "Cancellata", description: "Prenotazione cancellata con successo" });
    } catch {
      toast({ title: "Errore", description: "Cancellazione fallita", variant: "destructive" });
    } finally {
      setCancelSaving(false);
      setCancelBookingId(null);
    }
  };

  const handleReportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || updatingReportId === null) return;
    try {
      const updated = await reportsApi.updateFile(updatingReportId, file);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast({ title: "Aggiornato", description: "Referto aggiornato con successo" });
    } catch {
      toast({ title: "Errore", description: "Aggiornamento fallito", variant: "destructive" });
    } finally {
      setUpdatingReportId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const canModify = (b: Booking) => b.status !== "COMPLETED" && b.status !== "CANCELLED";

  const toIsoFromDatetimeLocal = (value: string) => {
    // value is like "2026-03-03T10:30"
    // Build a Date in local time, then send as UTC ISO.
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value; // fallback (backend will validate)
    return dt.toISOString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted">
        <div className="bg-primary py-10">
          <div className="container flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-foreground">Area Riservata</h1>
              <p className="text-primary-foreground/80">Ciao, {user?.name}</p>
            </div>
          </div>
        </div>

        <div className="container py-10 space-y-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Bookings */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-heading font-bold text-foreground">Le mie prenotazioni</h2>
                </div>

                {bookings.length === 0 ? (
                  <p className="text-muted-foreground">Nessuna prenotazione trovata.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div key={b.id} className="bg-card border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{b.service?.name ?? "Servizio"}</p>
                          <p className="text-sm text-muted-foreground">{b.doctor?.name ?? "Medico"} — {b.doctor?.location?.name ?? "Sede"}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(b.scheduled_at)}</p>
                          {b.notes && <p className="text-xs text-muted-foreground mt-1">Note: {b.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={statusColors[b.status]}>{statusLabels[b.status] || b.status}</Badge>
                          {canModify(b) && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                                <Pencil className="mr-1 h-3 w-3" /> Modifica
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setCancelBookingId(b.id)}>
                                <Trash2 className="mr-1 h-3 w-3" /> Cancella
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Reports */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-heading font-bold text-foreground">I miei referti</h2>
                </div>

                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleReportFileChange} />

                {reports.length === 0 ? (
                  <p className="text-muted-foreground">Nessun referto disponibile.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className="bg-card border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{r.booking?.service?.name ?? "Servizio"}</p>
                          <p className="text-sm text-muted-foreground">{r.filename}</p>
                          <p className="text-sm text-muted-foreground">Caricato il {formatDate(r.uploaded_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleDownload(r.id, r.filename)} className="bg-primary text-primary-foreground">
                            <Download className="mr-2 h-4 w-4" /> Scarica PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Edit Booking Dialog */}
      <Dialog open={!!editBooking} onOpenChange={(open) => !open && setEditBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica prenotazione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Data e ora</label>
              <Input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Note</label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Note aggiuntive..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBooking(null)}>Annulla</Button>
            <Button onClick={handleEditSave} disabled={editSaving} className="bg-primary text-primary-foreground">
              {editSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Confirm */}
      <AlertDialog open={cancelBookingId !== null} onOpenChange={(open) => !open && setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare la prenotazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La prenotazione verrà cancellata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelSaving} className="bg-destructive text-destructive-foreground">
              {cancelSaving ? "Cancellazione..." : "Conferma cancellazione"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserAreaPage;
