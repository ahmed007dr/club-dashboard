import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '@/config/api';

// جلب أنواع الاشتراكات مع دعم التصفية والترقيم
export const fetchSubscriptionTypes = createAsyncThunk(
  'subscriptions/fetchSubscriptionTypes',
  async (
    {
      page = 1,
      searchQuery = '',
      statusFilter = 'all',
      durationFilter = '',
      includesGym = '',
      includesPool = '',
      includesClasses = '',
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      const params = new URLSearchParams({
        page,
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(durationFilter && { duration: durationFilter }),
        ...(includesGym && { includes_gym: includesGym }),
        ...(includesPool && { includes_pool: includesPool }),
        ...(includesClasses && { includes_classes: includesClasses }),
      });

      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscription-types/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      return {
        count: data.count || 0,
        results: Array.isArray(data.results) ? data.results : [],
        next: data.next || null,
        previous: data.previous || null,
      };
    } catch (error) {
      console.error('Error fetching subscription types:', error);
      return rejectWithValue(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch subscription types'
      );
    }
  }
);

// جلب أنواع الاشتراكات النشطة
export const fetchActiveSubscriptionTypes = createAsyncThunk(
  'subscriptions/fetchActiveSubscriptionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscription-types/active/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching active subscription types:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب نوع اشتراك معين حسب ID
export const fetchSubscriptionTypeById = createAsyncThunk(
  'subscriptions/fetchSubscriptionTypeById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription type by ID:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// تحديث اشتراك
export const updateSubscription = createAsyncThunk(
  'subscriptions/updateSubscription',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization token is missing.');
      }

      const response = await axios.put(
        `${BASE_URL}subscriptions/api/subscriptions/${id}/`,
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
      console.error('Error updating subscription:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// حذف اشتراك حسب ID
export const deleteSubscriptionById = createAsyncThunk(
  'subscriptions/deleteSubscriptionById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BASE_URL}subscriptions/api/subscriptions/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return id;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// إضافة اشتراك جديد
export const postSubscription = createAsyncThunk(
  'subscriptions/postSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      const response = await axios.post(
        `${BASE_URL}subscriptions/api/subscriptions/`,
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
      console.error('Error posting subscription:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// تحديث نوع اشتراك
export const putSubscriptionType = createAsyncThunk(
  'subscriptions/putSubscriptionType',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}subscriptions/api/subscription-types/${id}/`,
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
      console.error('Error updating subscription type:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// حذف نوع اشتراك
export const deleteSubscriptionType = createAsyncThunk(
  'subscriptions/deleteSubscriptionType',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BASE_URL}subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return id;
    } catch (error) {
      console.error('Error deleting subscription type:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// إضافة نوع اشتراك جديد
export const addSubscriptionType = createAsyncThunk(
  'subscriptions/addSubscriptionType',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/subscription-types/`,
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
      console.error('Error adding subscription type:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب اشتراك معين حسب ID
export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchSubscriptionById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب الاشتراكات النشطة
export const fetchActiveSubscriptions = createAsyncThunk(
  'subscriptions/fetchActiveSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/active/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب الاشتراكات المنتهية
export const fetchExpiredSubscriptions = createAsyncThunk(
  'subscriptions/fetchExpiredSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/expired/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching expired subscriptions:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب اشتراكات عضو معين
export const fetchMemberSubscriptions = createAsyncThunk(
  'subscriptions/fetchMemberSubscriptions',
  async ({ memberId, page = 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/member/`,
        {
          params: { member_id: memberId, page },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return {
        results: Array.isArray(response.data.results) ? response.data.results : [],
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
      };
    } catch (error) {
      console.error('Error fetching member subscriptions:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب إحصائيات الاشتراكات
export const fetchSubscriptionStats = createAsyncThunk(
  'subscriptions/fetchSubscriptionStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/stats/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب الاشتراكات القادمة
export const fetchUpcomingSubscriptions = createAsyncThunk(
  'subscriptions/fetchUpcomingSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/upcoming/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching upcoming subscriptions:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// إجراء دفعة
export const makePayment = createAsyncThunk(
  'subscriptions/makePayment',
  async ({ subscriptionId, amount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/subscriptions/${subscriptionId}/make-payment/`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { subscriptionId, ...response.data };
    } catch (error) {
      console.error('Error making payment:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// تجديد اشتراك
export const renewSubscription = createAsyncThunk(
  'subscriptions/renewSubscription',
  async ({ subscriptionId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/subscriptions/${subscriptionId}/renew/`,
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
      console.error('Error renewing subscription:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// جلب كل الاشتراكات مع دعم التصفية
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const queryParams = {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        ...(params.searchTerm && { search_term: params.searchTerm }),
        ...(params.memberId && { member_id: params.memberId }),
        ...(params.typeId && { type_id: params.typeId }),
        ...(params.clubId && { club_id: params.clubId }),
        ...(params.clubName && { club_name: params.clubName }),
        ...(params.startDate && { start_date: params.startDate }),
        ...(params.endDate && { end_date: params.endDate }),
        ...(params.paidAmount && { paid_amount: params.paidAmount }),
        ...(params.remainingAmount && { remaining_amount: params.remainingAmount }),
        ...(params.status && { status: params.status }),
        ...(params.entryCount && { entry_count: params.entryCount }),
        ...(params.sort && { ordering: params.sort }),
        ...(params.startDateGte && { start_date_gte: params.startDateGte }),
        ...(params.startDateLte && { start_date_lte: params.startDateLte }),
        ...(params.endDateGte && { end_date_gte: params.endDateGte }),
        ...(params.endDateLte && { end_date_lte: params.endDateLte }),
        ...(params.paidAmountGte && { paid_amount_gte: params.paidAmountGte }),
        ...(params.paidAmountLte && { paid_amount_lte: params.paidAmountLte }),
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/?${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        subscriptions: Array.isArray(response.data.results) ? response.data.results : [],
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
      };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// إضافة حضور
export const addAttendance = createAsyncThunk(
  'subscriptions/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}attendance/api/attendances/add/`,
        newAttendance,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding attendance:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// طلب تجميد اشتراك
export const requestSubscriptionFreeze = createAsyncThunk(
  'subscriptions/requestSubscriptionFreeze',
  async ({ subscriptionId, requestedDays, startDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/subscriptions/${subscriptionId}/request-freeze/`,
        {
          requested_days: requestedDays,
          start_date: startDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { subscriptionId, ...response.data };
    } catch (error) {
      console.error('Error requesting subscription freeze:', error);
      return rejectWithValue({ subscriptionId, error: error.response?.data?.message || error.message });
    }
  }
);

// إلغاء تجميد اشتراك
export const cancelSubscriptionFreeze = createAsyncThunk(
  'subscriptions/cancelSubscriptionFreeze',
  async ({ freezeRequestId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/freeze-requests/${freezeRequestId}/cancel/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { freezeRequestId, ...response.data };
    } catch (error) {
      console.error('Error canceling subscription freeze:', error);
      return rejectWithValue({ freezeRequestId, error: error.response?.data?.message || error.message });
    }
  }
);

// جلب ملف المدرب
export const fetchCoachProfile = createAsyncThunk(
  'subscriptions/fetchCoachProfile',
  async ({ coachId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/coach-report/${coachId}/`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState: {
    subscriptionTypes: {
      count: 0,
      results: [],
      next: null,
      previous: null,
    },
    activeSubscriptionTypes: [],
    activeSubscriptions: [],
    subscriptions: [],
    expiredSubscriptions: [],
    memberSubscriptions: { results: [], count: 0, next: null, previous: null },
    upcomingSubscriptions: [],
    attendances: [],
    pagination: {
      page: 1,
      count: 0,
      next: null,
      previous: null,
    },
    coachProfile: {
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
    },
    stats: null,
    subscriptionType: null,
    subscription: null,
    paymentStatus: null,
    loading: false,
    error: null,
    status: 'idle',
    freezeStatus: {},
    freezeError: {},
    freezeSuccess: {},
    cancelStatus: {},
    cancelError: {},
    cancelSuccess: {},
  },
  reducers: {
    clearFreezeFeedback: (state, action) => {
      const id = action.payload;
      delete state.freezeStatus[id];
      delete state.freezeError[id];
      delete state.freezeSuccess[id];
      delete state.cancelStatus[id];
      delete state.cancelError[id];
      delete state.cancelSuccess[id];
    },
    clearCoachProfile: (state) => {
      state.coachProfile = {
        data: null,
        loading: false,
        error: null,
        lastFetch: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب أنواع الاشتراكات
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

      // إضافة نوع اشتراك
      .addCase(addSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes.results.push(action.payload);
        state.subscriptionTypes.count += 1;
      })
      .addCase(addSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // جلب نوع اشتراك معين
      .addCase(fetchSubscriptionTypeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionTypeById.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionType = action.payload;
      })
      .addCase(fetchSubscriptionTypeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // تحديث اشتراك
      .addCase(updateSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSubscription = action.payload;
        state.subscriptions = state.subscriptions.map((sub) =>
          sub.id === updatedSubscription.id ? updatedSubscription : sub
        );
        state.memberSubscriptions.results = state.memberSubscriptions.results.map((sub) =>
          sub.id === updatedSubscription.id ? updatedSubscription : sub
        );
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // حذف اشتراك
      .addCase(deleteSubscriptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionById.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = state.subscriptions.filter((sub) => sub.id !== action.payload);
        state.memberSubscriptions.results = state.memberSubscriptions.results.filter(
          (sub) => sub.id !== action.payload
        );
      })
      .addCase(deleteSubscriptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // جلب الاشتراكات
      .addCase(fetchSubscriptions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.subscriptions = action.payload.subscriptions;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // إضافة اشتراك
      .addCase(postSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions.push(action.payload);
        state.memberSubscriptions.results.push(action.payload);
      })
      .addCase(postSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // تحديث نوع اشتراك
      .addCase(putSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(putSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSubscriptionType = action.payload;
        state.subscriptionTypes.results = state.subscriptionTypes.results.map((sub) =>
          sub.id === updatedSubscriptionType.id ? updatedSubscriptionType : sub
        );
      })
      .addCase(putSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // حذف نوع اشتراك
      .addCase(deleteSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes.results = state.subscriptionTypes.results.filter(
          (sub) => sub.id !== action.payload
        );
        state.subscriptionTypes.count = Math.max(state.subscriptionTypes.count - 1, 0);
      })
      .addCase(deleteSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // جلب اشتراك معين
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.subscription = action.payload;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // جلب الاشتراكات النشطة
      .addCase(fetchActiveSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSubscriptions = action.payload;
      })
      .addCase(fetchActiveSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // جلب الاشتراكات المنتهية
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

      // جلب إحصائيات الاشتراكات
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

      // جلب الاشتراكات القادمة
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

      // إجراء دفعة
      .addCase(makePayment.pending, (state) => {
        state.loading = true;
        state.paymentStatus = null;
      })
      .addCase(makePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = 'succeeded';
        const { subscriptionId, remaining_amount } = action.payload;
        state.subscriptions = state.subscriptions.map((sub) =>
          sub.id === subscriptionId ? { ...sub, remaining_amount } : sub
        );
        state.memberSubscriptions.results = state.memberSubscriptions.results.map((sub) =>
          sub.id === subscriptionId ? { ...sub, remaining_amount } : sub
        );
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.loading = false;
        state.paymentStatus = 'failed';
        state.error = action.payload;
      })

      // تجديد اشتراك
      .addCase(renewSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        const updatedSubscription = action.payload;
        state.subscriptions = state.subscriptions.map((sub) =>
          sub.id === updatedSubscription.id ? updatedSubscription : sub
        );
        state.memberSubscriptions.results = state.memberSubscriptions.results.map((sub) =>
          sub.id === updatedSubscription.id ? updatedSubscription : sub
        );
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload;
      })

      // جلب اشتراكات عضو
      .addCase(fetchMemberSubscriptions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMemberSubscriptions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.memberSubscriptions = action.payload;
      })
      .addCase(fetchMemberSubscriptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // إضافة حضور
      .addCase(addAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances.push(action.payload);
      })
      .addCase(addAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // طلب تجميد اشتراك
      .addCase(requestSubscriptionFreeze.pending, (state, action) => {
        const { subscriptionId } = action.meta.arg;
        state.freezeStatus[subscriptionId] = 'loading';
        delete state.freezeError[subscriptionId];
        delete state.freezeSuccess[subscriptionId];
      })
      .addCase(requestSubscriptionFreeze.fulfilled, (state, action) => {
        state.loading = false;
        const { subscriptionId, id, end_date, freeze_requests } = action.payload;
        state.freezeStatus[subscriptionId] = 'succeeded';
        state.freezeSuccess[subscriptionId] = 'تم طلب تجميد الاشتراك بنجاح';
        state.subscriptions = state.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, end_date, freeze_requests } : sub
        );
        state.memberSubscriptions.results = state.memberSubscriptions.results.map((sub) =>
          sub.id === id ? { ...sub, end_date, freeze_requests } : sub
        );
      })
      .addCase(requestSubscriptionFreeze.rejected, (state, action) => {
        state.loading = false;
        const { subscriptionId, error } = action.payload;
        state.freezeStatus[subscriptionId] = 'failed';
        state.freezeError[subscriptionId] = error;
      })

      // إلغاء تجميد اشتراك
      .addCase(cancelSubscriptionFreeze.pending, (state, action) => {
        const { freezeRequestId } = action.meta.arg;
        state.cancelStatus[freezeRequestId] = 'loading';
        delete state.cancelError[freezeRequestId];
        delete state.cancelSuccess[freezeRequestId];
      })
      .addCase(cancelSubscriptionFreeze.fulfilled, (state, action) => {
        state.loading = false;
        const { freezeRequestId, id, end_date, freeze_requests } = action.payload;
        state.cancelStatus[freezeRequestId] = 'succeeded';
        state.cancelSuccess[freezeRequestId] = 'تم إلغاء تجميد الاشتراك بنجاح';
        state.subscriptions = state.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, end_date, freeze_requests } : sub
        );
        state.memberSubscriptions.results = state.memberSubscriptions.results.map((sub) =>
          sub.id === id ? { ...sub, end_date, freeze_requests } : sub
        );
      })
      .addCase(cancelSubscriptionFreeze.rejected, (state, action) => {
        state.loading = false;
        const { freezeRequestId, error } = action.payload;
        state.cancelStatus[freezeRequestId] = 'failed';
        state.cancelError[freezeRequestId] = error;
      })

      // جلب ملف المدرب
      .addCase(fetchCoachProfile.pending, (state) => {
        state.coachProfile.loading = true;
        state.coachProfile.error = null;
      })
      .addCase(fetchCoachProfile.fulfilled, (state, action) => {
        state.coachProfile.loading = false;
        state.coachProfile.data = action.payload;
        state.coachProfile.lastFetch = new Date().toISOString();
      })
      .addCase(fetchCoachProfile.rejected, (state, action) => {
        state.coachProfile.loading = false;
        state.coachProfile.error = action.payload;
      });
  },
});

export const { clearFreezeFeedback, clearCoachProfile } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;