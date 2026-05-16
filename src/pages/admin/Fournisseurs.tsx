import { useState } from "react";
import { useListFournisseurs, useCreateFournisseur, useUpdateFournisseur, useDeleteFournisseur, Fournisseur } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Fournisseurs() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [actif, setActif] = useState(true);
  const [defaultDelayLivraison, setDefaultDelayLivraison] = useState("");
  const [notes, setNotes] = useState("");
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fournisseurs, isLoading } = useListFournisseurs();
  const createMutation = useCreateFournisseur();
  const updateMutation = useUpdateFournisseur();
  const deleteMutation = useDeleteFournisseur();

  const openNewModal = () => {
    setEditingFournisseur(null);
    setNom("");
    setSociete("");
    setTelephone("");
    setEmail("");
    setAdresse("");
    setActif(true);
    setDefaultDelayLivraison("");
    setNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (f: Fournisseur) => {
    setEditingFournisseur(f);
    setNom(f.nom);
    setSociete(f.societe || "");
    setTelephone(f.telephone);
    setEmail(f.email || "");
    setAdresse(f.adresse || "");
    setActif(f.actif);
    setDefaultDelayLivraison(f.defaultDelayLivraison?.toString() || "");
    setNotes(f.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nom || !telephone) {
      toast({ title: t('common.error'), description: t('fournisseurs.validation_nom_telephone'), variant: "destructive" });
      return;
    }

    const data: any = {
      nom,
      societe,
      telephone,
      email,
      adresse,
      actif,
      notes,
    };
    if (defaultDelayLivraison) data.defaultDelayLivraison = parseInt(defaultDelayLivraison);

    try {
      if (editingFournisseur) {
        await updateMutation.mutateAsync({ id: editingFournisseur.id, data });
        toast({ title: t('common.success'), description: t('fournisseurs.update_success') });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: t('common.success'), description: t('fournisseurs.create_success') });
      }
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('fournisseurs.save_error'), variant: "destructive" });
    }
  };

  const handleDeleteClick = (fournisseur: Fournisseur) => {
  setFournisseurToDelete(fournisseur);
  setIsDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  if (!fournisseurToDelete) return;

  try {
    await deleteMutation.mutateAsync(fournisseurToDelete.id);
    toast({ title: t('common.success'), description: t('fournisseurs.delete_success') });
    await queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
  } catch (error) {
    toast({ title: t('common.error'), description: t('fournisseurs.delete_error'), variant: "destructive" });
  } finally {
    setIsDeleteDialogOpen(false);
    setFournisseurToDelete(null);
  }
};

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('fournisseurs.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('fournisseurs.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('fournisseurs.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('fournisseurs.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.nom')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.societe')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.telephone')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.email')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.actif')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('fournisseurs.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : fournisseurs?.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('fournisseurs.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {fournisseurs?.map((f, idx) => (
                        <motion.tr
                          key={f.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" /> {f.nom}
                          </td>
                          <td className="p-4 text-primary/70">{f.societe || "-"}</td>
                          <td className="p-4 text-primary/70">{f.telephone}</td>
                          <td className="p-4 text-primary/70">{f.email || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {f.actif ? t('common.active') : t('common.inactive')}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(f)} className="hover:bg-primary/10">
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(f)} className="hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
              <DialogTitle className="text-primary">{editingFournisseur ? t('fournisseurs.edit_title') : t('fournisseurs.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nom">{t('fournisseurs.nom_label')}</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="societe">{t('fournisseurs.societe_label')}</Label>
                <Input id="societe" value={societe} onChange={(e) => setSociete(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telephone">{t('fournisseurs.telephone_label')}</Label>
                <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('fournisseurs.email_label')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adresse">{t('fournisseurs.adresse_label')}</Label>
                <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultDelayLivraison">{t('fournisseurs.delay_label')}</Label>
                <Input id="defaultDelayLivraison" type="number" value={defaultDelayLivraison} onChange={(e) => setDefaultDelayLivraison(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t('fournisseurs.notes_label')}</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="actif" checked={actif} onCheckedChange={(checked) => setActif(!!checked)} />
                <Label htmlFor="actif">{t('fournisseurs.actif_label')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{editingFournisseur ? t('common.save') : t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent
    className="sm:max-w-[400px] rounded-2xl border border-border shadow-2xl"
    style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
  >
    <DialogHeader>
      <DialogTitle className="text-destructive">
        Confirmer la suppression
      </DialogTitle>
    </DialogHeader>

    <p className="text-primary/80">
      Voulez-vous vraiment supprimer le fournisseur{" "}
      <strong>{fournisseurToDelete?.nom}</strong> ? Cette action est irréversible.
    </p>

    <DialogFooter className="mt-4">
      <Button
        variant="outline"
        onClick={() => {
          setIsDeleteDialogOpen(false);
          setFournisseurToDelete(null);
        }}
      >
        {t('common.cancel')}
      </Button>

      <Button
        variant="destructive"
        onClick={confirmDelete}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? t('common.loading') : "Supprimer"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </ADMINLayout>
  );
}