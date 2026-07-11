import { useRef, useEffect, useState } from 'react'
import type { HarvestRecord } from '../types'
import { NumPad } from './NumPad'

interface RecordFormProps {
  editTarget: HarvestRecord | null
  onSave: (data: Omit<HarvestRecord, 'id'> | HarvestRecord) => void
  onClose: () => void
}

type NumField = 'quantity' | 'waterContent'

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
  const [activeField, setActiveField] = useState<NumField | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.focus()
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

  const numValues: Record<NumField, string> = { quantity, waterContent }
  const numSetters: Record<NumField, (v: string) => void> = {
    quantity: setQuantity,
    waterContent: setWaterContent,
  }

  function NumInput({ field, label, placeholder }: { field: NumField; label: string; placeholder: string }) {
    const active = activeField === field
    return (
      <div className="numfield">
        <label className={active ? 'numfield__label--active' : ''}>
          {label}
          <input
            type="text"
            inputMode="none"
            readOnly
            value={numValues[field]}
            placeholder={placeholder}
            className={`numfield__input${active ? ' numfield__input--active' : ''}`}
            onFocus={() => setActiveField(field)}
            onClick={() => setActiveField(field)}
          />
          {errors[field] && <span className="error">{errors[field]}</span>}
        </label>
        {active && (
          <NumPad
            value={numValues[field]}
            onChange={v => numSetters[field](v)}
          />
        )}
      </div>
    )
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
            onFocus={() => setActiveField(null)}
            required
          />
          {errors.time && <span className="error">{errors.time}</span>}
        </label>
        <NumInput field="quantity" label="數量（罐）" placeholder="0" />
        <NumInput field="waterContent" label="含水量（%）" placeholder="0.0" />
        <label>
          備註（選填）
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onFocus={() => setActiveField(null)}
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
