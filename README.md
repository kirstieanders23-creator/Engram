# Engram

Your second brain for household management - track products, warranties, meals, shopping, and more.

## Features

-  **Product Tracking** - Scan barcodes, store receipts with OCR, track warranties
-  **Meal Planning** - Smart meal suggestions based on expiring products
-  **Shopping Lists** - Personal and shared lists with roommates
-  **Daily Checklists** - Stay organized with daily tasks
-  **Home Maintenance** - Track repairs and maintenance schedules
-  **Bills Management** - Never miss a payment
-  **Roommate Coordination** - Share tasks and shopping
-  **Export** - PDF reports for insurance, JSON/CSV backups
-  **Smart Reminders** - Warranty expirations, time-based alerts
-  **Premium Features** - Advanced analytics and unlimited storage

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test
```

## Project Structure

- `/screens` - 32+ app screens
- `/providers` - Theme, Auth, Database, Premium context providers
- `/utils` - OCR, barcode scanning, meal planning, backup/export
- `/components` - Reusable UI components
- `/__tests__` - Jest test suite
- `/__mocks__` - Expo module mocks

## Tech Stack

- React Native + Expo
- React Navigation (tabs + stack)
- AsyncStorage (local-first)
- Firebase Authentication (optional)
- RevenueCat (monetization)
- Expo Camera (barcode + OCR)
- Jest + React Testing Library

## Color Scheme

- **Light Mode**: Sage green (#6B8E7D) with cream backgrounds
- **Dark Mode**: Lighter sage (#9BB092) on charcoal green

## Migration from Vestal

This project was cleanly migrated from Vestal with all features preserved.

