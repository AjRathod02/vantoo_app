# Vantoo Platform — Security Architecture

## Authentication

### Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token (JWT) | 15 minutes | Memory (mobile), httpOnly cookie option (web) | API authorization |
| Refresh Token | 30 days | Secure storage (Keychain/Keystore), httpOnly cookie (web) | Obtain new access tokens |

### JWT Claims

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["customer"],
  "permissions": ["orders:read", "orders:create"],
  "sessionId": "session-uuid",
  "deviceId": "device-uuid",
  "iat": 1700000000,
  "exp": 1700000900,
  "iss": "vantoo-auth",
  "aud": "vantoo-platform"
}
```

Access tokens are signed with RS256 (production) or HS256 (development). Public keys distributed via JWKS endpoint.

### OTP Security

- 6-digit cryptographically random OTP
- 5-minute expiry (configurable)
- Maximum 3 attempts per OTP
- Rate limit: 5 OTP requests per phone/email per hour
- OTP stored hashed in Redis (never plaintext in database)
- SMS/email delivery via notification service (Phase 2); logged in auth audit

### Password Policy

- Minimum 8 characters
- Hashed with Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
- Password history: last 5 passwords cannot be reused
- Account lockout after 10 failed attempts (15-minute lock)

### OAuth (Google / Apple)

- Authorization code flow with PKCE
- State parameter for CSRF protection
- Identity linked via `auth_identities` table
- Email verification required for account merge

## Authorization (RBAC)

### Role Hierarchy

```
super_admin
  └── admin
        ├── finance_team
        ├── area_manager
        ├── support_executive
        ├── vendor (restaurant_owner | grocery_store | ecommerce_seller)
        ├── delivery_rider
        └── customer
```

### Permission Model

Permissions follow `resource:action` format:

```
products:read, products:create, products:update, products:delete
orders:read, orders:create, orders:update, orders:cancel
vendors:read, vendors:approve, vendors:manage
users:read, users:manage, users:ban
payments:read, payments:refund, payments:settle
admin:dashboard, admin:reports, admin:config
```

Roles are assigned via `user_roles`. Permissions are assigned to roles via `role_permissions`. Super admin bypasses permission checks.

### Multi-Tenant Isolation

Vendor-scoped data filtered by `vendor_id` at the service layer. RLS policies enforce tenant boundaries at the database level for defense in depth.

## Session & Device Management

- Each login creates a session record with IP, user agent, device fingerprint
- Users can view and revoke individual sessions
- "Logout all devices" revokes all refresh tokens except current session
- Suspicious login detection: new device + new location triggers notification (Phase 2)
- Maximum 10 concurrent sessions per user (oldest revoked on overflow)

## API Security

### Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (login, OTP) | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Admin API | 200 requests | 1 minute |
| Search | 30 requests | 1 minute |

Implemented via Redis sliding window counters.

### Input Validation

- All request bodies validated with Zod schemas
- SQL queries use parameterized statements exclusively (pg prepared statements)
- No dynamic SQL construction from user input

### HTTP Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS

- Production: whitelist specific origins (customer domain, admin domain, mobile deep links)
- Development: localhost origins allowed

## Data Protection

### Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Passwords | Argon2id hash | TLS 1.3 |
| PII (phone, email) | AES-256-GCM column encryption (Phase 2) | TLS 1.3 |
| Payment data | Never stored (Razorpay tokenization) | TLS 1.3 |
| KYC documents | Encrypted object storage | TLS 1.3 |

### Audit Logging

All security-relevant actions logged to `auth.audit_logs`:

- Login success/failure
- OTP send/verify
- Password change/reset
- Role assignment
- Session revocation
- Permission denied events
- Admin actions

Logs include: `user_id`, `action`, `resource`, `ip_address`, `user_agent`, `metadata`, `created_at`.

Retention: 2 years minimum (compliance).

## Payment Security

- Razorpay webhook signature verification (HMAC-SHA256)
- Payment amounts validated server-side (never trust client)
- Idempotency keys prevent duplicate charges
- PCI DSS compliance via Razorpay (no card data touches our servers)

## File Upload Security

- Allowed MIME types whitelist (images: jpeg, png, webp; docs: pdf)
- Maximum file size: 10MB (images), 25MB (documents)
- Virus scanning via ClamAV (Phase 2)
- Stored in private buckets with signed URLs (15-minute expiry)

## Infrastructure Security

- All services in private VPC subnets
- Database not publicly accessible
- Secrets managed via environment variables / secret manager (never in code)
- Container images scanned for vulnerabilities in CI
- Dependency audit via `npm audit` in CI pipeline

## Incident Response

1. **Detection** — Audit logs, rate limit alerts, anomaly detection
2. **Containment** — Revoke compromised sessions, freeze affected wallets
3. **Investigation** — Audit log analysis, correlation by IP/device
4. **Recovery** — Force password reset, notify affected users
5. **Post-mortem** — Document and patch within 72 hours
