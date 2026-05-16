import { useState} from "react";
import { useListEmployees, useListFichesPaieByEmployee, useDownloadFichePaie, useGenerateFichePaie} from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Download} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export default function FichesPaie() {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState<string>("");
  const [mois, setMois] = useState<string>((new Date().getMonth() + 1).toString());
  const [annee, setAnnee] = useState<string>(new Date().getFullYear().toString());


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useListEmployees();
  const { data: fiches = [], isLoading, refetch } = useListFichesPaieByEmployee(employeeId ? parseInt(employeeId) : undefined);
  const generateMutation = useGenerateFichePaie();
  const downloadMutation = useDownloadFichePaie();

  // Charger les paramètres par défaut dès qu’ils sont disponibles


const handleGenerate = async () => {
  if (!employeeId) {
    toast({
      title: t("common.error"),
      description: "Veuillez sélectionner un employé",
      variant: "destructive",
    });
    return;
  }

  try {
    await generateMutation.mutateAsync({
      employeeId: parseInt(employeeId),
      mois: parseInt(mois),
      annee: parseInt(annee),
    });

    toast({ title: t("common.success"), description: t("fichesPaie.generate_success") });
    await queryClient.invalidateQueries({ queryKey: ["fiches-paie", parseInt(employeeId)] });
    refetch();
  } catch {
    toast({ title: t("common.error"), description: t("fichesPaie.generate_error"), variant: "destructive" });
  }
};

  const isGenerateDisabled = !employeeId  || generateMutation.isPending;

  const handleDownload = async (ficheId: number) => {
    try {
      await downloadMutation.mutateAsync(ficheId);
      toast({ title: t('common.success'), description: t('fichesPaie.download_success') });
    } catch {
      toast({ title: t('common.error'), description: t('fichesPaie.download_error'), variant: "destructive" });
    }
  };

  const getMonthName = (month: number) => format(new Date(2000, month - 1, 1), 'MMMM');


  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('fichesPaie.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('fichesPaie.subtitle')}</p>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">Générer une fiche</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-56">
                <label className="text-sm font-medium text-primary/70 mb-1 block">Employé</label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {employees.map(e => (<SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="text-sm font-medium text-primary/70 mb-1 block">Mois</label>
                <Select value={mois} onValueChange={setMois}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <label className="text-sm font-medium text-primary/70 mb-1 block">Année</label>
                <Select value={annee} onValueChange={setAnnee}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {[2024, 2025, 2026].map(a => (<SelectItem key={a} value={a.toString()}>{a}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        
            <div className="mt-6">
              <Button onClick={handleGenerate} disabled={isGenerateDisabled} className="gap-2">
                <FileText className="h-4 w-4" />
                {generateMutation.isPending ? "Génération..." : "Générer la fiche"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {employeeId && (
          <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-primary">Historique des fiches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">Période</th>
                      <th className="p-4 text-left">Salaire base</th>
                      <th className="p-4 text-left">Congés payés</th>
                      <th className="p-4 text-left">Congés non payés</th>
                      <th className="p-4 text-left">Net</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6} className="text-center py-12">Chargement...</td></tr>
                    ) : fiches.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12">Aucune fiche</td></tr>
                    ) : (
                      <AnimatePresence>
                        {fiches.map((fiche, idx) => (
                          <motion.tr key={fiche.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="border-b">
                            <td className="p-4 font-medium">{getMonthName(fiche.mois)} {fiche.annee}</td>
                            <td className="p-4">{fiche.salaireBase?.toFixed(3) ?? '-'} TND</td>
                            <td className="p-4">{fiche.joursCongePayes ?? 0}</td>
                            <td className="p-4">{fiche.joursCongeNonPayes ?? 0}</td>
                            <td className="p-4 font-bold text-primary">{fiche.salaireNet.toFixed(3)} TND</td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDownload(fiche.id)}>
                                <Download className="h-4 w-4 text-primary" />
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
        )}
      </div>
    </ADMINLayout>
  );
}