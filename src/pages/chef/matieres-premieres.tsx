import { useListMatieresPremieres, useGetStockMatiere } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChefMatieresPremieres() {
  const { t } = useTranslation();
  const { data: matieres = [], isLoading } = useListMatieresPremieres();

  // Composant d'affichage du stock
  const StockInfo = ({ matiereId, seuil, unite }: { matiereId: number; seuil: number; unite: string }) => {
    const { data: stock } = useGetStockMatiere(matiereId);
    if (!stock) return <span className="text-muted-foreground">...</span>;
    const isLow = stock.quantiteActuelle <= seuil;
    return (
      <span className={isLow ? "text-destructive font-medium flex items-center gap-1" : ""}>
        {isLow && <AlertTriangle className="h-3 w-3" />}
        {stock.quantiteActuelle} {unite}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-primary">{t('chef.matieresPremieres.title')}</h1>
        <Card className="border-primary/10 shadow-md rounded-2xl">
          <CardHeader className="bg-primary/5">
            <CardTitle>{t('chef.matieresPremieres.list_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">{t('common.loading')}</div>
            ) : matieres.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('chef.matieresPremieres.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">Nom</th>
                      <th className="p-4 text-left">Unité</th>
                      <th className="p-4 text-left">Stock actuel</th>
                      <th className="p-4 text-left">Seuil d'alerte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matieres.map((m) => (
                      <tr key={m.id} className="border-b">
                        <td className="p-4">{m.nom}</td>
                        <td className="p-4">{m.uniteMesure}</td>
                        <td className="p-4">
                          <StockInfo matiereId={m.id} seuil={m.seuilAlerte} unite={m.uniteMesure} />
                        </td>
                        <td className="p-4">{m.seuilAlerte} {m.uniteMesure}</td>
                      </tr>
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