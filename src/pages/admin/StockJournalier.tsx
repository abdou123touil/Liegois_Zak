import { useState } from "react";
import {
  useListProducts,
  useListStockJournalier,
  useCreateStockJournalier,
  StockJournalier as StockJournalierType,
} from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function StockJournalier() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStock, setSelectedStock] = useState<StockJournalierType | null>(null);
  const [stockRows, setStockRows] = useState<Array<{
    productId: string;
    quantiteProduite: string;
  }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStock, setEditingStock] = useState<StockJournalierType | null>(null);

  const { data: stocks = [], isLoading } = useListStockJournalier();
  const { data: products = [] } = useListProducts({});
  const createMutation = useCreateStockJournalier();

  const openNewModal = () => {
    setEditingStock(null);
    setDate(new Date().toISOString().split("T")[0]);

    const latestStock = stocks[0];

    const latestRows = latestStock?.lignes?.length
      ? latestStock.lignes.map((ligne) => ({
        productId: ligne.productId?.toString() || "",
        quantiteProduite: ligne.quantiteProduite?.toString() || "",
      }))
      : [{ productId: "", quantiteProduite: "" }];

    setStockRows(latestRows);
    setIsModalOpen(true);
  };

  const addRow = () => {
    setStockRows([...stockRows, { productId: "", quantiteProduite: "" }]);
  };

  const removeRow = (index: number) => {
    setStockRows(stockRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: "productId" | "quantiteProduite", value: string) => {
    setStockRows(rows =>
      rows.map((row, i) => i === index ? { ...row, [field]: value } : row)
    );
  };
  const openEditModal = (stock: StockJournalierType) => {
    setEditingStock(stock);
    setSelectedStock(null);
    setDate(stock.date);

    setStockRows(
      stock.lignes?.length
        ? stock.lignes.map((ligne) => ({
          productId: ligne.productId?.toString() || "",
          quantiteProduite: ligne.quantiteProduite?.toString() || "",
        }))
        : [{ productId: "", quantiteProduite: "" }]
    );

    setIsModalOpen(true);
  };
  const handleSave = async () => {
    const validRows = stockRows.filter(row => row.productId && row.quantiteProduite);

    if (validRows.length === 0) {
      toast({
        title: t("common.error"),
        description: t("stockJournalier.validation_required"),
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        date,
        lignes: validRows.map(row => ({
          productId: parseInt(row.productId),
          quantiteProduite: parseInt(row.quantiteProduite),
          quantitePerdue: 0,
        })),
      });

      toast({ title: t("common.success"), description: t("stockJournalier.create_success") });
      await queryClient.invalidateQueries({ queryKey: ["stock-journalier"] });
      setIsModalOpen(false);
      setEditingStock(null);
    } catch {
      toast({
        title: t("common.error"),
        description: t("stockJournalier.save_error"),
        variant: "destructive",
      });
    }
  };

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('stockJournalier.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('stockJournalier.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('stockJournalier.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('stockJournalier.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.product')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.date')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.produced')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.sold')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.unsold')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('stockJournalier.table.lost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : stocks.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('stockJournalier.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {stocks.map((stock, idx) => {
                        const totalProduite = stock.lignes?.reduce(
                          (sum, ligne) => sum + (ligne.quantiteProduite ?? 0),
                          0
                        ) ?? 0;

                        const totalVendue = stock.lignes?.reduce(
                          (sum, ligne) => sum + (ligne.quantiteVendue ?? 0),
                          0
                        ) ?? 0;

                        const totalInvendue = stock.lignes?.reduce(
                          (sum, ligne) => sum + (ligne.quantiteInvendue ?? 0),
                          0
                        ) ?? 0;

                        const totalPerdue = stock.lignes?.reduce(
                          (sum, ligne) => sum + (ligne.quantitePerdue ?? 0),
                          0
                        ) ?? 0;

                        return (
                          <motion.tr
                            key={stock.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setSelectedStock(stock)}
                            className="border-b border-primary/5 hover:bg-primary/5"
                          >
                            <td className="p-4 font-medium text-primary/90">
                              {stock.lignes?.length ?? 0} produits
                            </td>
                            <td className="p-4 text-primary/70">
                              {new Date(stock.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-primary/70">{totalProduite}</td>
                            <td className="p-4 text-primary/70">{totalVendue}</td>
                            <td className="p-4 text-primary/70">{totalInvendue}</td>
                            <td className="p-4 text-primary/70">{totalPerdue}</td>
                          </motion.tr>
                        );
                      })}
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
              <DialogTitle className="text-primary">
                {editingStock ? "Modifier le stock journalier" : t("stockJournalier.add_title")}
              </DialogTitle>            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("stockJournalier.date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="space-y-3">
                {stockRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2 items-end">
                    <div className="grid gap-2">
                      <Label>{t("stockJournalier.product")}</Label>
                      <Select value={row.productId} onValueChange={(value) => updateRow(index, "productId", value)}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder={t("stockJournalier.select_product")} />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>{t("stockJournalier.produced")}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={row.quantiteProduite}
                        onChange={(e) => updateRow(index, "quantiteProduite", e.target.value)}
                      />
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>
                {editingStock ? "Mettre à jour" : t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!selectedStock} onOpenChange={(open) => !open && setSelectedStock(null)}>
          <DialogContent
            className="sm:max-w-[700px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: "hsl(var(--card))", backdropFilter: "none" }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">
                Détails du stock -{" "}
                {selectedStock ? new Date(selectedStock.date).toLocaleDateString() : ""}
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-primary/70">Produit</th>
                    <th className="text-left p-3 text-sm font-medium text-primary/70">Produite</th>
                    <th className="text-left p-3 text-sm font-medium text-primary/70">Vendue</th>
                    <th className="text-left p-3 text-sm font-medium text-primary/70">Invendue</th>
                    <th className="text-left p-3 text-sm font-medium text-primary/70">Perdue</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedStock?.lignes?.length ? (
                    selectedStock.lignes.map((ligne) => (
                      <tr key={ligne.id ?? ligne.productId} className="border-b border-primary/5">
                        <td className="p-3 font-medium text-primary/90">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            {ligne.productName || "Produit inconnu"}
                          </div>
                        </td>
                        <td className="p-3 text-primary/70">{ligne.quantiteProduite ?? 0}</td>
                        <td className="p-3 text-primary/70">{ligne.quantiteVendue ?? 0}</td>
                        <td className="p-3 text-primary/70">{ligne.quantiteInvendue ?? 0}</td>
                        <td className="p-3 text-primary/70">{ligne.quantitePerdue ?? 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aucun produit
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedStock(null)}>
                Fermer
              </Button>
              <Button onClick={() => selectedStock && openEditModal(selectedStock)}>
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}