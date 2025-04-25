// src/redux/slices/subscriptionSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';



// Define the async thunk for creating a new subscription type
export const fetchSubscriptionTypes = createAsyncThunk(
  'subscriptions/fetchSubscriptionTypes',
  async (_, { rejectWithValue }) => {
    try {
      // Retrieve the access token from localStorage
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      // Make the GET request with the access token in the headers
      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscription-types/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;  // Return data to be used in the reducer
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);  // In case of error
    }
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

// GET subscription type by ID with token
export const fetchSubscriptionTypeById = createAsyncThunk(
  'subscriptions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/updateSubscription',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token'); // Get the token from localStorage

    if (!token) {
      return rejectWithValue("Authorization token is missing.");
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/subscriptions/api/subscriptions/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Use the token from localStorage
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data; // Return updated subscription
    } catch (error) {
      return rejectWithValue(error.response.data); // Handle any error
    }
  }
);


export const deleteSubscriptionById = createAsyncThunk(
  'subscriptions/deleteById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      await axios.delete(`http://127.0.0.1:8000/subscriptions/api/subscriptions/${id}/`, config);
      console.log('Subscription deleted successfully:', id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete subscription');
    }
  }
);



// Create an async thunk for fetching subscriptions
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token from localStorage:', token);  // Retrieve the token from localStorage
      if (!token) {
        console.log('No access token found');
        throw new Error('No access token found');
      }

      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/', {
        headers: {
          Authorization: `Bearer ${token}`, // Add the token to the request header
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Subscriptions fetched successfully:', response.data); // Log successful response
      return response.data; // Return the subscription data to the slice
    } catch (error) {
      console.log('Error fetching subscriptions:', error.response ? error.response.data : error.message); // Log error details
      return rejectWithValue(error.response ? error.response.data : error.message); // Handle errors
    }
  }
);


export const postSubscription = createAsyncThunk(
  'subscription/postSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) throw new Error('Access token not found');

      const response = await axios.post(
        'http://127.0.0.1:8000/subscriptions/api/subscriptions/',
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Subscription created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const putSubscriptionType = createAsyncThunk(
  'subscriptionTypes/putSubscriptionType',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('Access token not found');
        throw new Error('Access token not found');
      }

      const response = await axios.put(
        `http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Subscription type updated successfully:', response.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      console.error('Error updating subscription type:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);


export const deleteSubscriptionType = createAsyncThunk(
  'subscriptions/deleteSubscriptionType',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token'); // Get the token from localStorage
      const response = await axios.delete(
        `http://127.0.0.1:8000/subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in the headers
          },
        }
      );
      return id; // Return the id to filter it from the state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subscription type');
    }
  }
);

export const addSubscriptionType = createAsyncThunk(
  'subscriptions/addSubscriptionType',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://127.0.0.1:8000/subscriptions/api/subscription-types/',
        subscriptionData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Subscription type added successfully:', response.data); // Log the response data
      return response.data; // Return the new subscription type to add it to the state
    } catch (error) {
      console.error('Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to add subscription type');
    }
  }
);

// Create a thunk for fetching a subscription by its ID
export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchSubscriptionById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) throw new Error('Access token not found');

      const response = await axios.get(
        `http://127.0.0.1:8000/subscriptions/api/subscriptions/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Fetched subscription:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


const subscriptionsSlice = createSlice({
    name: 'subscriptions',
    initialState: {
      subscriptionTypes: [],
      subscriptions: [],
      subscriptionType: null, 
      subscription: null,
      loading: false,
      error: null,
      status: 'idle'
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
       
         // Handle addSubscriptionType action (createSubscriptionType)
    builder.addCase(addSubscriptionType.pending, (state) => {
      state.loading = true; // Show loading indicator
    });
    builder.addCase(addSubscriptionType.fulfilled, (state, action) => {
      state.loading = false;
      state.subscriptionTypes.push(action.payload); // Add new subscription type to the list
    });
    builder.addCase(addSubscriptionType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload; // Handle error, if any
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

        .addCase(fetchSubscriptionTypeById.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchSubscriptionTypeById.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptionType = action.payload;
          state.lastFetched = Date.now(); // Update last fetch timestamp
        })
        .addCase(fetchSubscriptionTypeById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        .addCase(updateSubscription.pending, (state) => {
          state.updateStatus = 'loading';
        })
        .addCase(updateSubscription.fulfilled, (state, action) => {
          state.updateStatus = 'succeeded';
          // Update the subscription in the state
          const updatedSubscription = action.payload;
          const index = state.subscriptions.findIndex(
            (subscription) => subscription.id === updatedSubscription.id
          );
          if (index !== -1) {
            state.subscriptions[index] = updatedSubscription;
          }
        })
        .addCase(updateSubscription.rejected, (state, action) => {
          state.updateStatus = 'failed';
          state.error = action.payload;
        })

         // Delete by ID
      .addCase(deleteSubscriptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionById.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = state.subscriptions.filter(
          (subscription) => subscription.id !== action.payload
        );
      })
      .addCase(deleteSubscriptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
        .addCase(fetchSubscriptions.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(fetchSubscriptions.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.subscriptions = action.payload; // Store the fetched data
        })
        .addCase(fetchSubscriptions.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload; // Handle error
        })
      
        .addCase(postSubscription.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(postSubscription.fulfilled, (state, action) => {
          state.loading = false;
          state.subscriptions.push(action.payload); // أضف الاشتراك الجديد للقائمة
        })
        .addCase(postSubscription.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        .addCase(putSubscriptionType.pending, (state) => {
          state.loading = true;    // Set loading to true when updating a subscription type
          state.error = null;      // Clear any previous error
        })
        .addCase(putSubscriptionType.fulfilled, (state, action) => {
          state.loading = false;  // Set loading to false when the update is completed
          // Find and update the subscription type in the list
          const updatedSubscription = action.payload;
          const index = state.subscriptionTypes.findIndex(sub => sub.id === updatedSubscription.id);
          if (index !== -1) {
            state.subscriptionTypes[index] = updatedSubscription;  // Update the subscription type in the state
          }
        })
        .addCase(putSubscriptionType.rejected, (state, action) => {
          state.loading = false;  // Set loading to false if the update fails
          state.error = action.payload;  // Store the error from the rejection
        })

        .addCase(deleteSubscriptionType.fulfilled, (state, action) => {
          state.subscriptionTypes = state.subscriptionTypes.filter(
            (sub) => sub.id !== action.payload
          );
        })
        .addCase(deleteSubscriptionType.rejected, (state, action) => {
          state.error = action.payload;
        })
        .addCase(fetchSubscriptionById.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.subscription = action.payload; // Store the fetched subscription in state
        })
        .addCase(fetchSubscriptionById.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        })
    },
  });
  
  export default subscriptionsSlice.reducer;
  
