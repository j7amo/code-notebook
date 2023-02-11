export type CellTypes = 'code' | 'text'

// We define an interface to describe an individual cell
export interface Cell {
  id: string
  type: CellTypes
  content: string
}
