import { useListOrders } from "@/lib/api-client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Orders() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useListOrders();

 const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('fr-TN', { 
    style: 'currency', 
    currency: 'TND' 
  }).format(val);
};

  const getPaymentBadge = (method: string) => {
    const variants: Record<string, string> = {
      cash: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      card: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      other: "bg-secondary text-gray-700 dark:text-gray-300",
    };
    return variants[method] || "bg-secondary";
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return t('orders.payment_methods.cash');
      case 'card': return t('orders.payment_methods.card');
      default: return t('orders.payment_methods.other');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('orders.title')}
          </h1>
          <p className="text-primary/60 text-sm mt-1">{t('orders.subtitle')}</p>
        </div>

        <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary">{t('orders.history_title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.order_id')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.date')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.total')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.payment')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.cashier')}</th>
                    <th className="text-left p-4 text-sm font-medium text-primary/70">{t('orders.table.items')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12"><Skeleton className="h-8 w-full" /></td></tr>
                  ) : orders?.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('orders.empty')}</td></tr>
                  ) : (
                    <AnimatePresence>
                      {orders?.map((order, idx) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-primary/5 hover:bg-primary/5"
                        >
                          <td className="p-4 font-mono text-primary/80">#{order.id}</td>
                          <td className="p-4 text-primary/70">{new Date(order.createdAt).toLocaleString()}</td>
                          <td className="p-4 font-semibold text-primary">{formatCurrency(order.total)}</td>
                          <td className="p-4">
                            <Badge className={getPaymentBadge(order.paymentMethod)}>
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </Badge>
                          </td>
                          <td className="p-4 text-primary/70">{order.employeeName || "—"}</td>
                          <td className="p-4 text-primary/70">
                            <details className="cursor-pointer">
                              <summary className="text-sm font-medium text-primary/80">
                                {t('orders.view_items', { count: order.items.length })}
                              </summary>
                              <ul className="mt-2 space-y-1 text-xs">
                                {order.items.map((item, i) => (
                                  <li key={i} className="flex justify-between">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
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
      </div>
    </AdminLayout>
  );
}