import { useDispatch } from 'react-redux'
import { bindActionCreators } from 'redux'
import { useMemo } from 'react'
import { actionCreators } from '../store'

export const useActions = (): typeof actionCreators => {
  const dispatch = useDispatch()
  // Turns an object whose values are action creators,
  // into an object with the same keys, but with every function
  // wrapped into a dispatch call, so they may be invoked directly.
  return useMemo(() => bindActionCreators(actionCreators, dispatch), [dispatch])
}
