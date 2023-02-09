import {
  type DeleteCellAction,
  type InsertCellBeforeAction,
  type MoveCellAction,
  type UpdateCellAction
} from '../actions'
import { ActionType } from '../action-types'
import { type CellTypes } from '../cell'

export const updateCell = (
  cellId: string,
  cellContent: string
): UpdateCellAction => {
  return {
    type: ActionType.UPDATE_CELL,
    payload: {
      id: cellId,
      content: cellContent
    }
  }
}

export const deleteCell = (cellId: string): DeleteCellAction => {
  return { type: ActionType.DELETE_CELL, payload: cellId }
}

export const moveCell = (
  cellId: string,
  direction: 'up' | 'down'
): MoveCellAction => {
  return {
    type: ActionType.MOVE_CELL,
    payload: {
      id: cellId,
      direction
    }
  }
}

export const insertCellBefore = (
  cellId: string,
  cellType: CellTypes
): InsertCellBeforeAction => {
  return {
    type: ActionType.INSERT_CELL_BEFORE,
    payload: {
      id: cellId,
      type: cellType
    }
  }
}
