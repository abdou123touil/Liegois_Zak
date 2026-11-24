import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { Users, TicketPercent, Plus, Trash2, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Customer, Promotion, useCreateCustomer, useDeletePromotion, useListCustomers, useListPromotions, useSavePromotion } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import CommercialLayout from "@/components/layout/CommercialLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const blank = { name: "", code: "", type: "PERCENTAGE" as "FIXED" | "PERCENTAGE", value: "10", minimumAmount: "0", startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) };

export default function Fidelite() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const { toast } = useToast();
  const { data: customers = [] } = useListCustomers();
  const { data: promotions = [] } = useListPromotions();
  const createCustomer = useCreateCustomer();
  const savePromotion = useSavePromotion();
  const deletePromotion = useDeletePromotion();
  const [form, setForm] = useState(blank);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [search, setSearch] = useState("");
  const totalPoints = useMemo(() => customers.reduce((sum, customer) => sum + customer.points, 0), [customers]);
  const visibleCustomers = customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));

  const addCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    try { await createCustomer.mutateAsync({ name: customerName, phone: customerPhone }); setCustomerName(""); setCustomerPhone(""); toast({ title: "Client ajouté" }); }
    catch (e) { toast({ title: "Impossible d’ajouter le client", description: e instanceof Error ? e.message : "Vérifiez les informations.", variant: "destructive" }); }
  };
  const submitPromotion = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = { name: form.name.trim(), code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value), minimumAmount: Number(form.minimumAmount), startDate: form.startDate, endDate: form.endDate, active: true };
    try { await savePromotion.mutateAsync(data as Omit<Promotion, "id">); setForm(blank); toast({ title: "Promotion créée" }); }
    catch (e) { toast({ title: "Impossible de créer la promotion", description: e instanceof Error ? e.message : "Vérifiez les informations.", variant: "destructive" }); }
  };
  const layout = (content: React.ReactNode) => isAdmin ? <AdminLayout>{content}</AdminLayout> : <CommercialLayout>{content}</CommercialLayout>;

  return layout(<div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Fidélité et promotions</h1><p className="mt-1 text-muted-foreground">Gérez les clients, leurs points et les offres de la boulangerie.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-4 p-5"><Users className="h-8 w-8 text-primary"/><div><p className="text-sm text-muted-foreground">Clients fidélité</p><p className="text-2xl font-bold">{customers.length}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><Gift className="h-8 w-8 text-primary"/><div><p className="text-sm text-muted-foreground">Points en circulation</p><p className="text-2xl font-bold">{totalPoints}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><TicketPercent className="h-8 w-8 text-primary"/><div><p className="text-sm text-muted-foreground">Promotions</p><p className="text-2xl font-bold">{promotions.length}</p></div></CardContent></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Ajouter un client</CardTitle></CardHeader><CardContent>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={addCustomer}><div><Label htmlFor="client-name">Nom</Label><Input id="client-name" required value={customerName} onChange={e=>setCustomerName(e.target.value)}/></div><div><Label htmlFor="client-phone">Téléphone</Label><Input id="client-phone" required value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/></div><Button className="sm:col-span-2" disabled={createCustomer.isPending}><Plus className="mr-2 h-4 w-4"/>Créer la fiche</Button></form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Créer une promotion</CardTitle></CardHeader><CardContent>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitPromotion}>
          <div><Label>Nom de l’offre</Label><Input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><Label>Code</Label><Input required value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/></div>
          <div><Label>Type de réduction</Label><Select value={form.type} onValueChange={(v: "FIXED" | "PERCENTAGE")=>setForm({...form,type:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">Pourcentage</SelectItem><SelectItem value="FIXED">Montant (TND)</SelectItem></SelectContent></Select></div>
          <div><Label>Valeur</Label><Input type="number" min="0.01" step="0.01" required value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></div>
          <div><Label>Minimum d’achat (TND)</Label><Input type="number" min="0" step="0.01" value={form.minimumAmount} onChange={e=>setForm({...form,minimumAmount:e.target.value})}/></div>
          <div><Label>Début</Label><Input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
          <div><Label>Fin</Label><Input type="date" required value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div>
          <Button className="sm:col-span-2" disabled={savePromotion.isPending}><Plus className="mr-2 h-4 w-4"/>Créer la promotion</Button>
        </form>
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Promotions disponibles</CardTitle></CardHeader><CardContent className="space-y-3">
      {promotions.length === 0 && <EmptyState title="Aucune promotion pour le moment" description="Créez une offre pour la faire apparaître ici." icon={TicketPercent} />}
      {promotions.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{p.name} <span className="ml-2 rounded bg-primary/10 px-2 py-1 text-sm text-primary">{p.code}</span></p><p className="text-sm text-muted-foreground">{p.type === "FIXED" ? `${p.value} TND` : `${p.value}%`} · minimum {p.minimumAmount} TND · {p.startDate} au {p.endDate}</p></div><Button variant="ghost" size="icon" aria-label="Supprimer" disabled={deletePromotion.isPending} onClick={async()=>{try{await deletePromotion.mutateAsync(p.id);toast({title:"Promotion supprimée"});}catch{toast({title:"Suppression impossible",variant:"destructive"});}}}><Trash2 className="h-4 w-4"/></Button></div>)}
    </CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Clients fidélité</CardTitle><Input className="max-w-xs" placeholder="Nom ou téléphone" value={search} onChange={e=>setSearch(e.target.value)}/></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Client</th><th className="p-2">Téléphone</th><th className="p-2 text-right">Points</th></tr></thead><tbody>{visibleCustomers.map((c: Customer)=><tr key={c.id} className="border-b last:border-0"><td className="p-2 font-medium">{c.name}</td><td className="p-2">{c.phone}</td><td className="p-2 text-right font-semibold">{c.points}</td></tr>)}{visibleCustomers.length===0&&<TableEmptyRow colSpan={3} title="Aucun client trouvé." />}</tbody></table></CardContent></Card>
    <p className="text-xs text-muted-foreground">Règle actuelle : 1 point gagné par TND dépensé. 100 points donnent 1 TND de réduction à la caisse.</p>
  </div>);
}
