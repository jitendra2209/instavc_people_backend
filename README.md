# InstaVC People Backend

Backend server for the InstaVC People Flutter application.

## Project Structure

```
instavc_people_backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.js   # Database configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   │   └── errorHandler.js
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── index.js         # Application entry point
├── .env                 # Environment variables (not in repo)
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
└── README.md          # Project documentation
```

## Technology Stack

- Node.js - Runtime environment
- Express.js - Web application framework
- MongoDB - Database
- Mongoose - MongoDB object modeling
- Additional packages:
  - cors - CORS middleware
  - helmet - Security headers
  - morgan - HTTP request logger
  - dotenv - Environment variables
  - swagger-jsdoc - OpenAPI/Swagger documentation
  - swagger-ui-express - Swagger UI for API documentation

## Setup and Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Copy `.env.example` to create your `.env` file:
   ```bash
   cp .env.example .env
   ```
   
   Then update the `.env` file with your MongoDB Atlas credentials:
   ```
   # Replace these values with your actual MongoDB Atlas credentials
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<appname>
   
   # Server configuration
   PORT=8000
   NODE_ENV=development
   ```
   
   To get your MongoDB URI:
   1. Log in to MongoDB Atlas
   2. Go to your cluster
   3. Click "Connect"
   4. Choose "Connect your application"
   5. Copy the connection string
   6. Replace `<username>`, `<password>`, and other placeholders with your actual values

3. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Security Features

- Helmet.js for security headers
- CORS protection
- Error handling middleware
- Environment variables for sensitive data

## Development

The project uses nodemon for development, which automatically restarts the server when files change.

## API Documentation

The API is documented using OpenAPI/Swagger specification. Once the server is running, you can access the interactive API documentation at:

```
http://localhost:8000/api-docs
```

The documentation includes:
- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Interactive API testing interface

### Available Endpoints

- **Authentication**
  - POST `/api/auth/signup` - Register a new user
  - POST `/api/auth/login` - Login user and get JWT token
  - GET `/api/auth/currentUser` - Get current user info (protected)
  - POST `/api/auth/forgotpassword` - Request password reset OTP
  - POST `/api/auth/resetpassword` - Reset password using OTP
