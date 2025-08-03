# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.0   | :white_check_mark: |

## Known Vulnerabilities

### Development-Only Vulnerabilities

The following vulnerabilities only affect the development environment and do not impact production builds:

1. **esbuild <= 0.24.2** (GHSA-67mh-4wv8-2f99)
   - **Severity**: Moderate
   - **Affected packages**: vite@5.4.19, lovable-tagger
   - **Description**: Allows any website to send requests to the development server
   - **Risk**: Development environment only - not exposed in production
   - **Mitigation**: 
     - Only run development server on trusted networks
     - Do not expose development server to public internet
     - Awaiting Vite v6+ compatibility for complete fix

## Security Features

This application implements several security measures for HIPAA compliance:

1. **Audit Logging**: Comprehensive logging of all authentication events
2. **Session Management**: 15-minute inactivity timeout
3. **Password Security**: Strong password requirements with complexity validation
4. **Data Encryption**: All data encrypted in transit and at rest via Supabase
5. **Access Control**: Row-level security policies in database

## Reporting a Vulnerability

To report a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to the repository maintainer
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide regular updates on the resolution.

## Security Updates

Security updates are applied regularly through:
- Dependabot alerts monitoring
- Regular `npm audit` checks
- Prompt patching of identified vulnerabilities

Last security review: January 3, 2025