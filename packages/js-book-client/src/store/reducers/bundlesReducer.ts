import produce from 'immer'
import { ActionType } from '../action-types'
import { type Action } from '../actions'
import { type Bundle } from '../bundle'

// When our application is loading there are no bundles in the store
// that's why type annotation is "Bundle | undefined"
type BundlesState = Record<string, Bundle | undefined>

const initialState: BundlesState = {}

const reducer = produce(
  (state = initialState, action: Action): BundlesState => {
    switch (action.type) {
      case ActionType.BUNDLE_START: {
        state[action.payload.cellId] = {
          // When we start the bundling process we want to completely
          // clean up previous state(i.e. resetting code, error props)
          processing: true,
          code: '',
          error: ''
        }

        return state
      }
      case ActionType.BUNDLE_COMPLETE: {
        const {
          cellId,
          bundle: { code, error }
        } = action.payload

        state[cellId] = {
          processing: false,
          code,
          error
        }

        return state
      }
      default:
        return state
    }
  },
  initialState
)

export default reducer
