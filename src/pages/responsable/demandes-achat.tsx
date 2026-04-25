// src/pages/responsable/demandes-achat.tsx
import { useState } from "react";
import { useListDemandesAchat, useApproveDemandeAchat, DemandeAchat } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Filter } from "lucide-react";

export default function ResponsableDemandesAchat() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOnlyPending, setShowOnlyPending] = useState(true);

  const { data: demandes = [], isLoading } = useListDemandesAchat();
  const approveMutation = useApproveDemandeAchat();

  const filteredDemandes = showOnlyPending
    ? demandes.filter(d => d.statut === "EN_ATTENTE")
    : demandes;

  const handleApprove = async (id: number, valide: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, valide });
      toast({
        title: t('common.success'),
        description: valide ? t('demandesAchat.approved') : t('demandesAchat.rejected'),
      });
      queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
    } catch {
      toast({
        title: t('common.error'),
        description: t('demandesAchat.approve_error'),
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{t('demandesAchat.status_pending')}</Badge>;
      case "VALIDEE":
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('demandesAchat.status_approved')}</Badge>;
      case "REJETEE":
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">{t('demandesAchat.status_rejected')}</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('responsable.demandesAchat.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('responsable.demandesAchat.subtitle')}</p>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row justify-between items-center">
            <CardTitle className="text-primary">{t('responsable.demandesAchat.list_title')}</CardTitle>
            <Button
              variant={showOnlyPending ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className="gap-1"
            >
              <Filter className="h-3 w-3" />
              {showOnlyPending ? t('responsable.demandesAchat.show_all') : t('responsable.demandesAchat.show_pending')}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : filteredDemandes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('responsable.demandesAchat.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.product')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.quantity')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.unit')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.supplier')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.requested_by')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.status')}</th>
                      <th className="text-right p-4 text-sm font-medium text-primary/70">{t('responsable.demandesAchat.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDemandes.map((demande, idx) => (
                      <motion.tr
                        key={demande.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-primary/5 hover:bg-primary/5"
                      >
                        <td className="p-4 font-medium text-primary/90">{demande.produit}</td>
                        <td className="p-4 text-primary/70">{demande.quantite}</td>
                        <td className="p-4 text-primary/70">{demande.uniteMesure}</td>
                        <td className="p-4 text-primary/70">{demande.fournisseurSuggere?.nom || '-'}</td>
                        <td className="p-4 text-primary/70">{demande.demandePar?.name || '-'}</td>
                        <td className="p-4">{getStatutBadge(demande.statut)}</td>
                        <td className="p-4 text-right space-x-2">
                          {demande.statut === "EN_ATTENTE" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(demande.id, true)}
                                className="hover:bg-green-100"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(demande.id, false)}
                                className="hover:bg-red-100"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </td>
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