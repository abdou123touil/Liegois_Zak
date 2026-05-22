import { useMemo, useState } from "react";
import { useCreateEchange, useListEchanges } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeftRight, TrendingDown, TrendingUp, ReceiptText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Echanges() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState<"ACHAT" | "VENTE" | "">("");
    const [montant, setMontant] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const { toast } = useToast();
    const { data: echanges = [], isLoading } = useListEchanges();
    const createMutation = useCreateEchange();

    const totals = useMemo(() => {
        return echanges.reduce(
            (acc, item) => {
                if (item.type === "ACHAT") acc.achats += item.montant;
                if (item.type === "VENTE") acc.ventes += item.montant;
                return acc;
            },
            { achats: 0, ventes: 0 }
        );
    }, [echanges]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("fr-TN", {
            style: "currency",
            currency: "TND",
        }).format(value);
    };

    const openNewModal = () => {
        setType("");
        setMontant("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!type || !montant || !date) {
            toast({
                title: "Erreur",
                description: "Veuillez remplir le type, le montant et la date.",
                variant: "destructive",
            });
            return;
        }

        try {
            await createMutation.mutateAsync({
                type,
                montant: parseFloat(montant),
                description: description || undefined,
                date,
            });

            toast({
                title: "Succès",
                description: type === "VENTE"
                    ? "Échange enregistré comme vente."
                    : "Échange enregistré comme dépense.",
            });

            setIsModalOpen(false);
        } catch {
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer l'échange.",
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
                            Échanges
                        </h1>
                        <p className="text-primary/60 text-sm mt-1">
                            Suivi des mouvements entre Liegois et Raghif
                        </p>
                    </div>

                    <Button onClick={openNewModal} className="gap-2 shadow-md">
                        <Plus className="h-4 w-4" />
                        Nouvel échange
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-primary/10 shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <ArrowLeftRight className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-primary/60">Total échanges</p>
                                <p className="text-2xl font-semibold text-primary">{echanges.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="rounded-full bg-amber-100 p-3">
                                <TrendingDown className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm text-primary/60">Raghif vers Liegois</p>
                                <p className="text-2xl font-semibold text-green-700">{formatCurrency(totals.ventes)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <TrendingUp className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-primary/60">Liegois vers Raghif</p>
                                <p className="text-2xl font-semibold text-amber-700">{formatCurrency(totals.achats)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-primary">Historique des échanges</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">Mouvement</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">Date</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">Montant</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">Description</th>
                                        <th className="text-left p-4 text-sm font-medium text-primary/70">Dépense</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12">Chargement...</td>
                                        </tr>
                                    ) : echanges.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                                Aucun échange enregistré
                                            </td>
                                        </tr>
                                    ) : (
                                        <AnimatePresence>
                                            {echanges.map((echange, idx) => (
                                                <motion.tr
                                                    key={echange.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="border-b border-primary/5 hover:bg-primary/5"
                                                >
                                                    <td className="p-4 font-medium text-primary/90">
                                                        <div className="flex items-center gap-2">
                                                            <ArrowLeftRight className="h-4 w-4 text-primary" />
                                                            {echange.type === "VENTE" ? "Raghif -> Liegois" : "Liegois -> Raghif"}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-primary/70">
                                                        {new Date(echange.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 font-semibold text-primary">
                                                        {formatCurrency(echange.montant)}
                                                    </td>
                                                    <td className="p-4 text-primary/70 max-w-md">
                                                        {echange.description || "-"}
                                                    </td>
                                                    <td className="p-4 text-primary/70">
                                                        <div className="flex items-center gap-2">
                                                            <ReceiptText className="h-4 w-4 text-primary/60" />
                                                            {echange.expenseId ? `#${echange.expenseId}` : "-"}
                                                        </div>
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
                        className="sm:max-w-[520px] rounded-2xl border border-border shadow-2xl"
                        style={{ backgroundColor: "hsl(var(--card))", backdropFilter: "none" }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-primary">Nouvel échange</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Mouvement</Label>
                                <Select value={type} onValueChange={(value: "ACHAT" | "VENTE") => setType(value)}>
                                    <SelectTrigger className="bg-card">
                                        <SelectValue placeholder="Choisir le mouvement" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card">
                                        <SelectItem value="VENTE">Raghif ⟿ à Liegois</SelectItem>
                                        <SelectItem value="ACHAT">Liegois ⟿ à Raghif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Montant (TND)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={montant}
                                        onChange={(e) => setMontant(e.target.value)}
                                        placeholder="0.000"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: échange farine, levure, matières premières..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleSave} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ADMINLayout>
    );
}