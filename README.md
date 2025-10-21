# Simple Login Project

A minimal full-stack web application implementing user authentication with login and dashboard pages. Built with modern technologies for security and performance.

## Features

- **User Authentication**: Email/Username + Password login
- **Form Validation**: Required fields and basic email format validation
- **Password Security**: Show/Hide password toggle and bcrypt hashing
- **JWT Authentication**: Secure token stored in HttpOnly cookie
- **Protected Routes**: Dashboard accessible only with valid JWT
- **Rate Limiting**: 5 login attempts per minute per IP address
- **Responsive Design**: Mobile-friendly UI using TailwindCSS with collapsible sidebar on mobile
- **Dark Mode**: Toggle between light and dark themes with persistence
- **Database Seeding**: Automated user creation with seed script

## Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router** for client-side routing
- **TailwindCSS** for styling
- **Axios** for API calls
- **React Icons** for UI icons
- **Vanta.js** and **Three.js** for background animations

### Backend
- **Node.js** with Express.js
- **MySQL2** for database connectivity
- **bcrypt** for password hashing
- **jsonwebtoken** for JWT handling
- **express-rate-limit** for rate limiting
- **cookie-parser** for secure cookie management
- **CORS** for cross-origin requests

## Project Structure

```
simple-login-project/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Login and Dashboard pages
│   │   ├── styles/        # Global styles
│   │   └── main.jsx       # App entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── middleware/         # Auth middleware
│   ├── routes/            # API routes
│   ├── db.js              # Database connection
│   ├── index.js           # Server entry point
│   ├── seed.js            # Database seeding
│   └── package.json
├── screenshots/            # App screenshots
├── .gitignore             # Git ignore rules
├── package.json           # Root package.json
└── README.md              # This file
```

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (version 5.7 or higher) - [Download here](https://www.mysql.com/)
- **Git** - [Download here](https://git-scm.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-github-repo-url>
cd simple-login-project
```

### 2. Database Setup

1. Start your MySQL server
2. Create a new database (e.g., `simple_login_db`)

### 3. Backend Setup

```bash
cd server
# Copy environment file and edit database credentials
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
DB_HOST=127.0.0.1
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=simple_login_db
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

Install dependencies and seed the database:

```bash
npm install
npm run seed
npm run dev
```

The server will start at `http://localhost:4000`

### 4. Frontend Setup

Open a new terminal window:

```bash
cd client
npm install
npm run dev
```

The client will start at `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Use the default login credentials:
   - **Email**: user@example.com
   - **Password**: Password123!
3. After successful login, you'll be redirected to the dashboard
4. To logout, click the logout button in the dashboard

## API Endpoints

### Authentication Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token (used for protected routes)

## Development

### Running in Development Mode

- **Server**: `npm run dev` (with nodemon for auto-restart)
- **Client**: `npm run dev` (with Vite hot reload)

### Building for Production

```bash
# Client build
cd client
npm run build
npm run preview

# Server build
cd server
npm run start
```

## Environment Variables
## Testing



### Running Unit Tests



The project includes unit tests for React components using Jest and React Testing Library.



```bash

cd client

npm test          # Run tests once

npm run test:watch # Run tests in watch mode

```



**Test Coverage:**

- Login form validation

- Password show/hide toggle functionality

- API call mocking and error handling

- Component rendering and user interactions



### Server (.env)

```env
DB_HOST=127.0.0.1          # MySQL host
DB_USER=root               # MySQL username
DB_PASS=                   # MySQL password
DB_NAME=simple_login_db    # Database name
JWT_SECRET=your_secret_key # JWT signing secret
NODE_ENV=development       # Environment (development/production)
```

## Security Notes

- JWT tokens are stored in HttpOnly cookies for security
- Passwords are hashed using bcrypt with salt rounds
- Rate limiting prevents brute force attacks
- CORS is configured for cross-origin requests
- In production, always use `NODE_ENV=production` and a strong `JWT_SECRET`


## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

Developed by D.N. Zaki Zamani

## Screenshots

Check the `screenshots/` folder for application previews.

