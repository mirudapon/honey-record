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
