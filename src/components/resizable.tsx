import React from 'react'
import { ResizableBox, type ResizableBoxProps } from 'react-resizable'
import './resizable.css'

interface ResizableProps {
  direction: 'horizontal' | 'vertical'
  children?: React.ReactNode
}

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  // We want to pass different values to "ResizableBox" depending on "direction" prop
  let resizableProps: ResizableBoxProps

  if (direction === 'horizontal') {
    resizableProps = {
      // We need this classname to be able to select the element later.
      className: 'resize-horizontal',
      // Unfortunately "ResizableBox" component's "width"/"height" props
      // only accept numbers, but we want to use 100%.
      // We have to use a HACK here: Infinity as a value of the prop.
      height: Infinity,
      width: window.innerWidth * 0.75,
      // This is the placement of resize handle('e' stands for East)
      resizeHandles: ['e'],
      // This is the way of setting resize constraints (so that user
      // cannot resize less than 25% and more than 80% of viewport width)
      minConstraints: [window.innerWidth * 0.2, Infinity],
      maxConstraints: [window.innerWidth * 0.75, Infinity]
    }
  } else {
    resizableProps = {
      height: 300,
      width: Infinity,
      resizeHandles: ['s'],
      minConstraints: [Infinity, window.innerHeight * 0.15],
      maxConstraints: [Infinity, window.innerHeight * 0.9]
    }
  }

  return <ResizableBox {...resizableProps}>{children}</ResizableBox>
}

export default Resizable
