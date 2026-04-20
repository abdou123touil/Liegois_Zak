import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:8081/api";

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

export type Employee = {
    id: number;
    name: string;
    username: string;
    role: "admin" | "cashier" | "ADMIN" |"CASHIER";
    hourlyRate?: number;
    hoursPerMonth?: number;
    monthlySalary?: number;
    isActive: boolean;
};
export type Category = {
    id: number;
    name: string;
    icon: string;
    color: string;
    isActive:boolean;
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
      console.log("🔵 Fetching /me...");
      const response = await apiRequest("/me");
      console.log("Status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      console.log("User data:", data);
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
      console.log("🔵 Fetching categories...");
      const response = await apiRequest("/categories");
      console.log("Status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      console.log("Categories data:", data);
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

            console.log("Products data:", data); // ✅ utilise data

            return data; // ✅ retourne data
        },
    });
}

// 🔹 useCreateOrder Hook (handles order creation)
export function useCreateOrder() {
    return useMutation({
        mutationFn: async ({ data }: { data: {employeeId:number ; amountPaid: number; paymentMethod: string; items: any[] } }) => {
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
            if (!response.ok) throw new Error("Failed to delete product.");
            return await response.json();
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
            if (!response.ok) throw new Error("Failed to delete category.");
            return await response.json();
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
            if (!response.ok) throw new Error("Failed to delete employee.");
            return await response.json();
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
            if (!response.ok) throw new Error("Failed to delete expense.");
            return await response.json();
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
            // Replace with actual API call
            const response = await apiRequest(`/sales-by-day?days=${days}`);
            const data = await response.json();
            return data as SalesByDay[];
        },
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

// api-client.ts

// Récupérer le token stocké
