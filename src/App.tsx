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

const queryClient = new QueryClient();

// Composant qui contient toute la logique de routage et attend l’utilisateur
function AppRouter() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirection initiale si nécessaire
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else {
        const currentPath = window.location.pathname;
        if (currentPath === "/login" || currentPath === "/") {
          console.log("Redirecting based on user role:", user.role);
          if (user.role === "admin") {
            setLocation("/admin");
          } else if (user.role === "cashier") {
            setLocation("/pos");
          } else {
            setLocation("/login");
          }
        }
      }
    }
    console.log("Auth state changed:", { user, isLoading });
    console.log("Current location:", window.location.pathname);
  }, [user, isLoading, setLocation]);

  // Tant que l’utilisateur n’est pas chargé, afficher un spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Si pas d’utilisateur, afficher la page de login (mais elle ne clignotera pas car isLoading=false)
  if (!user) {
    console.log("No user found, showing login page");
    return (
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/">
          <Login />
        </Route>

      </Switch>
    );
  }

  // Utilisateur connecté : afficher les routes protégées
  return (
    <Switch>
       <Route path="/login">
          {user.role === undefined && <Login />}
        </Route>
        <Route path="/">
          {user.role === undefined && <Login />}
        </Route>
      <Route path="/pos">
      {user.role === undefined && <Login />}
        {user.role === "cashier" && <Pos />}
        {user.role === "admin" && <Dashboard />}
        
      </Route>
      <Route path="/admin">
        {user.role === "admin" && <Dashboard />}
      </Route>
      <Route path="/admin/products">
        {user.role === "admin" && <Products />}
      </Route>
      <Route path="/admin/categories">
        {user.role === "admin" && <Categories />}
      </Route>
      <Route path="/admin/employees">
        {user.role === "admin" && <Employees />}
      </Route>
      <Route path="/admin/expenses">
        {user.role === "admin" && <Expenses />}
      </Route>
      <Route path="/admin/orders">
        {user.role === "admin" && <Orders />}
      </Route>
      <Route path="/admin/stats">
        {user.role === "admin" && <Stats />}
      </Route>
      <Route path="/">
        {user.role === "admin" && <Dashboard />}
        {user.role === "cashier" && <Pos />}
        {user.role === null && <Login />}
      </Route>
    
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