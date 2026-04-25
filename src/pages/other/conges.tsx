// src/pages/other/conges.tsx
import { useState } from "react";
import { useListConges, useCreateConge, useApproveConge, Conge } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function OtherConges() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const employeeId = user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [type, setType] = useState("CONGES_PAYES");
  const [motif, setMotif] = useState("");

  const { data: conges = [], isLoading } = useListConges();
  const createMutation = useCreateConge();
  const approveMutation = useApproveConge(); // pour information, l'employé ne peut pas valider lui-même

  // Filtrer les congés de l'utilisateur connecté
  const mesConges = conges.filter(c => c.employeeId === employeeId);
  const congesEnAttente = mesConges.filter(c => !c.valide);
  const congesValides = mesConges.filter(c => c.valide);

  const handleCreate = async () => {
    if (!dateDebut || !dateFin || !type) {
      toast({ title: t('common.error'), description: t('other.conges.validation_required'), variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        employeeId,
        dateDebut,
        dateFin,
        type,
        motif: motif || undefined,
      });
      toast({ title: t('common.success'), description: t('other.conges.create_success') });
      queryClient.invalidateQueries({ queryKey: ["conges"] });
      setIsModalOpen(false);
      setDateDebut("");
      setDateFin("");
      setType("CONGES_PAYES");
      setMotif("");
    } catch {
      toast({ title: t('common.error'), description: t('other.conges.save_error'), variant: "destructive" });
    }
  };

  const getTypeLabel = (typeValue: string) => {
    switch (typeValue) {
      case "CONGES_PAYES": return t('other.conges.type_paid');
      case "MALADIE": return t('other.conges.type_sick');
      case "SANS_SOLDE": return t('other.conges.type_unpaid');
      default: return typeValue;
    }
  };

  const getStatutBadge = (valide: boolean) => {
    return valide 
      ? <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('other.conges.approved')}</Badge>
      : <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{t('other.conges.pending')}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('other.conges.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('other.conges.subtitle')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('other.conges.request_button')}
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('other.conges.pending_requests')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{congesEnAttente.length}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('other.conges.approved_requests')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{congesValides.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des congés */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('other.conges.my_leaves')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : mesConges.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('other.conges.no_leaves')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.conges.start_date')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.conges.end_date')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.conges.type')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.conges.motif')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.conges.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {mesConges.map((conge, idx) => (
                        <motion.tr
                          key={conge.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 text-primary/70">{new Date(conge.dateDebut).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{new Date(conge.dateFin).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{getTypeLabel(conge.type)}</td>
                          <td className="p-4 text-primary/70">{conge.motif || '-'}</td>
                          <td className="p-4">{getStatutBadge(conge.valide)}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de nouvelle demande */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">{t('other.conges.new_request')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('other.conges.start_date')}</Label>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('other.conges.end_date')}</Label>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t('other.conges.type')}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONGES_PAYES">{t('other.conges.type_paid')}</SelectItem>
                    <SelectItem value="MALADIE">{t('other.conges.type_sick')}</SelectItem>
                    <SelectItem value="SANS_SOLDE">{t('other.conges.type_unpaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('other.conges.motif')}</Label>
                <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={t('other.conges.motif_placeholder')} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleCreate}>{t('common.submit')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}