import { useGetDashboardStats, useGetSalesByDay, useGetTopProducts, useGetSalarySummary } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, TrendingDown, Wallet, Receipt, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
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
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35 },
  }),
};

const COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: salesData = [], isLoading: salesLoading } = useGetSalesByDay({ days: 7 });
  const { data: topProducts = [], isLoading: productsLoading } = useGetTopProducts({ limit: 5 });
  const { data: salaryData = [], isLoading: salaryLoading } = useGetSalarySummary();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(val || 0);
  };

  const salaryPieData = salaryData.slice(0, 5).map((emp) => ({
    name: emp.employeeName.split(" ")[0],
    value: emp.ordersHandled || 0,
    fullName: emp.employeeName,
  }));

  const getSalesTrend = () => {
    if (!salesData || salesData.length < 2) return null;
    const lastTwo = salesData.slice(-2);
    const prev = lastTwo[0]?.sales || 0;
    const current = lastTwo[1]?.sales || 0;
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const trend = getSalesTrend();

  const kpis = [
    {
      title: t("dashboard.today_sales"),
      icon: DollarSign,
      value: stats?.todaySales,
      isCurrency: true,
      color: "text-primary",
      bg: "bg-primary/10",
      path: "/admin/orders",
      hint: "Voir les commandes du jour",
    },
    {
      title: t("dashboard.today_orders"),
      icon: ShoppingBag,
      value: stats?.todayOrders,
      isCurrency: false,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      path: "/admin/orders",
      hint: "Ouvrir les commandes",
    },
    {
      title: t("dashboard.total_products"),
      icon: Package,
      value: stats?.totalProducts,
      isCurrency: false,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      path: "/admin/products",
      hint: "Gérer les produits",
    },
    {
      title: t("dashboard.active_employees"),
      icon: Users,
      value: stats?.totalEmployees,
      isCurrency: false,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      path: "/admin/employees",
      hint: "Voir l'équipe",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col xl:flex-row xl:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("dashboard.overview")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("dashboard.today_snapshot")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/10 bg-card shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-primary/70">Mise à jour toutes les 5s</span>
            </div>

            {trend !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/10 bg-card shadow-sm">
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
          </div>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, idx) => (
            <motion.div
              key={item.title}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -3 }}
            >
              <Card
                onClick={() => setLocation(item.path)}
                className="cursor-pointer bg-card border-border shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground/80">{item.title}</CardTitle>
                  <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </CardHeader>

                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      {item.isCurrency ? formatCurrency(item.value || 0) : item.value?.toLocaleString() || 0}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                    <ArrowUpRight className="h-4 w-4 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="bg-card border-border rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif font-bold text-foreground">
                {t("dashboard.sales_last_7_days")}
              </CardTitle>
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
                      <YAxis tickFormatter={(val) => formatCurrency(Number(val))} tick={{ fontSize:8}}/>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} />
                      <Line type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            onClick={() => setLocation("/admin/expenses")}
            className="cursor-pointer bg-card border-border rounded-2xl shadow-sm hover:shadow-md transition-all"
          >
            <CardHeader>
              <CardTitle className="text-lg font-serif font-bold text-foreground">
                {t("dashboard.financial_summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {statsLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
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
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>

                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("dashboard.monthly_expenses")}</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(stats?.monthExpenses || 0)}
                      </p>
                    </div>
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("dashboard.estimated_profit")}</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(stats?.monthProfit || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t("dashboard.revenue_minus_expenses")}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-green-600" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
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
                      <XAxis type="number" tickFormatter={(val) => formatCurrency(Number(val))} />
                      <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="totalRevenue" fill="#0f766e" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif font-bold text-foreground">
                {t("dashboard.orders_by_employee")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salaryLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salaryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={86}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {salaryPieData.map((entry, index) => (
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
        </div>
      </div>
    </AdminLayout>
  );
}