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
} from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const [location] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

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
                                {user?.name?.charAt(0) || "U"}
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