# Restaurant Management (RMN)

Backend: ASP.NET Core 8 Web API. Frontend: Next.js 14 (App Router, TypeScript). Currently ships with sample restaurant management (RMN) placeholder endpoints and a simple UI list to verify FE/BE wiring.

## Run

1. Backend (API)

- `cd rmn-be`
- First time on macOS: trust dev certs if prompted `dotnet dev-certs https --trust`
- Run API: `dotnet run` (http://localhost:5280, https://localhost:7280)
- Open Swagger: http://localhost:5280/swagger

2. Frontend (Next.js)

- `cd rmn-fe`
- Copy envs: `cp .env.local.example .env.local` (edit `NEXT_PUBLIC_API_BASE_URL` if API port changes)
- Install deps: `npm install`
- Start dev server: `npm run dev` (http://localhost:3000)
