# API Specification

This section defines the contract for the REST API.

```yaml
openapi: 3.0.0
info:
  title: SaaS Platform for Grocery Shops API
  version: 1.0.0
  description: The REST API for the SaaS Platform for Grocery Shops, providing resources for managing retail operations.
servers:
  - url: /api
    description: API base path

# =====================================================================================
# Paths
# =====================================================================================
paths:
  /products:
    get:
      summary: List Products
      description: Retrieves a list of all products for the authenticated user's store.
      tags:
        - Products
      responses:
        '200':
          description: A JSON array of products.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

    post:
      summary: Create Product
      description: Creates a new product in the store's inventory.
      tags:
        - Products
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewProduct'
      responses:
        '201':
          description: The newly created product.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /products/{productId}:
    get:
      summary: Get Product
      description: Retrieves a single product by its ID.
      tags:
        - Products
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: A single product.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /sales-returns:
    post:
      summary: Create Sales Return
      description: Initiates a new sales return, specifying the original sale and items being returned.
      tags:
        - Sales Returns
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewSalesReturn'
      responses:
        '201':
          description: The newly created sales return record.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SalesReturn'
        '400':
          $ref: '#/components/responses/BadRequestError'

  /sales-returns/{returnId}:
    get:
      summary: Get Sales Return
      description: Retrieves a single sales return by its ID.
      tags:
        - Sales Returns
      parameters:
        - name: returnId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: A single sales return.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SalesReturn'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /purchase-returns:
    post:
      summary: Create Purchase Return
      description: Initiates a new purchase return to a supplier.
      tags:
        - Purchase Returns
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPurchaseReturn'
      responses:
        '201':
          description: The newly created purchase return record.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PurchaseReturn'
        '400':
          $ref: '#/components/responses/BadRequestError'

  /products/low-stock:
    get:
      summary: List Low-Stock Products
      description: Retrieves a list of all products where the current quantity is at or below the defined reorder level.
      tags:
        - Products
      responses:
        '200':
          description: A JSON array of low-stock products.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /dashboard/sales-summary:
    get:
      summary: Get Sales Summary
      description: Retrieves a summary of sales metrics for a given period (e.g., today).
      tags:
        - Dashboard
      parameters:
        - name: period
          in: query
          required: false
          schema:
            type: string
            enum: [today, week, month]
            default: today
      responses:
        '200':
          description: An object containing sales summary data.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SalesSummary'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /inventory/adjustments:
    post:
      summary: Create Inventory Adjustment
      description: Creates a manual adjustment for a product's inventory level.
      tags:
        - Inventory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewInventoryAdjustment'
      responses:
        '201':
          description: The newly created inventory adjustment record.
        '400':
          $ref: '#/components/responses/BadRequestError'

# =====================================================================================
# Components
# =====================================================================================
components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        store_id:
          type: string
          format: uuid
        name:
          type: string
        price:
          type: number
          format: decimal
        quantity:
          type: integer
        sku:
          type: string
          nullable: true

    NewProduct:
      type: object
      required:
        - name
        - price
        - quantity
      properties:
        name:
          type: string
        price:
          type: number
          format: decimal
        quantity:
          type: integer
        reorder_level:
          type: integer
          nullable: true
        sku:
          type: string
          nullable: true

    SalesReturn:
      type: object
      properties:
        id:
          type: string
          format: uuid
        store_id:
          type: string
          format: uuid
        original_sale_id:
          type: string
          format: uuid
        return_date:
          type: string
          format: date-time
        total_refund_amount:
          type: number
          format: decimal
        status:
          type: string
          enum: [requested, approved, completed]
        items:
          type: array
          items:
            $ref: '#/components/schemas/SalesReturnItem'

    SalesReturnItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        product_id:
          type: string
          format: uuid
        quantity:
          type: integer
        reason:
          type: string
          nullable: true

    NewSalesReturn:
      type: object
      required:
        - original_sale_id
        - items
      properties:
        original_sale_id:
          type: string
          format: uuid
        items:
          type: array
          items:
            type: object
            required: [product_id, quantity]
            properties:
              product_id:
                type: string
                format: uuid
              quantity:
                type: integer
              reason:
                type: string
                nullable: true

    PurchaseReturn:
      type: object
      properties:
        id:
          type: string
          format: uuid
        store_id:
          type: string
          format: uuid
        original_purchase_id:
          type: string
          format: uuid
        supplier_id:
          type: string
          format: uuid
        return_date:
          type: string
          format: date-time
        total_credit_amount:
          type: number
          format: decimal
        status:
          type: string
          enum: [shipped, received_by_supplier, credited]

    NewPurchaseReturn:
      type: object
      required:
        - original_purchase_id
        - supplier_id
        - items
      properties:
        original_purchase_id:
          type: string
          format: uuid
        supplier_id:
          type: string
          format: uuid
        items:
          type: array
          items:
            type: object
            required: [product_id, quantity]
            properties:
              product_id:
                type: string
                format: uuid
              quantity:
                type: integer
              reason:
                type: string
                nullable: true

    NewInventoryAdjustment:
      type: object
      required:
        - product_id
        - quantity_changed
        - reason
      properties:
        product_id:
          type: string
          format: uuid
        quantity_changed:
          type: integer
        reason:
          type: string
          enum: [damaged, stolen, stock_count, other]
        notes:
          type: string
          nullable: true

    SalesSummary:
      type: object
      properties:
        total_revenue:
          type: number
          format: decimal
        sale_count:
          type: integer
        average_sale_value:
          type: number
          format: decimal
        period:
          type: string

    ApiError:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: "bad_request"
            message:
              type: string
              example: "Invalid input provided."
            timestamp:
              type: string
              format: date-time
            requestId:
              type: string
              format: uuid

  responses:
    UnauthorizedError:
      description: Authentication information is missing or invalid.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    BadRequestError:
      description: The request body is malformed or in-valid.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    NotFoundError:
      description: The requested resource was not found.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
```
