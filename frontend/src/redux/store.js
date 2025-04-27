// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import attendanceSlice from './slices/AttendanceSlice';
import entryLogsSlice from './slices/EntryLogsSlice';
import staffSlice from './slices/staff';
import financeSlice from './slices/financeSlice';
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    attendance: attendanceSlice.reducer,
    entryLogs: entryLogsSlice.reducer,
    staff:staffSlice.reducer,
    finance: financeSlice.reducer,
  },
});

export default store;
