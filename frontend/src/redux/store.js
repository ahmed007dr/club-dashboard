// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import ticketsReducer from './slices/ticketsSlice';
import invitesReducer from './slices/invitesSlice';
import entryLogSlice from './slices/entryLogSlice';

import entryLogsSlice from './slices/EntryLogsSlice';
import staffSlice from './slices/staff';
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer,
    tickets: ticketsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    invites: invitesReducer,
    entryLog: entryLogSlice.reducer,
    entryLogs: entryLogsSlice.reducer,
    staff:staffSlice.reducer,

  },
});

export default store;
