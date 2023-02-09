import { type TypedUseSelectorHook, useSelector } from 'react-redux'
import { type RootState } from '../store'

// To make "useSelector" understand the type of data inside global state
// we need to use "TypedUseSelectorHook" interface to create a hook
// that is properly typed for our store's root state:
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector
// p.s. By the way this trick is from the official Redux docs
