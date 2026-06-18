# Treasure Coast Intelligence Platform

A cross-platform desktop application delivering institutional-grade real estate intelligence for St. Lucie and Martin County, Florida — the Treasure Coast — built with Electron.

## What's Inside

| Tab | County | App | Description |
|-----|--------|-----|-------------|
| Market Report | St. Lucie | stlucie_report | Single family intelligence — 20K transactions, out-of-state buyers, S/R levels |
| Sales Registry | St. Lucie | stlucie | Single family sales search |
| Market Report | Martin | martin_report | Martin County full market analysis |
| Matchmaker | Martin | martin_matchmaker | Motivated sellers × active buyers |
| Radar | Martin | martin_radar | Motivated seller radar map |
| Flip Tracker | Regional | treasure_fliptracker | Martin County flip pairs — hold periods, gains, serial flippers |
| Entity Intel | Regional | entity_intel | 26,391 entities tracked across 5 counties |

## Requirements

- **Node.js** v18+ — https://nodejs.org
- **PHP** v7.4+ with `pdo_mysql` extension
  - Linux: `sudo apt install php php-mysql`
  - macOS: `brew install php`
  - Windows: https://windows.php.net/download/
- **MySQL** database with the `rt_realestate` schema imported

## Quick Start

```bash
chmod +x setup.sh && ./setup.sh
# Configure www/*/includes/db.php with your MySQL credentials
npm start
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+1 | SL Market Report |
| Ctrl+2 | SL Sales Registry |
| Ctrl+3 | Martin Report |
| Ctrl+4 | Martin Matchmaker |
| Ctrl+5 | Martin Radar |
| Ctrl+6 | Flip Tracker |
| Ctrl+7 | Entity Intel |
| Ctrl+R | Refresh |

## Part of the Florida Real Estate Intelligence Suite

- [Brevard Intelligence](https://github.com/EdHyland-flipocity/florida-realestate-intelligence)
- [Sarasota Intelligence](https://github.com/EdHyland-flipocity/sarasota-intelligence)
- [Pinellas Intelligence](https://github.com/EdHyland-flipocity/pinellas-intelligence)
