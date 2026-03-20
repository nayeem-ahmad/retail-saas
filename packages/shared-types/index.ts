import { z } from "zod";

export enum UserRole {
  OWNER = "owner",
  MANAGER = "manager",
  CASHIER = "cashier",
  ACCOUNTANT = "accountant",
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRole;
}

export interface Tenant {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string; // A machine-readable error code (e.g., 'validation_error', 'not_found')
    message: string; // A human-readable error message
    details?: Record<string, any>; // Optional structured data, like Zod validation issues
    timestamp: string; // ISO 8601 timestamp of the error
    requestId: string; // A unique ID for tracing the request
    statusCode?: number; // Optional status code for internal use
  };
}

export enum AccountType {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  REVENUE = "revenue",
  EXPENSE = "expense",
}

export enum AccountCategory {
  CASH = "cash",
  BANK = "bank",
  GENERAL = "general",
}

export enum VoucherType {
  CASH_PAYMENT = "cash_payment",
  CASH_RECEIVE = "cash_receive",
  BANK_PAYMENT = "bank_payment",
  BANK_RECEIVE = "bank_receive",
  FUND_TRANSFER = "fund_transfer",
  JOURNAL = "journal",
}

// --- VALIDATION SCHEMAS ---

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
});

export type SignupInput = z.infer<typeof SignupSchema>;

// --- PRODUCT SCHEMAS ---

export interface Product {
  id: string;
  tenant_id: string;
  group_id?: string;
  subgroup_id?: string;
  name: string;
  sku: string;
  price: number;
  reorder_level: number;
}

export interface ProductStock {
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  tenant_id: string;
  store_id: string;
  supplier_id?: string | null;
  purchase_number: string;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  freight_amount: number;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  items: PurchaseItem[];
  supplier?: Supplier | null;
}

export interface PurchaseReturnItem {
  id: string;
  return_id: string;
  purchase_item_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

export interface PurchaseReturn {
  id: string;
  tenant_id: string;
  store_id: string;
  purchase_id: string;
  supplier_id?: string | null;
  return_number: string;
  reference_number?: string | null;
  total_amount: number;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  items: PurchaseReturnItem[];
  supplier?: Supplier | null;
  purchase?: Purchase | null;
}

export const ProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  initialStock: z.coerce.number().min(0, "Initial stock cannot be negative").default(0),
});

export type ProductInput = z.infer<typeof ProductSchema>;
