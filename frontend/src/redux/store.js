// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import attendanceSlice from './slices/AttendanceSlice';
import entryLogSlice from './slices/entryLogSlice';
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    attendance: attendanceSlice.reducer,
    entryLog: entryLogSlice.reducer,
  },
});

export default store;
