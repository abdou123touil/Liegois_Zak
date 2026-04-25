import { useState } from "react";
import { useListAchats, useCreateAchat, useListFournisseurs, Achat } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/ADMINLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Achats() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fournisseurId, setFournisseurId] = useState("");
  const [nomProduit, setNomProduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [uniteMesure, setUniteMesure] = useState("kg");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [dateAchat, setDateAchat] = useState(new Date().toISOString().split('T')[0]);
  const [factureRef, setFactureRef] = useState("");
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achats = [], isLoading } = useListAchats();
  const { data: fournisseurs = [] } = useListFournisseurs();
  const createMutation = useCreateAchat();

  const openNewModal = () => {
    setFournisseurId("");
    setNomProduit("");
    setQuantite("");
    setUniteMesure("kg");
    setPrixUnitaire("");
    setDateAchat(new Date().toISOString().split('T')[0]);
    setFactureRef("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fournisseurId || !nomProduit || !quantite || !prixUnitaire) {
      toast({ title: t('common.error'), description: t('achats.validation_required'), variant: "destructive" });
      return;
    }

    const achatData = {
      fournisseur: { id: parseInt(fournisseurId) },
      nomProduit,
      quantite: parseFloat(quantite),
      uniteMesure,
      prixUnitaire: parseFloat(prixUnitaire),
      dateAchat,
      factureRef: factureRef || undefined,
      notes: notes || undefined,
    };

    try {
      await createMutation.mutateAsync(achatData);
      toast({ title: t('common.success'), description: t('achats.create_success') });
      queryClient.invalidateQueries({ queryKey: ["achats"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('achats.save_error'), variant: "destructive" });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
  };

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('achats.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('achats.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('achats.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('achats.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.product')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.quantity')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.unit_price')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.total')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.date')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('achats.table.supplier')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : achats.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('achats.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {achats.map((achat, idx) => (
                        <motion.tr
                          key={achat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" /> {achat.nomProduit}
                          </td>
                          <td className="p-4 text-primary/70">{achat.quantite} {achat.uniteMesure}</td>
                          <td className="p-4 text-primary/70">{formatCurrency(achat.prixUnitaire)}</td>
                          <td className="p-4 font-semibold text-primary">{formatCurrency(achat.prixTotal)}</td>
                          <td className="p-4 text-primary/70">{new Date(achat.dateAchat).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70 flex items-center gap-1">
                            <Truck className="h-3 w-3" /> {achat.fournisseur?.nom || '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">{t('achats.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('achats.supplier')}</Label>
                <Select value={fournisseurId} onValueChange={setFournisseurId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('achats.select_supplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('achats.product_name')}</Label>
                <Input value={nomProduit} onChange={(e) => setNomProduit(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('achats.quantity')}</Label>
                  <Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('achats.unit')}</Label>
                  <Input value={uniteMesure} onChange={(e) => setUniteMesure(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t('achats.unit_price')}</Label>
                <Input type="number" step="0.001" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('achats.date')}</Label>
                <Input type="date" value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('achats.invoice_ref')}</Label>
                <Input value={factureRef} onChange={(e) => setFactureRef(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('achats.notes')}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}