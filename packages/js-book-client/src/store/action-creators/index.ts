import { type Dispatch } from 'redux'
import axios from 'axios'
import {
  type Action,
  type DeleteCellAction,
  type Direction,
  type InsertCellAfterAction,
  type MoveCellAction,
  type UpdateCellAction
} from '../actions'
import { ActionType } from '../action-types'
import { type Cell, type CellTypes } from '../cell'
import bundler from '../../bundler'
import { type RootState } from '../reducers'

export const updateCell = (id: string, content: string): UpdateCellAction => {
  return {
    type: ActionType.UPDATE_CELL,
    payload: {
      id,
      content
    }
  }
}

export const deleteCell = (id: string): DeleteCellAction => {
  return { type: ActionType.DELETE_CELL, payload: id }
}

export const moveCell = (id: string, direction: Direction): MoveCellAction => {
  return {
    type: ActionType.MOVE_CELL,
    payload: {
      id,
      direction
    }
  }
}

export const insertCellAfter = (
  id: string | null,
  type: CellTypes
): InsertCellAfterAction => {
  return {
    type: ActionType.INSERT_CELL_AFTER,
    payload: {
      id,
      type
    }
  }
}

export const createBundle =
  (cellId: string, input: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({ type: ActionType.BUNDLE_START, payload: { cellId } })

    const result = await bundler(input)
    dispatch({
      type: ActionType.BUNDLE_COMPLETE,
      payload: {
        cellId,
        bundle: {
          code: result.code,
          error: result.err
        }
      }
    })
  }

export const fetchCells = () => async (dispatch: Dispatch<Action>) => {
  dispatch({ type: ActionType.FETCH_CELLS })

  try {
    const { data }: { data: Cell[] } = await axios.get('/cells')

    dispatch({
      type: ActionType.FETCH_CELLS_COMPLETE,
      payload: data
    })
  } catch (err) {
    if (err instanceof Error) {
      dispatch({
        type: ActionType.FETCH_CELLS_ERROR,
        payload: err.message
      })
    }
  }
}

export const saveCells =
  () => async (dispatch: Dispatch<Action>, getState: () => RootState) => {
    const {
      cells: { data, order }
    } = getState()
    const orderedCells = order.map((cellId) => data[cellId])

    try {
      await axios.post('/cells', { cells: orderedCells })
    } catch (err) {
      if (err instanceof Error) {
        dispatch({
          type: ActionType.SAVE_CELLS_ERROR,
          payload: err.message
        })
      }
    }
  }
