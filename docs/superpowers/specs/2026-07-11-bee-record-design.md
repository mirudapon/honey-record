# Bee Record — Design Spec

**Date:** 2026-07-11  
**Status:** Approved

---

## Context

A personal PWA for beekeepers to record honey harvest data. Each record captures the harvest time, quantity (in jars), and water content (measured via refractometer). The app needs full CRUD and multi-condition filtering. All data is stored locally in the browser via IndexedDB — no backend required.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React (via Vite) |
| Language | TypeScript |
| DB | localStorage |
| PWA | vite-plugin-pwa |
| Styling | CSS Modules or Tailwind CSS |

---

## Data Model

```ts
interface HarvestRecord {
  id?: number;          // auto-increment primary key
  time: string;         // ISO 8601 datetime string
  quantity: number;     // number of jars
  waterContent: number; // percentage, e.g. 17.5
  note?: string;        // optional free-text note
}
```

Stored in localStorage under the key `bee-record-records` as a JSON-serialized array. All filtering and sorting is done in-memory after parsing the array.

---

## Project Structure

```
bee-record/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── db/
│   │   └── storage.ts      # localStorage read/write helpers
│   ├── components/
│   │   ├── RecordForm.tsx   # Add / edit form (modal or drawer)
│   │   ├── RecordList.tsx   # Scrollable list with summary header
│   │   ├── RecordItem.tsx   # Single record row with edit/delete actions
│   │   └── FilterBar.tsx    # Collapsible filter panel
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
└── package.json
```

---

## Features

### CRUD

- **Add** — FAB (floating action button) opens `RecordForm`. Fields: time (datetime-local picker, defaults to now), quantity (number input, unit: 罐), water content (number input, e.g. 17.5, unit: %), note (optional textarea).
- **Edit** — Tapping a record opens pre-filled `RecordForm` in edit mode. Saves via Dexie `put`.
- **Delete** — Delete button on each record with a confirmation prompt before removal.
- **List** — Reverse-chronological order by default. Each row shows time, quantity (罐), water content (%).

### Filtering

`FilterBar` sits above the list, collapsible to save space. All conditions are optional and combinable:

| Filter | Input |
|--------|-------|
| Time range | Start date ~ End date |
| Quantity range | Min jars ~ Max jars |
| Water content range | Min % ~ Max % |

Filtering is done in-memory by parsing the localStorage array and applying JavaScript `.filter()` conditions.

### Summary Strip

Displayed above the record list (below filter bar), updates reactively:
- Total records count
- Total jars
- Average water content (%)

---

## PWA Configuration

- `manifest.json`: name, short_name, icons, theme_color, background_color, display: standalone
- Service worker via `vite-plugin-pwa` (Workbox): cache-first for assets, network-first for nothing (all data is local)
- Installable on iOS and Android home screen

---

## Verification

1. `npm run dev` — app loads at localhost, no console errors
2. Add a record → appears in list immediately
3. Edit a record → changes persist after page reload
4. Delete a record → removed from list, confirmed via Application > localStorage in DevTools
5. Filter by time range → only matching records shown
6. Filter by quantity + water content → combined conditions work correctly
7. Summary strip reflects current filtered results
8. Lighthouse PWA audit score ≥ 90
9. Install prompt appears on mobile Chrome; app runs offline after install
