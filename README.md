<p align="center">
  <img src="docs/icon-512.png" height="400px" alt="icon-512">
</p>

# 💪 Svelter 

Svelter is an offline-first Progressive Web App (PWA) designed to help users manage workout routines, track training progress, and monitor performance statistics. Built with Svelte (ha) and optimized for mobile devices, Svelter can be installed directly from the browser and used without an internet connection.

## Features

### Workout Tracking

* Create and manage workout routines
* Organize exercises within routines
* Record sets, repetitions, and weights
* Edit workout data at any time

### Progress Monitoring

* Track workout history
* View progression over time
* Monitor training volume and consistency
* Store historical workout data locally

### Offline-First Experience

* Works without an internet connection
* Installable on Android and desktop devices
* Fast loading through Service Worker caching
* Data remains available even when offline

### Local Data Storage

* Uses IndexedDB for persistent storage
* No account required
* No cloud dependency
* User data is saved locally

## Technology Stack

### Frontend

* Svelte
* JavaScript (ES Modules)
* HTML5
* CSS3

### Storage

* IndexedDB
* Dexie.js

### Build & Tooling

* Vite
* vite-plugin-pwa

### Deployment

* GitHub Pages

## Installation

### Use the Hosted Version

1. Open the deployed application at https://capimdr.github.io/Svelter/ in your browser.
2. Select **Install App** or **Add to Home Screen** when prompted.
3. Launch Svelter from your home screen like a native application.

### Run Locally

Clone the repository:

```bash
git clone https://github.com/<username>/Svelter.git
cd Svelter
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```text
src/
├── components/      # Reusable UI components
├── stores/          # Svelte stores
├── views/           # Application views
├── db/              # IndexedDB/Dexie logic
└── main.js          # Application entry point

public/             # Static assets and icons
```

## PWA Features

* Installable on Android, iOS, and desktop
* Offline functionality through Service Workers
* Home screen integration
* Standalone application experience
* Cached assets for improved performance

## Browser Support

Svelter is designed for modern browsers that support:

* Progressive Web Apps
* IndexedDB
* Service Workers
* ES Modules

Recommended browsers:

* Google Chrome
* Microsoft Edge
* Samsung Internet

## Roadmap

Planned features include:

* Personal records (PR) tracking
* Exercise statistics and analytics
* Progress charts
* Workout reminders
* Data import/export
* Backup and restore functionality
* Exercise templates
* Bodyweight tracking

## Contributing

Contributions, bug reports, and feature requests are welcome. Feel free to open an issue or submit a pull request.
