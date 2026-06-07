import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;//     || "http://localhost:8081/api";

let token: string | null = null;
export type SalesByDay = {
  date: string;
  sales: number;
};

// 🔹 Top Products Type (for typing the top products data)
export type TopProduct = {
  productName: string;
  totalRevenue: number;
};

// 🔹 Salary Summary Type (for typing employee salary data)
export type SalarySummary = {
  employeeId: number;
  employeeName: string;
  role: string;
  ordersHandled: number;
  monthlySalary?: number;
  hourlyRate?: number;
  hoursPerMonth?: number;
};

// Dans api-client.ts, mettez à jour Employee
export type Employee = {
  id: number;
  name: string;
  username: string;
  password?: string; // Ajoutez ce champ pour la création/mise à jour
  role: "admin" | "cashier" | "ADMIN" | "CASHIER" | "CHEF" | "RESPONSABLE" | "OTHER";
  poste?: string;           // ← ajoutez ce champ
  hourlyRate?: number;
  hoursPerMonth?: number;
  monthlySalary?: number;
  isActive: boolean;
  dateEmbauche?: string;
  congesParAn?: number;
  joursCongeRestants?: number;
};
export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
};
export type Product = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  categoryName?: string;
};
export type Expense = {
  id: number;
  label: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
};

export type Order = {
  id: number;
  createdAt: string;
  total: number;
  paymentMethod: string;
  employeeId: number;
  employeeName?: string;
  amountPaid: number;
  change?: number;
  items: Array<{ productName: string; quantity: number; unitPrice: number; subtotal: number }>;
};
// ==================== FOURNISSEURS ====================
export interface Fournisseur {
  id: number;
  nom: string;
  societe?: string;
  telephone: string;
  email?: string;
  adresse?: string;
  actif: boolean;
  defaultDelayLivraison?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== ACHATS ====================
export interface Achat {
  id: number;
  fournisseur: Fournisseur;
  nomProduit: string;
  quantite: number;
  uniteMesure: string;
  prixUnitaire: number;
  prixTotal: number;
  dateAchat: string;
  factureRef?: string;
  notes?: string;
  createdAt: string;
}

// ==================== MATIÈRES PREMIÈRES ====================
export interface MatierePremiere {
  id: number;
  nom: string;
  uniteMesure: string;
  seuilAlerte: number;
  fournisseurPrefere?: Fournisseur;
  actif: boolean;
  uniteBase?: string;
  quantiteBaseParUnite?: number;
  seuilAlerteBase?: number;
}

export interface StockMatiere {
  id: number;
  matiere: MatierePremiere;
  quantiteActuelle: number;
  lastUpdated: string;
}

// ==================== STOCK JOURNALIER ====================
export interface StockJournalierLigne {
  id?: number;
  productId: number;
  productName?: string;
  quantiteProduite: number;
  quantiteVendue?: number;
  quantiteInvendue?: number;
  quantitePerdue?: number;
}

export interface StockJournalier {
  id: number;
  date: string;
  lignes: StockJournalierLigne[];
}

export interface CreateStockJournalierRequest {
  date: string;
  lignes: Array<{
    productId: number;
    quantiteProduite: number;
    quantitePerdue?: number;
  }>;
}

// ==================== DEMANDES D'ACHAT ====================
export interface DemandeAchat {
  id: number;
  produit: string;
  quantite: number;
  uniteMesure: string;
  fournisseurSuggere?: Fournisseur["id"];
  urgence: boolean;
  statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
  demandePar?: Employee;
  createdAt: string;
}

// ==================== CONGÉS ====================
export interface Conge {
  id: number;
  employeeId: number;
  employeeName: string;
  employeePoste?: string;
  dateDebut: string;
  dateFin: string;
  type: string;
  valide: boolean;
  motif?: string;
  demandeLe: string;
  reponseLe?: string;
  statue: "EN_ATTENTE" | "ACCEPTE" | "REFUSE";
}

// ==================== POINTAGES ====================
export interface Pointage {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  heureArrivee: string;
  heureDepart?: string;
  heuresTravaillees?: number;
  heuresSupplementaires?: number;
  statut: string;
  heuresPause?: number;

}

// ==================== FICHES DE PAIE ====================
export interface FichePaie {
  id: number;
  employeeId: number;
  employeeName: string;
  mois: number;
  annee: number;
  salaireBrut: number;
  salaireBase?: number;           // ajout
  heuresNormales: number;
  heuresSupplementaires: number;
  tauxHoraire: number;
  indemnites: number;
  deductions: number;
  salaireNet: number;
  joursCongePayes?: number;       // ajout
  joursCongeNonPayes?: number;    // ajout
  dateGeneration: string;
}
// Demandes d'achat
export interface DemandeAchat {
  id: number;
  produit: string;
  quantite: number;
  uniteMesure: string;
  fournisseurSuggere?: Fournisseur["id"];
  urgence: boolean;
  statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
  demandePar?: Employee;
  createdAt: string;
}

// Stock journalier

export interface ParametresPaie {
  id: number;
  indemniteTransport: number;
  tauxCotisationsSociales: number;
  majorationHeuresSup: number;
  notes?: string;
}
export interface GeneratePaieRequest {
  employeeId: number;
  mois: number;
  annee: number;
  indemniteTransport?: number;
  tauxCotisationsSociales?: number;
  majorationHeuresSup?: number;
}
export interface AlerteStock {
  matiereId: number;
  nom: string;
  stockActuel: number;
  seuilAlerte: number;
  uniteMesure: string;
}

export function useGetParametresPaie() {
  return useQuery({
    queryKey: ["parametres-paie"],
    queryFn: async () => {
      const response = await apiRequest("/parametres-paie");
      return response.json() as Promise<ParametresPaie>;
    },
  });
}

export function useUpdateParametresPaie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ParametresPaie>) => {
      const response = await apiRequest("/parametres-paie", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<ParametresPaie>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parametres-paie"] }),
  });
}


// Gestion du token
export function getToken(): string | null {
  return localStorage.getItem("jwt_token");
}

function setToken(token: string) {
  localStorage.setItem("jwt_token", token);
}

export function removeToken() {
  localStorage.removeItem("jwt_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// 🔹 UseLogin Hook (to be replaced by your actual API request)
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: { username: string; password: string } }) => {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Login failed");
      const result = await response.json();
      if (result.token) {
        setToken(result.token);
      }
      // Invalider la requête "me" pour qu'elle se relance avec le nouveau token
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      return {
        id: result.id,
        name: result.name,
        username: result.username,
        role: result.role,
        isActive: true,
      } as Employee;
    },
  });
}

export function useGetMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiRequest("/me");
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return { id: data.id, name: data.name, username: data.username, role: data.role, isActive: true };
    },
    retry: false,
  });
}
// Dans api-client.ts, modifiez useLogout
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      removeToken();
      // Invalider spécifiquement la query "me"
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      return true;
    },
  });
}
export function getListCategoriesQueryKey() {
  return ["categories"];
}

// 🔹 getListProductsQueryKey
export function getListProductsQueryKey({ categoryId }: { categoryId: number | undefined }) {
  return ["products", categoryId];
}

// 🔹 Other existing API functions (useGetMe, useLogout, etc.)

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    removeToken();
    throw new Error("Session expired");
  }
  return response;
}

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await apiRequest("/dashboard-stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    removeToken();
    throw new Error("Session expired");
  }
  return response;
}
// 🔹 Key for Dashboard Stats Query
export function getGetDashboardStatsQueryKey() {
  return ["dashboardStats"];
}
export function useListCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest("/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return data;
    },
  });
}

// 🔹 useListProducts Hook (fetches products based on category)
export function useListProducts({ categoryId }: { categoryId?: number }) {
  return useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      const url = categoryId
        ? `${API_BASE_URL}/products?categoryId=${categoryId}`
        : `${API_BASE_URL}/products`;

      const response = await fetch(url, { headers: authHeaders() });

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json(); // ✅ UNE SEULE FOIS


      return data; // ✅ retourne data
    },
  });
}

// 🔹 useCreateOrder Hook (handles order creation)
export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({ data }: { data: { employeeId: number; reductionMontant: number | null; reductionPourcentage: number | null; motifReduction: string; amountPaid: number; paymentMethod: string; items: any[] } }) => {
      const response = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creating order");
      return response.json();
    },
  });
}



// 🔹 useListProducts Hook (fetches products based on category)


// 🔹 useCreateProduct Hook (creates a new product)
export function useCreateProduct() {
  return useMutation({
    mutationFn: async ({ data }: { data: Product }) => {
      const response = await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create product.");
      return await response.json();
    },
  });
}

// 🔹 useUpdateProduct Hook (updates an existing product)
export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Product }) => {
      const response = await apiRequest(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update product.");
      return await response.json();
    },
  });
}

// 🔹 useDeleteProduct Hook (deletes a product)
export function useDeleteProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest(`/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product.");
      }

      return true;
    },
  });
}




// 🔹 useCreateCategory Hook (creates a new category)
export function useCreateCategory() {
  return useMutation({
    mutationFn: async ({ data }: { data: Category }) => {
      const response = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category.");
      return await response.json();
    },
  });
}

// 🔹 useUpdateCategory Hook (updates an existing category)
export function useUpdateCategory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Category }) => {
      const response = await apiRequest(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category.");
      return await response.json();
    },
  });
}

// 🔹 useDeleteCategory Hook (deletes a category)
export function useDeleteCategory() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest(`/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category.");
      }

      return true;
    },
  });
}

// 🔹 Other existing functions (getListCategoriesQueryKey, getListProductsQueryKey, etc.)



export function useListEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await apiRequest("/employees");
      const data = await response.json();
      return data;
    },
  });
}

// 🔹 getListEmployeesQueryKey (returns the query key for employees)
export function getListEmployeesQueryKey() {
  return ["employees"];
}

// 🔹 useCreateEmployee Hook (creates a new employee)
export function useCreateEmployee() {
  return useMutation({
    mutationFn: async ({ data }: { data: Employee }) => {
      const response = await apiRequest("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create employee.");
      return await response.json();
    },
  });
}

// 🔹 useUpdateEmployee Hook (updates an existing employee)
export function useUpdateEmployee() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Employee }) => {
      const response = await apiRequest(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update employee.");
      return await response.json();
    },
  });
}

// 🔹 useDeleteEmployee Hook (deletes an employee)
export function useDeleteEmployee() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest(`/employees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee.");
      }

      return true;
    },
  });
}

export function useListExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await apiRequest("/expenses");
      const data = await response.json();
      return data;
    },
  });
}

// 🔹 getListExpensesQueryKey (returns the query key for expenses)
export function getListExpensesQueryKey() {
  return ["expenses"];
}

// 🔹 useCreateExpense Hook (creates a new expense)
export function useCreateExpense() {
  return useMutation({
    mutationFn: async ({ data }: { data: Expense }) => {
      const response = await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create expense.");
      return await response.json();
    },
  });
}

// 🔹 useDeleteExpense Hook (deletes an expense)
export function useDeleteExpense() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest(`/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense.");
      }

      return true;
    },
  });
}
export function useListOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await apiRequest("/orders");
      const data = await response.json();
      return data;
    },
  });
}

// 🔹 getListOrdersQueryKey (returns the query key for orders)
export function getListOrdersQueryKey() {
  return ["orders"];
}

export function useGetSalesByDay({ days }: { days: number }) {
  return useQuery({
    queryKey: ["salesByDay", days],
    queryFn: async () => {
      const response = await apiRequest(`/sales-by-day?days=${days}`);
      if (!response.ok) throw new Error("Failed to fetch sales by day");
      return response.json() as Promise<SalesByDay[]>;
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}


// 🔹 getGetSalesByDayQueryKey (returns the query key for sales by day)
export function getGetSalesByDayQueryKey({ days }: { days: number }) {
  return ["salesByDay", days];
}

// 🔹 useGetTopProducts Hook (fetches top products data)
export function useGetTopProducts({ limit }: { limit: number }) {
  return useQuery({
    queryKey: ["topProducts", limit],
    queryFn: async () => {
      // Replace with actual API call
      const response = await apiRequest(`/top-products?limit=${limit}`);
      const data = await response.json();
      return data as TopProduct[];
    },
  });
}

// 🔹 getGetTopProductsQueryKey (returns the query key for top products)
export function getGetTopProductsQueryKey({ limit }: { limit: number }) {
  return ["topProducts", limit];
}

// 🔹 useGetSalarySummary Hook (fetches salary summary for employees)
export function useGetSalarySummary() {
  return useQuery({
    queryKey: ["salarySummary"],
    queryFn: async () => {
      // Replace with actual API call
      const response = await apiRequest("/salary-summary");
      const data = await response.json();
      return data as SalarySummary[];
    },
  });
}

// 🔹 getGetSalarySummaryQueryKey (returns the query key for salary summary)
export function getGetSalarySummaryQueryKey() {
  return ["salarySummary"];
}

// ==================== FOURNISSEURS ====================
export function useListFournisseurs() {
  return useQuery({
    queryKey: ["fournisseurs"],
    queryFn: async () => {
      const response = await apiRequest("/fournisseurs");
      return response.json() as Promise<Fournisseur[]>;
    },
  });
}

export function useCreateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Fournisseur>) => {
      const response = await apiRequest("/fournisseurs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Fournisseur>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fournisseurs"] }),
  });
}

export function useUpdateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Fournisseur> }) => {
      const response = await apiRequest(`/fournisseurs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Fournisseur>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fournisseurs"] }),
  });
}

export function useDeleteFournisseur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/fournisseurs/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete fournisseur.");
      }

      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fournisseurs"] }),
  });
}
// ==================== ACHATS ====================
export function useListAchats() {
  return useQuery({
    queryKey: ["achats"],
    queryFn: async () => {
      const response = await apiRequest("/achats");
      return response.json() as Promise<Achat[]>;
    },
  });
}

export function useCreateAchat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Achat>) => {
      const response = await apiRequest("/achats", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Achat>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["achats"] }),
  });
}

export interface IngredientCoutRequest {
  matierePremiereId: number;
  quantiteBase: number;
}

export interface CalculCoutProduitRequest {
  nomProduit: string;
  nombrePieces: number;
  ingredients: IngredientCoutRequest[];
}

export interface IngredientCoutResponse {
  matierePremiereId: number;
  nomMatiere: string;
  quantiteBase: number;
  uniteBase: string;
  prixUnitaireAchat: number;
  uniteAchat: string;
  quantiteBaseParUnite: number;
  prixParUniteBase: number;
  cout: number;
}

export interface CalculCoutProduitResponse {
  nomProduit: string;
  nombrePieces: number;
  coutTotal: number;
  coutParPiece: number;
  ingredients: IngredientCoutResponse[];
  id?: number;
  createdAt?: string;
}
export function useListHistoriqueCoutProduits() {
  return useQuery({
    queryKey: ["historique-cout-produits"],
    queryFn: async () => {
      const response = await apiRequest("/cout-produits/historique");

      if (!response.ok) {
        throw new Error("Failed to fetch cost history");
      }

      return response.json() as Promise<CalculCoutProduitResponse[]>;
    },
  });
}
export function useCalculerCoutProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CalculCoutProduitRequest) => {
      const response = await apiRequest("/cout-produits/calculer", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate product cost");
      }

      return response.json() as Promise<CalculCoutProduitResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historique-cout-produits"] });
    },
  });
}
export type DemandeGateauStatus =
  | "NOUVELLE"
  | "VUE_PAR_CHEF"
  | "ACCEPTEE"
  | "REFUSEE"
  | "TERMINEE";

export interface DemandeGateau {
  id: number;
  typeEvenement?: string;
  formatGateau?: string;
  nombrePersonnes?: number;
  gouts?: string;
  garnitures?: string;
  decoration?: string;
  couleurs?: string;
  texteGateau?: string;
  dateEvenement?: string;
  heureSouhaitee?: string;
  livraison?: boolean;
  adresseLivraison?: string;
  clientNom?: string;
  clientTelephone?: string;
  clientEmail?: string;
  notesClient?: string;
  noteChef?: string;
  budgetClient?: number;
  prixPropose?: number;
  status: DemandeGateauStatus;
  createdAt?: string;
  updatedAt?: string;
}

export function useCreateDemandeGateau() {
  return useMutation({
    mutationFn: async (data: Partial<DemandeGateau>) => {
      const response = await apiRequest("/demandes-gateaux", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create cake request");
      return response.json() as Promise<DemandeGateau>;
    },
  });
}

export function useListDemandesGateaux() {
  return useQuery({
    queryKey: ["demandes-gateaux"],
    queryFn: async () => {
      const response = await apiRequest("/demandes-gateaux");
      if (!response.ok) throw new Error("Failed to fetch cake requests");
      return response.json() as Promise<DemandeGateau[]>;
    },
    refetchInterval: 10000,
  });
}

export function useUpdateDemandeGateau() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<DemandeGateau>;
    }) => {
      const response = await apiRequest(`/demandes-gateaux/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update cake request");
      return response.json() as Promise<DemandeGateau>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-gateaux"] });
    },
  });
}

// ==================== MATIÈRES PREMIÈRES ====================
export function useListMatieresPremieres() {
  return useQuery({
    queryKey: ["matieres-premieres"],
    queryFn: async () => {
      const response = await apiRequest("/matieres-premieres/actifs");

      if (!response.ok) {
        throw new Error("Failed to fetch active matieres premieres");
      }

      return response.json() as Promise<MatierePremiere[]>;
    },
  });
}

export function useCreateMatierePremiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MatierePremiere>) => {
      const response = await apiRequest("/matieres-premieres", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<MatierePremiere>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] }),
  });
}

export function useUpdateMatierePremiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MatierePremiere> }) => {
      const response = await apiRequest(`/matieres-premieres/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<MatierePremiere>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] }),
  });
}

export function useDeleteMatierePremiere() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/matieres-premieres/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete matiere premiere.");
      }

      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matieres-premieres"] }),
  });
}
export function useListLatestStockJournalier() {
  return useQuery({
    queryKey: ["stock-journalier-latest"],
    queryFn: async () => {
      const response = await apiRequest("/stock-journalier/latest");
      if (!response.ok) throw new Error("Failed to fetch latest stock journalier");
      return response.json() as Promise<StockJournalier[]>;
    },
  });
}

export function useDeleteStockJournalier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/stock-journalier/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete stock journalier");

      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-journalier"] }),
  });
}
// Récupérer le stock d'une matière première
export function useGetStockMatiere(matiereId: number) {
  return useQuery({
    queryKey: ["stock-matiere", matiereId],
    queryFn: async () => {
      const response = await apiRequest(`/matieres-premieres/${matiereId}/stock`);
      return response.json() as Promise<StockMatiere>;
    },
    enabled: !!matiereId,
  });
}

// Mettre à jour le stock (pour ajustement manuel)
export function useUpdateStockMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matiereId, quantite }: { matiereId: number; quantite: number }) => {
      const response = await apiRequest(`/matieres-premieres/${matiereId}/stock?quantite=${quantite}`, {
        method: "PUT",
      });
      return response.json() as Promise<StockMatiere>;
    },
    onSuccess: (_, { matiereId }) => {
      queryClient.invalidateQueries({ queryKey: ["stock-matiere", matiereId] });
    },
  });
}

// ==================== CONGÉS ====================
export function useListConges() {
  return useQuery({
    queryKey: ["conges"],
    queryFn: async () => {
      const response = await apiRequest("/conges");
      return response.json() as Promise<Conge[]>;
    },
  });
}

export function useCreateConge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Conge>) => {
      const response = await apiRequest("/conges", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Conge>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conges"] }),
  });
}

export function useUpdateConge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Conge> }) => {
      const response = await apiRequest(`/conges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Conge>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conges"] }),
  });
}

export function useDeleteConge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/conges/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conges"] }),
  });
}

export function useApproveConge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valide }: { id: number; valide: boolean }) => {
      const response = await apiRequest(`/conges/${id}/approve?valide=${valide}`, {
        method: "PUT",
      });
      return response.json() as Promise<Conge>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conges"] }),
  });
}

// ==================== POINTAGES ====================
export function useListPointages() {
  return useQuery({
    queryKey: ["pointages"],
    queryFn: async () => {
      const response = await apiRequest("/pointages");
      return response.json() as Promise<Pointage[]>;
    },
  });
}

export function useCreatePointageArrivee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, date, heureArrivee }: { employeeId: number; date: string; heureArrivee: string }) => {
      const response = await apiRequest(`/pointages/arrivee?employeeId=${employeeId}&date=${date}&heureArrivee=${heureArrivee}`, {
        method: "POST",
      });
      return response.json() as Promise<Pointage>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
  });
}

export function useUpdatePointageDepart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, heureDepart }: { id: number; heureDepart: string }) => {
      const response = await apiRequest(`/pointages/${id}/depart?heureDepart=${heureDepart}`, {
        method: "PUT",
      });
      return response.json() as Promise<Pointage>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
  });
}
export function useUpdatePointage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Pointage> }) => {
      const response = await apiRequest(`/pointages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update pointage");

      return response.json() as Promise<Pointage>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
  });
}

// ==================== FICHES DE PAIE ====================
export function useGenerateFichePaie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePaieRequest) => {
      const response = await apiRequest("/paie/generate", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<FichePaie>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fiches-paie"] }),
  });
}

export function useListFichesPaieByEmployee(employeeId?: number) {
  return useQuery({
    queryKey: ["fiches-paie", employeeId],
    queryFn: async () => {
      const response = await apiRequest(`/paie/employee/${employeeId}`);
      return response.json() as Promise<FichePaie[]>;
    },
    enabled: !!employeeId,
  });
}

export function useDownloadFichePaie() {
  return useMutation({
    mutationFn: async (ficheId: number) => {
      const response = await fetch(`${API_BASE_URL}/paie/${ficheId}/download`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Erreur téléchargement");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiche_paie_${ficheId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
// ==================== DEMANDES D'ACHAT ====================
export function useListDemandesAchat() {
  return useQuery({
    queryKey: ["demandes-achat"],
    queryFn: async () => {
      const response = await apiRequest("/demandes-achat");
      return response.json() as Promise<DemandeAchat[]>;
    },
  });
}

export function useCreateDemandeAchat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DemandeAchat>) => {
      const response = await apiRequest("/demandes-achat", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<DemandeAchat>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demandes-achat"] }),
  });
}

export function useApproveDemandeAchat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valide }: { id: number; valide: boolean }) => {
      let url: string;
      if (valide) {
        url = `/demandes-achat/${id}/valider`;
        const response = await apiRequest(url, { method: "PUT" });
        return response.json() as Promise<DemandeAchat>;
      } else {
        // Ajouter un motif de rejet par défaut (le backend l'exige)
        const motif = "Rejeté par l'administrateur";
        url = `/demandes-achat/${id}/rejeter?motif=${encodeURIComponent(motif)}`;
        const response = await apiRequest(url, { method: "PUT" });
        return response.json() as Promise<DemandeAchat>;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demandes-achat"] }),
  });
}


// ==================== STOCK JOURNALIER ====================
export function useListStockJournalier() {
  return useQuery({
    queryKey: ["stock-journalier"],
    queryFn: async () => {
      const response = await apiRequest("/stock-journalier");
      return response.json() as Promise<StockJournalier[]>;
    },
  });
}

export function useCreateStockJournalier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockJournalierRequest) => {
      const response = await apiRequest("/stock-journalier", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create stock journalier");
      }

      return response.json() as Promise<StockJournalier>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-journalier"] }),
  });
}
export function useGetAlertesStockBas() {
  return useQuery({
    queryKey: ["alertes-stock-bas"],
    queryFn: async () => {
      const response = await apiRequest("/alertes/stock-bas");
      return response.json() as Promise<AlerteStock[]>;
    },
    refetchInterval: 30000, // toutes les 30 secondes
  });
}
export function useUpdateStockJournalier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StockJournalier> }) => {
      const response = await apiRequest(`/stock-journalier/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<StockJournalier>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-journalier"] }),
  });
}
export interface Echange {
  id: number;
  date: string;
  type: "ACHAT" | "VENTE";
  montant: number;
  description?: string;
  expenseId?: number;
  orderId?: number;
}

export function useListEchanges() {
  return useQuery({
    queryKey: ["echanges"],
    queryFn: async () => {
      const response = await apiRequest("/echanges");
      if (!response.ok) throw new Error("Failed to fetch echanges");
      return response.json() as Promise<Echange[]>;
    },
  });
}

export function useCreateEchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Echange>) => {
      const response = await apiRequest("/echanges", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create echange");

      return response.json() as Promise<Echange>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echanges"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["salesByDay"] });
    },
  });
}
export type DevisStatus = "EN_ATTENTE" | "CONFIRME" | "ANNULE";

export interface DevisItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Devis {
  id: number;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  total: number;
  status: DevisStatus;
  createdAt: string;
  items: DevisItem[];
}

export function useListDevis() {
  return useQuery({
    queryKey: ["devis"],
    queryFn: async () => {
      const response = await apiRequest("/devis");
      if (!response.ok) throw new Error("Failed to fetch devis");
      return response.json() as Promise<Devis[]>;
    },
    refetchInterval: 5000,
  });
}

export function useCreateDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employeeId: number;
      clientName?: string;
      clientPhone?: string;
      notes?: string;
      items: Array<{ productId: number; quantity: number }>;
    }) => {
      const response = await apiRequest("/devis", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create devis");
      return response.json() as Promise<Devis>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devis"] }),
  });
}

export function useConfirmDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { employeeId: number; paymentMethod: string; amountPaid: number };
    }) => {
      const response = await apiRequest(`/devis/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to confirm devis");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCancelDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/devis/${id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel devis");
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devis"] }),
  });
}