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

  const date = new Date(record.time).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const time = new Date(record.time).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <li className="record-item" onClick={onEdit}>
      <div className="record-item__header">
        <span className="record-item__date">{date}</span>
        <span className="record-item__time">{time}</span>
        <button
          className="record-item__delete"
          onClick={e => { e.stopPropagation(); handleDelete() }}
          aria-label="刪除"
        >
          ✕
        </button>
      </div>
      <div className="record-item__body">
        <div className="record-item__stat">
          <span className="record-item__stat-label">數量</span>
          <span className="record-item__stat-value">{record.quantity} <small>罐</small></span>
        </div>
        <div className="record-item__divider" />
        <div className="record-item__stat">
          <span className="record-item__stat-label">含水量</span>
          <span className="record-item__stat-value">{record.waterContent} <small>%</small></span>
        </div>
      </div>
      {record.note && <p className="record-item__note">{record.note}</p>}
    </li>
  )
}
