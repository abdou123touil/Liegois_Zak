import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from '@/lib/theme';
import Login from "@/pages/login";
import Dashboard from "@/pages/admin/dashboard";
import Pos from "@/pages/pos";
import Products from "@/pages/admin/products";
import Categories from "@/pages/admin/categories";
import Employees from "@/pages/admin/employees";
import Expenses from "@/pages/admin/expenses";
import Orders from "@/pages/admin/orders";
import Stats from "@/pages/admin/stats";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import Fournisseurs from "./pages/admin/Fournisseurs";
import Achats from "./pages/admin/Achats";
import Conges from "./pages/admin/Conges";
import DemandesAchat from "./pages/admin/DemandesAchat";
import FichesPaie from "./pages/admin/FichesPaie";
import MatieresPremieres from "./pages/admin/MatieresPremieres";
import Pointages from "./pages/admin/Pointages";
import StockJournalier from "./pages/admin/StockJournalier";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/ui/AnimatedPage";
// Nouveaux composants pour les rôles
import ChefDashboard from "./pages/chef/dashboard";
import ResponsableDashboard from "./pages/responsable/dashboard";
import ResponsableStockJournalier from "./pages/responsable/stock-journalier";
import OtherDashboard from "./pages/other/dashboard";
import OtherConges from "./pages/other/conges";
import OtherPointages from "./pages/other/pointages";
import ChefDemandesAchat from "./pages/chef/demandes-achat";
import ChefMatieresPremieres from "./pages/chef/matieres-premieres";
import ResponsablePointages from "./pages/responsable/pointages";
import ChefPointages from "./pages/chef/pointages";
import Echanges from "./pages/admin/Echanges";
import ChefCalculCoutProduit from "./pages/chef/calcul-cout-produit";
import DemandeGateau from "./pages/public/DemandeGateau";
import ChefDemandesGateaux from "./pages/chef/demandes-gateaux";
const queryClient = new QueryClient();

// Composant qui contient toute la logique de routage
function AppRouter() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirection initiale
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else {
        const currentPath = window.location.pathname;
        if (currentPath === "/login" || currentPath === "/") {
          const role = user.role?.toLowerCase();
          if (role === "admin") setLocation("/admin");
          else if (role === "chef") setLocation("/chef");
          else if (role === "responsable") setLocation("/responsable");
          else if (role === "other") setLocation("/other");
          else if (role === "cashier") setLocation("/pos");
          else setLocation("/login");
        }
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginRoutes />;

  const role = user.role?.toLowerCase();

  return (
    <AnimatePresence mode="wait">
      <AnimatedPage key={location}>
        <Switch>
          {/* Routes communes */}
          <Route path="/login" component={Login} />
          <Route path="/demande-gateau" component={DemandeGateau} />
          {/* Routes Admin */}
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/products" component={Products} />
          <Route path="/admin/categories" component={Categories} />
          <Route path="/admin/employees" component={Employees} />
          <Route path="/admin/expenses" component={Expenses} />
          <Route path="/admin/orders" component={Orders} />
          <Route path="/admin/stats" component={Stats} />
          <Route path="/admin/fournisseurs" component={Fournisseurs} />
          <Route path="/admin/achats" component={Achats} />
          <Route path="/admin/echanges" component={Echanges} />
          <Route path="/admin/matieres-premieres" component={MatieresPremieres} />
          <Route path="/admin/stock-journalier" component={StockJournalier} />
          <Route path="/admin/demandes-achat" component={DemandesAchat} />
          <Route path="/admin/conges" component={Conges} />
          <Route path="/admin/pointages" component={Pointages} />
          <Route path="/admin/fiches-paie" component={FichesPaie} />

          {/* Routes Chef */}
          {role === "chef" && (
            <>
              <Route path="/chef" component={ChefDashboard} />
              <Route path="/chef/demandes-achat" component={ChefDemandesAchat} />
              <Route path="/chef/matieres-premieres" component={ChefMatieresPremieres} />
              <Route path="/chef/pointages" component={ChefPointages} />
              <Route path="/chef/calcul-cout-produit" component={ChefCalculCoutProduit} />
              <Route path="/chef/demandes-gateaux" component={ChefDemandesGateaux} />
            </>
          )}

          {/* Routes Responsable */}
          {role === "responsable" && (
            <>
              <Route path="/responsable" component={ResponsableDashboard} />
              <Route path="/responsable/pointages" component={ResponsablePointages} />
              <Route path="/responsable/stock-journalier" component={ResponsableStockJournalier} />

            </>
          )}

          {/* Routes Other (employé standard) */}
          {role === "other" && (
            <>
              <Route path="/other" component={OtherDashboard} />
              <Route path="/other/conges" component={OtherConges} />
              <Route path="/other/pointages" component={OtherPointages} />
            </>
          )}

          {/* Route POS pour cashier */}
          <Route path="/pos" component={Pos} />

          {/* Fallback pour les routes non trouvées */}
          <Route path="/:rest*" component={NotFound} />
        </Switch>
      </AnimatedPage>
    </AnimatePresence>
  );
}

// Composant pour l'affichage du spinner
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// Routes de login (quand utilisateur non connecté)
function LoginRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Login} />
      <Route path="/:rest*" component={Login} />
      <Route path="/demande-gateau" component={DemandeGateau} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;