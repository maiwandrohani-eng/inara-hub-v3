# INARA Platform Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure Database**
   - Create a PostgreSQL database
   - Update `server/.env` with your database connection string:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/inara_platform"
     JWT_SECRET="your-secret-key-here"
     ```

3. **Initialize Database**
   ```bash
   cd server
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start Development**
   ```bash
   # From root directory
   npm run dev
   ```

5. **Access the Platform**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Login with: `admin@inara.org` / `admin123`

## Database Schema

The platform uses Prisma ORM with PostgreSQL. Key models include:

- **User**: Staff profiles with roles, departments, countries
- **WorkSystem**: 8 operational systems with access rules
- **Training**: Training modules with quizzes and certifications
- **Policy**: Policies with version control and assessments
- **LibraryResource**: Knowledge hub resources
- **MarketSubmission**: Innovation marketplace ideas
- **Template**: Standardized templates
- **ActivityLog**: Comprehensive audit trail

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin)
- `GET /api/auth/me` - Get current user

### Work Systems
- `GET /api/work/systems` - List all work systems
- `GET /api/work/systems/:id/access` - Check system access
- `POST /api/work/systems/:id/access` - Access system (returns URL)

### Training
- `GET /api/training` - List trainings
- `GET /api/training/:id` - Get training details
- `POST /api/training/:id/progress` - Update progress
- `POST /api/training/:id/quiz` - Submit quiz

### Policies
- `GET /api/policies` - List policies
- `GET /api/policies/:id` - Get policy details
- `POST /api/policies/:id/acknowledge` - Acknowledge policy
- `POST /api/policies/:id/assessment` - Submit assessment

### Library
- `GET /api/library` - List resources
- `GET /api/library/:id` - Get resource
- `GET /api/library/recommended/all` - Get recommendations

### Market
- `POST /api/market/submit` - Submit idea
- `GET /api/market/my-submissions` - Get my submissions
- `GET /api/market/all` - Get all submissions (reviewers)
- `POST /api/market/:id/review` - Review submission

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template (tracks download)
- `GET /api/templates/analytics/most-used` - Most used templates

### Bot
- `POST /api/bot/ask` - Ask INARA Bot a question

### Analytics
- `GET /api/analytics/people` - People analytics
- `GET /api/analytics/compliance` - Compliance analytics
- `GET /api/analytics/system-usage` - System usage analytics

### Admin
- All admin routes require ADMIN role
- `GET /api/admin/*` - Various management endpoints

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS settings
4. Set up SSL/TLS
5. Use environment-specific database
6. Configure file storage for uploads (templates, library resources)
7. Set up proper logging and monitoring

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser localStorage if needed

### CORS Issues
- Update CORS settings in `server/src/index.ts`
- Add frontend URL to allowed origins

## Next Steps

1. Configure work system URLs in admin panel
2. Upload training content
3. Add policies and assessments
4. Populate library with resources
5. Configure access rules for work systems
6. Set up email notifications (optional)
7. Configure file storage for uploads

