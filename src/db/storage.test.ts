import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadRecords,
  saveRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  applyFilters,
} from './storage'
import type { HarvestRecord } from '../types'

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
