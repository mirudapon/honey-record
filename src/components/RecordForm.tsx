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
