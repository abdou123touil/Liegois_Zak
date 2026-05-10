import { useState } from "react";
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CASHIER" | "CHEF" | "RESPONSABLE" | "OTHER">("CASHIER");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerMonth, setHoursPerMonth] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateEmbauche, setDateEmbauche] = useState("");
  const [congesParAn, setCongesParAn] = useState("20");
  const { data: employees, isLoading } = useListEmployees();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const openNewModal = () => {
    setEditingEmployee(null);
    setName("");
    setUsername("");
    setPassword("");
    setRole("CASHIER");
    setHourlyRate("");
    setHoursPerMonth("");
    setMonthlySalary("");
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
    setHourlyRate(emp.hourlyRate?.toString() || "");
    setHoursPerMonth(emp.hoursPerMonth?.toString() || "");
    setMonthlySalary(emp.monthlySalary?.toString() || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !username || !password) {
      toast({ title: t('common.error'), description: t('employees.validation_name_username_password_required'), variant: "destructive" });
      return;
    }

    const employeeData: any = {
      name,
      username,
      password,
      role,
      isActive: true,
    };

    // ADMIN → mensuel ; tous les autres → horaire
    if (role === "ADMIN") {
      employeeData.monthlySalary = monthlySalary ? parseFloat(monthlySalary) : null;
      employeeData.hourlyRate = null;
      employeeData.hoursPerMonth = null;
    } else {
      employeeData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      employeeData.hoursPerMonth = hoursPerMonth ? parseInt(hoursPerMonth) : null;
      employeeData.monthlySalary = null;
      employeeData.dateEmbauche = dateEmbauche;
      employeeData.congesParAn = parseInt(congesParAn);
    }

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

  const handleDelete = async (id: number) => {
    if (confirm(t('employees.confirm_delete'))) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: t('common.success'), description: t('employees.delete_success') });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
      } catch (error) {
        toast({ title: t('common.error'), description: t('employees.delete_error'), variant: "destructive" });
      }
    }
  };

  // Fonction pour afficher le badge de rôle avec les bonnes couleurs
  const getRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase();
    let colorClass = "";
    let label = "";

    switch (roleLower) {
      case "admin":
        colorClass = "bg-primary/10 text-primary";
        label = t('employees.role_admin');
        break;
      case "cashier":
        colorClass = "bg-amber-100 text-amber-700";
        label = t('employees.role_cashier');
        break;
      case "chef":
        colorClass = "bg-blue-100 text-blue-700";
        label = t('employees.role_chef');
        break;
      case "responsable":
        colorClass = "bg-purple-100 text-purple-700";
        label = t('employees.role_responsable');
        break;
      case "other":
        colorClass = "bg-gray-100 text-gray-700";
        label = t('employees.role_other');
        break;
      default:
        colorClass = "bg-gray-100 text-gray-700";
        label = role;
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
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('employees.table.name')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('employees.table.username')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('employees.table.role')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('employees.table.rate_salary')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('employees.table.soldes_conges')}</th>
                    <th className="text-right p-4 text-sm font-medium text-primary/70">{t('employees.table.actions')}</th>

                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-12">{t('common.loading')}</td></tr>
                  ) : employees?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12">{t('employees.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {employees?.map((emp, idx) => (
                        <motion.tr
                          key={emp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-medium text-primary/90 flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-primary" /> {emp.name}
                          </td>
                          <td className="p-4 text-primary/70">{emp.username}</td>
                          <td className="p-4">
                            {getRoleBadge(emp.role)}
                          </td>
                          <td className="p-4 text-primary/70">
                            {emp.role === "ADMIN"
                              ? t('employees.monthly_salary_format', { salary: emp.monthlySalary?.toFixed(2) })
                              : t('employees.hourly_rate_format', { rate: emp.hourlyRate, hours: emp.hoursPerMonth })}
                          </td>
                          <td className="p-4">{emp.joursCongeRestants ?? 0} jours</td>
                          <td className="p-4 text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(emp)} className="hover:bg-primary/10">
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} className="hover:bg-destructive/10">
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
              <DialogTitle className="text-primary">{editingEmployee ? t('employees.edit_title') : t('employees.add_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('employees.name_label')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">{t('employees.username_label')}</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('employees.password_label')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>





              <div className="grid gap-2">
                <Label htmlFor="role">{t('employees.role_label')}</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="ADMIN">{t('employees.role_admin')}</SelectItem>
                    <SelectItem value="CASHIER">{t('employees.role_cashier')}</SelectItem>
                    <SelectItem value="CHEF">{t('employees.role_chef')}</SelectItem>
                    <SelectItem value="RESPONSABLE">{t('employees.role_responsable')}</SelectItem>
                    <SelectItem value="OTHER">{t('employees.role_other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                <Input id="dateEmbauche" type="date" value={dateEmbauche} onChange={(e) => setDateEmbauche(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="congesParAn">Congés par an (jours)</Label>
                <Input id="congesParAn" type="number" min="0" value={congesParAn} onChange={(e) => setCongesParAn(e.target.value)} />
              </div>
              {role === "ADMIN" ? (
                <div className="grid gap-2">
                  <Label htmlFor="monthlySalary">{t('employees.monthly_salary_label')}</Label>
                  <Input id="monthlySalary" type="number" step="0.01" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">{t('employees.hourly_rate_label')}</Label>
                    <Input id="hourlyRate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hoursPerMonth">{t('employees.hours_per_month_label')}</Label>
                    <Input id="hoursPerMonth" type="number" value={hoursPerMonth} onChange={(e) => setHoursPerMonth(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{editingEmployee ? t('common.save') : t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ADMINLayout>
  );
}