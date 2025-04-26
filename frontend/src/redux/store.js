// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice'; 
import subscriptionsReducer from './slices/subscriptionsSlice'; 
import userSlice from './slices/memberSlice';
import clubSlice from './slices/clubSlice';
import staffSlice from './slices/staff';
const store = configureStore({
  reducer: {
    ui: uiReducer, 
    subscriptions: subscriptionsReducer, 
    member:userSlice.reducer, 
    club:clubSlice.reducer,
    staff:staffSlice.reducer,
  },
});

export default store;
