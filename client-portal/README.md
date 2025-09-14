# MzansiMed Client Portal

This is the client portal for MzansiMed, providing patient access to the system.

## Features

- User authentication with username/password
- Client dashboard
- Modern React TypeScript application

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Navigate to the client-portal directory:
   ```bash
   cd client-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (not recommended)

## Project Structure

```
src/
├── components/     # Reusable React components
├── contexts/       # React contexts (Auth, etc.)
├── pages/          # Page components
├── services/       # API and external services
├── utils/          # Utility functions
├── App.tsx         # Main App component
├── index.tsx       # Entry point
└── *.css          # Stylesheets
```

## Authentication

The client portal uses username/password authentication. For development, any non-empty credentials will work.

## Technology Stack

- React 18
- TypeScript
- React Router
- CSS3
