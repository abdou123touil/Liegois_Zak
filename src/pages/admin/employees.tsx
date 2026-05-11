import { useState, useEffect } from "react";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, Employee } from "@/lib/api-client";
import ADMINLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Employees() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CASHIER" | "CHEF" | "RESPONSABLE" | "OTHER">("CASHIER");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerMonth, setHoursPerMonth] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateEmbauche, setDateEmbauche] = useState("");
  const [congesParAn, setCongesParAn] = useState("20");
  const [monthlyFixedSalary, setMonthlyFixedSalary] = useState(""); // Frontend only !

  const { data: employees, isLoading } = useListEmployees();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  // Calcul automatique du taux horaire à partir du salaire mensuel fixe et des heures par mois
  useEffect(() => {
    if (role !== "ADMIN" && monthlyFixedSalary && hoursPerMonth) {
      const monthly = parseFloat(monthlyFixedSalary);
      const hours = parseInt(hoursPerMonth);
      if (!isNaN(monthly) && !isNaN(hours) && hours > 0) {
        const rate = monthly / hours;
        setHourlyRate(rate.toFixed(3));
      } else {
        setHourlyRate("");
      }
    } else if (role === "ADMIN") {
      setHourlyRate("");
    }
  }, [monthlyFixedSalary, hoursPerMonth, role]);

  const openNewModal = () => {
    setEditingEmployee(null);
    setName("");
    setUsername("");
    setPassword("");
    setChangePassword(false);
    setRole("CASHIER");
    setHourlyRate("");
    setHoursPerMonth("");
    setMonthlySalary("");
    setMonthlyFixedSalary("");
    setDateEmbauche(new Date().toISOString().split('T')[0]);
    setCongesParAn("20");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setUsername(emp.username);
    setRole(emp.role as any);
    setDateEmbauche(emp.dateEmbauche || new Date().toISOString().split('T')[0]);
    setCongesParAn(emp.congesParAn?.toString() || "20");
    setHoursPerMonth(emp.hoursPerMonth?.toString() || "");
    setMonthlySalary(emp.monthlySalary?.toString() || "");
    // Pré-remplir le salaire mensuel fixe à partir du taux horaire et heures par mois
    if (emp.hourlyRate && emp.hoursPerMonth) {
      const fixed = emp.hourlyRate * emp.hoursPerMonth;
      setMonthlyFixedSalary(fixed.toFixed(3));
      setHourlyRate(emp.hourlyRate.toString());
    } else {
      setMonthlyFixedSalary("");
      setHourlyRate("");
    }
    setPassword("");
    setChangePassword(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: employeeToDelete.id });
      toast({ title: t('common.success'), description: t('employees.delete_success') });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch {
      toast({ title: t('common.error'), description: t('employees.delete_error'), variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!name || !username) {
      toast({ title: t('common.error'), description: t('employees.validation_name_username_required'), variant: "destructive" });
      return;
    }
    if (!editingEmployee && !password) {
      toast({ title: t('common.error'), description: t('employees.validation_name_username_password_required'), variant: "destructive" });
      return;
    }
    if (editingEmployee && changePassword && !password) {
      toast({ title: t('common.error'), description: "Veuillez saisir le nouveau mot de passe", variant: "destructive" });
      return;
    }

    const employeeData: any = {
      name,
      username,
      role,
      isActive: true,
    };

    if (!editingEmployee || (editingEmployee && changePassword)) {
      employeeData.password = password;
    }

    if (role === "ADMIN") {
      employeeData.monthlySalary = monthlySalary ? parseFloat(monthlySalary) : null;
      employeeData.hourlyRate = null;
      employeeData.hoursPerMonth = null;
    } else {
      // On envoie le taux horaire calculé (ou saisi manuellement)
      employeeData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      employeeData.hoursPerMonth = hoursPerMonth ? parseInt(hoursPerMonth) : null;
      employeeData.monthlySalary = null;
    }
    employeeData.dateEmbauche = dateEmbauche;
    employeeData.congesParAn = parseInt(congesParAn);

    try {
      if (editingEmployee) {
        await updateMutation.mutateAsync({ id: editingEmployee.id, data: employeeData });
        toast({ title: t('common.success'), description: t('employees.update_success') });
      } else {
        await createMutation.mutateAsync({ data: employeeData });
        toast({ title: t('common.success'), description: t('employees.create_success') });
      }
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: t('employees.save_error'), variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase();
    let colorClass = "";
    let label = "";
    switch (roleLower) {
      case "admin": colorClass = "bg-primary/10 text-primary"; label = t('employees.role_admin'); break;
      case "cashier": colorClass = "bg-amber-100 text-amber-700"; label = t('employees.role_cashier'); break;
      case "chef": colorClass = "bg-blue-100 text-blue-700"; label = t('employees.role_chef'); break;
      case "responsable": colorClass = "bg-purple-100 text-purple-700"; label = t('employees.role_responsable'); break;
      case "other": colorClass = "bg-gray-100 text-gray-700"; label = t('employees.role_other'); break;
      default: colorClass = "bg-gray-100 text-gray-700"; label = role;
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{label}</span>;
  };

  return (
    <ADMINLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('employees.title')}
            </h1>
            <p className="text-primary/60 text-sm mt-1">{t('employees.subtitle')}</p>
          </div>
          <Button onClick={openNewModal} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> {t('employees.add_button')}
          </Button>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('employees.team_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">{t('employees.table.name')}</th>
                    <th className="p-4 text-left">{t('employees.table.username')}</th>
                    <th className="p-4 text-left">{t('employees.table.role')}</th>
                    <th className="p-4 text-left">{t('employees.table.rate_salary')}</th>
                    <th className="p-4 text-left">Solde congés</th>
                    <th className="p-4 text-right">{t('employees.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-12 text-center">{t('common.loading')}</td></tr>
                  ) : employees?.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center">{t('employees.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {employees?.map((emp, idx) => (
                        <motion.tr key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="border-b hover:bg-primary/5">
                          <td className="p-4 font-medium flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> {emp.name}</td>
                          <td className="p-4">{emp.username}</td>
                          <td className="p-4">{getRoleBadge(emp.role)}</td>
                          <td className="p-4">
                            {emp.role === "ADMIN"
                              ? t('employees.monthly_salary_format', { salary: emp.monthlySalary?.toFixed(2) })
                              : t('employees.hourly_rate_format', { rate: emp.hourlyRate, hours: emp.hoursPerMonth })}
                          </td>
                          <td className="p-4">{emp.joursCongeRestants ?? 0} jours</td>
                          <td className="p-4 text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(emp)} className="hover:bg-primary/10"><Edit className="h-4 w-4 text-primary" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(emp)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

        {/* Modal d'édition / création */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border border-border shadow-2xl bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary">{editingEmployee ? t('employees.edit_title') : t('employees.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>{t('employees.name_label')}</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>{t('employees.username_label')}</Label><Input value={username} onChange={e => setUsername(e.target.value)} /></div>
              <div><Label>{t('employees.role_label')}</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t('employees.role_admin')}</SelectItem>
                    <SelectItem value="CASHIER">{t('employees.role_cashier')}</SelectItem>
                    <SelectItem value="CHEF">{t('employees.role_chef')}</SelectItem>
                    <SelectItem value="RESPONSABLE">{t('employees.role_responsable')}</SelectItem>
                    <SelectItem value="OTHER">{t('employees.role_other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date d'embauche</Label><Input type="date" value={dateEmbauche} onChange={e => setDateEmbauche(e.target.value)} /></div>
              <div><Label>Congés par an (jours)</Label><Input type="number" min="0" value={congesParAn} onChange={e => setCongesParAn(e.target.value)} /></div>

              {role === "ADMIN" ? (
                <div><Label>{t('employees.monthly_salary_label')}</Label><Input type="number" step="0.01" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Salaire mensuel fixe (TND)</Label><Input type="number" step="0.01" value={monthlyFixedSalary} onChange={e => setMonthlyFixedSalary(e.target.value)} placeholder="Ex: 1500" /></div>
                    <div><Label>{t('employees.hours_per_month_label')}</Label><Input type="number" value={hoursPerMonth} onChange={e => setHoursPerMonth(e.target.value)} placeholder="Ex: 160" /></div>
                  </div>
                  <div><Label>{t('employees.hourly_rate_label')} (calculé)</Label><Input type="number" step="0.001" value={hourlyRate} disabled className="bg-muted" /></div>
                </>
              )}

              {/* Mot de passe obligatoire en création */}
              {!editingEmployee && (
                <div><Label>{t('employees.password_label')}</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              )}

              {/* Changer le mot de passe en édition */}
              {editingEmployee && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="changePassword" checked={changePassword} onChange={e => setChangePassword(e.target.checked)} />
                  <Label htmlFor="changePassword">Changer le mot de passe</Label>
                </div>
              )}
              {changePassword && (
                <div><Label>{t('employees.password_label')}</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{editingEmployee ? t('common.save') : t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmation suppression */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Voulez-vous vraiment supprimer l'employé <strong>{employeeToDelete?.name}</strong> ? Cette action est irréversible.</p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
              <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}