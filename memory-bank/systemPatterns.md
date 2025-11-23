# System Patterns

## Architecture
- **Client-Side Only**: Single Page Application (SPA) running entirely in the browser.
- **Cloud Persistence**: Data is stored in **Firebase Firestore** (migrated from localStorage).
- **Component-Based**: Built with React components.
- **Context API**: Used for global state management (Auth, Data).

## Key Technical Decisions
- **Authentication**: Custom "Secret Key" system. Key is hashed (SHA-256) to generate a User ID. No email/password required.
- **Database Structure**: `/users/{userId}/transactions` and `/users/{userId}/assets`.
- **Real-time Sync**: Utilizing Firestore's `onSnapshot` for instant updates across devices.
- **PWA**: Designed as a Progressive Web App for installability on mobile devices.
- **Tailwind CSS**: Utility-first CSS for rapid and responsive styling.
- **Dark Mode Default**: The application is designed with a dark theme as the default.
