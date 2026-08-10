# eTunda Platform - Setup Guide

## 🚀 Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/SOTWke/etunda-platform.git
cd etunda-platform

# Create .env file
cp .env.example .env

# Start all services
docker-compose up -d
```

### Access Points:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

Health check: `curl http://localhost:5000/health`

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- npm or yarn
- PostgreSQL 16+ (optional if using Docker for DB)

### Installation

```bash
# Install root dependencies
npm install

# Install workspace dependencies
cd packages/backend && npm install
cd ../frontend && npm install
cd ../shared && npm install
```

### Running Services

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
# Backend will be available at http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
# Frontend will be available at http://localhost:3000
```

---

## 📁 Project Structure

```
etunda-platform/
├── packages/
│   ├── backend/           # Express.js REST API
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   ├── frontend/          # React.js Web Application
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   │
│   └── shared/            # Shared TypeScript Types
│       ├── src/
│       │   └── types.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD Pipeline
│
├── docker-compose.yml     # Multi-container setup
├── .env.example
├── package.json           # Monorepo root
├── SETUP.md              # This file
└── CONTRIBUTING.md       # Contribution guidelines
```

---

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product (farmer only)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Farmers
- `GET /api/farmers` - List all farmers
- `GET /api/farmers/:id` - Get farmer profile
- `PUT /api/farmers/:id` - Update farmer profile

### Buyers
- `GET /api/buyers` - List all buyers
- `GET /api/buyers/:id` - Get buyer profile
- `PUT /api/buyers/:id` - Update buyer profile

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

---

## 🔧 Environment Variables

### Root Level (`.env`)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=etunda_db
NODE_ENV=development
PORT=5000
```

### Backend (`packages/backend/.env`)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=etunda_db
JWT_SECRET=your_jwt_secret_key_here
```

---

## 📦 Useful Commands

### Root Level
```bash
# Run both backend and frontend in parallel
npm run dev

# Build all workspaces
npm run build

# Run tests in all workspaces
npm run test

# Format code
npm run format
```

### Backend
```bash
npm run dev         # Start development server
npm run build       # Build TypeScript
npm start           # Run compiled code
npm test            # Run tests
npm run lint        # Run linter
```

### Frontend
```bash
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

---

## 🐳 Docker Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Stop specific service
docker-compose down postgres  # or backend, frontend

# Rebuild images
docker-compose up -d --build
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5432 (database)
lsof -ti:5432 | xargs kill -9
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database name: `etunda_db`

### Dependencies Not Installing
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

---

## 📝 Next Steps

1. **Implement Authentication**
   - JWT token generation
   - User login/register endpoints
   - Password hashing with bcryptjs

2. **Set Up Database**
   - Create database schema
   - Implement database migrations
   - Seed sample data

3. **Build Core Features**
   - Product management
   - Farmer profiles
   - Buyer profiles
   - Order management system

4. **Frontend Development**
   - Authentication pages
   - Farmer dashboard
   - Buyer dashboard
   - Product listing and detail pages
   - Order management interface

5. **Deployment**
   - Set up CI/CD pipeline
   - Deploy to production server
   - Configure environment variables

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

---

## 📞 Support

For issues and questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Join our discussions

---

## 📄 License

MIT License - See LICENSE file for details

---

**Happy coding! 🌱**
