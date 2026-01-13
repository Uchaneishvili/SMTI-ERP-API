# SMTI ERP API

Commission Management System API - Manages hotel commission agreements and calculates commissions for completed bookings.

## Tech Stack

- **Framework**: NestJS 10+ with TypeScript 5+
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston with daily rotation

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Docker)
- npm or yarn

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Uchaneishvili/SMTI-ERP-API.git
cd SMTI-ERP-API

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Generate Prisma client
npm run prisma:generate

# 5. Run migrations
npm run prisma:migrate

# 6. Start development server
npm run dev
```

### Using Docker

```bash
# Start PostgreSQL + API
docker-compose up -d

# API available at http://localhost:3000
# Swagger docs at http://localhost:3000/docs
```

## Database Schema

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│     Hotel       │──────<│  CommissionAgreement │>──────│    TierRule     │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id              │       │ id                   │       │ id              │
│ name            │       │ hotelId              │       │ agreementId     │
│ status          │       │ rateType             │       │ minBookings     │
│ createdAt       │       │ baseRate             │       │ maxBookings     │
│ updatedAt       │       │ preferredBonusRate   │       │ bonusRate       │
└─────────────────┘       │ effectiveFrom        │       └─────────────────┘
        │                 │ effectiveUntil       │
        │                 │ isActive             │
        │                 └──────────────────────┘
        │                           │
        v                           v
┌─────────────────┐       ┌──────────────────────┐
│    Booking      │──────>│  CommissionRecord    │
├─────────────────┤       ├──────────────────────┤
│ id              │       │ id                   │
│ hotelId         │       │ bookingId            │
│ bookingReference│       │ agreementId          │
│ amount          │       │ bookingAmount        │
│ currency        │       │ baseRate (snapshot)  │
│ status          │       │ preferredBonus       │
│ bookingDate     │       │ tierBonus            │
│ completedAt     │       │ totalRate            │
└─────────────────┘       │ commissionAmount     │
                          │ calculationDetails   │
                          │ calculatedAt         │
                          └──────────────────────┘
```

## API Endpoints

### Hotels

| Method | Endpoint                                  | Description          |
| ------ | ----------------------------------------- | -------------------- |
| POST   | `/api/v1/hotels`                          | Create hotel         |
| GET    | `/api/v1/hotels`                          | List hotels          |
| GET    | `/api/v1/hotels/:id`                      | Get hotel            |
| GET    | `/api/v1/hotels/:id/commission-agreement` | Get active agreement |
| PATCH  | `/api/v1/hotels/:id`                      | Update hotel         |
| DELETE | `/api/v1/hotels/:id`                      | Delete hotel         |

### Bookings

| Method | Endpoint                        | Description       |
| ------ | ------------------------------- | ----------------- |
| POST   | `/api/v1/bookings`              | Create booking    |
| GET    | `/api/v1/bookings`              | List bookings     |
| GET    | `/api/v1/bookings/:id`          | Get booking       |
| PATCH  | `/api/v1/bookings/:id`          | Update booking    |
| POST   | `/api/v1/bookings/:id/complete` | Mark as completed |
| POST   | `/api/v1/bookings/:id/cancel`   | Cancel booking    |

### Commission Agreements

| Method | Endpoint                            | Description      |
| ------ | ----------------------------------- | ---------------- |
| POST   | `/api/v1/commission-agreements`     | Create agreement |
| GET    | `/api/v1/commission-agreements`     | List agreements  |
| GET    | `/api/v1/commission-agreements/:id` | Get agreement    |
| PATCH  | `/api/v1/commission-agreements/:id` | Update agreement |
| DELETE | `/api/v1/commission-agreements/:id` | Delete agreement |

### Commissions

| Method | Endpoint                                              | Description          |
| ------ | ----------------------------------------------------- | -------------------- |
| POST   | `/api/v1/commissions/calculate`                       | Calculate commission |
| GET    | `/api/v1/commissions/summary?month=YYYY-MM`           | Monthly summary      |
| GET    | `/api/v1/commissions/export?month=YYYY-MM&format=csv` | Export records       |

## API Examples

### Create a Hotel

```bash
curl -X POST http://localhost:3000/api/v1/hotels \
  -H "Content-Type: application/json" \
  -d '{"name": "Grand Hotel Zurich", "status": "PREFERRED"}'
```

### Create a Commission Agreement

```bash
curl -X POST http://localhost:3000/api/v1/commission-agreements \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "HOTEL_UUID",
    "rateType": "TIERED",
    "baseRate": 0.10,
    "preferredBonusRate": 0.02,
    "tierRules": [
      {"minBookings": 5, "maxBookings": 10, "bonusRate": 0.01},
      {"minBookings": 11, "maxBookings": null, "bonusRate": 0.015}
    ]
  }'
```

### Create and Complete a Booking

```bash
# Create booking
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "HOTEL_UUID",
    "bookingReference": "BK-2026-001",
    "amount": 1500.00,
    "bookingDate": "2026-01-15T10:00:00Z"
  }'

# Mark as completed
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_UUID/complete
```

### Calculate Commission

```bash
curl -X POST http://localhost:3000/api/v1/commissions/calculate \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "BOOKING_UUID"}'
```

### Get Monthly Summary

```bash
curl "http://localhost:3000/api/v1/commissions/summary?month=2026-03"
```

## Scripts

| Command                  | Description             |
| ------------------------ | ----------------------- |
| `npm run dev`            | Start in watch mode     |
| `npm run build`          | Build for production    |
| `npm run start:prod`     | Run production build    |
| `npm run prisma:studio`  | Open Prisma Studio      |
| `npm run prisma:migrate` | Run database migrations |
| `npm run lint`           | Run ESLint              |
| `npm test`               | Run unit tests          |

## Environment Variables

| Variable       | Description                  | Default     |
| -------------- | ---------------------------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string | Required    |
| `PORT`         | Server port                  | 3000        |
| `NODE_ENV`     | Environment                  | development |
| `JWT_SECRET`   | JWT signing key              | Required    |
| `LOG_LEVEL`    | Logging level                | info        |
