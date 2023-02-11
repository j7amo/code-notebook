import React, { useEffect, useState } from 'react'
import { ResizableBox, type ResizableBoxProps } from 'react-resizable'
import './resizable.css'

interface ResizableProps {
  direction: 'horizontal' | 'vertical'
  children?: React.ReactNode
}

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  const [innerHeight, setInnerHeight] = useState(window.innerHeight)
  const [innerWidth, setInnerWidth] = useState(window.innerWidth)
  const [width, setWidth] = useState(window.innerWidth * 0.75)
  // We want to pass different values to "ResizableBox" depending on "direction" prop
  let resizableProps: ResizableBoxProps

  useEffect(() => {
    let timer: NodeJS.Timeout
    // We set up the "resize" event listener (with DEBOUNCE!)
    // and attach it to a WINDOW(the browser itself) object:
    const listener = (): void => {
      // How to DEBOUNCE handling of event:
      // 1) Create a timer with "setTimeout".
      // 2) Put all the main logic of the handler inside "setTimeout" callback.
      // 3) Check whether the timer already exists just before initializing the new timer.
      // 4) If YES then call "clearTimeout" to remove it.
      // RESULT: if user resize too often then the timer will have no chance of firing.
      // This will greatly help with performance.
      if (timer != null) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        // Whenever height/width changes we update the state of <Resizable/> component
        // which triggers re-render with the new minConstraints/maxConstraints values
        setInnerHeight(window.innerHeight)
        setInnerWidth(window.innerWidth)
        // We also need to check whether "width" piece of state
        // is too large and shrink it down (we do this because
        // there's a bug in "react-resizable" package).
        if (window.innerWidth * 0.75 < width) {
          setWidth(window.innerWidth * 0.75)
        }
      }, 500)
    }
    window.addEventListener('resize', listener)

    // We don't forget to clean up the event listener
    return () => {
      window.removeEventListener('resize', listener)
    }
  }, [width])

  if (direction === 'horizontal') {
    resizableProps = {
      // We need this classname to be able to select the element later.
      className: 'resize-horizontal',
      // Unfortunately "ResizableBox" component's "width"/"height" props
      // only accept numbers, but we want to use 100%.
      // We have to use a HACK here: Infinity as a value of the prop.
      height: Infinity,
      width,
      // This is the placement of resize handle('e' stands for East)
      resizeHandles: ['e'],
      // This is the way of setting resize constraints (so that user
      // cannot resize less than 25% and more than 80% of viewport width)
      minConstraints: [innerWidth * 0.2, Infinity],
      maxConstraints: [innerWidth * 0.75, Infinity],
      // Here we listen for 'resize-stop' event, get the current width of the editor,
      // set the corresponding state slice and provide this value as a "width" prop
      // back to the <ResizableBox /> component
      onResizeStop: (event, data) => {
        setWidth(data.size.width)
      }
    }
  } else {
    resizableProps = {
      height: 300,
      width: Infinity,
      resizeHandles: ['s'],
      minConstraints: [Infinity, innerHeight * 0.15],
      maxConstraints: [Infinity, innerHeight * 0.9]
    }
  }

  return <ResizableBox {...resizableProps}>{children}</ResizableBox>
}

export default Resizable
