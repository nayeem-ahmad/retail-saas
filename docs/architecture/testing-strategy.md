# Testing Strategy

This section outlines the comprehensive testing approach for the full-stack application, covering all layers from the UI to the database.

### Testing Pyramid

We will follow the classic testing pyramid model to balance test coverage, speed, and cost.

```text
      E2E Tests (Few)
   ┌───────────────────┐
  /      (Playwright)     \
 /─────────────────────────\
|   Integration Tests (More)  |
| (Jest + RTL / Supertest)  |
/─────────────────────────────\
|      Unit Tests (Many)      |
|          (Jest)           |
└─────────────────────────────┘
```

- **Unit Tests (Base):** The majority of our tests will be unit tests. They are fast, cheap, and test individual functions or components in isolation.
- **Integration Tests (Middle):** These tests will verify that multiple components work together correctly. For example, testing a React component that fetches data from a mocked API, or testing an API route's interaction with a mocked database repository.
- **End-to-End (E2E) Tests (Peak):** We will have a small number of E2E tests that simulate a full user journey in a real browser. They are slow and expensive but provide the highest confidence that the system works as a whole.

### Test Organization

- **Unit & Integration Tests:** Test files will be co-located with the source code they are testing, using the `*.test.ts(x)` naming convention.
    - *Example:* `apps/web/src/components/domain/product/ProductForm.test.tsx`
    - *Example:* `apps/web/src/app/api/products/route.test.ts`
- **E2E Tests:** End-to-end tests will live in a separate `e2e/` directory at the project root.
    - *Example:* `e2e/sales.spec.ts`

### Test Examples

- **Frontend Component Test (Unit):**
    ```typescript
    // Using Jest and React Testing Library
    it('should disable the submit button if the product name is empty', () => {
      render(<ProductForm />);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
    ```

- **Backend API Test (Integration):**
    ```typescript
    // Using Jest and Supertest (or similar)
    it('should return a 400 error if the product name is missing', async () => {
      // Mock the product repository to return an error
      const response = await request(app).post('/api/products').send({ price: 9.99 });
      expect(response.status).toBe(400);
    });
    ```

- **E2E Test:**
    ```typescript
    // Using Playwright
    test('should allow a user to create a new product', async ({ page }) => {
      await page.goto('/inventory');
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'New Test Product');
      await page.click('button:has-text("Submit")');
      await expect(page.locator('text=New Test Product')).toBeVisible();
    });
    ```

### Accessibility Testing

A multi-layered approach will be used to ensure the application meets accessibility standards.

-   **Automated Testing:**
    -   **Tool:** We will use `jest-axe` to integrate the `axe-core` engine into our Jest tests.
    -   **Process:** This will run as part of our CI pipeline and will fail the build if any new code introduces severe or critical accessibility violations.
-   **Manual Testing:**
    -   **Process:** Before a major feature is released, it must undergo a manual accessibility audit.
    -   **Checklist:** This includes verifying keyboard-only navigation, testing with a screen reader (e.g., VoiceOver, NVDA), and checking for sufficient color contrast.
-   **Developer Tooling:**
    -   Developers are expected to use browser extensions like **Axe DevTools** or the **Lighthouse** panel in Chrome DevTools to audit their work continuously during development.

### Testing for Returns Management

The new returns management functionality will be tested at all levels of the pyramid to ensure correctness and prevent regressions.

#### Unit Tests (Jest)

-   **Scope:** Test individual helper functions and business logic in isolation.
-   **Examples:**
    -   A function that calculates the total refund amount.
    -   A function that validates the status transition of a return (e.g., `requested` -> `approved`).

#### Integration Tests (Jest + Supertest)

-   **Scope:** These are the most critical tests for this feature. They will test the new API routes with mocked database repositories.
-   **Key Scenarios to Test for `POST /api/sales-returns`:**
    1.  **Success Case:** A valid return request successfully creates a `SalesReturn` record, updates product inventory, and returns a `201` status.
    2.  **Failure Case (Invalid Input):** The request fails with a `400` error if the `original_sale_id` is missing or the items array is empty.
    3.  **Failure Case (Not Found):** The request fails with a `404` error if the `original_sale_id` does not exist.
    4.  **Transactional Integrity:** If updating the product inventory fails, the entire transaction is rolled back, and no `SalesReturn` record is created. This will be tested by mocking the `ProductRepository` to throw an error.

#### E2E Tests (Playwright)

-   **Scope:** A full user journey that simulates a cashier processing a return.
-   **Example Scenario:**
    1.  Log in as a cashier.
    2.  Navigate to the sales history page.
    3.  Find a specific sale and initiate a return.
    4.  Select items to return and submit the form.
    5.  Verify that a "Return Complete" message is displayed.
    6.  Navigate to the inventory page and confirm that the stock for the returned items has been correctly updated.
