# Active Context

## Current Focus
- **Phase 1: Keyed Synchronization & Cloud (V1.1)**
- Implementing "Secret Key" authentication (SHA-256 hashing).
- Migrating data persistence from `localStorage` to **Firebase Firestore**.
- Enabling real-time synchronization between devices.

## Recent Changes
- Completed MVP (Local-First, PWA).
- Removed personal roadmap files from Git tracking.

## Next Steps
- Set up Firebase project and Firestore database.
- Implement `AuthContext` to manage the secret key and user session.
- Create a "Login" screen for entering the secret key.
- Refactor `useLocalStorage` to `useFirestore` (or similar hook) for data syncing.
