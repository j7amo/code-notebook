import { type Dispatch, type Middleware } from 'redux'
import { type Action } from '../actions'
import { ActionType } from '../action-types'
import { saveCells } from '../action-creators'
import { type RootState } from '../reducers'

// We define a middleware to handle the case of any update/change to cells.
// We need to "track" these actions:
// - MOVE_CELLS
// - UPDATE_CELL
// - INSERT_CELL_AFTER
// - DELETE_CELL
export const persistMiddleware: Middleware<RootState> = ({
  dispatch,
  getState
}: {
  dispatch: Dispatch<Action>
  getState: () => RootState
}) => {
  // This value is persisted, so we can use it inside middleware
  let timer: NodeJS.Timeout | undefined

  return (next: (action: Action) => void) => (action: Action) => {
    // No matter what we want to forward any single
    // action further down the middleware chain
    next(action)

    // But in addition we want to call "saveCells" action creator
    // on any of these actions dispatched:
    if (
      [
        ActionType.MOVE_CELL,
        ActionType.UPDATE_CELL,
        ActionType.INSERT_CELL_AFTER,
        ActionType.DELETE_CELL
      ].includes(action.type)
    ) {
      // Add debouncing
      if (timer != null) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        // We have to call action creator in a special way
        // because we are not dispatching it in React layer which results in
        // Redux Thunk middleware not being aware of it at all:
        void saveCells()(dispatch, getState)
      }, 250)
    }
  }
}
