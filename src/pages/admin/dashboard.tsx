import { useGetDashboardStats } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, Users, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useGetDashboardStats();

 
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('fr-TN', { 
    style: 'currency', 
    currency: 'TND' 
  }).format(val);
};


  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-serif font-bold text-foreground">{t('dashboard.overview')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.today_snapshot')}</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: t('dashboard.today_sales'), icon: DollarSign, value: stats?.todaySales, isCurrency: true },
            { title: t('dashboard.today_orders'), icon: ShoppingBag, value: stats?.todayOrders, isCurrency: false },
            { title: t('dashboard.total_products'), icon: Package, value: stats?.totalProducts, isCurrency: false },
            { title: t('dashboard.active_employees'), icon: Users, value: stats?.totalEmployees, isCurrency: false },
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
                  <item.icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      {item.isCurrency ? formatCurrency(item.value || 0) : item.value || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-serif font-semibold text-foreground mt-6">{t('dashboard.monthly_performance')}</h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -3 }}
            className="md:col-span-1"
          >
            <Card className="bg-primary/5 border-border rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">{t('dashboard.monthly_revenue')}</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.monthSales || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.from_orders', { count: stats?.monthOrders || 0 })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -3 }}
          >
            <Card className="bg-destructive/5 border-border rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">{t('dashboard.monthly_expenses')}</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(stats?.monthExpenses || 0)}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ y: -3 }}
            className="md:col-span-2"
          >
            <Card className="bg-green-500/5 border-border rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">{t('dashboard.estimated_profit')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(stats?.monthProfit || 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.revenue_minus_expenses')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}