// src/pages/chef/dashboard.tsx
import { useListDemandesAchat, useListMatieresPremieres, useGetStockMatiere } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle, Package, Eye } from "lucide-react";

export default function ChefDashboard() {
  const { t } = useTranslation();
  const { data: demandes = [], isLoading: loadingDemandes } = useListDemandesAchat();
  const { data: matieres = [], isLoading: loadingMatieres } = useListMatieresPremieres();

  const demandesEnAttente = demandes.filter(d => d.statut === "EN_ATTENTE");

  // Correction : on filtre les matières avec seuil > 0
  const matieresAlerte = matieres.filter(m => m.seuilAlerte && m.seuilAlerte > 0);

  // Composant StockAlert corrigé : on passe l'unité de mesure en prop
  const StockAlert = ({ matiereId, seuil, uniteMesure }: { matiereId: number; seuil: number; uniteMesure: string }) => {
    const { data: stock, isLoading } = useGetStockMatiere(matiereId);
    if (isLoading || !stock) return <span className="text-muted-foreground">...</span>;
    const isLow = stock.quantiteActuelle <= seuil;
    return (
      <div className="flex items-center gap-2">
        {isLow ? (
          <span className="text-destructive font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {stock.quantiteActuelle} {uniteMesure}
          </span>
        ) : (
          <span className="text-muted-foreground">{stock.quantiteActuelle} {uniteMesure}</span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('chef.dashboard.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('chef.dashboard.subtitle')}</p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('chef.dashboard.pending_requests')}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{demandesEnAttente.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {demandesEnAttente.length === 0 ? t('chef.dashboard.no_pending') : t('chef.dashboard.need_action')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('chef.dashboard.low_stock_alerts')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{matieresAlerte.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('chef.dashboard.check_stock')}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">{t('chef.dashboard.total_products')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{matieres.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('chef.dashboard.raw_materials_count')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes d'achat en attente */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('chef.dashboard.pending_requests_list')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDemandes ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : demandesEnAttente.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('chef.dashboard.no_pending_requests')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.product')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.quantity')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.supplier')}</th>
                      <th className="text-right p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.view')}</th>
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
                        <td className="p-4 text-right">
                          <Link href="/chef/demandes-achat">
                            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des matières premières avec alerte stock bas */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('chef.dashboard.low_stock_items')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMatieres ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : matieresAlerte.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('chef.dashboard.no_low_stock')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.product')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.current_stock')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.dashboard.threshold')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matieresAlerte.slice(0, 5).map((matiere) => (
                      <motion.tr
                        key={matiere.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-primary/5 hover:bg-primary/5"
                      >
                        <td className="p-4 font-medium text-primary/90">{matiere.nom}</td>
                        <td className="p-4">
                          <StockAlert
                            matiereId={matiere.id}
                            seuil={matiere.seuilAlerte}
                            uniteMesure={matiere.uniteMesure}
                          />
                        </td>
                        <td className="p-4 text-primary/70">{matiere.seuilAlerte} {matiere.uniteMesure}</td>
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