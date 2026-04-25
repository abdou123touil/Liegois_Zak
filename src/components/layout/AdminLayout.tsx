import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Receipt,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Croissant,
  Calendar,
  ClipboardList,
  Clock,
  PackageOpen,
  ShoppingCart,
  Truck,
  Umbrella
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: "/admin/orders", icon: FileText, label: t('nav.orders') },
    { href: "/admin/products", icon: Package, label: t('nav.products') },
    { href: "/admin/categories", icon: Tags, label: t('nav.categories') },
    { href: "/admin/employees", icon: Users, label: t('nav.employees') },
    { href: "/admin/expenses", icon: Receipt, label: t('nav.expenses') },
    { href: "/admin/stats", icon: BarChart3, label: t('nav.analytics') },
    { href: "/admin/fournisseurs", icon: Truck, label: t('nav.suppliers') },
    { href: "/admin/achats", icon: ShoppingCart, label: t('nav.purchases') },
    { href: "/admin/matieres-premieres", icon: PackageOpen, label: t('nav.raw_materials') },
    { href: "/admin/stock-journalier", icon: Calendar, label: t('nav.daily_stock') },
    { href: "/admin/demandes-achat", icon: ClipboardList, label: t('nav.purchase_requests') },
    { href: "/admin/conges", icon: Umbrella, label: t('nav.leaves') },
    { href: "/admin/pointages", icon: Clock, label: t('nav.attendance') },
    { href: "/admin/fiches-paie", icon: FileText, label: t('nav.payroll') },
  ];

  const formattedDate = new Date().toLocaleDateString(
    i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Image de fond pains */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')" }}
      />
      {/* Superposition turquoise avec opacité */}
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />

      {/* Contenu principal */}
      <div className="relative z-10 flex h-screen">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Croissant className="w-6 h-6 text-primary" />
              <span className="font-serif font-bold text-lg tracking-wide text-primary">{t('app.short_name')}</span>
            </div>
            <button className="lg:hidden text-foreground/70" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:bg-accent hover:text-foreground"
                    )}>
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card">
            <div className="mb-4 px-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-foreground/60 capitalize">{user?.role}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {t('actions.logout')}
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border bg-background/80 backdrop-blur-sm">
            <button
              className="lg:hidden text-foreground p-2 -ml-2 rounded-md hover:bg-accent transition"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="font-serif font-medium text-lg text-primary lg:hidden">
              {t('app.short_name')}
            </div>
            <LanguageSwitcher />
            <div className="hidden lg:flex items-center text-foreground/70 text-sm font-medium">
              {formattedDate}
            </div>
            <ThemeToggle />
          </header>
          <div className="flex-1 overflow-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}