# Bee Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal PWA for beekeepers to record honey harvest data (time, quantity in jars, water content %) with CRUD and multi-condition filtering, all stored in localStorage.

**Architecture:** React + TypeScript app scaffolded with Vite. A `useRecords` hook owns all state — it wraps localStorage helpers and derives filtered records + summary in-memory. Components are purely presentational, receiving data and callbacks as props.

**Tech Stack:** Vite, React 18, TypeScript, vite-plugin-pwa (Workbox), Vitest

## Global Constraints

- All data stored in `localStorage` under key `bee-record-records` as a JSON array — no backend, no IndexedDB
- `id` is a UUID string via `crypto.randomUUID()`, never a number
- Time values stored and compared as ISO 8601 strings throughout
- Language: Traditional Chinese (zh-TW) for all UI copy
- Unit for quantity: 罐 (jars)
- Unit for water content: % (e.g. 17.5)

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/vite-env.d.ts`

**Interfaces:**
- Produces: working dev server at `localhost:5173`, `npm test` runs with 0 failures

- [ ] **Step 1.1: Scaffold with Vite**

```bash
cd /Users/Mirumo/Projects/bee-record
npm create vite@latest . -- --template react-ts
```

Expected: Vite asks to ignore non-Vite files (docs/ exists) — confirm with `y`. Output ends with `Done.`

- [ ] **Step 1.2: Install core dependencies**

```bash
npm install
```

Expected: `added N packages` with no errors.

- [ ] **Step 1.3: Install dev dependencies**

```bash
npm install -D vite-plugin-pwa vitest @vitest/ui
```

Expected: `added N packages`.

- [ ] **Step 1.4: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: '蜂蜜採收記錄',
        short_name: 'Bee Record',
        description: 'Personal beekeeper harvest tracking PWA',
        theme_color: '#f5a623',
        background_color: '#fffbea',
        display: 'standalone',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 1.5: Add test script to `package.json`**

Add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 1.6: Add Vitest globals to `tsconfig.app.json`**

In `compilerOptions`, add:
```json
"types": ["vitest/globals"]
```

- [ ] **Step 1.7: Add PWA meta tags to `index.html` `<head>`**

```html
<meta name="theme-color" content="#f5a623" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Bee Record" />
<link rel="apple-touch-icon" href="/icons/pwa-192.png" />
```

- [ ] **Step 1.8: Remove Vite boilerplate**

```bash
rm -f src/assets/react.svg public/vite.svg
mkdir -p public/icons
```

- [ ] **Step 1.9: Verify dev server starts**

```bash
npm run dev
```

Expected: `VITE vX.X.X  ready` and `Local: http://localhost:5173/`

- [ ] **Step 1.10: Verify test runner**

```bash
npm test
```

Expected: `No test files found` or `0 tests passed` — no failures.

- [ ] **Step 1.11: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffold with Vite + React + TypeScript + PWA"
```

---

## Task 2: Types + Storage Module

**Files:**
- Create: `src/types/index.ts`
- Create: `src/db/storage.ts`
- Create: `src/db/storage.test.ts`

**Interfaces:**
- Produces:
```ts
// src/types/index.ts
export interface HarvestRecord {
  id: string
  time: string        // ISO 8601
  quantity: number    // jars
  waterContent: number // %
  note?: string
}

export interface FilterState {
  timeFrom?: string
  timeTo?: string
  quantityMin?: number
  quantityMax?: number
  waterMin?: number
  waterMax?: number
}

// src/db/storage.ts exports
export function loadRecords(): HarvestRecord[]
export function saveRecords(records: HarvestRecord[]): void
export function addRecord(partial: Omit<HarvestRecord, 'id'>): HarvestRecord
export function updateRecord(updated: HarvestRecord): HarvestRecord[]
export function deleteRecord(id: string): HarvestRecord[]
export function applyFilters(records: HarvestRecord[], filters: FilterState): HarvestRecord[]
```

- [ ] **Step 2.1: Create `src/types/index.ts`**

```ts
export interface HarvestRecord {
  id: string
  time: string
  quantity: number
  waterContent: number
  note?: string
}

export interface FilterState {
  timeFrom?: string
  timeTo?: string
  quantityMin?: number
  quantityMax?: number
  waterMin?: number
  waterMax?: number
}
```

- [ ] **Step 2.2: Write failing tests — `src/db/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadRecords,
  saveRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  applyFilters,
} from './storage'
import type { HarvestRecord, FilterState } from '../types'

const STORAGE_KEY = 'bee-record-records'

beforeEach(() => {
  localStorage.clear()
})

describe('loadRecords', () => {
  it('returns empty array when storage is empty', () => {
    expect(loadRecords()).toEqual([])
  })

  it('parses JSON from localStorage', () => {
    const records: HarvestRecord[] = [
      { id: '1', time: '2026-01-01T10:00:00.000Z', quantity: 3, waterContent: 17.5 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    expect(loadRecords()).toEqual(records)
  })

  it('returns empty array on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    expect(loadRecords()).toEqual([])
  })
})

describe('saveRecords', () => {
  it('serializes records to localStorage', () => {
    const records: HarvestRecord[] = [
      { id: '2', time: '2026-02-01T08:00:00.000Z', quantity: 5, waterContent: 18.0 },
    ]
    saveRecords(records)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(records)
  })
})

describe('addRecord', () => {
  it('assigns a UUID and persists the new record', () => {
    const partial = { time: '2026-03-01T09:00:00.000Z', quantity: 2, waterContent: 17.0 }
    const result = addRecord(partial)
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
    const stored = loadRecords()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toEqual(result)
  })

  it('appends to existing records', () => {
    addRecord({ time: '2026-03-01T09:00:00.000Z', quantity: 2, waterContent: 17.0 })
    addRecord({ time: '2026-03-02T10:00:00.000Z', quantity: 4, waterContent: 18.5 })
    expect(loadRecords()).toHaveLength(2)
  })
})

describe('updateRecord', () => {
  it('updates the matching record in place', () => {
    const record = addRecord({ time: '2026-04-01T10:00:00.000Z', quantity: 1, waterContent: 17.0 })
    updateRecord({ ...record, quantity: 99 })
    expect(loadRecords()[0].quantity).toBe(99)
  })

  it('does not change other records', () => {
    const a = addRecord({ time: '2026-04-01T10:00:00.000Z', quantity: 1, waterContent: 17.0 })
    const b = addRecord({ time: '2026-04-02T10:00:00.000Z', quantity: 2, waterContent: 18.0 })
    updateRecord({ ...a, quantity: 99 })
    expect(loadRecords().find(r => r.id === b.id)!.quantity).toBe(2)
  })

  it('returns the updated list', () => {
    const record = addRecord({ time: '2026-04-01T10:00:00.000Z', quantity: 1, waterContent: 17.0 })
    const result = updateRecord({ ...record, quantity: 7 })
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(7)
  })
})

describe('deleteRecord', () => {
  it('removes record by id', () => {
    const record = addRecord({ time: '2026-05-01T10:00:00.000Z', quantity: 3, waterContent: 17.5 })
    deleteRecord(record.id)
    expect(loadRecords()).toHaveLength(0)
  })

  it('returns remaining records', () => {
    const a = addRecord({ time: '2026-05-01T10:00:00.000Z', quantity: 1, waterContent: 17.0 })
    const b = addRecord({ time: '2026-05-02T10:00:00.000Z', quantity: 2, waterContent: 18.0 })
    const result = deleteRecord(a.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(b.id)
  })
})

describe('applyFilters', () => {
  const records: HarvestRecord[] = [
    { id: 'a', time: '2026-01-01T00:00:00.000Z', quantity: 2, waterContent: 17.0 },
    { id: 'b', time: '2026-06-15T00:00:00.000Z', quantity: 5, waterContent: 18.5 },
    { id: 'c', time: '2026-12-31T00:00:00.000Z', quantity: 10, waterContent: 20.0 },
  ]

  it('returns all records when filter is empty', () => {
    expect(applyFilters(records, {})).toHaveLength(3)
  })

  it('filters by timeFrom (inclusive)', () => {
    const result = applyFilters(records, { timeFrom: '2026-06-15T00:00:00.000Z' })
    expect(result.map(r => r.id)).toEqual(['b', 'c'])
  })

  it('filters by timeTo (inclusive)', () => {
    const result = applyFilters(records, { timeTo: '2026-06-15T00:00:00.000Z' })
    expect(result.map(r => r.id)).toEqual(['a', 'b'])
  })

  it('filters by time range', () => {
    const result = applyFilters(records, {
      timeFrom: '2026-06-01T00:00:00.000Z',
      timeTo: '2026-11-30T00:00:00.000Z',
    })
    expect(result.map(r => r.id)).toEqual(['b'])
  })

  it('filters by quantityMin', () => {
    const result = applyFilters(records, { quantityMin: 5 })
    expect(result.map(r => r.id)).toEqual(['b', 'c'])
  })

  it('filters by quantityMax', () => {
    const result = applyFilters(records, { quantityMax: 5 })
    expect(result.map(r => r.id)).toEqual(['a', 'b'])
  })

  it('filters by waterMin and waterMax combined', () => {
    const result = applyFilters(records, { waterMin: 18.0, waterMax: 19.0 })
    expect(result.map(r => r.id)).toEqual(['b'])
  })

  it('combines all filter conditions', () => {
    const result = applyFilters(records, {
      timeFrom: '2026-01-01T00:00:00.000Z',
      timeTo: '2026-12-31T00:00:00.000Z',
      quantityMin: 3,
      quantityMax: 8,
      waterMin: 18.0,
      waterMax: 20.0,
    })
    expect(result.map(r => r.id)).toEqual(['b'])
  })
})
```

- [ ] **Step 2.3: Run tests — confirm all fail**

```bash
npm test
```

Expected: Fails with `Cannot find module './storage'`

- [ ] **Step 2.4: Implement `src/db/storage.ts`**

```ts
import type { HarvestRecord, FilterState } from '../types'

const STORAGE_KEY = 'bee-record-records'

export function loadRecords(): HarvestRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HarvestRecord[]) : []
  } catch {
    return []
  }
}

export function saveRecords(records: HarvestRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(partial: Omit<HarvestRecord, 'id'>): HarvestRecord {
  const record: HarvestRecord = { id: crypto.randomUUID(), ...partial }
  saveRecords([...loadRecords(), record])
  return record
}

export function updateRecord(updated: HarvestRecord): HarvestRecord[] {
  const all = loadRecords().map(r => (r.id === updated.id ? updated : r))
  saveRecords(all)
  return all
}

export function deleteRecord(id: string): HarvestRecord[] {
  const remaining = loadRecords().filter(r => r.id !== id)
  saveRecords(remaining)
  return remaining
}

export function applyFilters(
  records: HarvestRecord[],
  filters: FilterState,
): HarvestRecord[] {
  return records.filter(r => {
    if (filters.timeFrom && r.time < filters.timeFrom) return false
    if (filters.timeTo && r.time > filters.timeTo) return false
    if (filters.quantityMin !== undefined && r.quantity < filters.quantityMin) return false
    if (filters.quantityMax !== undefined && r.quantity > filters.quantityMax) return false
    if (filters.waterMin !== undefined && r.waterContent < filters.waterMin) return false
    if (filters.waterMax !== undefined && r.waterContent > filters.waterMax) return false
    return true
  })
}
```

- [ ] **Step 2.5: Run tests — confirm all pass**

```bash
npm test
```

Expected:
```
✓ src/db/storage.test.ts (16 tests)
Test Files  1 passed (1)
Tests       16 passed (16)
```

- [ ] **Step 2.6: Commit**

```bash
git add src/types/index.ts src/db/storage.ts src/db/storage.test.ts
git commit -m "feat: types + storage module with Vitest coverage"
```

---

## Task 3: `useRecords` Hook

**Files:**
- Create: `src/hooks/useRecords.ts`

**Interfaces:**
- Consumes: `HarvestRecord`, `FilterState` from `src/types/index.ts`; all functions from `src/db/storage.ts`
- Produces:
```ts
export function useRecords(): {
  filteredRecords: HarvestRecord[]
  summary: { count: number; totalJars: number; avgWaterContent: number }
  filters: FilterState
  setFilters: (f: FilterState) => void
  clearFilters: () => void
  addRecord: (partial: Omit<HarvestRecord, 'id'>) => void
  updateRecord: (updated: HarvestRecord) => void
  deleteRecord: (id: string) => void
  formOpen: boolean
  editTarget: HarvestRecord | null
  openAdd: () => void
  openEdit: (record: HarvestRecord) => void
  closeForm: () => void
}
```

- [ ] **Step 3.1: Create `src/hooks/useRecords.ts`**

```ts
import { useState, useCallback, useMemo } from 'react'
import type { HarvestRecord, FilterState } from '../types'
import {
  loadRecords,
  addRecord as storageAdd,
  updateRecord as storageUpdate,
  deleteRecord as storageDelete,
  applyFilters,
} from '../db/storage'

export function useRecords() {
  const [records, setRecords] = useState<HarvestRecord[]>(() => loadRecords())
  const [filters, setFilters] = useState<FilterState>({})
  const [editTarget, setEditTarget] = useState<HarvestRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const filteredRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => (a.time < b.time ? 1 : -1))
    return applyFilters(sorted, filters)
  }, [records, filters])

  const summary = useMemo(() => {
    const count = filteredRecords.length
    const totalJars = filteredRecords.reduce((s, r) => s + r.quantity, 0)
    const avgWaterContent =
      count > 0
        ? filteredRecords.reduce((s, r) => s + r.waterContent, 0) / count
        : 0
    return { count, totalJars, avgWaterContent }
  }, [filteredRecords])

  const addRecord = useCallback((partial: Omit<HarvestRecord, 'id'>) => {
    const record = storageAdd(partial)
    setRecords(prev => [...prev, record])
  }, [])

  const updateRecord = useCallback((updated: HarvestRecord) => {
    const next = storageUpdate(updated)
    setRecords(next)
  }, [])

  const deleteRecord = useCallback((id: string) => {
    const next = storageDelete(id)
    setRecords(next)
  }, [])

  const clearFilters = useCallback(() => setFilters({}), [])

  const openAdd = useCallback(() => {
    setEditTarget(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((record: HarvestRecord) => {
    setEditTarget(record)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditTarget(null)
  }, [])

  return {
    filteredRecords,
    summary,
    filters,
    setFilters,
    clearFilters,
    addRecord,
    updateRecord,
    deleteRecord,
    formOpen,
    editTarget,
    openAdd,
    openEdit,
    closeForm,
  }
}
```

- [ ] **Step 3.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/hooks/useRecords.ts
git commit -m "feat: useRecords hook with filter and summary derivation"
```

---

## Task 4: `RecordForm` Component

**Files:**
- Create: `src/components/RecordForm.tsx`

**Interfaces:**
- Consumes: `HarvestRecord` from `src/types/index.ts`
- Produces:
```ts
interface RecordFormProps {
  editTarget: HarvestRecord | null   // null = add mode
  onSave: (data: Omit<HarvestRecord, 'id'> | HarvestRecord) => void
  onClose: () => void
}
```

- [ ] **Step 4.1: Create `src/components/RecordForm.tsx`**

```tsx
import { useRef, useEffect, useState } from 'react'
import type { HarvestRecord } from '../types'

interface RecordFormProps {
  editTarget: HarvestRecord | null
  onSave: (data: Omit<HarvestRecord, 'id'> | HarvestRecord) => void
  onClose: () => void
}

export function RecordForm({ editTarget, onSave, onClose }: RecordFormProps) {
  const isEdit = editTarget !== null
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [time, setTime] = useState(
    editTarget?.time.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
  )
  const [quantity, setQuantity] = useState(
    editTarget ? String(editTarget.quantity) : '',
  )
  const [waterContent, setWaterContent] = useState(
    editTarget ? String(editTarget.waterContent) : '',
  )
  const [note, setNote] = useState(editTarget?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!time) errs.time = '請選擇時間'
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) errs.quantity = '數量必須大於 0'
    const wc = parseFloat(waterContent)
    if (isNaN(wc) || wc < 0 || wc > 100) errs.waterContent = '含水量須介於 0–100'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      time: new Date(time).toISOString(),
      quantity: parseFloat(quantity),
      waterContent: parseFloat(waterContent),
      note: note.trim() || undefined,
    }
    onSave(isEdit ? { ...payload, id: editTarget!.id } : payload)
    onClose()
  }

  return (
    <dialog ref={dialogRef} onClick={handleBackdropClick} className="record-form-dialog">
      <form onSubmit={handleSubmit} className="record-form">
        <h2>{isEdit ? '編輯記錄' : '新增記錄'}</h2>
        <label>
          採收時間
          <input
            type="datetime-local"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />
          {errors.time && <span className="error">{errors.time}</span>}
        </label>
        <label>
          數量（罐）
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
          {errors.quantity && <span className="error">{errors.quantity}</span>}
        </label>
        <label>
          含水量（%）
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={waterContent}
            onChange={e => setWaterContent(e.target.value)}
            required
          />
          {errors.waterContent && <span className="error">{errors.waterContent}</span>}
        </label>
        <label>
          備註（選填）
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </label>
        <div className="form-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="submit">{isEdit ? '儲存' : '新增'}</button>
        </div>
      </form>
    </dialog>
  )
}
```

- [ ] **Step 4.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/RecordForm.tsx
git commit -m "feat: RecordForm modal with add/edit modes and validation"
```

---

## Task 5: `RecordList` and `RecordItem` Components

**Files:**
- Create: `src/components/RecordItem.tsx`
- Create: `src/components/RecordList.tsx`

**Interfaces:**
- Consumes: `HarvestRecord` from `src/types/index.ts`
- Produces:
```ts
// RecordItem props
interface RecordItemProps {
  record: HarvestRecord
  onEdit: () => void
  onDelete: () => void
}
// RecordList props
interface RecordListProps {
  records: HarvestRecord[]
  summary: { count: number; totalJars: number; avgWaterContent: number }
  onEdit: (record: HarvestRecord) => void
  onDelete: (id: string) => void
}
```

- [ ] **Step 5.1: Create `src/components/RecordItem.tsx`**

```tsx
import type { HarvestRecord } from '../types'

interface RecordItemProps {
  record: HarvestRecord
  onEdit: () => void
  onDelete: () => void
}

export function RecordItem({ record, onEdit, onDelete }: RecordItemProps) {
  function handleDelete() {
    if (window.confirm('確定要刪除這筆記錄嗎？')) {
      onDelete()
    }
  }

  const displayTime = new Date(record.time).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <li className="record-item" onClick={onEdit}>
      <div className="record-item__main">
        <span className="record-item__time">{displayTime}</span>
        <span className="record-item__quantity">{record.quantity} 罐</span>
        <span className="record-item__water">{record.waterContent}%</span>
      </div>
      {record.note && <p className="record-item__note">{record.note}</p>}
      <button
        className="record-item__delete"
        onClick={e => { e.stopPropagation(); handleDelete() }}
        aria-label="刪除"
      >
        ✕
      </button>
    </li>
  )
}
```

- [ ] **Step 5.2: Create `src/components/RecordList.tsx`**

```tsx
import type { HarvestRecord } from '../types'
import { RecordItem } from './RecordItem'

interface RecordListProps {
  records: HarvestRecord[]
  summary: { count: number; totalJars: number; avgWaterContent: number }
  onEdit: (record: HarvestRecord) => void
  onDelete: (id: string) => void
}

export function RecordList({ records, summary, onEdit, onDelete }: RecordListProps) {
  return (
    <section className="record-list-section">
      <div className="summary-strip">
        <span>共 <strong>{summary.count}</strong> 筆</span>
        <span>合計 <strong>{summary.totalJars}</strong> 罐</span>
        <span>平均含水量 <strong>{summary.avgWaterContent.toFixed(1)}</strong>%</span>
      </div>
      {records.length === 0 ? (
        <p className="record-list__empty">尚無記錄</p>
      ) : (
        <ul className="record-list">
          {records.map(record => (
            <RecordItem
              key={record.id}
              record={record}
              onEdit={() => onEdit(record)}
              onDelete={() => onDelete(record.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 5.3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/components/RecordList.tsx src/components/RecordItem.tsx
git commit -m "feat: RecordList, RecordItem, and summary strip"
```

---

## Task 6: `FilterBar` Component

**Files:**
- Create: `src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `FilterState` from `src/types/index.ts`
- Produces:
```ts
interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
}
```

- [ ] **Step 6.1: Create `src/components/FilterBar.tsx`**

```tsx
import { useState } from 'react'
import type { FilterState } from '../types'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
}

export function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  const [open, setOpen] = useState(false)

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial })
  }

  function clearField(key: keyof FilterState) {
    const next = { ...filters }
    delete next[key]
    onChange(next)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <div className={`filter-bar ${open ? 'filter-bar--open' : ''}`}>
      <button
        className="filter-bar__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        篩選 {hasActiveFilters && <span className="filter-bar__badge">●</span>}
        {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="filter-bar__panel">
          <div className="filter-bar__group">
            <label>
              時間 從
              <input
                type="datetime-local"
                value={filters.timeFrom?.slice(0, 16) ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ timeFrom: new Date(e.target.value).toISOString() })
                    : clearField('timeFrom')
                }
              />
            </label>
            <label>
              至
              <input
                type="datetime-local"
                value={filters.timeTo?.slice(0, 16) ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ timeTo: new Date(e.target.value).toISOString() })
                    : clearField('timeTo')
                }
              />
            </label>
          </div>

          <div className="filter-bar__group">
            <label>
              數量 最小（罐）
              <input
                type="number"
                min="0"
                step="1"
                value={filters.quantityMin ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ quantityMin: parseFloat(e.target.value) })
                    : clearField('quantityMin')
                }
              />
            </label>
            <label>
              最大（罐）
              <input
                type="number"
                min="0"
                step="1"
                value={filters.quantityMax ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ quantityMax: parseFloat(e.target.value) })
                    : clearField('quantityMax')
                }
              />
            </label>
          </div>

          <div className="filter-bar__group">
            <label>
              含水量 最小（%）
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={filters.waterMin ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ waterMin: parseFloat(e.target.value) })
                    : clearField('waterMin')
                }
              />
            </label>
            <label>
              最大（%）
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={filters.waterMax ?? ''}
                onChange={e =>
                  e.target.value
                    ? update({ waterMax: parseFloat(e.target.value) })
                    : clearField('waterMax')
                }
              />
            </label>
          </div>

          {hasActiveFilters && (
            <button className="filter-bar__clear" onClick={onClear}>
              清除全部篩選
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: FilterBar collapsible filter panel"
```

---

## Task 7: App Integration + Styles + PWA Icons

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Create: `public/icons/pwa-192.png`
- Create: `public/icons/pwa-512.png`

**Interfaces:**
- Consumes: all components and the `useRecords` hook

- [ ] **Step 7.1: Replace `src/App.tsx`**

```tsx
import { useRecords } from './hooks/useRecords'
import { RecordForm } from './components/RecordForm'
import { RecordList } from './components/RecordList'
import { FilterBar } from './components/FilterBar'
import type { HarvestRecord } from './types'
import './App.css'

export default function App() {
  const {
    filteredRecords,
    summary,
    filters,
    setFilters,
    clearFilters,
    addRecord,
    updateRecord,
    deleteRecord,
    formOpen,
    editTarget,
    openAdd,
    openEdit,
    closeForm,
  } = useRecords()

  function handleSave(data: Omit<HarvestRecord, 'id'> | HarvestRecord) {
    if ('id' in data) {
      updateRecord(data as HarvestRecord)
    } else {
      addRecord(data)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>蜂蜜採收記錄</h1>
      </header>

      <main className="app-main">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
        <RecordList
          records={filteredRecords}
          summary={summary}
          onEdit={openEdit}
          onDelete={deleteRecord}
        />
      </main>

      <button className="fab" onClick={openAdd} aria-label="新增記錄">
        +
      </button>

      {formOpen && (
        <RecordForm
          editTarget={editTarget}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 7.2: Replace `src/App.css`**

```css
/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #fffbea; color: #333; }

/* Layout */
.app { display: flex; flex-direction: column; min-height: 100dvh; }
.app-header { background: #f5a623; color: white; padding: 1rem; text-align: center; }
.app-header h1 { font-size: 1.25rem; }
.app-main { flex: 1; padding: 1rem; max-width: 640px; margin: 0 auto; width: 100%; }

/* FAB */
.fab {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  width: 3.5rem; height: 3.5rem; border-radius: 50%;
  background: #f5a623; color: white; border: none;
  font-size: 2rem; line-height: 1; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
}
.fab:hover { background: #e09000; }

/* Summary strip */
.summary-strip {
  display: flex; gap: 1rem; flex-wrap: wrap;
  background: #fff8dc; padding: 0.75rem 1rem;
  border-radius: 8px; margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

/* Record list */
.record-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.record-list__empty { color: #999; text-align: center; padding: 2rem 0; }
.record-item {
  background: white; border-radius: 8px; padding: 0.75rem 1rem;
  display: flex; align-items: flex-start; gap: 0.5rem;
  cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.08);
  position: relative; flex-wrap: wrap;
}
.record-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,.15); }
.record-item__main { flex: 1; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.record-item__time { color: #666; font-size: 0.85rem; }
.record-item__quantity { font-weight: 600; }
.record-item__water { color: #3a7bd5; }
.record-item__note { color: #888; font-size: 0.8rem; margin-top: 0.25rem; flex-basis: 100%; }
.record-item__delete {
  background: none; border: none; color: #c00;
  cursor: pointer; font-size: 1rem; padding: 0.25rem; flex-shrink: 0;
}

/* Filter bar */
.filter-bar { margin-bottom: 0.75rem; }
.filter-bar__toggle {
  background: white; border: 1px solid #ddd; border-radius: 8px;
  padding: 0.5rem 1rem; cursor: pointer; width: 100%;
  text-align: left; display: flex; justify-content: space-between; align-items: center;
}
.filter-bar--open .filter-bar__toggle { border-radius: 8px 8px 0 0; }
.filter-bar__badge { color: #f5a623; margin-right: 0.25rem; }
.filter-bar__panel {
  background: white; border: 1px solid #ddd; border-top: none;
  border-radius: 0 0 8px 8px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.filter-bar__group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.filter-bar__group label {
  display: flex; flex-direction: column; font-size: 0.8rem;
  font-weight: 500; flex: 1; min-width: 140px;
}
.filter-bar__group input {
  margin-top: 0.25rem; padding: 0.4rem;
  border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;
}
.filter-bar__clear {
  align-self: flex-start; background: none; border: 1px solid #c00;
  color: #c00; border-radius: 4px; padding: 0.4rem 0.75rem; cursor: pointer;
}

/* Modal dialog */
.record-form-dialog {
  border: none; border-radius: 12px; padding: 0;
  box-shadow: 0 8px 32px rgba(0,0,0,.25); max-width: 420px; width: 90%;
}
.record-form-dialog::backdrop { background: rgba(0,0,0,.4); }
.record-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.record-form h2 { margin-bottom: 0.25rem; }
.record-form label {
  display: flex; flex-direction: column;
  font-size: 0.9rem; font-weight: 500;
}
.record-form input, .record-form textarea {
  margin-top: 0.3rem; padding: 0.5rem;
  border: 1px solid #ccc; border-radius: 6px; font-size: 1rem;
}
.record-form textarea { resize: vertical; }
.record-form .error { color: #c00; font-size: 0.8rem; margin-top: 0.2rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.form-actions button {
  padding: 0.6rem 1.2rem; border-radius: 6px;
  cursor: pointer; font-size: 0.95rem; border: none;
}
.form-actions button[type="button"] {
  background: white; border: 1px solid #ccc; color: #333;
}
.form-actions button[type="submit"] { background: #f5a623; color: white; }
```

- [ ] **Step 7.3: Generate PWA icon placeholders**

A minimal approach — generate solid-color PNGs using Node.js (no extra package needed at dev time):

```bash
node -e "
const fs = require('fs');
// Minimal 1x1 orange PNG (valid PNG header + IDAT for solid color)
// Replace with real icons before production deployment
const { createCanvas } = require('canvas');
" 2>/dev/null || true
```

If `canvas` is unavailable, download any 192×192 and 512×512 PNG and place them at:
- `public/icons/pwa-192.png`
- `public/icons/pwa-512.png`

For a quick placeholder without canvas, use `pwa-asset-generator` once you have a source SVG or PNG:
```bash
npx pwa-asset-generator ./src/assets/icon.png ./public/icons --icon-only
```

The app will run without icons in dev mode; icons are only required for a passing Lighthouse PWA audit.

- [ ] **Step 7.4: Verify TypeScript — full project**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7.5: Run all tests**

```bash
npm test
```

Expected:
```
✓ src/db/storage.test.ts (16 tests)
Test Files  1 passed (1)
Tests       16 passed (16)
```

- [ ] **Step 7.6: Start dev server and manual verification**

```bash
npm run dev
```

Manual checklist at `http://localhost:5173/`:
- [ ] Header shows "蜂蜜採收記錄"
- [ ] FAB (+) visible bottom-right
- [ ] Click FAB → modal opens with empty form, time defaults to now
- [ ] Fill quantity=3, waterContent=17.5 → click 新增 → record appears in list
- [ ] Summary strip shows "共 1 筆 / 合計 3 罐 / 平均含水量 17.5%"
- [ ] Click record row → edit modal opens pre-filled
- [ ] Change quantity to 5 → 儲存 → list updates, summary updates to 5 罐
- [ ] Reload page → record still present (localStorage persistence)
- [ ] Delete button (✕) → confirm dialog → record removed
- [ ] Filter bar → click 篩選 → panel expands
- [ ] Set 含水量 最小=18 → record with 17.5% disappears; clear filter → reappears

- [ ] **Step 7.7: Production build**

```bash
npm run build && npm run preview
```

Expected: Build completes without errors. `dist/sw.js` appears (service worker generated by Workbox). App loads at `http://localhost:4173/`.

- [ ] **Step 7.8: Final commit**

```bash
git add src/App.tsx src/App.css public/icons/ vite.config.ts index.html
git commit -m "feat: App integration, styles, PWA config — initial release"
```

---

## Dependency Order

```
Task 1 (scaffold)
  └─► Task 2 (types + storage + tests)
        └─► Task 3 (useRecords hook)
              ├─► Task 4 (RecordForm)      ─┐
              ├─► Task 5 (RecordList/Item) ─┤─► Task 7 (App + styles + PWA)
              └─► Task 6 (FilterBar)       ─┘
```

Tasks 4, 5, and 6 are independent of each other and can be worked in parallel once Task 3 is complete.
