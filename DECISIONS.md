# Architecture Decisions

This document explains key design decisions made during the development of the Commission Management System.

## 1. Tiered Commission Modeling with Separate TierRule Table

### Decision

Tier rules are stored in a separate `TierRule` table rather than embedded as JSON in `CommissionAgreement`.

### Rationale

- **Normalization**: Each tier rule can be independently queried and indexed
- **Flexibility**: Easy to add, modify, or remove individual tiers without affecting the entire agreement
- **Validation**: Database-level constraints ensure data integrity (e.g., non-overlapping ranges)
- **Scalability**: Efficient queries when aggregating tier usage statistics

### Trade-off

- Slightly more complex queries (requires JOIN or include)
- More database rows to manage

### Alternative Considered

Storing tiers as JSON array in `CommissionAgreement.tierRules` would be simpler but less queryable.

---

## 2. Rate History Preservation via CommissionRecord Snapshots

### Decision

When calculating commission, all rate values are copied into `CommissionRecord` (baseRate, preferredBonus, tierBonus, totalRate).

### Rationale

- **Audit Trail**: Historical records show exactly what rates were applied at calculation time
- **Agreement Changes**: Future rate changes don't retroactively affect past calculations
- **Compliance**: Financial auditing requires immutable historical records
- **Debug-ability**: `calculationDetails` JSON provides full context for any calculation

### Trade-off

- Data duplication (rates stored in both Agreement and Record)
- Larger database size over time

### Alternative Considered

Storing only `agreementId` and recalculating - rejected because rate history would be lost.

---

## 3. Hard Deletes with Cascade

### Decision

Deleting a Hotel cascades to delete all related Agreements, Bookings, and CommissionRecords.

### Rationale

- **Simplicity**: No need for `deletedAt` fields and filtered queries
- **GDPR Compliance**: True deletion when required
- **Development Speed**: Faster to implement for MVP

### Trade-off

- No recovery possible after deletion
- Historical reporting for deleted hotels is lost
- Cascade might accidentally delete important data

### Alternative Considered

Soft deletes (adding `deletedAt` timestamp) - would preserve history but adds complexity to every query.

### Future Improvement

Add soft deletes for Hotel and Booking when audit requirements become stricter.

---

## 4. BaseService Generic Pattern

### Decision

Created an abstract `BaseService<T, C, U>` that handles common CRUD operations.

### Rationale

- **DRY Principle**: Avoids duplicating boilerplate across services
- **Consistency**: All entities use the same error handling and pagination patterns
- **Maintainability**: Bug fixes apply to all services at once

### Implementation

```typescript
export abstract class BaseService<T, C = unknown, U = unknown> {
  constructor(
    protected readonly model: CrudDelegate<T>,
    protected readonly entityName: string,
  ) {}

  async findAll(params?: QueryParams): Promise<T[]>;
  async findOne(id: string): Promise<T>;
  async create(data: C): Promise<T>;
  async update(id: string, data: U): Promise<T>;
  async remove(id: string): Promise<T>;
}
```

---

## 5. Booking Status Transitions

### Decision

Bookings can only transition from PENDING to COMPLETED or CANCELLED. No other transitions allowed.

### Rationale

- **Business Logic**: Completed/cancelled bookings are final states
- **Commission Integrity**: Prevents recalculation issues
- **State Machine**: Clear, predictable status flow

### Validation

```typescript
const allowedTransitions = {
  PENDING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
```

---

## 6. Commission Calculation as Service Method (Not Event-Driven)

### Decision

Commission is calculated via explicit API call, not automatically on booking completion.

### Rationale

- **Control**: Allows manual verification before calculation
- **Flexibility**: Can recalculate or skip certain bookings
- **Debugging**: Easier to trace calculation issues
- **Idempotency**: Calling calculate twice returns existing record

### Trade-off

- Requires additional API call after completing booking
- Risk of forgetting to calculate

### Future Improvement

Add optional webhook/event to auto-calculate on booking completion.

---

## 7. Monthly Aggregation at Query Time

### Decision

Monthly summaries are calculated on-demand from `CommissionRecord` data.

### Rationale

- **Real-time**: Always reflects current data
- **No Sync Issues**: No need to maintain separate summary tables
- **Simpler Architecture**: Fewer moving parts

### Trade-off

- Slower for large datasets
- Database load on every summary request

### Future Improvement

Add materialized views or pre-computed monthly summaries for performance.
