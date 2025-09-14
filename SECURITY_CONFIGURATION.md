# Security Configuration Guide

## Problem Solved

The application was blocking localhost requests in development mode due to overly strict security middleware. The security system was:

1. **Rejecting IPv6 localhost (`::1`)** - Common when accessing `http://localhost:3000` from modern browsers
2. **Flagging normal API endpoints as malicious** - The pattern detection was too aggressive
3. **Blocking legitimate development tools** - User agents like browsers were being flagged

## Solution Implemented

### Environment-Aware Security

The security middleware now adapts based on the `NODE_ENV`:

- **Development Mode**: Lenient security rules for easier development
- **Production Mode**: Strict security rules for maximum protection

### New Configuration Options

Added three new environment variables to control security strictness:

```bash
# Development (Lenient)
ENABLE_STRICT_IP_VALIDATION=false
ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=false
ENABLE_STRICT_USER_AGENT_VALIDATION=false

# Production (Strict)
ENABLE_STRICT_IP_VALIDATION=true
ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=true
ENABLE_STRICT_USER_AGENT_VALIDATION=true
```

### Changes Made

#### 1. Enhanced IP Validation (`SecurityService.isValidIpAddress`)
- **Development**: Allows common localhost variations (`127.0.0.1`, `::1`, `localhost`, `0.0.0.0`)
- **Production**: Strict IPv4/IPv6 validation
- **Fixed**: IPv6 localhost regex pattern

#### 2. Improved Malicious Pattern Detection (`SecurityService.containsMaliciousPatterns`)
- **Development**: Only blocks obvious XSS and SQL injection attempts
- **Production**: Comprehensive pattern detection (original behavior)
- **Fixed**: Normal API endpoints no longer flagged as malicious

#### 3. Flexible User-Agent Validation (`SecurityService.isValidUserAgent`)
- **Development**: Only blocks known malicious scanners
- **Production**: Blocks bots, crawlers, and automated tools
- **Fixed**: Browser user agents now accepted in development

#### 4. Conditional Middleware Checks (`SecurityMiddleware`)
- IP validation only runs when `enableStrictIpValidation=true`
- Malicious pattern detection only runs when `enableStrictMaliciousPatternDetection=true`
- User-Agent validation only runs when `enableStrictUserAgentValidation=true`

## Usage

### Quick Toggle Script

Use the provided script to switch between security modes:

```bash
# Enable lenient mode (development)
node scripts/toggle-security.js lenient

# Enable strict mode (production)
node scripts/toggle-security.js strict
```

### Manual Configuration

Edit your `.env` files directly:

**For Development (`.env`, `.env.development`):**
```bash
ENABLE_STRICT_IP_VALIDATION=false
ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=false
ENABLE_STRICT_USER_AGENT_VALIDATION=false
```

**For Production (`.env.production`):**
```bash
ENABLE_STRICT_IP_VALIDATION=true
ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=true
ENABLE_STRICT_USER_AGENT_VALIDATION=true
```

## Testing

After applying these changes:

1. **Development**: `http://localhost:3000/api/health` should work without security errors
2. **Production**: All security validations remain active for maximum protection

## Security Considerations

- **Development**: Security is relaxed for easier development but still protects against obvious attacks
- **Production**: Full security protection is maintained
- **Localhost**: IPv6 localhost (`::1`) is now properly handled
- **API Endpoints**: Normal REST API patterns are no longer blocked

## Files Modified

1. `src/infrastructure/security/security.service.ts` - Enhanced validation logic
2. `src/infrastructure/security/security.middleware.ts` - Conditional security checks
3. `src/infrastructure/config/app.config.ts` - New configuration options
4. `.env`, `.env.development`, `.env.production` - Environment-specific settings
5. `scripts/toggle-security.js` - Utility script for switching modes

## Backward Compatibility

- Existing production deployments remain secure (strict mode by default)
- Development environments become more user-friendly
- All security features can be individually controlled