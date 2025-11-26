# External APIs

### bKash Payment Gateway API

- **Purpose:** To securely process online payments from customers for orders placed on the e-commerce storefront.
- **Documentation:** To be provided. The exact implementation will depend on the official developer documentation from bKash.
- **Base URL(s):** Will include a sandbox URL for testing and a production URL for live payments.
- **Authentication:** Typically via an App Key and App Secret provided by bKash. These will be stored securely as environment variables on the backend.
- **Rate Limits:** To be determined from the official documentation.

**Key Endpoints Used (Example Flow):**
- `POST /token` - To obtain an authentication token for making other API calls.
- `POST /payment/create` - To initiate a payment request and get a payment URL to redirect the user to.
- `POST /payment/execute` - To confirm and execute the payment after the user has approved it on the bKash platform.
- `GET /payment/status` - To query the status of a transaction after the user is redirected back to our site.

**Integration Notes:** The integration will be handled exclusively by the **Backend API** component to ensure security. A dedicated server-side module will be created to encapsulate all interactions with the bKash API, handling the token exchange, payment creation, and execution flow. The frontend will not interact with the bKash API directly.

### Nagad Payment Gateway API

- **Purpose:** To provide a second major option for customers to process online payments, increasing the flexibility of the e-commerce platform.
- **Documentation:** To be provided. The implementation will follow the official developer documentation from Nagad.
- **Base URL(s):** Will include separate sandbox and production URLs.
- **Authentication:** Expected to be via a Merchant ID and API Key provided by Nagad, stored securely on the backend.
- **Rate Limits:** To be determined from the official documentation.

**Key Endpoints Used (Example Flow):**
- `POST /remote-payment-gateway-payment` - To initiate a payment and receive a checkout URL.
- `GET /remote-payment-gateway-payment/{paymentRefId}` - To verify the status of the payment after the user returns to the site.

**Integration Notes:** Similar to the bKash integration, this will be a backend-only responsibility. A dedicated server-side module will be created to handle the specific API flow for Nagad. The frontend will be abstracted from the details of which payment gateway is being used.

### SMS Gateway API (Generic)

- **Purpose:** To send automated transaction alerts (Sales, Payments) to customers.
- **Documentation:** Dependent on the selected local provider (e.g., Twilio, GreenWeb, Diana Host).
- **Base URL(s):** Provider-specific.
- **Authentication:** API Key/Secret stored in environment variables.
- **Rate Limits:** Dependent on the provider plan.

**Key Endpoints Used (Example Flow):**
- `POST /send-sms` - To dispatch a single SMS message.
- `GET /balance` - To check the remaining SMS credit balance.

**Integration Notes:**
-   Sending will be handled asynchronously via the **Background Job Queue** (see Scalability Epic) to prevent blocking the main sales flow.
-   A `NotificationService` wrapper will be created to abstract the specific provider, allowing us to switch providers without changing business logic.
