# INARA Global Staff Platform

Unified Digital Workplace for All INARA Staff Worldwide

## Overview

The INARA Global Staff Platform is a comprehensive digital workplace solution that provides:

- **Work Systems Gateway**: Secure access to 8 operational systems with compliance gating
- **Training Management**: Complete LMS with certifications, expiry, and training paths
- **Orientation**: Live, auto-updating orientation with completion tracking
- **Policies**: Policy management with version control, assessments, and acknowledgment
- **Library**: Knowledge hub with search, tagging, and recommendations
- **Market**: Innovation marketplace for program ideas with review workflow
- **Templates**: Standardized template management with usage tracking
- **INARA Bot**: AI assistant for institutional questions
- **Admin Panel**: Comprehensive management interface
- **Analytics**: People, compliance, and usage dashboards

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (running locally or remote)

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cd server
cp .env.example .env
# Edit .env with your database URL and JWT secret
# Example DATABASE_URL: postgresql://user:password@localhost:5432/inara_platform
```

3. Set up the database:
```bash
cd server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed initial data (admin user, work systems, etc.)
```

4. Start development servers:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend app on http://localhost:3000

### Default Login Credentials

After seeding:
- **Admin**: `admin@inara.org` / `admin123`
- **Staff**: `staff@inara.org` / `staff123`

## Project Structure

```
inara-hub-v3/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── components/ # Reusable components
│   │   ├── store/    # State management
│   │   └── api/      # API client
│   └── ...
├── server/           # Node.js backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Auth middleware
│   │   └── index.ts  # Server entry
│   └── prisma/       # Database schema
└── ...
```

## Features

### Work Tab
- 8 system gateways with access control
- Role-based permissions
- Training/policy prerequisite checks
- Access logging

### Training Tab
- Mandatory and optional trainings
- Progress tracking
- Quiz/assessment system
- Certifications with expiry
- Training paths

### Orientation Tab
- Live, auto-updating content
- Completion tracking
- Micro-check assessments

### Policies Tab
- Brief, complete, and assessment views
- Version control
- Mandatory acknowledgment
- Re-certification on updates

### Library Tab
- Resource search and filtering
- Tagging system
- Role-based recommendations
- Access tracking

### Market Tab
- Concept note submission form
- Review workflow
- Bonus tracking
- Status management

### Templates Tab
- Category organization
- Version control
- Download tracking
- Most used analytics

### INARA Bot
- Institutional knowledge base
- Policy/training search
- Sensitive query detection
- Escalation guidance

### Admin Panel
- User management
- Content management (trainings, policies, library, templates)
- Work system configuration
- Access rule management
- Analytics dashboards

## Key Features Implemented

✅ **Work Tab**: 8 system gateways with role-based access control and compliance gating  
✅ **Training Tab**: Full LMS with progress tracking, quizzes, certifications, and expiry  
✅ **Orientation Tab**: Live orientation with completion tracking and micro-checks  
✅ **Policies Tab**: Policy management with version control, assessments, and acknowledgment  
✅ **Library Tab**: Knowledge hub with search, filtering, tagging, and recommendations  
✅ **Market Tab**: Innovation marketplace with concept note submission and review workflow  
✅ **Templates Tab**: Template management with categories, versions, and download tracking  
✅ **INARA Bot**: AI assistant for institutional questions with sensitive query detection  
✅ **Admin Panel**: Management interface for all platform content and configuration  
✅ **Analytics**: People, compliance, and system usage dashboards  
✅ **RBAC**: Role-based access control with department and country restrictions  
✅ **Compliance Gating**: Training and policy prerequisites for system access  
✅ **Activity Logging**: Comprehensive audit trail of all user actions

## License

Copyright © INARA

