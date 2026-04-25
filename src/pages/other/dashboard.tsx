// src/pages/other/dashboard.tsx
import { useAuth } from "@/lib/auth";
import { useListPointages, useListConges } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Briefcase, TrendingUp, CalendarDays } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

export default function OtherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const employeeId = user?.id;

  const today = new Date();
  const debutMois = startOfMonth(today).toISOString().split('T')[0];
  const finMois = endOfMonth(today).toISOString().split('T')[0];

  const { data: pointages = [], isLoading: loadingPointages } = useListPointages();
  const { data: conges = [], isLoading: loadingConges } = useListConges();

  // Filtrer les pointages et congés de l'utilisateur connecté
  const mesPointages = pointages.filter(p => p.employeeId === employeeId);
  const mesConges = conges.filter(c => c.employeeId === employeeId);

  // Pointages du mois en cours
  const pointagesCeMois = mesPointages.filter(p => p.date >= debutMois && p.date <= finMois);
  const joursTravailles = pointagesCeMois.length;
  const totalHeures = pointagesCeMois.reduce((acc, p) => acc + (p.heuresTravaillees || 0), 0);

  // Congés en attente
  const congesEnAttente = mesConges.filter(c => !c.valide).length;

  // Derniers pointages (5 derniers)
  const derniersPointages = [...mesPointages]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête avec photo / nom */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-md">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('other.dashboard.welcome', { name: user?.name })}
            </h1>
            <p className="text-primary/60 text-sm mt-1 flex items-center gap-2">
              <Briefcase className="h-3 w-3" />
              {user?.poste || t('other.dashboard.employee')}
            </p>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">
                {t('other.dashboard.days_worked_this_month')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{joursTravailles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('other.dashboard.out_of_month', { total: new Date().getDate() })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">
                {t('other.dashboard.total_hours')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalHeures.toFixed(1)} h</div>
              <p className="text-xs text-muted-foreground mt-1">{t('other.dashboard.hours_this_month')}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary/70">
                {t('other.dashboard.pending_leaves')}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{congesEnAttente}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('other.dashboard.awaiting_approval')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Derniers pointages */}
        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row justify-between items-center">
            <CardTitle className="text-primary">{t('other.dashboard.recent_attendance')}</CardTitle>
            <Link href="/other/pointages">
              <Button variant="ghost" size="sm" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {t('other.dashboard.view_all')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loadingPointages ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : derniersPointages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('other.dashboard.no_attendance')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.dashboard.date')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.dashboard.arrival')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.dashboard.departure')}</th>
                      <th className="text-left p-4 text-sm font-medium text-primary/70">{t('other.dashboard.hours')}</th>
                    </tr>
                  </thead>
                  <tbody>
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
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Congés récents / actions rapides */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('other.dashboard.recent_leaves')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingConges ? (
                <div className="text-center text-muted-foreground">{t('common.loading')}</div>
              ) : mesConges.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('other.dashboard.no_leaves')}</p>
              ) : (
                <ul className="space-y-2">
                  {mesConges.slice(0, 3).map(conge => (
                    <li key={conge.id} className="flex justify-between items-center text-sm">
                      <span>{new Date(conge.dateDebut).toLocaleDateString()} → {new Date(conge.dateFin).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        conge.valide ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {conge.valide ? t('other.dashboard.approved') : t('other.dashboard.pending')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-primary">{t('other.dashboard.quick_actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/other/pointages">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Clock className="h-4 w-4" />
                  {t('other.dashboard.clock_in_out')}
                </Button>
              </Link>
              <Link href="/other/conges">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {t('other.dashboard.request_leave')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}