# Project Specification (MVP)

Project: Development of a National Digital Platform for Storage and Accessibility of Data for Low-resourced Namibian Languages

Summary
- Build a web platform to ingest, store, catalogue, search, and share language materials (audio, transcripts, metadata) for low-resourced Namibian languages. The platform targets researchers, community contributors, and administrators.

Primary goals
- Provide a reproducible, documented pipeline to import and archive language recordings and metadata.
- Allow contributors to upload recordings with structured metadata and request publishing/sharing permissions.
- Allow researchers and the public (per policy) to browse, search, and download permitted materials.
- Provide admin moderation and access control.

User roles
- Contributor: register, upload recordings, provide metadata, view own uploads, request sharing.
- Researcher/Consumer: browse languages, search transcripts, stream/download public materials.
- Admin/Moderator: review and approve uploads, manage contributors, set visibility and licenses.

MVP feature list
- Authentication: Supabase Auth for contributors and admins.
- Upload flow: file upload (audio), metadata form, preview, submit for moderation or immediate publish if permitted.
- Storage: Supabase Storage for media files, Postgres tables for metadata.
- Playback: in-browser audio playback with download option where permitted.
- Search & filters: full-text search on transcripts, filters for language, tags, date, license.
- Basic admin UI: list pending uploads, approve/reject, edit metadata.
- Import: SQL migration scripts and one-click import instructions for existing backup data.

Non-functional requirements
- Security: service_role keys stored in server environment; do not expose in frontend or repository.
- Privacy & consent: capture consent meta (consent_text, consent_date) and allow embargoed content.
- Backup & retention: periodic DB backups exported; media archived offsite.
- Performance: support hundreds of GB of media; use streaming and CDN where possible.

Clarifying questions (to finalize design)
1. Which data access levels are required (public / restricted / embargo)? Default: public + restricted by admin.
2. Expected scale (approx. number of recordings, total size)? Default: start small (thousands, <1TB) and scale later.
3. Transcription availability: will transcripts be uploaded or generated? Default: transcripts uploaded.
4. Any legal/licensing constraints to capture? Default: capture license field (CC-BY, CC0, restricted).
5. Preferred hosting (Supabase+Vercel recommended)? Default: use Supabase for DB/storage and Vercel for frontend.

Sprint plan (first 2 weeks)
- Day 1-3: Finalize `docs/spec.md` and `docs/schema.md`, update README, confirm Supabase project refs.
- Day 4-10: Implement backend migrations, seed sample data, and basic API endpoints for `languages` and `recordings`.
- Day 11-14: Implement frontend skeleton: language list and recording detail pages, connect to Supabase anon key.

Deliverables
- `docs/spec.md`, `docs/schema.md`
- SQL migrations in `nldr-backend/supabase/migrations`
- Working local dev run instructions in `README.md`
- Demo script and slides for supervisor review

Next actions for you
- Review and answer clarifying questions above (or accept defaults).
- Confirm which items to prioritise for the first sprint.
