// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import attendanceSlice from './slices/AttendanceSlice';
<<<<<<< HEAD
import entryLogSlice from './slices/entryLogSlice';
=======
import entryLogsSlice from './slices/EntryLogsSlice';
import staffSlice from './slices/staff';
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    attendance: attendanceSlice.reducer,
<<<<<<< HEAD
    entryLog: entryLogSlice.reducer,
=======
    entryLogs: entryLogsSlice.reducer,
    staff:staffSlice.reducer,
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
  },
});

export default store;
