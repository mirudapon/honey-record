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
