# Deployment Architecture

This section defines the strategy for deploying the application using **Docker** containers on the **Render.com** platform.

### Deployment Strategy

We leverage a **Docker-first** strategy. Each application in our `apps/` directory (Frontend and Backend) contains its own `Dockerfile`. 

- **Platform:** Render.com
- **Deployment Method:** Docker Web Services. Render monitors our GitHub repository and triggers a build when changes are pushed to `main`.
- **Private Networking:** The Backend and Database communicate over Render's internal private network, ensuring the database is not exposed to the public internet.

### CI/CD Pipeline

The pipeline is orchestrated via **GitHub Actions** and Render's automatic deployment hooks:

1.  **Push:** Code is pushed to the `main` branch.
2.  **Lint & Test:** GitHub Actions runs `npm run lint` and `npm test` across the monorepo.
3.  **Docker Build (Render):** Render detects the push, executes the `Dockerfile` for each service (Frontend/Backend), and builds a production-ready image.
4.  **Health Check:** Render performs a zero-downtime deploy, switching traffic to the new containers only after they pass health checks.

### Environment Management

Environment variables are managed within the Render Dashboard for each service (Production/Staging).

| Environment | Hosting | Purpose |
| :--- | :--- | :--- |
| **Development** | `docker-compose` | Local replication of the full production environment. |
| **Staging** | Render (Docker) | Pre-production environment for final UAT. |
| **Production** | Render (Docker) | Live environment for retail stores. |

### Local Development Flow

Developers can spin up the entire stack (Postgres, NestJS, Next.js) using a single command:
```bash
docker-compose up
```
This ensures that every developer is working against the same versions of the database and runtime as production.
