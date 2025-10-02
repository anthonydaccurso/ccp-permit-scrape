# Setup Instructions

## Database Setup

The application uses Supabase for the PostgreSQL database. Follow these steps to set up the database:

### 1. Apply Migration

The database schema is defined in `supabase/migrations/001_initial_schema.sql`. To apply it:

**Option A: Using Supabase Dashboard (Recommended)**

1. Log in to your Supabase dashboard at https://supabase.com/dashboard
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click "Run" to execute the migration

**Option B: Using the Migration Script**

The migration script is provided but requires database URL access. For Supabase, the dashboard method is recommended.

### 2. Seed Initial Data

After applying the migration, run the seed script to populate initial data:

```bash
npm run db:seed
```

This will create:
- 21 NJ counties
- 11 Monmouth County towns
- 22 data sources (permit offices, assessor sites, builders)
- 10 sample leads

## Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
ADMIN_TOKEN_NEW=your-secure-admin-token
PORT=3001
```

## Running the Application

1. Start the backend server:
```bash
cd server && npm run dev
```

2. In a separate terminal, start the frontend:
```bash
cd web && npm run dev
```

Or run both together from the root:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
