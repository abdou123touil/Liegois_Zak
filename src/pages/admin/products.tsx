import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListCategories, Product } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, ArrowUpDown, Search, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Products() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useListProducts({});
  const { data: categories } = useListCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "categoryName" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Fonction pour déterminer si un produit est actif
  const getProductIsActive = (product: Product) => {
    return Boolean((product as any).isActive ?? (product as any).active);
  };
onst filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let compareA: any, compareB: any;
      switch (sortBy) {
        case "name":
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case "price":
          compareA = a.price;
          compareB = b.price;
          break;
        case "categoryName":
          compareA = (a.categoryName || "").toLowerCase();
          compareB = (b.categoryName || "").toLowerCase();
          break;
        case "status":
          compareA = getProductIsActive(a);
          compareB = getProductIsActive(b);
          break;
        default:
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
      }
      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, sortBy, sortOrder]);
  const openNewModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategoryId("");
    setImageUrl("");
    setDescription("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategoryId(product.categoryId.toString());
    setImageUrl(product.imageUrl || "");
    setDescription(product.description || "");
    setIsActive(getProductIsActive(product));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || !categoryId) {
      toast({ title: t('common.error'), description: t('products.validation_required'), variant: "destructive" });
      return;
    }

    const productData = {
      name,
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      imageUrl: imageUrl || undefined,
      description: description || undefined,
      isActive,
    };
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data: productData });
        toast({ title: t('common.success'), description: t('products.update_success') });
      } else {
        await createMutation.mutateAsync({ data: productData });
        toast({ title: t('common.success'), description: t('products.create_success') });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('products.save_error'), variant: "destructive" });
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: productToDelete.id });
      toast({ title: t('common.success'), description: t('products.delete_success') });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast({ title: t('common.error'), description: t('products.delete_error'), variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(val);
  };
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('products.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('products.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md hover:shadow-lg transition-all">
            <Plus className="h-4 w-4" /> {t('products.add_button')}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('products.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-40 rounded-xl border-primary/20">
                <SelectValue placeholder={t('products.sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t('products.sort_by_name')}</SelectItem>
                <SelectItem value="price">{t('products.sort_by_price')}</SelectItem>
                <SelectItem value="categoryName">{t('products.sort_by_category')}</SelectItem>
                <SelectItem value="status">{t('products.sort_by_status')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              className="border-primary/20 rounded-xl"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-1">
              {sortOrder === "asc" ? t('common.ascending') : t('common.descending')}
            </span>
          </div>
        </div>
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">
              {t('products.all_title')}
              {searchTerm && ` • ${filteredAndSortedProducts.length} résultat(s)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('products.table.image')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('products.table.name')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('products.table.category')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('products.table.price')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('products.table.status')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('products.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('common.loading')}...</td></tr>
                  ) : filteredAndSortedProducts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                      {searchTerm ? t('products.no_results') : t('products.empty')}
                    </td></tr>
                  ) : (
                    <AnimatePresence>
                      {filteredAndSortedProducts.map((product, idx) => {
                        const productActive = getProductIsActive(product);
                        return (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-primary/5 hover:bg-primary/5 transition"
                          >
                            <td className="p-4">
                              {product.imageUrl ? (
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shadow-sm">
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-medium text-primary/90">{product.name}</td>
                            <td className="p-4 text-primary/70">{product.categoryName || t('common.unknown')}</td>
                            <td className="p-4 font-semibold text-primary">{formatCurrency(product.price)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${productActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {productActive ? t('products.status_active') : t('products.status_inactive')}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(product)} className="hover:bg-primary/10">
                                <Edit className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)} className="hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
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
              <DialogTitle className="text-primary">{editingProduct ? t('products.edit_title') : t('products.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('products.name_label')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border-primary/20 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">{t('products.price_label')}</Label>
                  <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">{t('products.category_label')}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="rounded-lg border-primary/20 bg-card">
                      <SelectValue placeholder={t('products.select_category')} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">{t('products.image_url_label')}</Label>
                <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t('products.description_label')}</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg" />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox id="isActive" checked={isActive} onCheckedChange={(c) => setIsActive(c as boolean)} />
                <Label htmlFor="isActive" className="font-normal cursor-pointer text-primary/80">{t('products.active_label')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? t('common.save') : t('common.create')}
              </Button>
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
              Voulez-vous vraiment supprimer le produit{" "}
              <strong>{productToDelete?.name}</strong> ? Cette action est irréversible.
            </p>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setProductToDelete(null); }}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t('common.loading') : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}