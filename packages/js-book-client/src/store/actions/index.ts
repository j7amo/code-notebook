// For every action type we need to have a corresponding interface
// that describes the structure of an action (this is especially important
// because of different payloads these actions will have):
import { type ActionType } from '../action-types'
import { type CellTypes } from '../cell'

export type Direction = 'up' | 'down'

export interface MoveCellAction {
  type: ActionType.MOVE_CELL
  payload: {
    // "id" of the cell that we want to move
    id: string
    // Because user can move cells up/down, we need to know the direction
    direction: Direction
  }
}

export interface DeleteCellAction {
  type: ActionType.DELETE_CELL
  // To delete the cell from cells array we only need to know its id
  payload: string
}

export interface InsertCellAfterAction {
  type: ActionType.INSERT_CELL_AFTER
  // To insert a new cell after another cell we need to know:
  // - id of the cell to insert the new one after;
  // - type of the cell we are inserting (we need this because
  // we are also creating a new cell here)
  payload: {
    // Here is something interesting:
    // Just to be able to handle one single corner-case
    // of inserting the cell to the very last index of cells array
    // we decide that we can pass "null" instead of specific "id"
    // when we want to do it!
    id: string | null
    type: CellTypes
  }
}

export interface UpdateCellAction {
  type: ActionType.UPDATE_CELL
  // To update a cell we need to know:
  // - id of the cell;
  // - new cell content we are inserting(either code content
  // for code-cell or text content for text-cell)
  payload: {
    id: string
    content: string
  }
}

export interface BundleStartAction {
  type: ActionType.BUNDLE_START
  payload: {
    cellId: string
  }
}

export interface BundleCompleteAction {
  type: ActionType.BUNDLE_COMPLETE
  payload: {
    cellId: string
    bundle: {
      code: string
      error: string
    }
  }
}

// Now we need to export all these interfaces to use them in other files.
// The easiest way of doing it is creating a type that is a UNION of these interfaces
// and export it instead of exporting interfaces one by one:
export type Action =
  | MoveCellAction
  | DeleteCellAction
  | InsertCellAfterAction
  | UpdateCellAction
  | BundleStartAction
  | BundleCompleteAction
