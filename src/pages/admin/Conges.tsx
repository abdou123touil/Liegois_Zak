import { useEffect, useState } from "react";
import { useListConges, useCreateConge, useApproveConge, useListEmployees, Conge } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle, XCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Employee } from "@/lib/api-client";

export default function Conges() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [type, setType] = useState("");
  const [motif, setMotif] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [congesRestants, setCongesRestants] = useState(0);
  const [joursDemandes, setJoursDemandes] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conges = [], isLoading } = useListConges();
  const { data: employees = [] } = useListEmployees();
  const createMutation = useCreateConge();
  const approveMutation = useApproveConge();

  const openNewModal = () => {
    setEmployeeId("");
    setDateDebut("");
    setDateFin("");
    setType("");
    setMotif("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!employeeId || !dateDebut || !dateFin || !type) {
      toast({ title: t('common.error'), description: t('conges.validation_required'), variant: "destructive" });
      return;
    }

    const data = {
      employeeId: parseInt(employeeId),
      dateDebut,
      dateFin,
      type,
      motif: motif || undefined,
    };

    try {
      await createMutation.mutateAsync(data);
      toast({ title: t('common.success'), description: t('conges.create_success') });
      queryClient.invalidateQueries({ queryKey: ["conges"] });
      setIsModalOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('conges.save_error'), variant: "destructive" });
    }
  };

  const handleApprove = async (id: number, valide: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, valide });
      toast({ title: t('common.success'), description: valide ? t('conges.approved') : t('conges.rejected') });
      queryClient.invalidateQueries({ queryKey: ["conges"] });
    } catch {
      toast({ title: t('common.error'), description: t('conges.approve_error'), variant: "destructive" });
    }
  };

  const getTypeLabel = (typeValue: string) => {
    switch (typeValue) {
      case "CONGES_PAYES": return t('conges.type_paid');
      case "MALADIE": return t('conges.type_sick');
      case "SANS_SOLDE": return t('conges.type_unpaid');
      default: return typeValue;
    }
  };

  const getStatutBadge = (valide: boolean) => {
    return valide
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('conges.approved')}</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{t('conges.pending')}</span>;
  };
  useEffect(() => {
    const emp = employees.find(e => e.id.toString() === employeeId);
    setSelectedEmployee(emp || null);
    setCongesRestants(emp?.joursCongeRestants ?? 0);
  }, [employeeId, employees]);

  // Calcul des jours demandés quand dateDebut ou dateFin change
  useEffect(() => {
    if (dateDebut && dateFin) {
      const start = new Date(dateDebut);
      const end = new Date(dateFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setJoursDemandes(diffDays);
    } else {
      setJoursDemandes(0);
    }
  }, [dateDebut, dateFin]);

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('conges.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('conges.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('conges.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('conges.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('conges.table.employee')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('conges.table.start')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('conges.table.end')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('conges.table.type')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('conges.table.status')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('conges.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : conges.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('conges.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {conges.map((conge, idx) => (
                        <motion.tr
                          key={conge.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" /> {conge.employeeName}
                          </td>
                          <td className="p-4 text-primary/70">{new Date(conge.dateDebut).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{new Date(conge.dateFin).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{getTypeLabel(conge.type)}</td>
                          <td className="p-4">{getStatutBadge(conge.valide)}</td>
                          <td className="p-4 text-right space-x-2">
                            {!conge.valide && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(conge.id, true)} className="hover:bg-green-100">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(conge.id, false)} className="hover:bg-red-100">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
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
              <DialogTitle className="text-primary">{t('conges.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('conges.employee')}</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder={t('conges.select_employee')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('conges.start_date')}</Label>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('conges.end_date')}</Label>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Congés restants</Label>
                  <Input value={congesRestants} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label>Jours demandés</Label>
                  <Input value={joursDemandes} disabled className="bg-muted" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t('conges.type')}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder={t('conges.select_type')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="CONGES_PAYES">{t('conges.type_paid')}</SelectItem>
                    <SelectItem value="MALADIE">{t('conges.type_sick')}</SelectItem>
                    <SelectItem value="SANS_SOLDE">{t('conges.type_unpaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('conges.motif')}</Label>
                <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
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