interface NumPadProps {
  value: string
  onChange: (value: string) => void
}

const BUTTONS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '⌫'],
]

export function NumPad({ value, onChange }: NumPadProps) {
  function press(key: string) {
    if (key === 'C') {
      onChange('')
      return
    }
    if (key === '⌫') {
      onChange(value.slice(0, -1))
      return
    }
    if (key === '.' && value.includes('.')) return
    if (key === '.' && value === '') {
      onChange('0.')
      return
    }
    // Prevent leading zeros (e.g. "007"), but allow "0."
    if (value === '0' && key !== '.') {
      onChange(key)
      return
    }
    onChange(value + key)
  }

  return (
    <div className="numpad">
      {BUTTONS.map((row, ri) => (
        <div key={ri} className="numpad__row">
          {row.map(key => (
            <button
              key={key}
              type="button"
              className={`numpad__key${key === 'C' ? ' numpad__key--clear' : ''}${key === '⌫' ? ' numpad__key--back' : ''}`}
              onPointerDown={e => { e.preventDefault(); press(key) }}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
