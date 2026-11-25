# StockFlow Backend

## Setup

From `backend/`, install the dependencies and create `.env` from `.env.example`.
Set `DATABASE_URL` to a PostgreSQL connection URL and replace `JWT_SECRET_KEY`
with a long, random secret.

Run the schema migration before starting the API:

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Back up an existing database before running migrations. The tenant migration
preserves current records and assigns existing users, categories, products,
and stock movements to the `StockFlow` organization. PostgreSQL applies the
migration transactionally.

## API

Swagger documentation is available at `/docs`.

- `POST /api/v1/auth/register` creates an organization with its owner, or accepts
  an invitation token to join an organization.
- Authenticated category, product, dashboard, settings, and stock APIs are
  restricted to the caller's organization.
- `GET /api/v1/categories/{category_id}` retrieves a category owned by the
  caller's organization.
- `GET /api/v1/products` lists all products in the caller's organization by
  default; `category_id` and `search` are optional filters.
- `POST /api/v1/organizations/invitations` returns a one-time registration token
  for the invited email address. The token expires after seven days.
- `GET /api/v1/dashboard/summary` returns product and quantity totals and
  low-stock products.
- `GET` and `PATCH /api/v1/settings` read and update the organization's default
  low-stock threshold.

Run the backend tests with `python -m pytest -q`.
