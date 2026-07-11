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
