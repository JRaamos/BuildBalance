import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';
export interface SessionUser { id: string; name: string; email: string; role: UserRole }
interface AuthState { accessToken: string | null; user: SessionUser | null }

const stored = localStorage.getItem('buildbalance.session');
const initialState: AuthState = stored ? JSON.parse(stored) as AuthState : { accessToken: null, user: null };

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: SessionUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem('buildbalance.session', JSON.stringify(state));
    },
    signOut(state) {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem('buildbalance.session');
    }
  }
});

export const { setCredentials, signOut } = slice.actions;
export const authReducer = slice.reducer;
