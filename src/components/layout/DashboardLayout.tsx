// src/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Calendar,
    Clock,
    LogOut,
    Menu,
    X,
    Croissant,
    Users,
    ShoppingBag,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const [location] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const role = user?.role?.toLowerCase() as "chef" | "responsable" | "other" | undefined;

    // Menu selon rôle
    const navItems = (() => {
        switch (role) {
            case "chef":
                return [
                    { href: "/chef", icon: LayoutDashboard, label: t('dashboard.home') },
                    { href: "/chef/demandes-achat", icon: ClipboardList, label: t('dashboard.purchase_requests') },
                    { href: "/chef/matieres-premieres", icon: Package, label: t('dashboard.raw_materials') },
                    { href: "/chef/pointages", icon: Clock, label: t('dashboard.attendance') },
                    { href: "/chef/calcul-cout-produit", icon: ShoppingBag, label: t('dashboard.cost_calculation') },
                    { href: "/chef/demandes-gateaux", icon: Users, label: t('dashboard.cake_requests') },
                ];
            case "responsable":
                return [
                    { href: "/responsable", icon: LayoutDashboard, label: t('dashboard.home') },
                    { href: "/responsable/stock-journalier", icon: Package, label: t('dashboard.daily_stock') },
                    { href: "/responsable/pointages", icon: Clock, label: t('dashboard.attendance') },
                ];
            case "other":
                return [
                    { href: "/other", icon: LayoutDashboard, label: t('dashboard.home') },
                    { href: "/other/pointages", icon: Clock, label: t('dashboard.attendance') },
                    { href: "/other/conges", icon: Calendar, label: t('dashboard.leaves') },
                ];
            default:
                return [];
        }
    })();

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // The local UI still returns to the login screen if the network is unavailable.
        } finally {
            window.location.href = "/login";
        }
    };

    const formattedDate = new Date().toLocaleDateString(
        i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    );

    return (
        <div className="app-shell relative min-h-screen overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')" }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-background/65 backdrop-blur-[2px] dark:bg-background/75" />
            {/* Contenu principal */}
            <div className="relative z-10 flex h-screen">
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <aside className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-card/95 border-r border-border/80 shadow-xl backdrop-blur-xl transition-[transform,width] duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
                    isSidebarCollapsed ? "lg:w-20" : "lg:w-72",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className={cn("flex items-center h-16 border-b border-border bg-card", isSidebarCollapsed ? "justify-center px-3 lg:px-2" : "justify-between px-6")}>
                        <div className="flex items-center gap-2">
                            <Croissant className="w-6 h-6 text-primary" />
                            <span className={cn("font-serif font-bold text-lg tracking-wide text-primary", isSidebarCollapsed && "lg:hidden")}>{t('app.short_name')}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:inline-flex shrink-0"
                            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                            aria-label={isSidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
                            aria-expanded={!isSidebarCollapsed}
                            title={isSidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
                        >
                            {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                        </Button>
                        <button className="lg:hidden text-foreground/70" onClick={() => setIsSidebarOpen(false)}>
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="space-y-1 px-3">
                            {navItems.map((item) => {
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.href} href={item.href} aria-label={item.label}>
                                        <span className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent transition-all duration-200 text-sm font-medium cursor-pointer",
                                            isSidebarCollapsed && "lg:justify-center lg:px-2",
                                            isActive
                                                ? "border-primary/15 bg-primary/10 text-primary shadow-sm"
                                                : "text-foreground/70 hover:border-border/70 hover:bg-background/80 hover:text-foreground"
                                        )} title={isSidebarCollapsed ? item.label : undefined}>
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span className={cn("truncate", isSidebarCollapsed && "lg:hidden")}>{item.label}</span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    <div className="p-4 border-t border-border bg-card">
                        <div className={cn("mb-4 flex items-center gap-3", isSidebarCollapsed ? "justify-center px-0 lg:px-0" : "px-3")}>
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <div className={cn("overflow-hidden", isSidebarCollapsed && "lg:hidden")}>
                                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                                <p className="text-xs text-foreground/60 capitalize">{user?.role}</p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all", isSidebarCollapsed && "lg:justify-center lg:px-0")}
                            title={isSidebarCollapsed ? t('actions.logout') : undefined}
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className={cn(isSidebarCollapsed && "lg:hidden")}>{t('actions.logout')}</span>
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border/80 bg-background/80 backdrop-blur-xl">
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
