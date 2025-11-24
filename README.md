# Engram

Your second brain for household management - track products, warranties, meals, shopping, and more.

## Features

- **Product Tracking** - Scan barcodes, store receipts with OCR, track warranties
- **Meal Planning** - Smart meal suggestions based on expiring products
- **Shopping Lists** - Personal and shared lists with roommates
- **Daily Checklists** - Stay organized with daily tasks
- **Home Maintenance** - Track repairs and maintenance schedules
- **Bills Management** - Never miss a payment
- **Roommate Coordination** - Share tasks and shopping
- **Export** - PDF reports for insurance, JSON/CSV backups
- **Smart Reminders** - Warranty expirations, time-based alerts
- **Premium Features** - Advanced analytics and unlimited storage

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

# Engram

Engram is a React Native + Expo app designed as your second brain for home and life management. It features secure login, product/item management, photo and OCR input, barcode scanning, multi-photo storage, fuzzy search, full-screen photo viewer, cloud OCR, API lookups, backup/export, theme toggle, and a premium, neurodivergent-friendly UX.

## Features

- Login/Signup (Firebase/local)
- Product/Item CRUD with debounced and fuzzy search
- Inline photo thumbnails in cards
- Multi-photo capture and persistent storage
- OCR (local and Google Vision API)
- Barcode scanning with Open Food Facts API
- Full-screen photo viewer (swipe/zoom)
- Product detail with warranty/reminders
- Backup/export to JSON
- Theme toggle with persistence
- Automated tests and CI workflow
- Premium, accessible, user-friendly design

## Install

```powershell
npm install --legacy-peer-deps
expo install expo-image-picker expo-file-system expo-barcode-scanner expo-sharing
npm install firebase tesseract.js fast-levenshtein
```

## Run

```powershell
npm start
```

## Test

```powershell
npm test --silent
```

## Configuration

- Google Vision API: Set your API key in `.env` or as an environment variable.
- Open Food Facts API: No key required; falls back to mock data if unavailable.

## Scripts

```powershell
npm run lint     # ESLint
npm run format   # Prettier
```

Enjoy building with Engram!
