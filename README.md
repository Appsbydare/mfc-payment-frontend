# MFC Payment System - Frontend

This is the frontend application for the Malta Fight Co. Payment Automation System.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=MFC Payment System
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API services
├── store/         # Redux store configuration
├── types/         # TypeScript type definitions
└── App.tsx        # Main application component
```

## Deployment

This project is configured for deployment on Vercel. The build process will:

1. Compile TypeScript
2. Build the Vite application
3. Output to the `dist` directory
4. Serve static files with client-side routing support

## API Integration

The frontend communicates with the backend API. Make sure to:

1. Set the correct `VITE_API_BASE_URL` environment variable
2. Ensure CORS is properly configured on the backend
3. Handle authentication tokens appropriately 

# I need to push this somehow :). Yes. I need it again