# Copilot Instructions for Engram

Welcome, AI coding agents! This guide summarizes essential knowledge and conventions for working productively in the Engram codebase.

## Project Overview
- **Engram** is a React Native + Expo app for household management: product tracking, meal planning, shopping, reminders, and more.
- Major features: barcode/receipt scanning (OCR), smart meal suggestions, daily checklists, bills, roommate coordination, PDF/CSV export, and premium analytics.
- Migrated from "Vestal"—all features and data structures preserved.

## Architecture & Structure
- **Screens**: All UI flows live in `screens/` (32+ screens, e.g., `DashboardScreen.js`, `BillsScreen.js`).
- **Providers**: App-wide state/context in `providers/` (`ThemeProvider.js`, `AuthProvider.js`, etc.).
- **Components**: Reusable UI in `components/` (e.g., `PhotoViewer.js`, `UrgentMealSuggestion.js`).
- **Utils**: Business logic, integrations, and helpers in `utils/` (OCR, barcode, backup, meal planning, etc.).
- **Tests**: Jest tests in `__tests__/`; Expo module mocks in `__mocks__/`.

## Data & Integrations
- **Local-first**: Uses AsyncStorage for most data (`constants.js` defines keys).
- **Cloud**: Optional Firebase Auth, RevenueCat for monetization.
- **OCR/Barcode**: Integrates `expo-camera`, `expo-file-system`, and `tesseract.js` (see `utils/receipt-ocr.js`).
- **Manual Lookup**: Product manual search logic in `utils/manual-lookup.js` (mock DB, ready for API integration).

## Developer Workflows
- **Install**: `npm install --legacy-peer-deps`
- **Start dev server**: `npm start`
- **Run on device**: `npm run android` or `npm run ios`
- **Test**: `npm test` (Jest + React Testing Library)
- **Build**: Use `expo build` or EAS Build for production
- **Export**: PDF/CSV via utilities in `utils/`

## Patterns & Conventions
- **Navigation**: React Navigation (bottom tabs + stack)
- **Context**: All global state via React Context Providers in `providers/`
- **Testing**: All new logic should have Jest tests in `__tests__/` (see examples)
- **Mocking**: Use `__mocks__/` for Expo/native modules in tests
- **Data keys**: Use `STORAGE_KEYS` from `constants.js` for AsyncStorage
- **Color scheme**: Light/dark mode with sage green palette (see README)
- **Migration**: All legacy "Vestal" references have been updated—preserve compatibility if extending data models

## References
- See `README.md` and `SETUP_COMPLETE.md` for full project details, quick start, and migration notes.
- For new features, follow patterns in existing screens, providers, and utils.

---

If any conventions or workflows are unclear, ask for clarification or check the referenced files for examples.
