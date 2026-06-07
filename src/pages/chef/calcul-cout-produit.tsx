import { useMemo, useState } from "react";
import {
    useListMatieresPremieres,
    useCalculerCoutProduit,
    useListHistoriqueCoutProduits,
    MatierePremiere,
} from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plus, Trash2, Package, Wheat, Loader2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface IngredientLine {
    id: string;
    matierePremiereId: string;
    quantiteBase: string;
}

export default function ChefCalculCoutProduit() {
    const { toast } = useToast();
    const { data: matieres = [], isLoading } = useListMatieresPremieres();
    const calculMutation = useCalculerCoutProduit();
    const { data: historique = [] } = useListHistoriqueCoutProduits();
    const [nomProduit, setNomProduit] = useState("");
    const [nombrePieces, setNombrePieces] = useState("1");
    const [ingredients, setIngredients] = useState<IngredientLine[]>([
        { id: crypto.randomUUID(), matierePremiereId: "", quantiteBase: "" },
    ]);

    const selectedIds = useMemo(
        () => ingredients.map((item) => item.matierePremiereId).filter(Boolean),
        [ingredients]
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("fr-TN", {
            style: "currency",
            currency: "TND",
            minimumFractionDigits: 3,
        }).format(value || 0);
    };

    const getMatiere = (id: string) => {
        return matieres.find((m) => m.id.toString() === id) as MatierePremiere | undefined;
    };

    const addIngredient = () => {
        setIngredients((prev) => [
            ...prev,
            { id: crypto.randomUUID(), matierePremiereId: "", quantiteBase: "" },
        ]);
    };

    const removeIngredient = (id: string) => {
        setIngredients((prev) => {
            if (prev.length === 1) {
                return [{ id: crypto.randomUUID(), matierePremiereId: "", quantiteBase: "" }];
            }
            return prev.filter((item) => item.id !== id);
        });
    };

    const updateIngredient = (id: string, field: keyof IngredientLine, value: string) => {
        setIngredients((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleCalculate = async () => {
        if (!nomProduit.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez saisir le nom du produit.",
                variant: "destructive",
            });
            return;
        }

        const pieces = parseInt(nombrePieces || "1");
        if (!pieces || pieces <= 0) {
            toast({
                title: "Erreur",
                description: "Le nombre de pièces doit être supérieur à 0.",
                variant: "destructive",
            });
            return;
        }

        const validIngredients = ingredients
            .filter((item) => item.matierePremiereId && parseFloat(item.quantiteBase) > 0)
            .map((item) => ({
                matierePremiereId: parseInt(item.matierePremiereId),
                quantiteBase: parseFloat(item.quantiteBase),
            }));

        if (validIngredients.length === 0) {
            toast({
                title: "Erreur",
                description: "Veuillez ajouter au moins un ingrédient.",
                variant: "destructive",
            });
            return;
        }

        try {
            await calculMutation.mutateAsync({
                nomProduit,
                nombrePieces: pieces,
                ingredients: validIngredients,
            });
        } catch {
            toast({
                title: "Erreur",
                description: "Impossible de calculer le prix initial. Vérifiez que chaque matière a au moins un achat.",
                variant: "destructive",
            });
        }
    };

    const result = calculMutation.data;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Calcul prix initial
                        </h1>
                        <p className="text-primary/60 text-sm mt-1">
                            Calcule le coût de fabrication d’un produit à partir des matières premières.
                        </p>
                    </div>

                    <Button onClick={handleCalculate} disabled={calculMutation.isPending} className="gap-2 shadow-md">
                        {calculMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Calculator className="h-4 w-4" />
                        )}
                        Calculer
                    </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                    <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-primary flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Produit à fabriquer
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-5 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Nom du produit</Label>
                                    <Input
                                        value={nomProduit}
                                        onChange={(e) => setNomProduit(e.target.value)}
                                        placeholder="Ex: Gâteau chocolat, pain, croissant..."
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Nombre de pièces fabriquées</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={nombrePieces}
                                        onChange={(e) => setNombrePieces(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-primary/10 overflow-hidden">
                                <div className="flex items-center justify-between bg-primary/5 px-4 py-3 border-b border-primary/10">
                                    <div className="font-semibold text-primary flex items-center gap-2">
                                        <Wheat className="h-4 w-4" />
                                        Ingrédients
                                    </div>

                                    <Button variant="outline" size="sm" onClick={addIngredient} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Ajouter
                                    </Button>
                                </div>

                                <div className="divide-y divide-primary/10">
                                    {isLoading ? (
                                        <div className="p-8 text-center text-primary/60">Chargement...</div>
                                    ) : (
                                        <AnimatePresence initial={false}>
                                            {ingredients.map((ingredient) => {
                                                const matiere = getMatiere(ingredient.matierePremiereId);
                                                const uniteBase = matiere?.uniteBase || "g";

                                                return (
                                                    <motion.div
                                                        key={ingredient.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        className="p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_44px] gap-3 items-end"
                                                    >
                                                        <div className="grid gap-2">
                                                            <Label>Matière première</Label>
                                                            <Select
                                                                value={ingredient.matierePremiereId}
                                                                onValueChange={(value) =>
                                                                    updateIngredient(ingredient.id, "matierePremiereId", value)
                                                                }
                                                            >
                                                                <SelectTrigger className="bg-card">
                                                                    <SelectValue placeholder="Choisir une matière" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-card">
                                                                    {matieres.map((matiere) => {
                                                                        const disabled =
                                                                            selectedIds.includes(matiere.id.toString()) &&
                                                                            ingredient.matierePremiereId !== matiere.id.toString();

                                                                        return (
                                                                            <SelectItem
                                                                                key={matiere.id}
                                                                                value={matiere.id.toString()}
                                                                                disabled={disabled}
                                                                            >
                                                                                {matiere.nom} ({matiere.uniteBase || "g"})
                                                                            </SelectItem>
                                                                        );
                                                                    })}
                                                                </SelectContent>
                                                            </Select>

                                                          
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label>Quantité ({uniteBase})</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                value={ingredient.quantiteBase}
                                                                onChange={(e) =>
                                                                    updateIngredient(ingredient.id, "quantiteBase", e.target.value)
                                                                }
                                                                placeholder="0"
                                                            />
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeIngredient(ingredient.id)}
                                                            className="hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="border-primary/10 shadow-md rounded-2xl">
                            <CardContent className="p-5">
                                <p className="text-sm text-primary/60">Coût total</p>
                                <p className="text-3xl font-bold text-primary mt-1">
                                    {formatCurrency(result?.coutTotal || 0)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md rounded-2xl">
                            <CardContent className="p-5">
                                <p className="text-sm text-primary/60">Prix initial par pièce</p>
                                <p className="text-3xl font-bold text-green-700 mt-1">
                                    {formatCurrency(result?.coutParPiece || 0)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="text-primary text-base">Détail du calcul</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!result ? (
                                    <div className="p-6 text-center text-primary/50">
                                        Aucun calcul pour le moment.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-primary/10">
                                        {result.ingredients.map((item) => (
                                            <div key={item.matierePremiereId} className="p-4 space-y-1">
                                                <div className="flex justify-between gap-3">
                                                    <span className="font-medium text-primary">{item.nomMatiere}</span>
                                                    <span className="font-semibold text-primary">
                                                        {formatCurrency(item.cout)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-primary/60">
                                                    {item.quantiteBase} {item.uniteBase} x{" "}
                                                    {formatCurrency(item.prixParUniteBase)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </div>
                <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-primary flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historique des calculs
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        {historique.length === 0 ? (
                            <div className="p-8 text-center text-primary/50">
                                Aucun calcul enregistré.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">Produit</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">Date</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">Pièces</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">Coût total</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">Coût / pièce</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {historique.map((item) => (
                                            <tr key={item.id} className="border-b border-primary/5 hover:bg-primary/5">
                                                <td className="p-4 font-medium text-primary">{item.nomProduit}</td>
                                                <td className="p-4 text-primary/70">
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleString("fr-TN") : "-"}
                                                </td>
                                                <td className="p-4 text-primary/70">{item.nombrePieces}</td>
                                                <td className="p-4 font-semibold text-primary">
                                                    {formatCurrency(item.coutTotal)}
                                                </td>
                                                <td className="p-4 font-semibold text-green-700">
                                                    {formatCurrency(item.coutParPiece)}
                                                </td>
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