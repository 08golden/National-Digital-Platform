# Deployment Plan

## Project title
Development of a National Digital Platform for Storage and Accessibility of Data for Low-resourced Namibian Languages

## Deployment goal
The platform will provide a secure, scalable, and organised digital archive for language recordings, transcripts, consent records, and metadata for low-resourced Namibian languages. The system must allow communities, researchers, and administrators to upload, preserve, search, and access language data according to privacy and access rules.

## Deployment architecture

### Recommended production stack
- Frontend: Vercel
- Backend/API: Next.js hosted on Vercel or a Node-compatible server
- Database: Supabase Postgres
- Storage: Supabase Storage
- Auth: Supabase Auth
- CI/CD: GitHub Actions
- Backups: Supabase automated backups + export pipeline

### Why this architecture
- Supabase simplifies database, auth, and object storage with a managed Postgres service.
- Vercel allows fast deployment of the React/Vite frontend and Next.js API layer.
- GitHub Actions supports code validation, migrations, and automated checks before release.
- The combination reduces operational complexity while supporting a public-facing archive platform.

## Hosting and operational model

### Production hosting plan
1. Host the frontend on Vercel with a custom domain and production environment variables.
2. Host the backend API through Vercel or a dedicated Next.js production deployment.
3. Use Supabase for the database and object storage, with row-level security and service-role keys only in secure server environments.
4. Keep all secrets in GitHub repository secrets or hosting environment secrets, never in source files.

### Archive and preservation strategy
- Store original audio files in Supabase Storage under a structured bucket layout.
- Store metadata in Postgres tables keyed by language, contributor, recording, transcript, and consent events.
- Maintain access policies for public, restricted, and embargoed resources.
- Record license and consent metadata for every uploaded item.

## Security and governance
- Keep `SUPABASE_SERVICE_ROLE_KEY` on server-side only.
- Use anon/public keys only in the frontend and public-safe queries.
- Restrict admin actions to authenticated admin roles.
- Require consent before public sharing of materials.
- Log moderation actions for uploads, approvals, and rejections.

## Proposed rollout phases

### Phase 1: local MVP and validation
- Confirm local Supabase project configuration and database migrations.
- Validate upload, metadata insertion, and storage access.
- Confirm admin review and moderation flows.

### Phase 2: staging deployment
- Deploy the frontend to a staging domain.
- Run acceptance tests on production-like environment variables.
- Validate moderation, permissions, and language search functions.

### Phase 3: production pilot
- Launch to a small user group: researchers, language communities, and administrators.
- Capture feedback on metadata quality and data access controls.
- Improve the archive workflow based on user needs.

### Phase 4: national scale rollout
- Expand language coverage.
- Add import tools, enhanced search, and downloadable archives.
- Establish periodic backup and retention policies.

## Budget and sustainability considerations
- Supabase managed services lower the technical overhead for a small-to-medium project.
- Vercel keeps frontend hosting simple and developer-friendly.
- The project should plan for monthly hosting costs, storage growth, and backup retention.
- A governance model should include data stewardship and access review for community language data.

## Supervisor-facing summary
This deployment architecture supports the long-term institutional goal of building a national language data archive that is usable, trusted, and sustainable. It aligns with the project’s core objective: to preserve and make accessible language data for low-resourced Namibian languages while respecting consent, access rights, and community ownership.
