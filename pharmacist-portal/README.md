# MzansiMed Pharmaceutical Management System

A modern React-based web application for managing pharmaceutical operations, built with TypeScript and modern web technologies.

## Features

- **Secure Authentication**: P-number and password-based login system
- **Add Medication**: Dual-panel interface for adding medication details
- **Check Instructions**: Placeholder page for future medication instruction functionality
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Modern UI**: Clean, professional interface with intuitive navigation

## Pages

### 1. Login Page
- P-number and password authentication
- Beautiful gradient design
- Form validation and error handling
- Session persistence

### 2. Add Medication Page
- **Left Panel**: Primary medication entry form
- **Right Panel**: Alternative medication entry form
- Comprehensive medication and patient information fields
- Responsive two-column layout

### 3. Check Instructions Page
- Currently blank as requested
- Ready for future implementation

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: CSS3 with modern design principles
- **State Management**: React Context API
- **Build Tool**: Create React App
- **Package Manager**: npm

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mzansi-med-pharmaceutical-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Starts the development server
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (not recommended)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navigation.tsx
│   └── Navigation.css
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── pages/              # Application pages
│   ├── LoginPage.tsx
│   ├── LoginPage.css
│   ├── AddMedicationPage.tsx
│   ├── AddMedicationPage.css
│   ├── CheckInstructionsPage.tsx
│   └── CheckInstructionsPage.css
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## Authentication

The application uses a simple authentication system that:
- Accepts P-number and password combinations
- Stores session information in localStorage
- Protects routes from unauthorized access
- Provides logout functionality

**Note**: This is a demo implementation. In production, integrate with your backend authentication system.

## Form Fields

### Medication Information
- Medication Name
- Dosage
- Frequency
- Duration
- Special Instructions

### Patient Information
- Patient Name
- Patient ID
- Date Prescribed
- Prescriber

## Responsive Design

The application is fully responsive and includes:
- Mobile-first design approach
- Breakpoints for tablets and mobile devices
- Touch-friendly interface elements
- Optimized layouts for different screen sizes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Modular CSS architecture

### Adding New Features
1. Create new components in the `components/` directory
2. Add new pages in the `pages/` directory
3. Update routing in `App.tsx`
4. Add corresponding CSS files
5. Update navigation if needed

## Deployment

### Build for Production
```bash
npm run build
```

The build folder contains the production-ready application.

### Deployment Options
- **Netlify**: Drag and drop the build folder
- **Vercel**: Connect your GitHub repository
- **AWS S3**: Upload build files to S3 bucket
- **Traditional hosting**: Upload build files to your web server

## Security Considerations

- Implement proper authentication with your backend
- Use HTTPS in production
- Validate all form inputs
- Implement CSRF protection
- Regular security updates

## Support

For technical support or questions:
- Contact the IT department
- Check the application logs
- Review the browser console for errors

## License

This project is proprietary software for MzansiMed pharmaceutical operations.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Developed by**: MzansiMed Development Team
