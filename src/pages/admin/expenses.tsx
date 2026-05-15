import { useState, useRef } from "react";
import { useListExpenses, useCreateExpense, useDeleteExpense, Expense } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Expenses() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useListExpenses();
  const createMutation = useCreateExpense();
  const deleteMutation = useDeleteExpense();

  // Référence pour empêcher le défilement du fond (optionnel)
  const inputRef = useRef<HTMLInputElement>(null);

  const expenseCategories = [
    { value: "rent", label: t('expenses.categories.rent') },
    { value: "utilities", label: t('expenses.categories.utilities') },
    { value: "salary", label: t('expenses.categories.salary') },
    { value: "ingredients", label: t('expenses.categories.ingredients') },
    { value: "packaging", label: t('expenses.categories.packaging') },
    { value: "maintenance", label: t('expenses.categories.maintenance') },
    { value: "marketing", label: t('expenses.categories.marketing') },
    { value: "other", label: t('expenses.categories.other') },
  ];

  const handleSave = async () => {
    if (!label || !amount || !category) {
      toast({ title: t('common.error'), description: t('expenses.validation_required'), variant: "destructive" });
      return;
    }

    const expenseData = {
      label,
      amount: parseFloat(amount),
      category,
      notes,
      date,
    };

    try {
      await createMutation.mutateAsync({ data: expenseData });
      toast({ title: t('common.success'), description: t('expenses.create_success') });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: t('common.error'), description: t('expenses.save_error'), variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('expenses.confirm_delete'))) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: t('common.success'), description: t('expenses.delete_success') });
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      } catch (error) {
        toast({ title: t('common.error'), description: t('expenses.delete_error'), variant: "destructive" });
      }
    }
  };

  const resetForm = () => {
    setLabel("");
    setAmount("");
    setCategory("");
    setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(val);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('expenses.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('expenses.subtitle')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('expenses.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('expenses.history_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('expenses.table.label')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('expenses.table.category')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('expenses.table.amount')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('expenses.table.date')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('expenses.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : expenses?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12">{t('expenses.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {expenses?.map((exp, idx) => (
                        <motion.tr
                          key={exp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary/50" /> {exp.label}
                          </td>
                          <td className="p-4 text-primary/70">{exp.category}</td>
                          <td className="p-4 font-semibold text-destructive">{formatCurrency(exp.amount)}</td>
                          <td className="p-4 text-primary/70">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {/* On ajoute `modal={true}` et on ajuste la hauteur */}
         <DialogContent
  onOpenAutoFocus={(e) => e.preventDefault()}  className="sm:max-w-[500px] w-[95vw] rounded-2xl border border-border shadow-2xl bg-card p-0 overflow-hidden fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" style={{maxHeight: "90dvh",}}>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-primary">{t('expenses.add_title')}</DialogTitle>
            </DialogHeader>
            <div
              className="flex-1 overflow-y-auto px-6 py-2 space-y-4 overscroll-contain " onClick={() => inputRef.current?.focus()}
            >
              <div className="grid gap-2">
                <Label htmlFor="label">{t('expenses.label_label')}</Label>
                <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus={false} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('expenses.amount_label')}</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) setAmount(val);
                    }}
                    autoFocus={false}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">{t('expenses.category_label')}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder={t('expenses.select_category')} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">{t('expenses.date_label')}</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t('expenses.notes_label')}</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>

  );
}