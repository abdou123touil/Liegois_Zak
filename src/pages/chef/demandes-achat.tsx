
import { useState } from "react";
import { useListDemandesAchat, useCreateDemandeAchat, useApproveDemandeAchat, useListFournisseurs } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Filter, Plus } from "lucide-react";

export default function ChefDemandesAchat() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showOnlyPending, setShowOnlyPending] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [produit, setProduit] = useState("");
    const [quantite, setQuantite] = useState("");
    const [uniteMesure, setUniteMesure] = useState("");
    const [fournisseurSuggereId, setFournisseurSuggereId] = useState("none");
    const [urgence, setUrgence] = useState(false);

    const { data: demandes = [], isLoading } = useListDemandesAchat();
    const { data: fournisseurs = [] } = useListFournisseurs();
    const createMutation = useCreateDemandeAchat();
    const approveMutation = useApproveDemandeAchat();

    const filteredDemandes = showOnlyPending
        ? demandes.filter(d => d.statut === "EN_ATTENTE")
        : demandes;

    const handleCreate = async () => {
        if (!produit || !quantite || !uniteMesure) {
            toast({ title: t('common.error'), description: t('demandesAchat.validation_required'), variant: "destructive" });
            return;
        }
        try {
            const fournisseurData = fournisseurSuggereId && fournisseurSuggereId !== "none"
                ? { id: parseInt(fournisseurSuggereId) }
                : null;
            await createMutation.mutateAsync({
                produit,
                quantite: parseFloat(quantite),
                uniteMesure,
                fournisseurSuggere: fournisseurData || null,
                urgence,
            });
            toast({ title: t('common.success'), description: t('demandesAchat.create_success') });
            queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
            setIsModalOpen(false);
            setProduit("");
            setQuantite("");
            setUniteMesure("");
            setFournisseurSuggereId("");
            setUrgence(false);
        } catch {
            toast({ title: t('common.error'), description: t('demandesAchat.save_error'), variant: "destructive" });
        }
    };

    const handleApprove = async (id: number, valide: boolean) => {
        try {
            await approveMutation.mutateAsync({ id, valide });
            toast({ title: t('common.success'), description: valide ? t('demandesAchat.approved') : t('demandesAchat.rejected') });
            queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
        } catch {
            toast({ title: t('common.error'), description: t('demandesAchat.approve_error'), variant: "destructive" });
        }
    };

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case "EN_ATTENTE": return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{t('demandesAchat.status_pending')}</Badge>;
            case "VALIDEE": return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('demandesAchat.status_approved')}</Badge>;
            case "REJETEE": return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">{t('demandesAchat.status_rejected')}</Badge>;
            default: return <Badge variant="outline">{statut}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {t('chef.demandesAchat.title')}
                        </h1>
                        <p className="text-primary/60 text-sm mt-1">{t('chef.demandesAchat.subtitle')}</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> {t('demandesAchat.add_button')}
                    </Button>
                </div>

                <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row justify-between items-center">
                        <CardTitle className="text-primary">{t('chef.demandesAchat.list_title')}</CardTitle>
                        <Button
                            variant={showOnlyPending ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowOnlyPending(!showOnlyPending)}
                            className="gap-1"
                        >
                            <Filter className="h-3 w-3" />
                            {showOnlyPending ? t('chef.demandesAchat.show_all') : t('chef.demandesAchat.show_pending')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
                        ) : filteredDemandes.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">{t('chef.demandesAchat.empty')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.product')}</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.quantity')}</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.unit')}</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.supplier')}</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.requested_by')}</th>
                                            <th className="text-left p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.status')}</th>
                                            <th className="text-right p-4 text-sm font-medium text-primary/70">{t('chef.demandesAchat.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDemandes.map((demande, idx) => (
                                            <motion.tr
                                                key={demande.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b border-primary/5 hover:bg-primary/5"
                                            >
                                                <td className="p-4 font-medium">{demande.produit}</td>
                                                <td className="p-4">{demande.quantite} {demande.uniteMesure}</td>
                                                <td className="p-4">{demande.uniteMesure}</td>
                                                <td className="p-4">{demande.fournisseurSuggere?.nom || '-'}</td>
                                                <td className="p-4">{demande.demandePar?.name || '-'}</td>
                                                <td className="p-4">{getStatutBadge(demande.statut)}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    {demande.statut === "EN_ATTENTE" && (
                                                        <>
                                                            <Button variant="ghost" size="icon" onClick={() => handleApprove(demande.id, true)} className="hover:bg-green-100">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleApprove(demande.id, false)} className="hover:bg-red-100">
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de création (identique à celui supprimé de l’admin) */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-primary">{t('demandesAchat.add_title')}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>{t('demandesAchat.product')}</Label>
                                <Input value={produit} onChange={(e) => setProduit(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('demandesAchat.quantity')}</Label>
                                    <Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('demandesAchat.unit')}</Label>
                                    <Input value={uniteMesure} onChange={(e) => setUniteMesure(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('demandesAchat.supplier')}</Label>
                                <Select value={fournisseurSuggereId} onValueChange={setFournisseurSuggereId}>
                                    <SelectTrigger className="bg-card">
                                        <SelectValue placeholder={t('demandesAchat.select_supplier')} />
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
                                <Checkbox checked={urgence} onCheckedChange={(val) => setUrgence(!!val)} />
                                <Label>{t('demandesAchat.urgent')}</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleCreate}>{t('common.create')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}