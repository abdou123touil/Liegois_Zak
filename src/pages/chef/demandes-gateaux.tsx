import { useState } from "react";
import { DemandeGateau, useListDemandesGateaux, useUpdateDemandeGateau } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CakeSlice, Eye, Loader2 } from "lucide-react";

export default function ChefDemandesGateaux() {
  const { data: demandes = [], isLoading } = useListDemandesGateaux();
  const updateMutation = useUpdateDemandeGateau();
  const [selected, setSelected] = useState<DemandeGateau | null>(null);
  const [prixPropose, setPrixPropose] = useState("");
  const [noteChef, setNoteChef] = useState("");

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(value || 0);

  const openDetails = (demande: DemandeGateau) => {
    setSelected(demande);
    setPrixPropose(demande.prixPropose?.toString() || "");
    setNoteChef(demande.noteChef || "");
  };

  const updateStatus = async (status: DemandeGateau["status"]) => {
    if (!selected) return;

    await updateMutation.mutateAsync({
      id: selected.id,
      data: {
        status,
        prixPropose: prixPropose ? parseFloat(prixPropose) : undefined,
        noteChef,
      },
    });

    setSelected(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Demandes de gâteaux
          </h1>
          <p className="text-primary/60 text-sm mt-1">
            Demandes publiques envoyées par les clients.
          </p>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary flex items-center gap-2">
              <CakeSlice className="h-5 w-5" />
              Liste des demandes
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-primary/60">Chargement...</div>
            ) : demandes.length === 0 ? (
              <div className="p-10 text-center text-primary/50">Aucune demande.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm text-primary/70">Client</th>
                      <th className="text-left p-4 text-sm text-primary/70">Format</th>
                      <th className="text-left p-4 text-sm text-primary/70">Date</th>
                      <th className="text-left p-4 text-sm text-primary/70">Budget</th>
                      <th className="text-left p-4 text-sm text-primary/70">Statut</th>
                      <th className="text-right p-4 text-sm text-primary/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((demande) => (
                      <tr key={demande.id} className="border-b border-primary/5 hover:bg-primary/5">
                        <td className="p-4 font-medium text-primary">
                          {demande.clientNom}
                          <div className="text-xs text-primary/50">{demande.clientTelephone}</div>
                        </td>
                        <td className="p-4 text-primary/70">{demande.formatGateau || "-"}</td>
                        <td className="p-4 text-primary/70">{demande.dateEvenement || "-"}</td>
                        <td className="p-4 text-primary/70">{formatCurrency(demande.budgetClient)}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {demande.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => openDetails(demande)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Demande #{selected?.id}</DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Info label="Client" value={selected.clientNom} />
                  <Info label="Téléphone" value={selected.clientTelephone} />
                  <Info label="Événement" value={selected.typeEvenement} />
                  <Info label="Format" value={selected.formatGateau} />
                  <Info label="Personnes" value={selected.nombrePersonnes?.toString()} />
                  <Info label="Date" value={selected.dateEvenement} />
                  <Info label="Heure" value={selected.heureSouhaitee} />
                  <Info label="Budget" value={formatCurrency(selected.budgetClient)} />
                  <Info label="Goûts" value={selected.gouts} />
                  <Info label="Garnitures" value={selected.garnitures} />
                  <Info label="Décoration" value={selected.decoration} />
                  <Info label="Couleurs" value={selected.couleurs} />
                </div>

                {selected.notesClient && (
                  <div>
                    <Label>Notes client</Label>
                    <p className="mt-1 rounded-xl bg-primary/5 p-3 text-sm text-primary/70">
                      {selected.notesClient}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Prix proposé</Label>
                  <Input type="number" value={prixPropose} onChange={(e) => setPrixPropose(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Note chef</Label>
                  <Textarea rows={3} value={noteChef} onChange={(e) => setNoteChef(e.target.value)} />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => updateStatus("REFUSEE")} disabled={updateMutation.isPending}>
                Refuser
              </Button>
              <Button variant="secondary" onClick={() => updateStatus("VUE_PAR_CHEF")} disabled={updateMutation.isPending}>
                Marquer vue
              </Button>
              <Button onClick={() => updateStatus("ACCEPTEE")} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accepter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
      <div className="text-xs text-primary/50">{label}</div>
      <div className="font-medium text-primary">{value || "-"}</div>
    </div>
  );
}