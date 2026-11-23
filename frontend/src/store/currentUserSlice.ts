import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CurrentUser } from '@/shared';

// Redux's ONLY responsibility in B4F Board - see
// ../../../projects/b4f-board/specification/FRONTEND-ARCHITECTURE.md,
// "Frontend state ownership". Never the raw JWT (it never reaches the
// client at all - see lib/session). Never workspace membership, issues,
// projects, or comments - those are server data, fetched fresh, never
// duplicated here.
interface CurrentUserState {
  user: CurrentUser | null;
}

const initialState: CurrentUserState = { user: null };

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser | null>) {
      state.user = action.payload;
    },
  },
});

export const { setCurrentUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;
