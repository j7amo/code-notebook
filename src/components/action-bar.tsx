import React from 'react'
import { useActions } from '../hooks/use-actions'

interface ActionBarProps {
  id: string
}

const ActionBar: React.FC<ActionBarProps> = ({ id }) => {
  const { moveCell, deleteCell } = useActions()

  const onUpClickHandler = (): void => {
    moveCell(id, 'up')
  }

  const onDownClickHandler = (): void => {
    moveCell(id, 'down')
  }

  const onDeleteClickHandler = (): void => {
    deleteCell(id)
  }

  return (
    <div>
      <button type="button" onClick={onUpClickHandler}>
        Up
      </button>
      <button type="button" onClick={onDownClickHandler}>
        Down
      </button>
      <button type="button" onClick={onDeleteClickHandler}>
        Delete
      </button>
    </div>
  )
}

export default ActionBar
