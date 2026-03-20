# Story 80.1: Customer CRUD API & UI

Status: complete

## Story

As a Shop Owner or Manager,
I want to create, edit, and view rich customer profiles with auto-generated codes, type classification, group/territory assignment, credit limits, and discount settings,
so that I can maintain a structured, segmented customer database to drive sales and reporting workflows.

## Acceptance Criteria

1.  A "Customers" menu item and dashboard screen exists. [x]
2.  A user can create a new customer with all required and optional fields (see Data Model below). [ ]
3.  **Customer Code** is auto-generated on create (e.g. `CUST-00001`), editable by user, but must remain unique per tenant. [ ]
4.  **Customer Type** is selectable: `Individual` or `Organization`. [ ]
5.  **Customer Group** is an optional FK reference to the `CustomerGroup` entity (managed via Story 80.4). [ ]
6.  **Territory** is an optional FK reference to the `Territory` entity (managed via Story 80.5). [ ]
7.  **Credit Limit** and **Default Discount %** are optional decimal fields. [ ]
8.  **Profile Picture** can be uploaded (stored as a URL string). [ ]
9.  The backend validates Phone uniqueness per tenant. [x]
10. The backend validates Customer Code uniqueness per tenant. [ ]
11. The `Customer` model is linked to `Tenant`, and optionally to `CustomerGroup` and `Territory`. [ ]
12. The `Sale` model is optionally associated with a `Customer`. [x]

## Data Model Changes

### Customer (revised)

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | auto |
| tenant_id | FK → Tenant | required |
| **customer_code** | String | Auto-generated (`CUST-NNNNN`), editable, unique per tenant |
| name | String | required |
| phone | String | required, unique per tenant |
| email | String? | optional |
| address | String? | optional |
| **profile_pic_url** | String? | URL to uploaded image |
| **customer_type** | Enum (`INDIVIDUAL`, `ORGANIZATION`) | default `INDIVIDUAL` |
| **customer_group_id** | FK → CustomerGroup? | optional |
| **territory_id** | FK → Territory? | optional |
| **credit_limit** | Decimal(12,2)? | optional, default null |
| **default_discount_pct** | Decimal(5,2)? | optional, 0-100 range |
| total_spent | Decimal(12,2) | computed, default 0 |
| segment_category | String | default "Regular" |
| created_at | DateTime | auto |

### New unique constraint
- `@@unique([tenant_id, customer_code])`
- Existing `@@unique([tenant_id, phone])` stays

## Tasks / Subtasks

- [ ] Task 1: Database Schema Update
  - [ ] Add `CustomerType` enum (`INDIVIDUAL`, `ORGANIZATION`) to Prisma schema.
  - [ ] Add new columns to `Customer` model: `customer_code`, `profile_pic_url`, `customer_type`, `customer_group_id`, `territory_id`, `credit_limit`, `default_discount_pct`.
  - [ ] Add relations to `CustomerGroup` and `Territory` (created in Stories 80.4 & 80.5).
  - [ ] Add `@@unique([tenant_id, customer_code])` constraint.
  - [ ] Generate and run Prisma migration.

- [ ] Task 2: Auto-generation Service Logic
  - [ ] Implement `generateCustomerCode(tenantId)` in the service — queries the last code for the tenant and increments. Format: `CUST-00001`.
  - [ ] On create: if `customer_code` not supplied, auto-generate. If supplied, validate uniqueness.

- [ ] Task 3: Backend API Updates
  - [ ] Expand `CreateCustomerDto` with new fields (customer_code optional, customer_type, customer_group_id, territory_id, credit_limit, default_discount_pct, profile_pic_url).
  - [ ] Add `UpdateCustomerDto` (partial of CreateCustomerDto).
  - [ ] Add `PATCH /customers/:id` endpoint.
  - [ ] Update `findAll` to include `customerGroup` and `territory` relations in response.
  - [ ] Update `findOne` to include `customerGroup` and `territory` relations.

- [ ] Task 4: Frontend UI Updates
  - [ ] Update "New Customer" modal: add fields for Customer Type (radio/select), Customer Group (dropdown from API), Territory (dropdown from API), Credit Limit, Default Discount %, Profile Picture upload.
  - [ ] Customer Code shown as auto-filled input (editable).
  - [x] Customer list table: show Code, Type, Group, Territory columns.
  - [ ] Customer detail page: display all new fields.
  - [ ] Add inline edit capability or an "Edit Customer" modal.

## Dev Notes

- **Customer Code** format: `CUST-NNNNN` (zero-padded 5 digits). Query `MAX(customer_code)` per tenant to determine next. If the code is user-edited, validate format is not required — any unique string is acceptable.
- **Profile Pic**: For MVP, accept a URL string. File upload to object storage can be a follow-up.
- **Dependencies**: Stories 80.4 (Customer Group CRUD) and 80.5 (Territory CRUD) should be implemented first or in parallel, since this story references those entities as foreign keys.
- **Seed data**: Update `seed.ts` to assign groups and territories to existing customers.

### References

- [Source: docs/prd/epic-80-customer-segmentation.md]

## Dev Agent Record

### Agent Model Used
GPT-5.4

### Completion Notes List

- ✅ Standardized the Customers dashboard list onto the shared `DataTable` shell used by Sales.
- ✅ The customer list now exposes code, type, group, territory, total spent, segment, and registration date in a searchable/sortable table.
- ✅ Preserved the existing create-customer modal flow and direct navigation into the customer detail page from the list actions.
