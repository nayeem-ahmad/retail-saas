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

// --- VALIDATION SCHEMAS ---

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
