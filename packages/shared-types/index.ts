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

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIALING = 'TRIALING',
}

export enum SubscriptionPlanCode {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

export interface SubscriptionPlanSummary {
  code: SubscriptionPlanCode;
  name: string;
  description?: string | null;
  monthly_price: number;
  yearly_price?: number | null;
  features_json?: Record<string, unknown>;
}

export interface TenantSubscriptionSummary {
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  is_premium: boolean;
  plan: SubscriptionPlanSummary;
}

export interface TenantContextSummary {
  id: string;
  name: string;
  role: UserRole;
  stores: Store[];
  subscription?: TenantSubscriptionSummary | null;
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
  tenantName: z.string().min(2, "Organization name must be at least 2 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  planCode: z.nativeEnum(SubscriptionPlanCode).default(SubscriptionPlanCode.BASIC),
});

export type SignupInput = z.infer<typeof SignupSchema>;

// --- PRODUCT SCHEMAS ---

export interface Product {
  id: string;
  tenant_id: string;
  group_id?: string | null;
  subgroup_id?: string | null;
  name: string;
  sku?: string | null;
  price: number;
  reorder_level?: number | null;
  safety_stock?: number | null;
  lead_time_days?: number | null;
  image_url?: string | null;
  group?: ProductGroup | null;
  subgroup?: ProductSubgroup | null;
  stocks?: ProductStock[];
}

export interface ProductGroup {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  _count?: { subgroups?: number; products?: number };
}

export interface ProductSubgroup {
  id: string;
  tenant_id: string;
  group_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  group?: ProductGroup | null;
  _count?: { products?: number };
}

export interface Warehouse {
  id: string;
  tenant_id: string;
  store_id: string;
  name: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductStock {
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  warehouse?: Warehouse;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  reference_type?: string | null;
  reference_id?: string | null;
  quantity_delta: number;
  balance_after?: number | null;
  unit_cost?: number | null;
  note?: string | null;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
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
  sku: z.string().min(3, "SKU must be at least 3 characters").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  initialStock: z.coerce.number().min(0, "Initial stock cannot be negative").default(0),
  groupId: z.string().uuid().optional(),
  subgroupId: z.string().uuid().optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  leadTimeDays: z.coerce.number().min(0).optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
