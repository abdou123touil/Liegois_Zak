// src/pages/other/pointages.tsx
import { useState } from "react";
import { useListPointages, useCreatePointageArrivee, useUpdatePointageDepart } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, LogIn, LogOut, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export default function OtherPointages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const employeeId = user?.id;

  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [arrivalDate, setArrivalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [arrivalTime, setArrivalTime] = useState(format(new Date(), 'HH:mm'));

  const [isDepartModalOpen, setIsDepartModalOpen] = useState(false);
  const [departTime, setDepartTime] = useState(format(new Date(), 'HH:mm'));

  const { data: pointages = [], isLoading } = useListPointages();
  const createArrivee = useCreatePointageArrivee();
  const updateDepart = useUpdatePointageDepart();

  // Filtrer les pointages de l'employé connecté
  const mesPointages = pointages.filter(p => p.employeeId === employeeId);
  const pointageAujourdhui = mesPointages.find(p => p.date === format(new Date(), 'yyyy-MM-dd'));
  const aDejaArrive = !!pointageAujourdhui;
  const aDejaDepart = !!pointageAujourdhui?.heureDepart;

  // Statistiques du mois
  const today = new Date();
  const debutMois = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
  const finMois = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');
  const pointagesCeMois = mesPointages.filter(p => p.date >= debutMois && p.date <= finMois);
  const joursTravailles = pointagesCeMois.length;
  const totalHeures = pointagesCeMois.reduce((acc, p) => acc + (p.heuresTravaillees || 0), 0);

  // Derniers pointages (5 derniers)
  const derniersPointages = [...mesPointages]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleArrival = async () => {
    try {
      await createArrivee.mutateAsync({
        employeeId,
        date: arrivalDate,
        heureArrivee: arrivalTime,
      });
      toast({ title: t('common.success'), description: t('other.pointages.arrival_success') });
      queryClient.invalidateQueries({ queryKey: ["pointages"] });
      setIsArrivalModalOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('other.pointages.save_error'), variant: "destructive" });
    }
  };

  const handleDepart = async () => {
    if (!pointageAujourdhui) return;
    try {
      await updateDepart(pointageAujourdhui.id).mutateAsync(departTime);
      toast({ title: t('common.success'), description: t('other.pointages.depart_success') });
      queryClient.invalidateQueries({ queryKey: ["pointages"] });
      setIsDepartModalOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('other.pointages.save_error'), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('other.pointages.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('other.pointages.subtitle')}</p>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-4">
          {!aDejaArrive ? (
            <Button onClick={() => setIsArrivalModalOpen(true)} className="gap-2 shadow-md">
              <LogIn className="h-4 w-4" /> {t('other.pointages.clock_in')}
            </Button>
          ) : !aDejaDepart ? (
            <Button onClick={() => setIsDepartModalOpen(true)} className="gap-2 shadow-md">
              <LogOut className="h-4 w-4" /> {t('other.pointages.clock_out')}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground bg-primary/5 px-4 py-2 rounded-lg">
              {t('other.pointages.already_done_today')}
            </div>
          )}
        </div>

        {/* Cartes statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">
                {t('other.pointages.days_worked_this_month')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{joursTravailles}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('other.pointages.out_of_month', { total: new Date().getDate() })}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">
                {t('other.pointages.total_hours')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalHeures.toFixed(1)} h</div>
              <p className="text-xs text-muted-foreground mt-1">{t('other.pointages.hours_this_month')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Derniers pointages */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row justify-between items-center">
            <CardTitle className="text-primary">{t('other.pointages.recent_attendance')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : derniersPointages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('other.pointages.no_attendance')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.pointages.date')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.pointages.arrival')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.pointages.departure')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.pointages.hours')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {derniersPointages.map((pointage, idx) => (
                        <motion.tr
                          key={pointage.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 text-primary/70">{new Date(pointage.date).toLocaleDateString()}</td>
                          <td className="p-4 text-primary/70">{pointage.heureArrivee}</td>
                          <td className="p-4 text-primary/70">{pointage.heureDepart || '-'}</td>
                          <td className="p-4 text-primary/70 font-medium">
                            {pointage.heuresTravaillees ? `${pointage.heuresTravaillees.toFixed(1)} h` : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Arrivée */}
        <Dialog open={isArrivalModalOpen} onOpenChange={setIsArrivalModalOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">{t('other.pointages.clock_in')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('other.pointages.date')}</Label>
                <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('other.pointages.arrival_time')}</Label>
                <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsArrivalModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleArrival}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Départ */}
        <Dialog open={isDepartModalOpen} onOpenChange={setIsDepartModalOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">{t('other.pointages.clock_out')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('other.pointages.departure_time')}</Label>
                <Input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDepartModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleDepart}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}