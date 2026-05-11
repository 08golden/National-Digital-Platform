# Frontend-Backend Connection Report

**Project:** Digital Language Repository
**Date:** 2026-05-10

## Servers Status

- **Backend (Next.js)**: Running on `http://localhost:3000`
- **Frontend (Vite)**: Running on `http://localhost:5173`

## Connection Configuration

- Frontend environment variable: `VITE_API_URL=http://localhost:3000`
- Frontend API wrappers in `frontend/src/lib/api/` use `VITE_API_URL` for all backend calls.
- Backend provides API endpoints at `/api/*` routes.

## Test Results

- Backend API tested: `GET /api/languages` returns `200 OK` with data.
- Frontend server started successfully without build errors.
- No port conflicts: Backend on 3000, Frontend on 5173.
- Environment variables are correctly set in respective `.env` files.

