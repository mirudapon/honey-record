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
