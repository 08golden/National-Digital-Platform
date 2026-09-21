# Development of a National Digital Platform for Storage and Accessibility of Data for Low-resourced Namibian Languages

This repository contains the implementation of a national digital language platform for collecting, storing, organising, preserving, and making accessible language data for low-resourced Namibian languages. The platform is designed for researchers, language communities, contributors, and administrators who need a trusted digital archive for audio, text, metadata, and consent records.

## Project goal

The platform supports the long-term digital preservation and accessibility of language materials by enabling:
- secure upload and archiving of audio and related files
- structured metadata capture for languages, contributors, and recordings
- search and filtering for language resources
- moderation and access control for sensitive or restricted data
- data-sharing workflows with consent and licensing records

## Current implementation status

The working MVP includes:
- a Next.js backend with API routes for recordings and metadata
- a Vite + React frontend for browsing and upload workflows
- Supabase database and storage integration
- SQL migrations and seed data for initial content and search support
- local E2E validation for successful upload to storage and DB insertion

## Tech stack

- Frontend: Vite + React + TypeScript
- Backend: Next.js + TypeScript
- Database: Supabase Postgres
- Storage: Supabase Storage
- Auth: Supabase Auth
- Deployment target: Supabase + Vercel (recommended for the platform production stack)

## Local setup

1. Open the backend environment file and set values for the live Supabase project.
2. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev -- --port 5173
   ```
4. Open the frontend in the browser and use the upload flow.

## Platform deployment intent

For the supervisor review and eventual deployment, the project is designed for a hosted architecture based on:
- Supabase for Postgres, Auth, and Storage
- Vercel for the frontend application
- GitHub Actions for CI and automated validation
- scheduled backups and consistent environment secrets management

This approach fits the project objective of building an organised archive and access portal for low-resourced language data with secure, scalable hosting.

## Documentation

- [docs/spec.md](docs/spec.md) — MVP specification and requirements
- [docs/deployment-plan.md](docs/deployment-plan.md) — deployment plan for supervisor review
- [nldr-backend/supabase/migrations](nldr-backend/supabase/migrations) — database schema and seed migrations
- [backend/src/app/api](backend/src/app/api) — backend API endpoints
- [frontend/src](frontend/src) — frontend application