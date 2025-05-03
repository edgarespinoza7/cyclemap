![Banner](./public/Banner%20Desktop.png)
![Banner](./public/Banner%20Mobile.png)

# CycleMap

A modern web application for discovering and exploring bike-sharing networks worldwide. Built with Next.js 14, TypeScript, and Mapbox GL JS.

Visit (https://cyclemap-gamma.vercel.app/) to view the deployed application.


## Features

- **Interactive World Map**: Visualize bike-sharing networks globally using Mapbox GL JS
- **Real-time Station Data**: Monitor bike and dock availability across stations
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Smart Search & Filtering**: Find networks by name or country
- **Optimized Data Fetching**: Implemented caching strategy using SWR to handle API rate limits

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Map**: Mapbox GL JS
- **Data Fetching**: SWR
- **State Management**: React Context
- **Deployment**: Vercel

## Architecture

### Key Design Decisions

1. **App Router & Server Components**

   - Leveraged Next.js 14 App Router for improved routing and layouts
   - Used Server Components where possible to reduce client-side JavaScript

2. **Data Fetching Strategy**

   - Implemented SWR for data caching and revalidation
   - Managed API rate limits through optimized fetching patterns
   - Created fallback mechanisms for handling API timeouts

3. **Map Implementation**

   - Custom map controls and interactions
   - Efficient marker clustering for large datasets
   - Synchronized sidebar and map state

4. **Component Architecture**
   - Shared UI components using shadcn/ui
   - Context-based state management for map interactions
   - Responsive layout with mobile-first approach

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Mapbox API key
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cyclemap-frontend.git

# Install dependencies
cd cyclemap-frontend
npm install

# Set up environment variables
cp .env.example .env.local
```

Add your Mapbox API key to `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Development

```bash
# Start development server
npm run dev
```

Visit `https://cyclemap-gamma.vercel.app/` to view the application.

## Challenges & Solutions

### API Rate Limiting

**Challenge**: The bike-sharing API has strict rate limits that affected data freshness.

**Solution**: Implemented SWR with custom configuration:

- Optimized revalidation intervals
- Implemented stale-while-revalidate pattern
- Added error boundaries for failed requests

### Map Performance

**Challenge**: Rendering large numbers of markers affected performance.

**Solution**:

- Implemented marker clustering
- Added viewport-based rendering
- Optimized layer management

## Project Structure

```
cyclemap-frontend/
├── src/
│   ├── app/             # App router pages and layouts
│   ├── components/      # Reusable components
│   ├── context/         # React context providers
│   ├── lib/            # Utilities and API functions
│   └── types/          # TypeScript definitions
├── public/             # Static assets
└── tailwind.config.js  # Tailwind configuration
```

## Acknowledgments

- [CityBikes API](https://api.citybik.es/v2/) for providing bike-sharing data
- [Mapbox](https://www.mapbox.com/) for map visualization
- [shadcn/ui](https://ui.shadcn.com/) for UI components
