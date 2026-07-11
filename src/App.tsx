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
