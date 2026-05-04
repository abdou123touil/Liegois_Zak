import { useListDemandesAchat, useApproveDemandeAchat } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function DemandesAchat() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: demandes = [], isLoading } = useListDemandesAchat();
  const approveMutation = useApproveDemandeAchat();

  const handleApprove = async (id: number, valide: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, valide });
      toast({ title: t('common.success'), description: valide ? t('demandesAchat.approved') : t('demandesAchat.rejected') });
      queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
    } catch {
      toast({ title: t('common.error'), description: t('demandesAchat.approve_error'), variant: "destructive" });
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">En attente</span>;
      case "VALIDEE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Validée</span>;
      case "REJETEE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejetée</span>;
      default: return statut;
    }
  };

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('demandesAchat.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('demandesAchat.subtitle')}</p>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('demandesAchat.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.product')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.quantity')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.unit')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.supplier')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.urgent')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.status')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('demandesAchat.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : demandes.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12">{t('demandesAchat.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {demandes.map((demande, idx) => (
                        <motion.tr
                          key={demande.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" /> {demande.produit}
                          </td>
                          <td className="p-4 text-primary/70">{demande.quantite} {demande.uniteMesure}</td>
                          <td className="p-4 text-primary/70">{demande.uniteMesure}</td>
                          <td className="p-4 text-primary/70">{demande.fournisseurSuggere?.nom || '-'}</td>
                          <td className="p-4">{demande.urgence ? <span className="text-destructive font-bold">Oui</span> : "Non"}</td>
                          <td className="p-4">{getStatutBadge(demande.statut)}</td>
                          <td className="p-4 text-right space-x-2">
                            {demande.statut === "EN_ATTENTE" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(demande.id, true)} className="hover:bg-green-100">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(demande.id, false)} className="hover:bg-red-100">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
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
      </div>
    </ADMINLayout>
  );
}