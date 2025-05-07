import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchSubscriptionTypes = createAsyncThunk(
  'subscriptionTypes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const allResponse = await axios.get(`${BASE_URL}/subscriptions/api/subscription-types/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const activeResponse = await axios.get(`${BASE_URL}/subscriptions/api/subscription-types/active/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const allSubscriptions = allResponse.data;
      const activeSubscriptions = activeResponse.data;
      const activeIds = new Set(activeSubscriptions.map(sub => sub.id));
      const modifiedSubscriptions = allSubscriptions.map((sub) => ({
        ...sub,
        isActive: activeIds.has(sub.id),
      }));
      return modifiedSubscriptions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveSubscriptionTypes = createAsyncThunk(
  'activeSubscriptionTypes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscription-types/active/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptionTypeById = createAsyncThunk(
  'subscriptions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscription-types/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/updateSubscription',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue("Authorization token is missing.");
      }
      const response = await axios.put(
        `${BASE_URL}/subscriptions/api/subscriptions/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
      await axios.delete(`${BASE_URL}/subscriptions/api/subscriptions/${id}/`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete subscription');
    }
  }
);

export const postSubscription = createAsyncThunk(
  'subscription/postSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Access token not found');
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const putSubscriptionType = createAsyncThunk(
  'subscriptionTypes/putSubscriptionType',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
      const response = await axios.put(
        `${BASE_URL}/subscriptions/api/subscription-types/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteSubscriptionType = createAsyncThunk(
  'subscriptions/deleteSubscriptionType',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${BASE_URL}/subscriptions/api/subscription-types/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status !== 204) {
        throw new Error("Failed to delete subscription type.");
      }
      return id;
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
        `${BASE_URL}/subscriptions/api/subscription-types/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add subscription type');
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchSubscriptionById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Access token not found');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveSubscriptions = createAsyncThunk(
  'subscriptions/fetchActiveSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/active/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchExpiredSubscriptions = createAsyncThunk(
  'subscriptions/fetchExpiredSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/expired/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMemberSubscriptions = createAsyncThunk(
  'subscriptions/fetchMemberSubscriptions',
  async (memberId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/member/`, {
        params: { member_id: memberId },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptionStats = createAsyncThunk(
  'subscriptions/fetchSubscriptionStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/stats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchUpcomingSubscriptions = createAsyncThunk(
  'subscriptions/fetchUpcomingSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/subscriptions/api/subscriptions/upcoming/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const makePayment = createAsyncThunk(
  'subscriptions/makePayment',
  async ({ subscriptionId, amount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/${subscriptionId}/make-payment/`,
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const renewSubscription = createAsyncThunk(
  'subscription/renewSubscription',
  async ({ subscriptionId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue("No token found in localStorage");
      }
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/${subscriptionId}/renew/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { club_id: clubId },
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
      return rejectWithValue(error.response?.data?.message || 'Error fetching subscriptions');
    }
  }
);

export const addAttendance = createAsyncThunk(
  'attendance/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/attendance/api/attendances/add/`, newAttendance, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add attendance.');
    }
  }
);

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
    attendances: [],
    stats: null,
    subscriptionType: null,
    subscription: null,
    payment: null,
    loading: false,
    error: null,
    status: 'idle',
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
      .addCase(addSubscriptionType.pending, (state) => {
        state.loading = true;
      })
      .addCase(addSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes.push(action.payload);
      })
      .addCase(addSubscriptionType.rejected, (state, action) => {
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
        state.lastFetched = Date.now();
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
        state.subscriptions = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(postSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions.push(action.payload);
      })
      .addCase(postSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(putSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(putSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSubscription = action.payload;
        const index = state.subscriptionTypes.findIndex(sub => sub.id === updatedSubscription.id);
        if (index !== -1) {
          state.subscriptionTypes[index] = updatedSubscription;
        }
      })
      .addCase(putSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.subscription = action.payload;
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
      .addCase(fetchExpiredSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpiredSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.expiredSubscriptions = action.payload;
      })
      .addCase(fetchExpiredSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
        state.paymentStatus = 'succeeded';
        state.subscriptions = state.subscriptions.map((subscription) =>
          subscription.id === action.payload.subscriptionId
            ? { ...subscription, remaining_amount: action.payload.remaining_amount }
            : subscription
        );
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.loading = false;
        state.paymentStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(renewSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        const index = state.subscriptions.findIndex(sub => sub.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index].end_date = action.payload.end_date;
        }
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
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
      .addCase(addAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances.push(action.payload);
        if (!state.memberSubscriptions?.length) {
          return;
        }
        const { attendance_date, subscription, subscription_details } = action.payload;
        const memberId = subscription_details?.member;
        if (!memberId) {
          return;
        }
        const subscriptionIndex = state.memberSubscriptions.findIndex(
          sub => sub.id === subscription && sub.member === memberId
        );
        if (subscriptionIndex === -1) {
          return;
        }
        if (!state.memberSubscriptions[subscriptionIndex].attendance_dates) {
          state.memberSubscriptions[subscriptionIndex].attendance_dates = [];
        }
        const existingDates = state.memberSubscriptions[subscriptionIndex].attendance_dates;
        const isDuplicate = existingDates.some(date => date === attendance_date);
        if (!isDuplicate) {
          state.memberSubscriptions[subscriptionIndex].attendance_dates = [
            ...existingDates,
            attendance_date
          ];
          state.memberSubscriptions[subscriptionIndex].attendance_days = 
            state.memberSubscriptions[subscriptionIndex].attendance_dates.length;
        }
      });
  },
});

export default subscriptionsSlice.reducer;