import { useEffect, useState } from "react";
import {
    useListMatieresPremieres,
    useCreateMatierePremiere,
    useUpdateMatierePremiere,
    useDeleteMatierePremiere,
    useListFournisseurs,
    useGetStockMatiere,
    MatierePremiere,
    useUpdateStockMatiere
} from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, AlertTriangle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function MatieresPremieres() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MatierePremiere | null>(null);
    const [nom, setNom] = useState("");
    const [uniteMesure, setUniteMesure] = useState("");
    const [seuilAlerteBase, setSeuilAlerteBase] = useState("");
    const [uniteBase, setUniteBase] = useState("g");
    const [quantiteBaseParUnite, setQuantiteBaseParUnite] = useState("1");
    const [fournisseurPrefereId, setFournisseurPrefereId] = useState("none");
    const [actif, setActif] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedMatiere, setSelectedMatiere] = useState<MatierePremiere | null>(null);
    const [newStockQty, setNewStockQty] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: stockData, refetch: refetchStock } = useGetStockMatiere(selectedMatiere?.id || 0);
    const updateStockMutation = useUpdateStockMatiere();
    const { data: matieres = [], isLoading } = useListMatieresPremieres();
    const { data: fournisseurs = [] } = useListFournisseurs();
    const createMutation = useCreateMatierePremiere();
    const updateMutation = useUpdateMatierePremiere();
    const deleteMutation = useDeleteMatierePremiere();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [matiereToDelete, setMatiereToDelete] = useState<MatierePremiere | null>(null);
    // Pour chaque matière, on peut récupérer son stock (mais attention à ne pas faire trop de requêtes)
    // On peut soit afficher le stock via un composant séparé, soit le récupérer dans la liste via un endpoint du backend.
    // Ici on ne récupère pas le stock dans la liste pour éviter N appels, mais on pourrait.

    const openNewModal = () => {
        setEditingItem(null);
        setNom("");
        setUniteMesure("");
        setUniteBase("g");
        setQuantiteBaseParUnite("1");
        setSeuilAlerteBase("");
        setFournisseurPrefereId("");
        setActif(true);
        setIsModalOpen(true);
    };
    const openStockModal = (matiere: MatierePremiere) => {
        setSelectedMatiere(matiere);
        setIsStockModalOpen(true);
    };
    const openEditModal = (item: MatierePremiere) => {
        setEditingItem(item);
        setNom(item.nom);
        setUniteMesure(item.uniteMesure);
        setUniteBase(item.uniteBase || "g");
        setQuantiteBaseParUnite(item.quantiteBaseParUnite?.toString() || "1");
        setSeuilAlerteBase(item.seuilAlerteBase?.toString() || "");
        setFournisseurPrefereId(item.fournisseurPrefere?.id?.toString() || "none");
        setActif(item.actif);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (selectedMatiere && stockData) {
            setNewStockQty(stockData.quantiteActuelle.toString());
        }
    }, [selectedMatiere, stockData]);

    const handleUpdateStock = async () => {
        if (!selectedMatiere) return;
        const newQty = parseFloat(newStockQty);
        if (isNaN(newQty)) {
            toast({ variant: "destructive", description: "Quantité invalide" });
            return;
        }
        try {
            await updateStockMutation.mutateAsync({
                matiereId: selectedMatiere.id,
                quantite: newQty,
            });
            toast({ description: "Stock mis à jour" });
            // Rafraîchir la liste (ou simplement refetch le stock)
            queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] });
            queryClient.invalidateQueries({ queryKey: ["stock-matiere", selectedMatiere.id] });
            setIsStockModalOpen(false);
            setSelectedMatiere(null);
        } catch {
            toast({ variant: "destructive", description: "Erreur" });
        }
    };
    const handleSave = async () => {
        if (!nom || !uniteMesure) {
            toast({ title: t('common.error'), description: t('matieresPremieres.validation_required'), variant: "destructive" });
            return;
        }

        const fournisseurData = fournisseurPrefereId && fournisseurPrefereId !== "none"
            ? { id: parseInt(fournisseurPrefereId) }
            : null;

        const conversion = parseFloat(quantiteBaseParUnite || "1");

        const data: any = {
            nom,
            uniteMesure,
            uniteBase: uniteBase || "g",
            quantiteBaseParUnite: Number.isFinite(conversion) && conversion > 0 ? conversion : 1,
            seuilAlerteBase: seuilAlerteBase ? parseFloat(seuilAlerteBase) : null,
            fournisseurPrefere: fournisseurData,
            actif,
        };

        try {
            if (editingItem) {
                await updateMutation.mutateAsync({ id: editingItem.id, data });
                toast({ title: t('common.success'), description: t('matieresPremieres.update_success') });
            } else {
                await createMutation.mutateAsync(data);
                toast({ title: t('common.success'), description: t('matieresPremieres.create_success') });
            }
            queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] });
            setIsModalOpen(false);
        } catch (error) {
            toast({ title: t('common.error'), description: t('matieresPremieres.save_error'), variant: "destructive" });
        }
    };

    const handleDeleteClick = (matiere: MatierePremiere) => {
        setMatiereToDelete(matiere);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!matiereToDelete) return;

        try {
            await deleteMutation.mutateAsync(matiereToDelete.id);
            toast({ title: t('common.success'), description: t('matieresPremieres.delete_success') });
            await queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] });
        } catch (error) {
            toast({ title: t('common.error'), description: t('matieresPremieres.delete_error'), variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setMatiereToDelete(null);
        }
    };

    // Composant pour afficher l'indicateur d'alerte seuil
    const StockIndicator = ({ matiere }: { matiere: MatierePremiere }) => {
        const { data: stock } = useGetStockMatiere(matiere.id);
        const seuil = matiere.seuilAlerteBase || 0;
        const quantite = stock?.quantiteActuelle || 0;
        const isLow = seuil > 0 && quantite <= seuil;

        if (!stock) return <span className="text-primary/50">-</span>;
        return (
            <div className="flex items-center gap-2">
                <span className={isLow ? "text-destructive font-semibold" : "text-primary/80"}>
                    {quantite} {matiere.uniteBase || "g"}
                </span>
                {isLow && (
                    <AlertTriangle className="h-4 w-4 text-destructive" title={t('matieresPremieres.stock_alert')} />
                )}
            </div>
        );
    };

    return (
        <ADMINLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {t('matieresPremieres.title')}
                        </h1>
                        <p className="text-primary/60 text-sm mt-1">{t('matieresPremieres.subtitle')}</p>
                    </div>
                    <Button onClick={openNewModal} className="gap-2 shadow-md">
                        <Plus className="h-4 w-4" /> {t('matieresPremieres.add_button')}
                    </Button>
                </div>

                <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-primary">{t('matieresPremieres.list_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.name')}</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.unit')}</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.stock')}</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.threshold')}</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.preferred_supplier')}</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.status')}</th>
                                        <th className="text-right p-4 text-sm font-medium text-primary/70">{t('matieresPremieres.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="text-center py-12">{t('common.loading')}</td></tr>
                                    ) : matieres.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12">{t('matieresPremieres.empty')}</td></tr>
                                    ) : (
                                        <AnimatePresence>
                                            {matieres.map((item, idx) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="border-b border-primary/5 hover:bg-primary/5"
                                                >
                                                    <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                                                        <Package className="h-5 w-5 text-primary" /> {item.nom}
                                                    </td>
                                                    <td className="p-4 text-primary/70">
                                                        <div>{item.uniteMesure}</div>
                                                        <div className="text-xs text-primary/50">
                                                            1 {item.uniteMesure} = {item.quantiteBaseParUnite || 1} {item.uniteBase || "g"}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <StockIndicator matiere={item} />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openStockModal(item)}
                                                                className="h-6 w-6"
                                                            >
                                                                <Settings className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-primary/70">
                                                        {item.seuilAlerteBase ? `${item.seuilAlerteBase} ${item.uniteBase || "g"}` : "-"}
                                                    </td>
                                                    <td className="p-4 text-primary/70">{item.fournisseurPrefere?.nom || '-'}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {item.actif ? t('common.active') : t('common.inactive')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="hover:bg-primary/10">
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)} className="hover:bg-destructive/10">
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
                    <DialogContent
                        className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl"
                        style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-primary">{editingItem ? t('matieresPremieres.edit_title') : t('matieresPremieres.add_title')}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>{t('matieresPremieres.name')}</Label>
                                <Input value={nom} onChange={(e) => setNom(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>{t("matieresPremieres.purchase_unit")}</Label>
                                    <Input
                                        value={uniteMesure}
                                        onChange={(e) => setUniteMesure(e.target.value)}
                                        placeholder={t("matieresPremieres.purchase_unit_placeholder")}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('matieresPremieres.unitdeca')}</Label>
                                    <Select value={uniteBase} onValueChange={setUniteBase}>
                                        <SelectTrigger className="bg-card">
                                            <SelectValue placeholder={t('matieresPremieres.unitdeca_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card">
                                            <SelectItem value="g">g</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                            <SelectItem value="piece">piece</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('matieresPremieres.quantity_in_purchase_unit')}</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={quantiteBaseParUnite}
                                    onChange={(e) => setQuantiteBaseParUnite(e.target.value)}
                                    placeholder={t('matieresPremieres.quantity_placeholder')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>{t("matieresPremieres.threshold_base", { unit: uniteBase })}</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={seuilAlerteBase}
                                    onChange={(e) => setSeuilAlerteBase(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('matieresPremieres.preferred_supplier')}</Label>
                                <Select value={fournisseurPrefereId} onValueChange={setFournisseurPrefereId}>
                                    <SelectTrigger className="bg-card">
                                        <SelectValue placeholder={t('matieresPremieres.select_supplier')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card">
                                        <SelectItem value="none">{t('common.none')}</SelectItem>
                                        {fournisseurs.map(f => (
                                            <SelectItem key={f.id} value={f.id.toString()}>{f.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox checked={actif} onCheckedChange={(val) => setActif(!!val)} />
                                <Label>{t('common.active')}</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleSave}>{editingItem ? t('common.save') : t('common.create')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>{t("matieresPremieres.edit_stock")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>{t("matieresPremieres.matiere")}</Label>
                                <Input value={selectedMatiere?.nom} disabled />
                            </div>
                            <div>
                                <Label>{t("matieresPremieres.new_quantity", { unit: selectedMatiere?.uniteBase || "g" })}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newStockQty}
                                    onChange={(e) => setNewStockQty(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>
                                {t("common.cancel")}
                            </Button>
                            <Button onClick={handleUpdateStock} disabled={updateStockMutation.isPending}>
                                {updateStockMutation.isPending ? t("common.updating") : t("common.save")}
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
                                {t("matieresPremieres.confirm_delete")}
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-primary/80">
                            {t("matieresPremieres.delete_confirmation", { name: matiereToDelete?.nom })}
                        </p>

                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setMatiereToDelete(null);
                                }}
                            >
                                {t('common.cancel')}
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? t('common.loading') : t('matieresPremieres.delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ADMINLayout>
    );
}