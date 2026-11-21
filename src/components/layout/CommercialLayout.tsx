import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const logout = useLogout();
  const handleLogout = async () => { await logout.mutateAsync(); setUser(null); window.location.href = "/login"; };
  return <div className="min-h-screen bg-muted/30">
    <header className="flex items-center justify-between border-b bg-background px-5 py-3">
      <Link href="/commercial"><span className="flex cursor-pointer items-center gap-2 font-semibold"><Store className="h-5 w-5 text-primary"/> Espace commercial</span></Link>
      <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{user?.name}</span><Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Déconnexion</Button></div>
    </header>
    <main className="mx-auto max-w-6xl p-5 md:p-8">{children}</main>
  </div>;
}
