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
