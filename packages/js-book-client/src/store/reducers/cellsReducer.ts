import produce from 'immer'
import { type Action } from '../actions'
import { ActionType } from '../action-types'
import { type Cell } from '../cell'
import { generateRandomId } from '../../utils'

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

// Finally create reducer function.
// Wrap it with PRODUCE function of Immer library
// for MUCH EASIER state updates.
// p.s. All update patterns that can be used with Immer are here:
// https://immerjs.github.io/immer/update-patterns/
const reducer = produce(
  (state: CellsState = initialState, action: Action) => {
    switch (action.type) {
      case ActionType.UPDATE_CELL: {
        const { id, content } = action.payload
        state.data[id].content = content
        // When using Immer we technically don't have to return anything now.
        // But to avoid fallthrough case in switch we have to use a break/return statement.
        // Moreover, we MUST RETURN STATE (even though it is not needed when using Immer!)
        // because when later we'll try to access state["something"] we'll get TS error:
        // ""something" is possibly 'undefined'"
        return state
        // We don't need to write state updating logic Vanilla Redux-way
        // because we can now use Immer (here we use it explicitly via "produce" function
        // but in Redux Toolkit aka RTK it is used as a built-in solution already)
        // return {
        //   ...state,
        //   data: {
        //     ...state.data,
        //     [id]: {
        //       ...state.data[id],
        //       content
        //     }
        //   }
        // }
      }
      case ActionType.DELETE_CELL: {
        const { payload: id } = action
        // When deleting a cell we have to remove it from 2 places:
        // 1) From the "data" object
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.data[id]
        // 2) From the "order" array
        state.order = state.order.filter((cellId) => cellId !== id)

        return state
      }
      case ActionType.MOVE_CELL: {
        const { id, direction } = action.payload
        const indexOfCellToMove = state.order.findIndex(
          (cellId) => cellId === id
        )
        // Calculate new index to move cell to
        const targetIndex =
          direction === 'up' ? indexOfCellToMove - 1 : indexOfCellToMove + 1

        // Check if the index is outside of array
        // and return early if so (because it is an invalid value,
        // and we don't need to update state in this case)
        if (targetIndex < 0 || targetIndex > state.order.length - 1) {
          return state
        }

        // Swap ids
        state.order[indexOfCellToMove] = state.order[targetIndex]
        state.order[targetIndex] = id

        return state
      }
      case ActionType.INSERT_CELL_AFTER: {
        const { id, type } = action.payload
        // When inserting new cell we need to create a new cell object first
        const newCell: Cell = {
          id: generateRandomId(5),
          type,
          content: ''
        }

        // Add it to "data" object
        state.data[newCell.id] = newCell

        // Add its id to "order" array
        if (id != null) {
          const index = state.order.findIndex((cellId) => cellId === id)
          state.order.splice(index + 1, 0, newCell.id)
        } else {
          state.order.unshift(newCell.id)
        }

        return state
      }
      case ActionType.FETCH_CELLS: {
        state.loading = true
        state.error = null

        return state
      }
      case ActionType.FETCH_CELLS_COMPLETE: {
        state.loading = false
        state.order = action.payload.map((cell) => cell.id)
        // Here's a little trick new: we can add type annotation to reduce function
        // to satisfy TS.
        state.data = action.payload.reduce<CellsState['data']>((acc, cur) => {
          acc[cur.id] = cur

          return acc
        }, {})

        return state
      }
      case ActionType.FETCH_CELLS_ERROR: {
        state.loading = false
        state.error = action.payload

        return state
      }
      case ActionType.SAVE_CELLS_ERROR: {
        state.error = action.payload

        return state
      }
      default:
        return state
    }
  },
  // We also must provide initialState as a 2nd argument to "produce" function
  // because when later we'll try to access state["something"] we'll get TS error:
  // ""something" is possibly 'undefined'"
  initialState
)

export default reducer
