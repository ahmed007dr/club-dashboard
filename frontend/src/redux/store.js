// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import attendanceSlice from './slices/AttendanceSlice';
import ticketsReducer from './slices/ticketsSlice';
import invitesReducer from './slices/invitesSlice';
import entryLogSlice from './slices/entryLogSlice';
import authReducer from './slices/authSlice';
import usersReducer from "./slices/users";
import entryLogsSlice from './slices/EntryLogsSlice';
import staffSlice from './slices/staff';
import financeSlice from './slices/financeSlice';
import stockSlice from './slices/stockSlice';
import stockReducer from './slices/stockSlice'; 
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer, 
    tickets: ticketsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    attendance: attendanceSlice.reducer,
    entryLogs: entryLogsSlice.reducer,
    staff:staffSlice.reducer,
    invites: invitesReducer,
    entryLog: entryLogSlice.reducer,
    finance:financeSlice.reducer,
    auth: authReducer,
    users: usersReducer,
    stock: stockSlice.reducer,
    stock: stockReducer,
  },
});

export default store;
