import React from 'react'
import { useActions } from '../hooks/use-actions'
import './action-bar.css'

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
    <div className="action-bar">
      <button
        className="button is-primary is-small"
        type="button"
        onClick={onUpClickHandler}
      >
        <span className="icon">
          <i className="fas fa-arrow-up"></i>
        </span>
      </button>
      <button
        className="button is-primary is-small"
        type="button"
        onClick={onDownClickHandler}
      >
        <span className="icon">
          <i className="fas fa-arrow-down"></i>
        </span>
      </button>
      <button
        className="button is-primary is-small"
        type="button"
        onClick={onDeleteClickHandler}
      >
        <span className="icon">
          <i className="fas fa-times"></i>
        </span>
      </button>
    </div>
  )
}

export default ActionBar
