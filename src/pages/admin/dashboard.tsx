import { useGetDashboardStats, useGetSalesByDay, useGetTopProducts, useGetSalarySummary } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: salesData, isLoading: salesLoading } = useGetSalesByDay({ days: 7 });
  const { data: topProducts, isLoading: productsLoading } = useGetTopProducts({ limit: 5 });
  const { data: salaryData, isLoading: salaryLoading } = useGetSalarySummary();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(val);
  };

  // Préparer les données pour le pie chart (top 5 employés par commandes traitées)
  const salaryPieData = salaryData?.slice(0, 5).map((emp) => ({
    name: emp.employeeName.split(" ")[0],
    value: emp.ordersHandled || 0,
    fullName: emp.employeeName,
  }));

  // Calculer la variation des ventes (tendance)
  const getSalesTrend = () => {
    if (!salesData || salesData.length < 2) return null;
    const lastTwo = salesData.slice(-2);
    const prev = lastTwo[0]?.sales || 0;
    const current = lastTwo[1]?.sales || 0;
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };
  const trend = getSalesTrend();

  return (
    <AdminLayout>
      <div className="space-y-8 p-4 md:p-6">
        {/* En-tête animé */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{t("dashboard.overview")}</h1>
            <p className="text-muted-foreground mt-1">{t("dashboard.today_snapshot")}</p>
          </div>
          {trend !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-foreground">
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}% vs hier
              </span>
            </div>
          )}
        </motion.div>

        {/* Cartes KPI (4 cartes) */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: t("dashboard.today_sales"), icon: DollarSign, value: stats?.todaySales, isCurrency: true, color: "text-primary" },
            { title: t("dashboard.today_orders"), icon: ShoppingBag, value: stats?.todayOrders, isCurrency: false, color: "text-blue-600" },
            { title: t("dashboard.total_products"), icon: Package, value: stats?.totalProducts, isCurrency: false, color: "text-green-600" },
            { title: t("dashboard.active_employees"), icon: Users, value: stats?.totalEmployees, isCurrency: false, color: "text-purple-600" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
            >
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground/80">{item.title}</CardTitle>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      {item.isCurrency ? formatCurrency(item.value || 0) : item.value?.toLocaleString() || 0}
                    </div>
                  )}
                  {item.isCurrency && !statsLoading && (
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.total_earnings_today")}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Graphiques en deux colonnes */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Graphique des ventes sur 7 jours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif font-bold text-foreground">{t("dashboard.sales_last_7_days")}</CardTitle>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => formatCurrency(val)} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} />
                        <Line type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top produits (bar chart) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif font-bold text-foreground">{t("dashboard.top_products")}</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={topProducts} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tickFormatter={(val) => formatCurrency(val)} />
                        <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Bar dataKey="totalRevenue" fill="#0f766e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Deuxième ligne : Résumé des salaires et bénéfice */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Pie chart des commandes par employé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif font-bold text-foreground">{t("dashboard.orders_by_employee")}</CardTitle>
              </CardHeader>
              <CardContent>
                {salaryLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salaryPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {salaryPieData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} commandes`, props.payload.fullName]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Carte récapitulative bénéfice / dépenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif font-bold text-foreground">{t("dashboard.financial_summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.monthly_revenue")}</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(stats?.monthSales || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.monthly_expenses")}</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(stats?.monthExpenses || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.estimated_profit")}</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                          {formatCurrency(stats?.monthProfit || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{t("dashboard.revenue_minus_expenses")}</p>
                      </div>
                      <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Wallet className="h-7 w-7 text-green-600" />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}