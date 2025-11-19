# Database Migration Guide

This guide explains the schema changes needed to match the product spec.

## Schema Changes Summary

### New Fields Added

#### User Model
- `fullName` (String?): Primary name field

#### InvestorProfile Model
- `fullName` (String, required): Full name
- `email` (String, required): Email
- `halalScore` (Int?, default 0): 0-100 halal compliance score
- `halalCategory` (HalalCategory?): halal, grey, or forbidden
- `investmentPreferences` (String?): Investment preferences
- `bio` (String?): Bio
- `industriesInterestedIn` (String[]): Industries interested in
- `profileComplete` (Boolean, default false): Profile completion status
- `onboardingComplete` (Boolean, default false): Onboarding completion status
- `halalResponses` (Json?): HalalFocus questionnaire responses

#### VisionaryProfile Model
- `fullName` (String, required): Founder full name
- `email` (String, required): Email
- `halalScore` (Int?, default 0): 0-100 halal compliance score
- `halalCategory` (HalalCategory?): halal, grey, or forbidden
- `industry` (String, required): Industry (renamed from sector)
- `fundingNeeded` (Int?): Funding needed (renamed from fundingAsk)
- `profileComplete` (Boolean, default false): Profile completion status
- `onboardingComplete` (Boolean, default false): Onboarding completion status
- `halalResponses` (Json?): HalalFocus questionnaire responses

#### New Enum
- `HalalCategory`: halal, grey, forbidden

## Migration Steps

1. **Generate Prisma Client:**
   ```bash
   pnpm --filter @ummati/db exec prisma generate
   ```

2. **Create and apply migration:**
   ```bash
   pnpm --filter @ummati/db exec prisma migrate dev --name add_halalfocus_fields
   ```

3. **If you need to reset the database (development only):**
   ```bash
   pnpm --filter @ummati/db exec prisma migrate reset
   ```

## Backward Compatibility

- Legacy fields (`sector`, `fundingAsk`, `preferredSectors`, etc.) are kept for backward compatibility
- Existing data will continue to work
- New features use the new fields

## Data Migration Notes

- Existing users will need to complete HalalFocus verification
- Existing profiles will have `profileComplete: false` and `onboardingComplete: false` until updated
- `halalScore` and `halalCategory` will be `null` until HalalFocus is completed

