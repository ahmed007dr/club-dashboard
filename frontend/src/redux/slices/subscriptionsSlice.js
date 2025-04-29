// src/redux/slices/subscriptionSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';


export const fetchSubscriptionTypes = createAsyncThunk(
  'subscriptionTypes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all subscriptions
      const allResponse = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscription-types/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch active subscriptions
      const activeResponse = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscription-types/active/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allSubscriptions = allResponse.data;
      const activeSubscriptions = activeResponse.data;

      // Get list of active subscription IDs
      const activeIds = new Set(activeSubscriptions.map(sub => sub.id));

      // Add isActive flag
      const modifiedSubscriptions = allSubscriptions.map((sub) => ({
        ...sub,
        isActive: activeIds.has(sub.id), // if the id is in active list, it's active
      }));

      return modifiedSubscriptions;

    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



// Async thunk to fetch active subscription types
export const fetchActiveSubscriptionTypes = createAsyncThunk(
  'activeSubscriptionTypes/fetch',
  async (_, { rejectWithValue }) => {

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:8000/subscriptions/api/subscription-types/active/',
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

// GET subscription type by ID with token
export const fetchSubscriptionTypeById = createAsyncThunk(
  'subscriptions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token'); // Get the token from localStorage

    if (!token) {
      console.error("Authorization token is missing.");
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
      console.log("Update successful:", response.data); // Log success
      return response.data; // Return updated subscription
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message); // Log error
      return rejectWithValue(error.response?.data || error.message); // Handle any error
    }
  }
);

export const deleteSubscriptionById = createAsyncThunk(
  'subscriptions/deleteById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
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
/*
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      // Retrieve the access token from localStorage
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);  

      // If no token is found, throw an error
      if (!token) {
        console.log('No access token found');
        throw new Error('No access token found');
      }

      // Make a GET request to the subscriptions API with the token in Authorization header
      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/', {
        headers: {
          Authorization: `Bearer ${token}`, // Attach Bearer token for authentication
          'Content-Type': 'application/json', // Specify the content type
        },
      });

      // Log the successful response
      console.log('Subscriptions fetched successfully:', response.data);

      // Return the fetched subscriptions data
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.log('Error fetching subscriptions:', error.response ? error.response.data : error.message);

      // Return the error to be handled by the slice
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);
*/



export const postSubscription = createAsyncThunk(
  'subscription/postSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

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
      const token = localStorage.getItem('token');

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
      const token = localStorage.getItem('token'); // Get the token from localStorage
      const response = await axios.delete(
        `${BASE_URL}/subscriptions/api/subscription-types/${id}/`, // Use BASE_URL here
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in the headers
          },
        }
      );
      console.log('Subscription type deleted successfully:', response.data);
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');

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

// Thunk to fetch active subscriptions
export const fetchActiveSubscriptions = createAsyncThunk(
  'subscriptions/fetchActiveSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/active/', {
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

// ✅ New thunk: Fetch expired subscriptions
export const fetchExpiredSubscriptions = createAsyncThunk(
  'subscriptions/fetchExpiredSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/expired/', {
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

// ✅ New thunk: fetch member subscriptions
export const fetchMemberSubscriptions = createAsyncThunk(
  'subscriptions/fetchMemberSubscriptions',
  async (memberId, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/subscriptions/api/subscriptions/member/`,
        {
          params: { member_id: memberId }, // Pass member_id as query param
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const fetchSubscriptionStats = createAsyncThunk(
  'subscriptions/fetchSubscriptionStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/stats/', {
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

// Fetch Upcoming Subscriptions
export const fetchUpcomingSubscriptions = createAsyncThunk(
  'subscriptions/fetchUpcomingSubscriptions',
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/subscriptions/upcoming/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// POST: Make payment for a subscription
export const makePayment = createAsyncThunk(
  'subscriptions/makePayment',
  async ({ subscriptionId, amount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); 

      const response = await axios.post(
        `http://127.0.0.1:8000/subscriptions/api/subscriptions/${subscriptionId}/make-payment/`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const renewSubscription = createAsyncThunk(
  'subscription/renewSubscription',
  async ({ subscriptionId}, thunkAPI) => {
    console.log(`API URL: http://127.0.0.1:8000/subscriptions/api/subscriptions/${subscriptionId}/renew/`);
    const token = localStorage.getItem('token');  // Retrieve token from localStorage
    
    if (!token) {
      return thunkAPI.rejectWithValue("No token found in localStorage");
    }

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/subscriptions/api/subscriptions/${subscriptionId}/renew/`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Subscription renewed successfully:', response.data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk to fetch subscriptions and their statuses
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [allRes, activeRes, upcomingRes, expiredRes] = await Promise.all([
        axios.get(`${BASE_URL}/subscriptions/api/subscriptions/`, config),
        axios.get(`${BASE_URL}/subscriptions/api/subscriptions/active/`, config),
        axios.get(`${BASE_URL}/subscriptions/api/subscriptions/upcoming/`, config),
        axios.get(`${BASE_URL}/subscriptions/api/subscriptions/expired/`, config),
      ]);
      

      const activeIds = new Set(activeRes.data.map(sub => sub.id));
      const upcomingIds = new Set(upcomingRes.data.map(sub => sub.id));
      const expiredIds = new Set(expiredRes.data.map(sub => sub.id));

      const subscriptionsWithStatus = allRes.data.map(sub => {
        if (activeIds.has(sub.id)) {
          return { ...sub, status: 'Active' };
        } else if (upcomingIds.has(sub.id)) {
          return { ...sub, status: 'Upcoming' };
        } else if (expiredIds.has(sub.id)) {
          return { ...sub, status: 'Expired' };
        } else {
          return { ...sub, status: 'Unknown' };
        }
      });

      return subscriptionsWithStatus;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching subscriptions');
    }
  }
);
//
const subscriptionsSlice = createSlice({
    name: 'subscriptions',
    initialState: {
      subscriptionTypes: [],
      ActivesubscriptionTypes: [],
      Activesubscription: [],
      subscriptions: [],
      allsubscriptions: [],
      expiredSubscriptions: [],
      memberSubscriptions: [],
      upcomingSubscriptions: [],
      stats: null,
      subscriptionType: null, 
      subscription: null,
      payment: null,
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

  //  .addCase(fetchActiveSubscriptionTypes.pending, (state) => {
   //   state.loading = true;
  //    state.error = null;
  //  })
  //  .addCase(fetchActiveSubscriptionTypes.fulfilled, (state, action) => {
 //     state.loading = false;
  //    state.ActivesubscriptionTypes = action.payload;
 //   })
  //  .addCase(fetchActiveSubscriptionTypes.rejected, (state, action) => {
 //     state.loading = false;
 //     state.error = action.payload;
  //  })

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
        .addCase(fetchActiveSubscriptions.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchActiveSubscriptions.fulfilled, (state, action) => {
          state.loading = false;
          state.Activesubscription = action.payload;
        })
        .addCase(fetchActiveSubscriptions.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

         // Expired subscriptions
      .addCase(fetchExpiredSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpiredSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.expiredSubscriptions = action.payload;
        console.log('Expired subscriptions fetched successfully:', action.payload);
      })
      .addCase(fetchExpiredSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       // ✅ Subscription Stats
       .addCase(fetchSubscriptionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSubscriptionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUpcomingSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingSubscriptions = action.payload; 
      })
      .addCase(fetchUpcomingSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(makePayment.pending, (state) => {
        state.loading = true;
        state.paymentStatus = null;
      })
      .addCase(makePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = 'succeeded'; // Optionally set payment status to succeeded
      
        // Find the subscription in the subscriptions array and update its remaining_amount
        const updatedSubscription = state.subscriptions.find(
          (subscription) => subscription.id === action.payload.subscriptionId
        );
        if (updatedSubscription) {
          updatedSubscription.remaining_amount = action.payload.remaining_amount;
        }
      })
      .addCase(makePayment.rejected, (state, action) => {
        console.error("Payment Error: ", action.payload);
        state.loading = false;
        state.paymentStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(renewSubscription.pending, (state) => {
        state.loading = true;  // Set loading to true while the API call is in progress
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        
        // Update the specific subscription in the array
        const index = state.subscriptions.findIndex(sub => sub.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index].end_date = action.payload.end_date;
        }
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.loading = false;  // Set loading to false if the API call fails
        state.error = action.payload;  // Store the error message
        state.status = 'failed';  // Mark the operation as failed
      })
     
     // .addCase(fetchAllSubscriptions.fulfilled, (state, action) => {
      //  state.loading = false;
      //  state.allsubscriptions = action.payload;
     // })

     .addCase(fetchMemberSubscriptions.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchMemberSubscriptions.fulfilled, (state, action) => {
      state.loading = false;
      state.memberSubscriptions = action.payload;
    })
    .addCase(fetchMemberSubscriptions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
     
    },
  });
  
  export default subscriptionsSlice.reducer;
  
