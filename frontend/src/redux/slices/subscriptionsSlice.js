// src/redux/slices/subscriptionSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchSubscriptionTypes = createAsyncThunk(
  'subscription/fetchSubscriptionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Debugging line to check the token
      if (!token) {
        throw new Error('No token found in localStorage');
      }
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

// Define the async thunk for creating a new subscription type
export const createSubscriptionType = createAsyncThunk(
  'subscriptions/createSubscriptionType',
  async (subscriptionData) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // Make the POST request to create the subscription type
    const response = await axios.post(
      'http://127.0.0.1:8000/subscriptions/api/subscription-types/',
      subscriptionData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the header
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data; // Return the response data (created subscription type)
  }
);

// Async thunk to fetch active subscription types
export const fetchActiveSubscriptionTypes = createAsyncThunk(
  'subscriptions/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        'http://127.0.0.1:8000/subscriptions/api/subscription-types/active/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch one subscription by ID
export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateSubscriptionById = createAsyncThunk(
  'subscriptions/updateById',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteSubscriptionById = createAsyncThunk(
  'subscriptions/deleteById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );
      return id; // Return ID to remove it from state later
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// استخدام createAsyncThunk لجلب بيانات الاشتراكات
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchAll', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/');
      return response.data;  // 
    } catch (error) {
      return rejectWithValue(error.message);  
    }
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/create',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://127.0.0.1:8000/subscriptions/api/subscriptions/',
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
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
      subscriptions: [], 
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
        })
        .addCase(createSubscriptionType.pending, (state) => {
          state.loading = true;
        })
        .addCase(createSubscriptionType.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptionTypes.push(action.payload); // Add the new subscription type
        })
        .addCase(createSubscriptionType.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message; // Handle errors
        })

        .addCase(fetchActiveSubscriptionTypes.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchActiveSubscriptionTypes.fulfilled, (state, action) => {
          state.loading = false;
          state.activeSubscriptions = action.payload;
        })
        .addCase(fetchActiveSubscriptionTypes.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        .addCase(fetchSubscriptionById.pending, (state) => {
          state.loading = true;
          state.error = null;
          state.selectedSubscription = null;
        })
        .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
          state.loading = false;
          state.selectedSubscription = action.payload;
        })
        .addCase(fetchSubscriptionById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        .addCase(updateSubscriptionById.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateSubscriptionById.fulfilled, (state, action) => {
          state.loading = false;
          state.selectedSubscription = action.payload;
        })
        .addCase(updateSubscriptionById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        .addCase(deleteSubscriptionById.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteSubscriptionById.fulfilled, (state, action) => {
          state.loading = false;
          // Optionally filter out the deleted item from a list
          state.activeSubscriptions = state.activeSubscriptions.filter(
            (sub) => sub.id !== action.payload
          );
        })
        .addCase(deleteSubscriptionById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        .addCase(fetchSubscriptions.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchSubscriptions.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptions = action.payload;  
        })
        .addCase(fetchSubscriptions.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        .addCase(createSubscription.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createSubscription.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptions.push(action.payload); // أضف الاشتراك الجديد للقائمة
        })
        .addCase(createSubscription.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
    },
  });
  
  export default subscriptionsSlice.reducer;
  
