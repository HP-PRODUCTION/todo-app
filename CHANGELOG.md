# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-03

### Added
- Progressive Web App support with service worker and manifest.
- Offline caching for core static assets.
- Keyboard shortcuts: Ctrl/Cmd+K for search and N for new task focus.
- SVG favicon and offline precache for the icon.

### Changed
- Stronger task/state normalization on load and import.
- Safer persistence flow with storage failure handling.
- Import/export backup format now supports versioned envelopes while keeping legacy compatibility.
- Accessibility improvements for modal focus management and visible focus styles.
- Reduced motion support via `prefers-reduced-motion`.

### Fixed
- Eliminated missing favicon request noise in production runs.
- Better resilience against malformed localStorage/imported task data.
