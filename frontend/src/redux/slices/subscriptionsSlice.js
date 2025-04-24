// src/redux/slices/subscriptionSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchSubscriptionTypes = createAsyncThunk(
  'subscription/fetchSubscriptionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:8000/subscriptions/api/subscription-types/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const subscriptionsSlice = createSlice({
    name: 'subscriptions',
    initialState: {
      subscriptionTypes: [],
      loading: false,
      error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchSubscriptionTypes.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchSubscriptionTypes.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptionTypes = action.payload;
        })
        .addCase(fetchSubscriptionTypes.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    },
  });
  
  export default subscriptionsSlice.reducer;
  
