import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import type { FinanceItem, FinancePeriod } from "@/types/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Euro } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminFinancePage = () => {
  const [data, setData] = useState<FinanceItem[]>([]);
  const [period, setPeriod] = useState<FinancePeriod>("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.finance({ period, from: from || undefined, to: to || undefined })
      .then(setData)
      .catch(() => toast({ title: "Errore", description: "Impossibile caricare i dati", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const total = data.reduce((sum, d) => sum + d.total_amount, 0);

  const periodLabels: Record<string, string> = {
    daily: "Giornaliero", weekly: "Settimanale", monthly: "Mensile",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted">
        <div className="bg-primary py-10">
          <div className="container">
            <h1 className="text-3xl font-heading font-bold text-primary-foreground">Dashboard Incassi</h1>
            <p className="text-primary-foreground/80">Panoramica economico-finanziaria</p>
          </div>
        </div>

        <div className="container py-8 space-y-8">
          {/* Filters */}
          <div className="bg-card border rounded-lg p-4 flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Periodo</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as FinancePeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="monthly">Mensile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Da</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">A</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={load} className="bg-primary text-primary-foreground">Aggiorna</Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Euro className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">Totale incassi</span>
              </div>
              <p className="text-3xl font-heading font-bold text-foreground">€{total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Periodi analizzati</span>
              </div>
              <p className="text-3xl font-heading font-bold text-foreground">{data.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Euro className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Media per periodo</span>
              </div>
              <p className="text-3xl font-heading font-bold text-foreground">
                €{data.length ? (total / data.length).toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00"}
              </p>
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">Nessun dato disponibile per il periodo selezionato.</p>
          ) : (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Incassi — {periodLabels[period]}</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      formatter={(value: number) => [`€${value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`, "Incasso"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Bar dataKey="total_amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          {data.length > 0 && (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">Periodo</th>
                    <th className="text-right p-4 font-semibold text-foreground">Incasso</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-4 text-foreground">{d.period}</td>
                      <td className="p-4 text-right font-semibold text-foreground">€{d.total_amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminFinancePage;
