# PCF Overview

PCF Overview is an English-language web application for searching, filtering,
and reviewing Product Carbon Footprint records.

## Project Repository

This GitHub repository is the central source of truth for the project:

https://github.com/TomatenMarccc/PCF.git

Always use the latest repository state before making changes. Project changes
must be committed back to this repository.

## Technology Stack

- Node.js 22 or newer
- TypeScript with strict type checking
- React and React Router
- Vite
- Express
- Supabase PostgreSQL
- Supabase Row Level Security
- Node.js Test Runner

The browser never receives the Supabase service-role key. Database access is
routed through the Node.js API.

The current confirmation endpoint uses the server-side service-role key.
User-specific authorization must be added together with application
authentication before production use.

## Design System

The interface uses the following fixed color palette:

### Base Colors

- White: `#ffffff`
- Black: `#000000`
- Bosch Gray 50: `#71767c`

### Accent Colors

Accent colors must be used in this priority order:

1. Bosch Blue 50: `#007bc0`
2. Bosch Turquoise 50: `#18837e`
3. Bosch Purple 40: `#9e2896`
4. Bosch Green 50: `#00884a`

Bosch Blue is the primary interaction and selection color. Turquoise is used
for data and coverage visualization, Purple for intermediate states, and Green
for successful or completed states. White, Black, and Bosch Gray remain the
dominant interface colors.

## Features

- PCF overview with a fixed search and filter area
- Search by Part Number
- Combinable Plant Code, Reference Year, Calculation Method, and Product Class filters
- Result limits of 10, 25, or 50 records
- Copyable Part Number
- Status, BOM-Coverage, and PCF Total metrics
- Responsive result cards
- Part detail route with all required PCF fields
- PCF confirmation action that persists the status as `Complete`
- Top Parts PCF waterfall chart
- PCF Breakdown waterfall chart
- Top Materials percentage chart
- G2G emissions waterfall chart
- Interactive BOM-Tree with zoom, pan, node details, and PCF-scaled nodes
- BOM search with matching-node highlights and automatic path expansion
- Expand-all, collapse-all, and recenter actions
- Information placeholder route
- Supabase-backed filter options and result data

## Project Structure

```text
src/
  client/
    components/       Reusable UI components
    pages/            Overview, detail, and information routes
    api.ts            Browser API client
    App.tsx           Application shell and routing
    styles.css        Responsive enterprise UI
  config/
    env.ts            Server-side environment configuration
  lib/
    part-filters.ts   Query parsing and validation
    supabase.ts       Server-side Supabase client
  server.ts           Express API and production static server
supabase/
  migrations/         Versioned database schema
  config.toml         Supabase CLI configuration
  seed.sql            Development and mock data
```

## Environment Setup

Create the local environment file:

```bash
cp .env.example .env.local.development
```

Set the values from `Supabase Dashboard -> Project Settings -> API`:

```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is optional for the current application and must
never be exposed to the browser or committed to Git.

## Install And Run

```bash
npm install
npm run dev
```

Development services:

- Web application: http://localhost:3000
- Node.js API: http://localhost:3001
- Health check: http://localhost:3001/api/health

## Available Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the production build. In a production environment, provide
the environment variables through the hosting platform.

## Vercel Deployment

The repository contains `vercel.json` and an Express entry point in
`api/index.ts`. Vercel builds the Vite frontend into `dist/client`, routes
`/api/*` requests to the Express serverless function, and sends all other
routes to the React application.

Configure these variables in `Project Settings -> Environment Variables`:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Apply them to Production and Preview deployments. Do not configure `PORT`;
Vercel manages the function runtime automatically. Redeploy after changing
environment variables.

## Application Routes

- `/` - PCF overview, search, filters, and preview cards
- `/parts/:id` - selected part detail
- `/info` - information placeholder

## Supabase

The local project is linked to the hosted Supabase instance. Apply pending
migrations and seed data with:

```bash
supabase db push --include-seed
```

For local Supabase development, Docker must be running:

```bash
supabase start
supabase db reset
```

### Parts Table

The `public.parts` table contains:

- `id`
- `part_number`
- `name`
- `status`
- `bom_coverage`
- `pcf_total`
- `plant_code`
- `product_class`
- `calculation_method`
- `reference_year`
- `validity_year`
- `primary_data_share`
- `cx_data_quality_rating_total`
- `pcf_calculation_version`
- `created_at`
- `updated_at`

The schema validates statuses, percentages, non-negative PCF values, and
four-digit Plant Codes. Anonymous and authenticated clients receive read-only
access through a Supabase RLS policy.

The current seed contains 12 development records. Replace or extend these
records in `supabase/seed.sql` as the business dataset becomes available.

### Part Chart Data

The `public.part_chart_data` table stores one chart-data record per part:

- `top_parts` - variable part contributions in `kgCO2eq/pc`
- `pcf_breakdown` - BOM, G2G, logistics, and packaging contributions
- `material_breakdown` - material shares that total 100 percent
- `g2g_breakdown` - Gate-to-Gate emission contributions in `kgCO2eq/pc`

Each field is a JSON array of `{ "label": string, "value": number }` entries.
This keeps the X-axis categories flexible per part while the chart type and
Y-axis unit remain consistent. The current migration and seed file generate
mock chart data for all existing development parts.

### BOM Tree Data

The `public.bom_nodes` table stores a normalized hierarchy for every part.
Each node contains:

- Stable node and parent keys
- Material or Part Number
- Description and source system
- Quantity and hierarchy level
- PCF, upstream PCF, and MCF values
- Leaf-node state

The mock generator creates 127 nodes per development part across four levels:
one root, six assemblies, 30 components, and 90 material leaves. Node sizes in
the visualization are scaled by PCF. Parent and leaf nodes use the colors and
search-highlight behavior derived from the supplied BOM visualization logic.

Inside the BOM modal:

- The tree starts fully collapsed and initially shows only the root node.
- Click a node to expand/collapse it and inspect its values.
- Right-click a node to open its details without changing expansion.
- Search by Material Number, description, source, or level.
- Matching nodes receive a blue highlight and their ancestor paths open.
- Use `Expand all`, `Collapse all`, and the recenter button for large trees.

Node colors follow the hierarchy and material type:

- Root: Black
- Assemblies: Bosch Blue
- Components: Bosch Turquoise
- Steel materials: Bosch Gray
- Aluminium materials: Bosch Purple
- Thermoplastic materials: Bosch Green
