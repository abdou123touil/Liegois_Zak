import { useGetSalesByDay, useGetTopProducts, useGetSalarySummary } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Stats() {
  const { t } = useTranslation();
  const { data: salesData, isLoading: salesLoading } = useGetSalesByDay({ days: 7 });
  const { data: topProducts, isLoading: productsLoading } = useGetTopProducts({ limit: 5 });
  const { data: salarySummary, isLoading: salaryLoading } = useGetSalarySummary();

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('fr-TN', { 
    style: 'currency', 
    currency: 'TND' 
  }).format(val);
};
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('stats.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('stats.subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sales by day chart (simplified table) */}
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" /> {t('stats.daily_sales_title', { days: 7 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-2">
                  {salesData?.map((day, idx) => (
                    <motion.div
                      key={day.date}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex justify-between items-center p-2 border-b border-primary/10"
                    >
                      <span className="text-primary/80">{new Date(day.date).toLocaleDateString()}</span>
                      <span className="font-semibold text-primary">{formatCurrency(day.sales)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="border-primary/10 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" /> {t('stats.top_products_title', { limit: 5 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-2">
                  {topProducts?.map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border-b border-primary/10">
                      <span className="text-primary/90">{prod.productName}</span>
                      <span className="font-semibold text-primary">{formatCurrency(prod.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary summary */}
          <Card className="border-primary/10 shadow-md rounded-2xl md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" /> {t('stats.salary_summary_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salaryLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="text-left p-2 text-sm font-medium text-primary/70">{t('stats.table.employee')}</th>
                        <th className="text-left p-2 text-sm font-medium text-primary/70">{t('stats.table.role')}</th>
                        <th className="text-left p-2 text-sm font-medium text-primary/70">{t('stats.table.orders_handled')}</th>
                        <th className="text-left p-2 text-sm font-medium text-primary/70">{t('stats.table.salary')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salarySummary?.map((emp, idx) => (
                        <motion.tr
                          key={emp.employeeId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5"
                        >
                          <td className="p-2 text-primary/90">{emp.employeeName}</td>
                          <td className="p-2 text-primary/70">{emp.role}</td>
                          <td className="p-2 text-primary/70">{emp.ordersHandled}</td>
                          <td className="p-2 font-semibold text-primary">{formatCurrency(emp.monthlySalary || (emp.hourlyRate! * emp.hoursPerMonth!))}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}