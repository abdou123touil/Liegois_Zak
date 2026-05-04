import { useState } from "react";
import { useListProducts, useListStockJournalier, useCreateStockJournalier } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/ADMINLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function StockJournalier() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantiteProduite, setQuantiteProduite] = useState("");
  const [quantitePerdue, setQuantitePerdue] = useState("0");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stocks = [], isLoading } = useListStockJournalier();
  const { data: products = [] } = useListProducts({});
  const createMutation = useCreateStockJournalier();

  const openNewModal = () => {
    setProductId("");
    setDate(new Date().toISOString().split('T')[0]);
    setQuantiteProduite("");
    setQuantitePerdue("0");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!productId || !quantiteProduite) {
      toast({ title: t('common.error'), description: t('stockJournalier.validation_required'), variant: "destructive" });
      return;
    }

    const data = {
      product: { id: parseInt(productId) },
      date,
      quantiteProduite: parseInt(quantiteProduite),
      quantitePerdue: quantitePerdue ? parseInt(quantitePerdue) : 0,
    };

    try {
      await createMutation.mutateAsync(data);
      toast({ title: t('common.success'), description: t('stockJournalier.create_success') });
      queryClient.invalidateQueries({ queryKey: ["stock-journalier"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('stockJournalier.save_error'), variant: "destructive" });
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
                      {stocks.map((stock, idx) => (
                        <motion.tr
                          key={stock.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" /> {stock.product?.name}
                           </td>
                          <td className="p-4 text-primary/70">{new Date(stock.date).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{stock.quantiteProduite}</td>
                          <td className="p-4 text-primary/70">{stock.quantiteVendue ?? 0}</td>
                          <td className="p-4 text-primary/70">{stock.quantiteInvendue ?? 0}</td>
                          <td className="p-4 text-primary/70">{stock.quantitePerdue ?? 0}</td>
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
              <DialogTitle className="text-primary">{t('stockJournalier.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('stockJournalier.product')}</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="bg-card" >
                    <SelectValue placeholder={t('stockJournalier.select_product')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('stockJournalier.date')}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('stockJournalier.produced')}</Label>
                <Input type="number" min="0" value={quantiteProduite} onChange={(e) => setQuantiteProduite(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('stockJournalier.lost')}</Label>
                <Input type="number" min="0" value={quantitePerdue} onChange={(e) => setQuantitePerdue(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}