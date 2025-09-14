# MzansiMed Backend API

This is the backend API for the MzansiMed patient management system. It provides REST endpoints for managing patient data with PostgreSQL database integration.

## Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Make sure you have PostgreSQL installed and running. Create a database for the application:

```sql
CREATE DATABASE mzansimed_db;
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE mzansimed_db TO your_db_user;
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mzansimed_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Initialize Database

Run the database setup script to create tables and insert sample data:

```bash
npm run db:setup
```

### 5. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Patients
- `GET /api/patients` - Get all patients (with optional filtering)
- `GET /api/patients/:id` - Get a specific patient
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/:id` - Update an existing patient
- `DELETE /api/patients/:id` - Delete a patient

### Query Parameters for GET /api/patients

You can filter patients using the following query parameters:
- `search` - Search across all fields
- `initials` - Filter by initials
- `surname` - Filter by surname
- `address` - Filter by address
- `cellNumber` - Filter by cell number
- `homeLanguage` - Filter by home language
- `limit` - Number of results to return (default: 50, max: 100)
- `offset` - Number of results to skip (for pagination)

Example:
```
GET /api/patients?surname=Smith&homeLanguage=Afrikaans&limit=10
```

## API Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Patient Data Structure

```json
{
  "id": "uuid",
  "initials": "J.D.",
  "surname": "Smith",
  "address": "123 Main Street, Cape Town, 8001",
  "cellNumber": "082 123 4567",
  "homeLanguage": "Afrikaans",
  "createdAt": "2023-01-01T12:00:00Z",
  "updatedAt": "2023-01-01T12:00:00Z"
}
```

## Development

### Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm run db:setup` - Initialize database tables and sample data

### Database Schema

The `patients` table has the following structure:

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initials VARCHAR(10) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  cell_number VARCHAR(20) NOT NULL,
  home_language VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

The API includes comprehensive error handling:
- Input validation using express-validator
- Database error handling
- Duplicate patient prevention
- Proper HTTP status codes
- Detailed error messages

## Security Features

- CORS configuration
- Helmet.js for security headers
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Request logging with Morgan
