import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@radix-ui/react-checkbox";

export default function Categories() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#10b981");
  const [isActive, setisActive] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { data: categories, isLoading } = useListCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const openNewModal = () => {
    setEditingCategory(null);
    setName("");
    setIcon("🍞");
    setColor("#10b981");
    setisActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setisActive(category.isActive);

    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !icon) {
      toast({ title: t('common.error'), description: t('categories.validation_name_icon_required'), variant: "destructive" });
      return;
    }

    const categoryData = { name, icon, color, isActive };

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: categoryData });
        toast({ title: t('common.success'), description: t('categories.update_success') });
      } else {
        await createMutation.mutateAsync({ data: categoryData });
        toast({ title: t('common.success'), description: t('categories.create_success') });
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('categories.save_error'), variant: "destructive" });
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: categoryToDelete.id });
      toast({ title: t('common.success'), description: t('categories.delete_success') });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      toast({ title: t('common.error'), description: t('categories.delete_error'), variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('categories.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('categories.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('categories.add_button')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">{t('common.loading')}</div>
            ) : categories?.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">{t('categories.empty')}</div>
            ) : (
              categories?.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-card rounded-2xl border border-primary/10 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        {cat.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary/90">{cat.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs text-muted-foreground">{cat.color}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(cat)} className="hover:bg-primary/10">
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(cat)} className="hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">{editingCategory ? t('categories.edit_title') : t('categories.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('categories.name_label')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icon">{t('categories.icon_label')}</Label>
                <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍞" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">{t('categories.color_label')}</Label>
                <div className="flex gap-2">
                  <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#10b981" className="rounded-lg" />
                  <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: color }} />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="isActive" checked={isActive} onCheckedChange={(c) => setisActive(c as boolean)} />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer text-primary/80">{t('products.active_label')}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{editingCategory ? t('common.save') : t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent
            className="sm:max-w-[400px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-destructive">
                Confirmer la suppression
              </DialogTitle>
            </DialogHeader>

            <p className="text-primary/80">
              Voulez-vous vraiment supprimer la catégorie{" "}
              <strong>{categoryToDelete?.name}</strong> ? Cette action est irréversible.
            </p>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                {t('common.cancel')}
              </Button>

              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t('common.loading') : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}