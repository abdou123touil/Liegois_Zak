import { useState } from "react";
import { useListPointages, useCreatePointageArrivee, useUpdatePointageDepart, useListEmployees, Pointage } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/ADMINLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Pointages() {
  const { t } = useTranslation();
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isDepartModalOpen, setIsDepartModalOpen] = useState(false);
  const [selectedPointageId, setSelectedPointageId] = useState<number | null>(null);
  const [departTime, setDepartTime] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heureArrivee, setHeureArrivee] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pointages = [], isLoading } = useListPointages();
  const { data: employees = [] } = useListEmployees();
  const createArrivee = useCreatePointageArrivee();
  const updateDepart = useUpdatePointageDepart(); // ← plus d'argument
  

 

  const handleArrivalSave = async () => {
    if (!employeeId || !date || !heureArrivee) {
      toast({ title: t('common.error'), description: t('pointages.validation_arrival'), variant: "destructive" });
      return;
    }

    try {
      await createArrivee.mutateAsync({
        employeeId: parseInt(employeeId),
        date,
        heureArrivee,
      });
      toast({ title: t('common.success'), description: t('pointages.arrival_success') });
      queryClient.invalidateQueries({ queryKey: ["pointages"] });
      setIsArrivalModalOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('pointages.save_error'), variant: "destructive" });
    }
  };

  const openDepartModal = (pointageId: number) => {
    setSelectedPointageId(pointageId);
    setDepartTime("");
    setIsDepartModalOpen(true);
  };

  const handleDepartSave = async () => {
  if (!selectedPointageId || !departTime) {
    toast({ title: t('common.error'), description: t('pointages.validation_depart'), variant: "destructive" });
    return;
  }

  const fullDepartTime = `${departTime}:00`;

  try {
    await updateDepart.mutateAsync({ id: selectedPointageId, heureDepart: fullDepartTime });
    toast({ title: t('common.success'), description: t('pointages.depart_success') });
    queryClient.invalidateQueries({ queryKey: ["pointages"] });
    setIsDepartModalOpen(false);
    setSelectedPointageId(null);
    setDepartTime("");
  } catch {
    toast({ title: t('common.error'), description: t('pointages.save_error'), variant: "destructive" });
  }
};

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('pointages.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('pointages.subtitle')}</p>
          </div>
        
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('pointages.list_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('pointages.table.employee')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('pointages.table.date')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('pointages.table.arrival')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('pointages.table.departure')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('pointages.table.hours')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('pointages.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : pointages.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">{t('pointages.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {pointages.map((pointage, idx) => (
                        <motion.tr
                          key={pointage.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" /> {pointage.employeeName}
                          </td>
                          <td className="p-4 text-primary/70">{new Date(pointage.date).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{pointage.heureArrivee}</td>
                          <td className="p-4 text-primary/70">{pointage.heureDepart || '-'}</td>
                          <td className="p-4 text-primary/70">{pointage.heuresTravaillees ?? '-'}</td>
                          <td className="p-4 text-right">
                            {!pointage.heureDepart && (
                              <Button variant="ghost" size="icon" onClick={() => openDepartModal(pointage.id)} className="hover:bg-primary/10">
                                <LogOut className="h-4 w-4 text-primary" />
                              </Button>
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

        {/* Modal Arrivée */}
        <Dialog open={isArrivalModalOpen} onOpenChange={setIsArrivalModalOpen}>
          <DialogContent
            className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">{t('pointages.arrival_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('pointages.employee')}</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder={t('pointages.select_employee')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('pointages.date')}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('pointages.arrival_time')}</Label>
                <Input type="time" value={heureArrivee} onChange={(e) => setHeureArrivee(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsArrivalModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleArrivalSave}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Départ */}
        <Dialog open={isDepartModalOpen} onOpenChange={setIsDepartModalOpen}>
          <DialogContent
            className="sm:max-w-[400px] rounded-2xl border border-border shadow-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'none' }}
          >
            <DialogHeader>
              <DialogTitle className="text-primary">{t('pointages.depart_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('pointages.depart_time')}</Label>
                <Input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDepartModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleDepartSave}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}