import { useListDemandesAchat, useApproveDemandeAchat } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

export default function ChefDemandesAchat() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: demandes = [], isLoading } = useListDemandesAchat();
  const approveMutation = useApproveDemandeAchat();

  const demandesEnAttente = demandes.filter(d => d.statut === "EN_ATTENTE");

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
      case "EN_ATTENTE": return <Badge variant="outline" className="bg-amber-100 text-amber-700">En attente</Badge>;
      case "VALIDEE": return <Badge variant="outline" className="bg-green-100 text-green-700">Validée</Badge>;
      case "REJETEE": return <Badge variant="outline" className="bg-red-100 text-red-700">Rejetée</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-primary">{t('chef.demandesAchat.title')}</h1>
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle>{t('chef.demandesAchat.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">{t('common.loading')}</div>
            ) : demandesEnAttente.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('chef.demandesAchat.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">Produit</th>
                      <th className="p-4 text-left">Quantité</th>
                      <th className="p-4 text-left">Fournisseur</th>
                      <th className="p-4 text-left">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandesEnAttente.map((demande) => (
                      <motion.tr key={demande.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-b">
                        <td className="p-4">{demande.produit}</td>
                        <td className="p-4">{demande.quantite} {demande.uniteMesure}</td>
                        <td className="p-4">{demande.fournisseurSuggere?.nom || '-'}</td>
                        <td className="p-4">{getStatutBadge(demande.statut)}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => handleApprove(demande.id, true)} className="hover:bg-green-100">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleApprove(demande.id, false)} className="hover:bg-red-100">
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
      </div>
    </DashboardLayout>
  );
}