export interface HarvestRecord {
  id: string
  time: string
  quantity: number
  waterContent: number
  note?: string
}

export interface FilterState {
  timeFrom?: string
  timeTo?: string
  quantityMin?: number
  quantityMax?: number
  waterMin?: number
  waterMax?: number
}
