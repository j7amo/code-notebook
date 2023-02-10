import { combineReducers } from 'redux'
import cellsReducer from './cellsReducer'
import bundlesReducer from './bundlesReducer'

// Create state slices inside global state
// and assign corresponding reducers to manage them
const reducers = combineReducers({
  cells: cellsReducer,
  bundles: bundlesReducer
})

export default reducers

// We need to define a type to describe GLOBAL STATE STRUCTURE inside Redux store
// in order to use it with "useSelector" later.
// Here we dynamically obtain the return type of "reducers" with TS built-in helper:
export type RootState = ReturnType<typeof reducers>
