# New Homes Lead Finder - Project Summary

## Overview

A professional-grade, production-ready full-stack TypeScript application for tracking and scoring new home construction leads for pool sales companies. The system ingests data from multiple sources (permits, assessors, builders), automatically scores leads based on customizable criteria, and provides a comprehensive dashboard for lead management.

## Architecture

### Monorepo Structure
```
├── server/          # Node.js + Fastify backend
├── web/             # React + TypeScript frontend  
├── supabase/        # Database migrations
└── README.md        # Comprehensive documentation
```

### Technology Stack

**Backend:**
- Node.js 20+ with TypeScript
- Fastify (web framework)
- Supabase Client (PostgreSQL access)
- Zod (validation)

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

**Database:**
- PostgreSQL via Supabase
- Row Level Security (RLS) enabled
- Comprehensive indexing

## Core Features

### 1. Lead Management System
- **Multi-source ingestion**: FireCrawl and n8n webhooks
- **Automatic scoring**: 0-10 scale based on configurable rules
- **Deduplication**: Canonical key system prevents duplicates
- **Advanced filtering**: Search, score, date range, location, source, status
- **Bulk operations**: CSV export with custom filters

### 2. Intelligent Scoring Engine
Automated lead scoring based on:
- Lot size (≥0.09 acres: +2 points)
- Recency (issued ≤180 days: +2 points)
- Value/age (≥$500K OR built this/last year: +1 point)
- Status (FINAL/CO/ISSUED: +1 point)
- Maximum score: 10 (capped)

### 3. Data Source Management
- 22+ pre-seeded NJ sources
- County and township permit offices
- Assessor databases
- Builder communities
- Source status tracking
- Active/inactive toggles

### 4. Geographic Coverage
- All 21 NJ counties
- Town-level granularity
- Hierarchical organization (towns → counties)
- Active/inactive management

### 5. Professional Dashboard
**Five main tabs:**

1. **Leads**: Filterable table with score badges, status indicators, Google Maps integration
2. **Areas**: County and town management with active/inactive controls
3. **Sources**: Organized by type (permit/assessor/builder) with status tracking
4. **Exports**: Quick exports (7/30 days, high score) plus custom CSV generation
5. **Settings**: Scoring rules documentation, API configuration, system info

## Database Schema

### Tables

**leads** (main lead storage)
- Comprehensive address data
- Score and canonicalKey for deduplication
- Support for permits, assessors, builders, manual entries
- Tags and notes for annotations
- Timestamp tracking (firstSeen, lastSeen)

**areas** (geographic regions)
- Hierarchical structure (county → town)
- Slug-based URLs
- Active/inactive status

**sources** (data sources)
- Type categorization
- Geographic association
- Last run tracking
- Active/inactive status

### Security
- Row Level Security (RLS) on all tables
- Public read/write policies (for webhook ingestion)
- Unique constraints on slugs and canonical keys
- Comprehensive indexing for performance

## API Endpoints

### Leads
- `GET /api/leads` - List with filtering (search, score, date, location, source)
- `GET /api/leads/:id` - Get single lead
- `PATCH /api/leads/:id` - Update notes, tags, status

### Areas
- `GET /api/areas` - List all counties and towns
- `POST /api/areas` - Create new area
- `PATCH /api/areas/:id` - Update area (toggle active, rename)

### Sources
- `GET /api/sources` - List all data sources
- `POST /api/sources` - Add new source
- `PATCH /api/sources/:id` - Update source (active status, last run)

### Ingestion Webhooks
- `POST /api/ingest/firecrawl` - Ingest FireCrawl extractions
- `POST /api/ingest/n8n` - Ingest n8n workflow data
- Both require `x-admin-token` header

### Export
- `GET /api/export.csv` - Generate CSV with filters
- Defaults to last 7 days if no date range specified

## Seeded Data

The application comes pre-populated with:

### Counties (21)
All NJ counties: Atlantic, Bergen, Burlington, Camden, Cape May, Cumberland, Essex, Gloucester, Hudson, Hunterdon, Mercer, Middlesex, Monmouth, Morris, Ocean, Passaic, Salem, Somerset, Sussex, Union, Warren

### Towns (11 in Monmouth County)
Freehold, Holmdel, Marlboro, Middletown, Howell, Colts Neck, Manalapan, Wall, Aberdeen, Matawan, Red Bank

### Data Sources (22)
- 6 Monmouth township permit offices
- 15 county-level permit/assessor portals
- 1 builder (Toll Brothers)

### Sample Leads (10)
Realistic mock data covering:
- New construction permits
- Assessor records
- Builder communities
- Various lot sizes, values, and scores

## Developer Experience

### Quick Start
```bash
# Install all dependencies
npm run install:all

# Run database migration (via Supabase dashboard recommended)
# See SETUP.md for instructions

# Seed database
npm run db:seed

# Development mode (runs both server and web)
npm run dev
```

### Build
```bash
# Build everything
npm run build

# Build individually
npm run build:server
npm run build:web
```

### Scripts
- `npm run dev` - Start server + web in dev mode
- `npm run dev:server` - Server only
- `npm run dev:web` - Frontend only
- `npm run build` - Production build
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database

## Production Readiness

### Code Quality
- Full TypeScript throughout
- Zod validation on all API inputs
- Error handling and logging
- Clean architecture with separation of concerns
- Modular file organization

### Performance
- Database indexing on frequently queried columns
- Efficient pagination
- Optimized queries with Supabase client
- Production build optimization with Vite

### Security
- Admin token for webhook endpoints
- RLS policies on all tables
- Input validation
- CORS configuration
- No exposed credentials

### UX/UI
- Mobile-first responsive design
- Clean, professional interface
- Intuitive navigation
- Sticky filter bars
- Loading states and error handling
- Toast-ready architecture (notifications)
- Accessible color schemes

## Integration Points

### FireCrawl
Expected payload format:
```json
{
  "source": "freehold-permits",
  "permitNumber": "24-001234",
  "issueDate": "2025-09-20",
  "status": "ISSUED",
  "permitType": "New SFD",
  "rawAddress": "123 Main St, Freehold, NJ 07728",
  "contractorName": "ABC Builders",
  "estValue": 650000,
  "lotAcres": 0.35
}
```

### n8n
Expected payload format:
```json
{
  "source": "monmouth-assessor",
  "kind": "assessor",
  "rawAddress": "45 Oak Dr, Holmdel, NJ 07733",
  "street": "45 Oak Dr",
  "city": "Holmdel",
  "state": "NJ",
  "zip": "07733",
  "county": "Monmouth",
  "town": "Holmdel",
  "lotAcres": 0.32,
  "yearBuilt": 2025
}
```

## File Organization

### Backend (`/server/src/`)
- `index.ts` - Fastify server setup
- `types.ts` - TypeScript interfaces and DB mappers
- `scoring.ts` - Lead scoring logic
- `db/connection.ts` - Supabase client
- `db/migrate.ts` - Migration runner
- `db/seed.ts` - Data seeding
- `routes/` - API endpoint handlers
- `utils/` - Normalization helpers

### Frontend (`/web/src/`)
- `App.tsx` - Main application shell
- `main.tsx` - React entry point
- `types.ts` - TypeScript interfaces
- `api.ts` - API client functions
- `components/` - Tab components (Leads, Areas, Sources, Exports, Settings)

## Deployment Notes

1. **Database**: Run migration SQL via Supabase dashboard
2. **Environment**: Configure Supabase URL and keys in `.env`
3. **Backend**: Deploy server to Node.js hosting (e.g., Railway, Render)
4. **Frontend**: Deploy web build to CDN/static host (e.g., Vercel, Netlify)
5. **Webhooks**: Configure FireCrawl and n8n to POST to `/api/ingest/*`

## Future Enhancements

Potential additions:
- Lead assignment and workflow management
- Email notifications for high-score leads
- Advanced analytics and reporting
- Multi-user support with authentication
- Mobile app (React Native)
- Additional data sources
- ML-based scoring improvements
- Geographic visualization (map view)

## License

MIT

## Support

For setup assistance, see `SETUP.md` and `README.md`.
