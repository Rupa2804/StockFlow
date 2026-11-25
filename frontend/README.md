# StockFlow Frontend

## Run locally

Start the FastAPI backend in one PowerShell terminal:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

In a second terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite runs at `http://localhost:3000` to match the backend's configured CORS
origin. The API base defaults to `http://127.0.0.1:8000`; set
`VITE_API_BASE_URL` in a local frontend environment file to override it.

## Implemented

- Login and registration for creating an organization or joining by invitation.
- JWT session handling, protected routes, and logout.
- Dashboard summary with low-stock products.
- Category listing, creation, and category details.
- Product search, category filtering, pagination, create, edit, detail, and
  delete.
- Stock-in and stock-out adjustments with movement history on product details.
- Organization default low-stock settings and staff invitations.

Inventory requests use the authenticated user's token. Organization ownership
is assigned and enforced by the backend; the frontend does not send an
organization ID.

## Build

```powershell
npm run build
```

The backend does not expose a staff directory or invitation-list endpoint, so
the frontend only supports creating an invitation and displaying its returned
token and expiration.
