import { type Action } from '../actions'
import { ActionType } from '../action-types'
import { type Cell } from '../cell'

// First we describe structure of the current state slice
interface CellsState {
  loading: boolean
  error: string | null
  order: string[]
  // "data" will be an object that holds key-value pairs
  data: Record<string, Cell> // - is an alias for {[id: string]: Cell}
}

// Then we set initial state
const initialState: CellsState = {
  loading: false,
  error: null,
  order: [],
  data: {}
}

// And finally create reducer function
const reducer = (
  state: CellsState = initialState,
  action: Action
): CellsState => {
  switch (action.type) {
    case ActionType.MOVE_CELL:
      return state
    case ActionType.DELETE_CELL:
      return state
    case ActionType.INSERT_CELL_BEFORE:
      return state
    case ActionType.UPDATE_CELL:
      return state
    default:
      return state
  }
}

export default reducer
