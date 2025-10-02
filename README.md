# New Homes Lead Finder

A professional full-stack application for tracking and managing new home construction leads for pool sales. Built with React, TypeScript, Node.js, Fastify, and PostgreSQL.

## Features

- **Lead Management**: Track permits, assessor data, and builder information
- **Smart Scoring**: Automated lead scoring based on lot size, value, recency, and status
- **Multi-Source Ingestion**: Webhooks for FireCrawl and n8n integration
- **Advanced Filtering**: Search, filter, and sort leads by multiple criteria
- **Area Management**: Manage counties and towns across New Jersey
- **Source Tracking**: Monitor crawl sources and their status
- **CSV Export**: Quick and custom exports with flexible filtering
- **RESTful API**: Full API access for integrations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Validation**: Zod
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository and install dependencies:

```bash
npm run install:all
```

2. Configure environment variables:

Copy `.env.example` to `.env` and update with your database credentials:

```
DATABASE_URL=postgresql://user:password@host:5432/database
ADMIN_TOKEN_NEW=your-secure-admin-token
PORT=3001
```

3. Run database migrations:

```bash
npm run db:migrate
```

4. Seed the database:

```bash
npm run db:seed
```

### Development

Start both server and frontend in development mode:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/health

### Production Build

Build the entire project:

```bash
npm run build
```

## Project Structure

```
.
├── server/               # Backend API
│   ├── src/
│   │   ├── db/          # Database connection and seeds
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Utilities
│   │   ├── types.ts     # TypeScript types
│   │   ├── scoring.ts   # Lead scoring logic
│   │   └── index.ts     # Server entry point
│   └── package.json
│
├── web/                 # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.ts       # API client
│   │   ├── types.ts     # TypeScript types
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   └── package.json
│
├── supabase/
│   └── migrations/      # Database migrations
│
└── package.json         # Root package (workspace)
```

## API Endpoints

### Leads

- `GET /api/leads` - List leads with filtering
- `GET /api/leads/:id` - Get single lead
- `PATCH /api/leads/:id` - Update lead

### Areas

- `GET /api/areas` - List all counties and towns
- `POST /api/areas` - Create new area
- `PATCH /api/areas/:id` - Update area

### Sources

- `GET /api/sources` - List all sources
- `POST /api/sources` - Create new source
- `PATCH /api/sources/:id` - Update source

### Ingestion Webhooks

- `POST /api/ingest/firecrawl` - Ingest FireCrawl data
- `POST /api/ingest/n8n` - Ingest n8n data

Requires `x-admin-token` header with admin token.

### Exports

- `GET /api/export.csv` - Export leads as CSV

## Scoring Rules

Leads are automatically scored (0-10) based on:

- **+2 points**: Lot size ≥ 0.09 acres
- **+2 points**: Issued within 180 days
- **+1 point**: Est. value ≥ $500K OR built this/last year
- **+1 point**: Status is FINAL, CO, or ISSUED

## Ingestion Payload Examples

### FireCrawl Format

```json
[
  {
    "source": "freehold-permits",
    "permitNumber": "24-001234",
    "issueDate": "2025-09-20",
    "status": "ISSUED",
    "permitType": "New SFD",
    "rawAddress": "123 Main St, Freehold, NJ 07728",
    "contractorName": "ABC Builders",
    "estValue": 650000
  }
]
```

### n8n Format

```json
[
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
    "yearBuilt": 2025,
    "status": "CO",
    "issueDate": "2025-09-15"
  }
]
```

## Data Sources

The system tracks 22+ data sources across New Jersey including:

- County and township permit offices
- Assessor databases
- Builder communities (Toll Brothers, etc.)

See the Sources tab in the UI for the complete list.

## Crawl & Ingest (GitHub Actions)

Automated daily crawling using FireCrawl + GitHub Actions to fetch permit data from all configured sources and ingest them into your database.

### Setup Instructions

1. **Install Dependencies**

   The crawl script dependencies are already in `package.json`. Run:

   ```bash
   npm install
   ```

2. **Configure GitHub Secrets**

   In your GitHub repository, navigate to Settings → Secrets and Variables → Actions, and add the following secrets:

   - `APP_BASE_URL` - Your production app URL (e.g., `https://leads.custompoolpros.com`)
   - `ADMIN_TOKEN_NEW` - Your admin token (same as in your `.env` file)
   - `FIRECRAWL_API_KEY` - Your FireCrawl API key (get from https://firecrawl.dev)

3. **Schedule Configuration**

   The workflow runs daily at 7:00 AM ET (11:00 AM UTC) automatically via GitHub Actions cron schedule.

   You can also trigger it manually:
   - Go to Actions tab in GitHub
   - Select "Crawl & Ingest" workflow
   - Click "Run workflow"

4. **Local Testing**

   Test the crawl script locally before deploying:

   ```bash
   # Set environment variables in your .env file
   APP_BASE_URL=http://localhost:3001
   ADMIN_TOKEN_NEW=your-admin-token
   FIRECRAWL_API_KEY=fc_live_your_key
   NOMINATIM_UA=CustomPoolPros/1.0 (contact@custompoolpros.com)

   # Run the crawl
   npm run crawl
   ```

5. **How It Works**

   - Fetches all active sources from `GET /api/sources`
   - For each source, initiates a FireCrawl request with HTML table extraction
   - Extracts permit data (issue date, permit number, address, type, status)
   - Normalizes addresses and creates canonical keys for deduplication
   - Optionally geocodes addresses using Nominatim (respects 1 req/sec rate limit)
   - Posts leads to `POST /api/ingest/firecrawl` with admin token authentication
   - Logs success/failure counts for each source

6. **Monitoring**

   Check GitHub Actions tab for workflow runs and logs. Each run provides:
   - Total sources processed
   - Successful vs failed sources
   - Total leads ingested
   - Per-source success/failure details

7. **FireCrawl Configuration**

   The default extraction targets common permit table structures:
   - Tables, `.permit-list`, `.results table` selectors
   - Fields: issueDate, permitNumber, rawAddress, permitType, status

   Customize the extraction in `scripts/crawl-and-ingest.ts` if needed for specific county formats.

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
