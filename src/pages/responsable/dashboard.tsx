// src/pages/responsable/dashboard.tsx
import { useListDemandesAchat, useListStockJournalier, useListEmployees, useApproveDemandeAchat } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ClipboardList, PackageCheck, Users, Eye, CheckCircle, XCircle } from "lucide-react";

export default function ResponsableDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: demandes = [], isLoading: loadingDemandes } = useListDemandesAchat();
  const { data: stockJournalier = [], isLoading: loadingStock } = useListStockJournalier();
  const { data: employees = [], isLoading: loadingEmployees } = useListEmployees();
  const approveMutation = useApproveDemandeAchat();

  const demandesEnAttente = demandes.filter(d => d.statut === "EN_ATTENTE");
  const aujourdHui = new Date().toISOString().split('T')[0];
  const productionAujourdhui = stockJournalier.find(s => s.date === aujourdHui);
  const quantiteProduiteAujourdhui = productionAujourdhui?.quantiteProduite || 0;
  const employesActifs = employees.filter(e => e.isActive).length;

  const handleApprove = async (id: number, valide: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, valide });
      toast({ title: t('common.success'), description: valide ? t('demandesAchat.approved') : t('demandesAchat.rejected') });
      queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
    } catch {
      toast({ title: t('common.error'), description: t('demandesAchat.approve_error'), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('responsable.dashboard.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('responsable.dashboard.subtitle')}</p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('responsable.dashboard.pending_requests')}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{demandesEnAttente.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('responsable.dashboard.need_validation')}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('responsable.dashboard.today_production')}</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{quantiteProduiteAujourdhui}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('responsable.dashboard.units_produced_today')}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('responsable.dashboard.active_employees')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{employesActifs}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('responsable.dashboard.active_staff')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes d'achat en attente avec actions */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('responsable.dashboard.pending_requests_list')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDemandes ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : demandesEnAttente.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('responsable.dashboard.no_pending_requests')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.product')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.quantity')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.supplier')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.requested_by')}</th>
                      <th className="text-right p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandesEnAttente.slice(0, 5).map((demande) => (
                      <motion.tr
                        key={demande.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-primary/5 hover:bg-primary/5"
                      >
                        <td className="p-4 font-medium text-primary/90">{demande.produit}</td>
                        <td className="p-4 text-primary/70">{demande.quantite} {demande.uniteMesure}</td>
                        <td className="p-4 text-primary/70">{demande.fournisseurSuggere?.nom || '-'}</td>
                        <td className="p-4 text-primary/70">{demande.demandePar?.name || '-'}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" className="hover:bg-green-100" onClick={() => handleApprove(demande.id, true)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-red-100" onClick={() => handleApprove(demande.id, false)}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dernières productions */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('responsable.dashboard.recent_productions')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStock ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : stockJournalier.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('responsable.dashboard.no_productions')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.date')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.product')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.produced')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.sold')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.dashboard.unsold')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockJournalier.slice(0, 7).map((stock) => (
                      <motion.tr
                        key={stock.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-primary/5 hover:bg-primary/5"
                      >
                        <td className="p-4 text-primary/70">{new Date(stock.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-primary/90">{stock.product?.name}</td>
                        <td className="p-4 text-primary/70">{stock.quantiteProduite}</td>
                        <td className="p-4 text-primary/70">{stock.quantiteVendue ?? 0}</td>
                        <td className="p-4 text-primary/70">{stock.quantiteInvendue ?? 0}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}