import { useState, useMemo, useEffect } from "react";
import {
  useListCategories,
  useListProducts,
  useCreateOrder,
  getGetDashboardStatsQueryKey,
  useCreateDevis,
  useListDevis,
  useConfirmDevis,
  useCancelDevis,
  Devis,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Minus, CreditCard, Banknote, HelpCircle, ShoppingCart, Loader2, Croissant, Package, X, FileText, CheckCircle, XCircle } from "lucide-react";
import { useLogout } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

// Génération d'un QR code via Google Charts (pas de librairie externe)
const generateQrCodeUrl = (data: string, size = 150) => {
  return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(data)}&choe=UTF-8`;
};

const generateTicketHtml = (
  orderId: number,
  date: Date,
  items: CartItem[],
  subtotal: number,
  discountAmount: number,
  total: number,
  amountPaid: number,
  change: number,
  paymentMethod: string,
  qrCodeUrl?: string
) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(val);
  };
  const formatDate = (d: Date) => {
    return d.toLocaleString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket de caisse</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 300px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
        }
        .info {
          text-align: center;
          margin-bottom: 15px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .items-table th, .items-table td {
          text-align: left;
          padding: 4px 0;
        }
        .items-table td:last-child, .items-table th:last-child {
          text-align: right;
        }
        .totals {
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .qr-code {
          text-align: center;
          margin-top: 15px;
        }
        .qr-code img {
          width: 80px;
          height: 80px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">BOULANGERIE LEIGOIS</div>
        <div> Hay Ennassim 2 (près de la clinique Elmozen), Medenine</div>
        <div>Tel: +216 52 228 383</div>
      </div>
      <div class="info">
        <div>Ticket N° ${orderId}</div>
        <div>${formatDate(date)}</div>
      </div>
      <table class="items-table">
        <thead>
          <tr><th>Article</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${formatCurrency(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="totals">
        <div><span>Sous-total :</span><span>${formatCurrency(subtotal)}</span></div>
        ${discountAmount > 0 ? `<div><span>Réduction :</span><span>- ${formatCurrency(discountAmount)}</span></div>` : ''}
        <div><span>TOTAL :</span><span>${formatCurrency(total)}</span></div>
        <div><span>Payé :</span><span>${formatCurrency(amountPaid)}</span></div>
        <div><span>Rendu :</span><span>${formatCurrency(change)}</span></div>
        <div><span>Moyen :</span><span>${paymentMethod.toUpperCase()}</span></div>
      </div>
      ${qrCodeUrl ? `<div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div>` : ''}
      <div class="footer">
        Merci de votre visite !<br>
        À bientôt
      </div>
    </body>
    </html>
  `;
};

export default function Pos() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<number | undefined>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "other">("cash");
  const [amountEntered, setAmountEntered] = useState("0");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { user, setUser } = useAuth();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [devisListOpen, setDevisListOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [devisNotes, setDevisNotes] = useState("");
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const { data: categories } = useListCategories();
  const { data: products, isLoading: isLoadingProducts } = useListProducts({ categoryId: activeCategory ?? null });
  const createOrderMutation = useCreateOrder();
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const { data: devis = [] } = useListDevis();
  const createDevisMutation = useCreateDevis();
  const confirmDevisMutation = useConfirmDevis();
  const [printTicket, setPrintTicket] = useState(false);
  const cancelDevisMutation = useCancelDevis();
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      // Redirection forcée pour réinitialiser complètement l'état React
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    if (!isCartOpen) setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountedTotal = useMemo(() => {
    let total = cartTotal;
    if (discountValue && parseFloat(discountValue) > 0) {
      if (discountType === "fixed") {
        total = Math.max(0, total - parseFloat(discountValue));
      } else if (discountType === "percentage") {
        total = total * (1 - parseFloat(discountValue) / 100);
      }
    }
    return total;
  }, [cartTotal, discountType, discountValue]);

  const handleNumpad = (val: string) => {
    if (val === "C") {
      setAmountEntered("0");
    } else if (val === ".") {
      if (!amountEntered.includes(".")) setAmountEntered(amountEntered + ".");
    } else {
      if (amountEntered === "0") {
        setAmountEntered(val);
      } else {
        if (amountEntered.includes(".")) {
          const parts = amountEntered.split(".");
          if (parts[1].length >= 2) return;
        }
        setAmountEntered(amountEntered + val);
      }
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmountEntered(val.toString());
  };

  useEffect(() => {
    if (user) {
      setUserId(user.id as number);
    }
  }, [user]);

  const processPayment = async () => {
    if (cart.length === 0) return;
    const amountPaid = parseFloat(amountEntered);
    if (paymentMethod === "cash" && amountPaid < discountedTotal) {
      toast({ title: t('common.error'), description: t('pos.insufficient_funds'), variant: "destructive" });
      return;
    }

    try {
      const response = await createOrderMutation.mutateAsync({
        data: {
          employeeId: userId!,
          amountPaid: paymentMethod === "cash" ? amountPaid : discountedTotal,
          paymentMethod,
          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
          reductionMontant: discountType === "fixed" && discountValue ? parseFloat(discountValue) : null,
          reductionPourcentage: discountType === "percentage" && discountValue ? parseFloat(discountValue) : null,
          motifReduction: discountReason || "",
        },
      });

      // Contenu du QR code (personnalisable)
      const qrData = `Commande #${response.id}\nTotal: ${formatCurrency(discountedTotal)}\nDate: ${new Date().toLocaleString()}`;
      const qrCodeUrl = generateQrCodeUrl(qrData, 100);

      const discountAmount = discountType === "fixed" ? (parseFloat(discountValue) || 0) : (cartTotal * (parseFloat(discountValue) || 0) / 100);
      const ticketHtml = generateTicketHtml(
        response.id,
        new Date(),
        cart,
        cartTotal,
        discountAmount,
        discountedTotal,
        paymentMethod === "cash" ? amountPaid : discountedTotal,
        paymentMethod === "cash" ? amountPaid - discountedTotal : 0,
        paymentMethod,
        qrCodeUrl
      );

      if (printTicket) {
        const printWindow = window.open("", "_blank", "width=400,height=600");

        if (printWindow) {
          printWindow.document.write(ticketHtml);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }
      }

      setPaymentModalOpen(false);
      setSuccessModalOpen(true);
      setCart([]);
      setAmountEntered("0");
      setDiscountValue("");
      setDiscountReason("");
      setPrintTicket(false);
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      setTimeout(() => setSuccessModalOpen(false), 3000);

    } catch (error) {
      toast({ title: t('common.error'), description: t('pos.payment_error'), variant: "destructive" });
    }
  };
  const handleCreateDevis = async () => {
    if (cart.length === 0 || !userId) return;

    try {
      await createDevisMutation.mutateAsync({
        employeeId: userId,
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
        notes: devisNotes || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast({ title: "Succès", description: "Devis enregistré." });
      setDevisModalOpen(false);
      setIsCartOpen(false);
      setCart([]);
      setClientName("");
      setClientPhone("");
      setDevisNotes("");
    } catch {
      toast({ title: "Erreur", description: "Impossible de créer le devis.", variant: "destructive" });
    }
  };

  const handleConfirmDevis = async (devisToConfirm: Devis) => {
    if (!userId) return;

    try {
      await confirmDevisMutation.mutateAsync({
        id: devisToConfirm.id,
        data: {
          employeeId: userId,
          paymentMethod: "cash",
          amountPaid: devisToConfirm.total,
        },
      });

      toast({ title: "Succès", description: "Devis confirmé et ajouté aux commandes." });
      setSelectedDevis(null);
      setDevisListOpen(false);
    } catch {
      toast({ title: "Erreur", description: "Impossible de confirmer le devis.", variant: "destructive" });
    }

  };
  const setQuantity = (productId: number, newQuantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      ).filter(item => item.quantity > 0)
    );
  };
  const handleCancelDevis = async (id: number) => {
    try {
      await cancelDevisMutation.mutateAsync(id);
      toast({ title: "Succès", description: "Devis annulé." });
      setSelectedDevis(null);
      setDevisListOpen(false);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'annuler le devis.", variant: "destructive" });
    }
  };
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(val);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Image de fond pains */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />

      <div className="relative z-10 flex h-screen">
        {/* Main content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-primary/10 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <Croissant className="w-6 h-6 text-primary" />
              <span className="font-serif font-bold text-xl tracking-tight text-primary">{t('app.name')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-primary/70 hidden sm:block">
                {new Date().toLocaleDateString(t('locale'), { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <LanguageSwitcher />
              <ThemeToggle />
              <div className="flex items-center gap-3 border-l border-primary/20 pl-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.name?.charAt(0) || "C"}
                </div>
                <span className="text-sm font-medium hidden sm:block text-primary/80">{user?.name}</span>
                <Button variant="outline" onClick={() => setDevisListOpen(true)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Devis
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary/60 hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                </Button>

              </div>
            </div>
          </header>

          {/* Barre des catégories avec défilement horizontal */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-primary/10 shrink-0 pt-2 px-2 overflow-x-auto">
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={(v) => setActiveCategory(v === "all" ? undefined : parseInt(v))}
            >
              <TabsList className="inline-flex h-auto p-1 bg-transparent gap-2">
                <TabsTrigger
                  value="all"
                  className="px-6 py-3 text-base rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none transition-all whitespace-nowrap"
                >
                  {t('pos.all_products')}
                </TabsTrigger>
                {categories?.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id.toString()}
                    className="px-6 py-3 text-base rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none transition-all whitespace-nowrap"
                  >
                    <span className="mr-2">{cat.icon}</span> {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Grille des produits */}
          <ScrollArea className="flex-1 p-4 sm:p-6">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                <AnimatePresence>
                  {products?.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart(product)}
                      className="cursor-pointer"
                    >
                      <Card className="h-full border border-primary/10 shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden bg-card">
                        <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl text-primary/30">
                              {categories?.find(c => c.id === product.categoryId)?.icon || <Croissant className="w-12 h-12" />}
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold shadow-sm text-primary">
                            {formatCurrency(product.price)}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="font-semibold text-primary/90 line-clamp-2 leading-tight">{product.name}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {products?.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-primary/50">
                    <Package className="h-12 w-12 mb-4 opacity-30" />
                    <p>{t('pos.no_products')}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Bouton flottant pour ouvrir le panier (mobile/tablet) */}
          {!isCartOpen && cart.length > 0 && (
            <Button
              onClick={() => setIsCartOpen(true)}
              className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 lg:hidden"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </Button>
          )}
        </div>

        {/* Sidebar du panier */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsCartOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-80 z-50 bg-card border-l border-primary/10 shadow-xl flex flex-col lg:relative lg:translate-x-0"
              >
                <div className="h-16 flex items-center justify-between px-5 border-b border-primary/10 bg-card shrink-0">
                  <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> {t('pos.current_order')}
                  </h2>
                  <div className="flex items-center gap-2">
                    {cart.length > 0 && (
                      <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} {t('pos.items')}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="lg:hidden">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <AnimatePresence initial={false}>
                    {cart.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-64 text-primary/50"
                      >
                        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                          <ShoppingCart className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="font-medium">{t('pos.cart_empty')}</p>
                        <p className="text-sm text-center mt-1 px-8">{t('pos.cart_hint')}</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <motion.div
                            key={item.productId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 bg-primary/5 border border-primary/10 p-3 rounded-xl"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-primary/90 truncate">{item.name}</div>
                              <div className="text-sm text-primary font-semibold mt-1">{formatCurrency(item.price * item.quantity)}</div>
                            </div>
                            <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md hover:bg-primary/10"
                                onClick={() => updateQuantity(item.productId, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.quantity}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  // Autorise : chiffres, un point, nombres décimaux
                                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                    const num = parseFloat(val);
                                    if (!isNaN(num) && num >= 0) {
                                      setQuantity(item.productId, num);
                                    } else if (val === "") {
                                      setQuantity(item.productId, 0);
                                    } else if (val === ".") {
                                      // Permet de commencer par un point (ex: .5 → 0.5)
                                      setQuantity(item.productId, 0);
                                    }
                                  }
                                }}
                                className="w-12 text-center text-sm font-bold text-primary bg-transparent border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md hover:bg-primary/10"
                                onClick={() => updateQuantity(item.productId, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
                <div className="shrink-0 border-t border-primary/10 bg-card p-5 space-y-4">
                  <div className="space-y-2 border-t border-primary/10 pt-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-primary/70 whitespace-nowrap">Réduction</Label>
                      <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                        <SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Montant</SelectItem>
                          <SelectItem value="percentage">Pourcentage</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder={discountType === "fixed" ? "TND" : "%"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-24"
                      />

                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-primary/70 text-sm">
                      <span>{t('pos.subtotal')}</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-primary/70 text-sm">
                      <span>{t('pos.tax')}</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between text-primary font-bold text-2xl pt-2 border-t border-dashed border-primary/20">
                      <span>{t('pos.total')}</span>
                      <span className="text-primary">{formatCurrency(discountedTotal)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl gap-2"
                    disabled={cart.length === 0}
                    onClick={() => setDevisModalOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Créer un devis
                  </Button>
                  <Button
                    className="w-full h-14 text-lg rounded-xl shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90"
                    disabled={cart.length === 0}
                    onClick={() => {
                      setPaymentMethod("cash");
                      setAmountEntered(discountedTotal.toString());
                      setPrintTicket(false);
                      setPaymentModalOpen(true);
                    }}
                  >
                    {t('pos.pay')} {formatCurrency(discountedTotal)}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Dialog open={devisModalOpen} onOpenChange={setDevisModalOpen}>
          <DialogContent className="sm:max-w-[520px] rounded-2xl bg-card border border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">Créer un devis</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Client</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom client" />
                </div>
                <div className="grid gap-2">
                  <Label>Téléphone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+216..." />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={devisNotes} onChange={(e) => setDevisNotes(e.target.value)} placeholder="Remarque optionnelle" />
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="flex justify-between pt-3 border-t border-primary/10 text-lg font-bold text-primary">
                  <span>Total</span>
                  <span>{formatCurrency(discountedTotal)}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-xl"
                onClick={handleCreateDevis}
                disabled={createDevisMutation.isPending}
              >
                {createDevisMutation.isPending ? "Enregistrement..." : "Enregistrer le devis"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={devisListOpen} onOpenChange={setDevisListOpen}>
          <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">Devis en attente</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {devis.filter((d) => d.status === "EN_ATTENTE").length === 0 ? (
                <div className="py-10 text-center text-primary/50">Aucun devis en attente</div>
              ) : (
                devis
                  .filter((d) => d.status === "EN_ATTENTE")
                  .map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-primary">
                          Devis #{d.id} {d.clientName ? `- ${d.clientName}` : ""}
                        </div>
                        <div className="text-sm text-primary/60">
                          {new Date(d.createdAt).toLocaleString()} - {d.items.length} articles
                        </div>
                        {d.notes && <div className="text-sm text-primary/70 mt-1">{d.notes}</div>}
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">{formatCurrency(d.total)}</div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => setSelectedDevis(d)}>
                            Voir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!selectedDevis} onOpenChange={(open) => !open && setSelectedDevis(null)}>
          <DialogContent className="sm:max-w-[620px] rounded-2xl bg-card border border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">
                Devis #{selectedDevis?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedDevis && (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/10 p-4 bg-primary/5">
                  <div className="text-sm text-primary/60">Client</div>
                  <div className="font-medium text-primary">
                    {selectedDevis.clientName || "Non renseigné"}
                  </div>
                  {selectedDevis.clientPhone && (
                    <div className="text-sm text-primary/70">{selectedDevis.clientPhone}</div>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedDevis.items.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-primary/10 py-2">
                      <div>
                        <div className="font-medium text-primary">{item.productName}</div>
                        <div className="text-sm text-primary/60">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div className="font-semibold text-primary">{formatCurrency(item.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xl font-bold text-primary pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedDevis.total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleCancelDevis(selectedDevis.id)}
                    disabled={cancelDevisMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Annuler
                  </Button>

                  <Button
                    className="gap-2"
                    onClick={() => handleConfirmDevis(selectedDevis)}
                    disabled={confirmDevisMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirmer achat
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Modal de paiement repensé */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-primary/20 shadow-2xl p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>{t('pos.payment_title')}</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-5">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl">
                <span className="text-lg font-semibold text-primary/80">{t('pos.total_due')}</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(discountedTotal)}</span>
              </div>

              <div>
                <label className="text-sm font-medium text-primary/70 mb-1 block">{t('pos.payment_method')}</label>
                <Select value={paymentMethod} onValueChange={(val: any) => {
                  setPaymentMethod(val);
                  if (val !== "cash") {
                    setAmountEntered(discountedTotal.toString());
                  }
                }}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder={t('pos.select_payment_method')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> {t('pos.cash')}</div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t('pos.card')}</div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> {t('pos.other')}</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "cash" && (
                <>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-right text-3xl font-mono tracking-wider shadow-inner text-primary">
                    {formatCurrency(parseFloat(amountEntered || "0"))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["7", "8", "9", "+10", "4", "5", "6", "+20", "1", "2", "3", "+50", "C", "0", ".", "+100"].map((key, i) => (
                      <Button
                        key={i}
                        variant={key === "C" ? "destructive" : key.startsWith("+") ? "secondary" : "outline"}
                        className="h-14 text-xl font-medium rounded-xl"
                        onClick={() => {
                          if (key.startsWith("+")) {
                            handleQuickAmount(parseFloat(amountEntered || "0") + parseInt(key.substring(1)));
                          } else {
                            handleNumpad(key);
                          }
                        }}
                      >
                        {key}
                      </Button>
                    ))}
                  </div>
                  {parseFloat(amountEntered) > discountedTotal && (
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl text-green-700">
                      <span className="font-medium">{t('pos.change')}</span>
                      <span className="text-xl font-bold">{formatCurrency(parseFloat(amountEntered) - discountedTotal)}</span>
                    </div>
                  )}
                </>
              )}

              {paymentMethod !== "cash" && (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-3 bg-primary/5 rounded-xl">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    {paymentMethod === "card" ? <CreditCard className="h-8 w-8 text-primary" /> : <HelpCircle className="h-8 w-8 text-primary" />}
                  </div>
                  <p className="text-sm text-primary/70">{t('pos.payment_instruction')}</p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
                <div>
                  <Label htmlFor="printTicket" className="font-medium text-primary">
                    Imprimer le ticket
                  </Label>
                  <p className="text-xs text-primary/60 mt-0.5">
                    Générer le ticket de caisse après validation
                  </p>
                </div>

                <Checkbox
                  id="printTicket"
                  checked={printTicket}
                  onCheckedChange={(checked) => setPrintTicket(!!checked)}
                />
              </div>
              <Button
                className="w-full h-12 text-base rounded-xl shadow-md bg-primary hover:bg-primary/90 disabled:opacity-50"
                disabled={(paymentMethod === "cash" && parseFloat(amountEntered) < discountedTotal) || createOrderMutation.isPending}
                onClick={processPayment}
              >
                {createOrderMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : t('pos.complete_order')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent className="sm:max-w-[400px] border-none bg-transparent shadow-none [&>button]:hidden">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border border-primary/20"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">{t('pos.order_complete')}</h2>
              <p className="text-primary/70">{t('pos.ready_next')}</p>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}