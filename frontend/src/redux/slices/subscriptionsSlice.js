import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '@/config/api'; // تأكد إن المسار ده صحيح حسب هيكلية المشروع

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
        return rejectWithValue('Authentication token is missing.');
      }

      // بناء query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (durationFilter) params.append('duration', durationFilter);
      if (includesGym) params.append('includes_gym', includesGym);
      if (includesPool) params.append('includes_pool', includesPool);
      if (includesClasses) params.append('includes_classes', includesClasses);

      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscription-types/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      let subscriptions = data.results || [];
      if (!Array.isArray(subscriptions)) {
        console.warn('Response results is not an array:', subscriptions);
        subscriptions = [];
      }

      return {
        count: data.count ?? 0,
        results: subscriptions,
        next: data.next ?? null,
        previous: data.previous ?? null,
      };
    } catch (error) {
      console.error('Error fetching subscription types:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch subscription types';
      return rejectWithValue(errorMessage);
    }
  }
);

// جلب أنواع الاشتراكات النشطة
export const fetchActiveSubscriptionTypes = createAsyncThunk(
  'activeSubscriptionTypes/fetch',
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
      return response.data;
    } catch (error) {
      console.error('Error fetching active subscription types:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// جلب نوع اشتراك معين حسب ID
export const fetchSubscriptionTypeById = createAsyncThunk(
  'subscriptions/fetchById',
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
      return rejectWithValue(error.response?.data || error.message);
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
        return rejectWithValue('Authorization token is missing.');
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
      console.log('Update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update failed:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// حذف اشتراك حسب ID
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

      await axios.delete(
        `${BASE_URL}subscriptions/api/subscriptions/${id}/`,
        config
      );
      console.log('Subscription deleted successfully:', id);
      return id;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to delete subscription'
      );
    }
  }
);

// إضافة اشتراك جديد
export const postSubscription = createAsyncThunk(
  'subscription/postSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Access token not found');

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
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// تحديث نوع اشتراك
export const putSubscriptionType = createAsyncThunk(
  'subscriptionTypes/putSubscriptionType',
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }

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

      console.log('Subscription type updated successfully:', response.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      console.error('Error updating subscription type:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// حذف نوع اشتراك
export const deleteSubscriptionType = createAsyncThunk(
  'subscriptions/deleteSubscriptionType',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${BASE_URL}subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Subscription type deleted successfully:', response.data);
      return id;
    } catch (error) {
      console.error('Error deleting subscription type:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete subscription type'
      );
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
          },
        }
      );
      console.log('Subscription type added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding subscription type:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add subscription type'
      );
    }
  }
);

// جلب اشتراك معين حسب ID
export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchSubscriptionById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Access token not found');

      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/${id}/`,
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

      return response.data;
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      return rejectWithValue(error.response?.data || error.message);
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

      return response.data;
    } catch (error) {
      console.error('Error fetching expired subscriptions:', error);
      return rejectWithValue(error.response?.data || error.message);
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
          params: { 
            member_id: memberId,
            page: page
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching member subscriptions:', error);
      return rejectWithValue(error.response?.data || error.message);
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
      return rejectWithValue(error.response?.data || error.message);
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
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming subscriptions:', error);
      return rejectWithValue(error.response?.data || error.message);
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

      return response.data;
    } catch (error) {
      console.error('Error making payment:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// تجديد اشتراك
export const renewSubscription = createAsyncThunk(
  'subscription/renewSubscription',
  async ({ subscriptionId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found in localStorage');
      }

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
      console.log('Subscription renewed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// جلب كل الاشتراكات مع دعم التصفية
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue('Authentication token missing');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // بناء query parameters
      const queryParams = {
        page: Number(params.page) || 1,
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
      };

      // معالجة تصفية التواريخ
      if (params.startDateGte) queryParams.start_date_gte = params.startDateGte;
      if (params.startDateLte) queryParams.start_date_lte = params.startDateLte;
      if (params.endDateGte) queryParams.end_date_gte = params.endDateGte;
      if (params.endDateLte) queryParams.end_date_lte = params.endDateLte;

      // معالجة تصفية المبالغ
      if (params.paidAmountGte) queryParams.paid_amount_gte = params.paidAmountGte;
      if (params.paidAmountLte) queryParams.paid_amount_lte = params.paidAmountLte;

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/subscriptions/?${queryString}`,
        config
      );

      // تحديد حالة الاشتراك على الـ client side
      const currentDate = new Date().toISOString().split('T')[0];
      const subscriptionsWithStatus = response.data.results.map((sub) => {
        if (sub.end_date < currentDate) {
          return { ...sub, status: 'Expired' };
        } else if (sub.start_date > currentDate) {
          return { ...sub, status: 'Upcoming' };
        } else {
          return { ...sub, status: 'Active' };
        }
      });

      return {
        subscriptions: subscriptionsWithStatus,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      console.error('Error fetching subscriptions:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(
        error.response?.data || 'Error fetching subscriptions'
      );
    }
  }
);

// إضافة حضور
export const addAttendance = createAsyncThunk(
  'attendance/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
      console.log('Sending attendance data:', newAttendance);
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

      console.log('Attendance response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding attendance:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add attendance.'
      );
    }
  }
);

// طلب تجميد اشتراك
export const requestSubscriptionFreeze = createAsyncThunk(
  'subscriptions/requestFreeze',
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
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );
      console.log('Subscription freeze request successful:', response.data);
      return { subscriptionId, data: response.data };
    } catch (error) {
      console.error('Subscription freeze request failed:', error.response?.data || error.message);
      return rejectWithValue({ subscriptionId, error: error.response?.data || error.message });
    }
  }
);

// إلغاء تجميد اشتراك
export const cancelSubscriptionFreeze = createAsyncThunk(
  'subscriptions/cancelFreeze',
  async ({ freezeRequestId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}subscriptions/api/freeze-requests/${freezeRequestId}/cancel/`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );
      console.log('Subscription freeze cancel successful:', response.data);
      return { freezeRequestId, data: response.data };
    } catch (error) {
      console.error('Subscription freeze cancel failed:', error.response?.data || error.message);
      return rejectWithValue({ freezeRequestId, error: error.response?.data || error.message });
    }
  }
);

// جلب ملف المدرب
export const fetchCoachProfile = createAsyncThunk(
  'subscriptions/fetchCoachProfile',
  async (coachId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}subscriptions/api/coach-report/${coachId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      return rejectWithValue(error.response?.data || 'Network error');
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
    ActivesubscriptionTypes: [],
    Activesubscription: [],
    subscriptions: [],
    allsubscriptions: [],
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
    payment: null,
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
      .addCase(fetchSubscriptionTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes = {
          count: action.payload.count || 0,
          results: Array.isArray(action.payload.results)
            ? action.payload.results
            : [],
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
      .addCase(fetchSubscriptionTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        if (!Array.isArray(state.subscriptionTypes.results)) {
          state.subscriptionTypes.results = [];
        }
        state.subscriptionTypes.results.push(action.payload);
        state.subscriptionTypes.count += 1;
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
      })
      .addCase(fetchSubscriptionTypeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSubscription.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSubscription = action.payload;
        const index = state.subscriptions.findIndex(
          (subscription) => subscription.id === updatedSubscription.id
        );
        if (index !== -1) {
          state.subscriptions[index] = updatedSubscription;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading = false;
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
        state.subscriptions = action.payload.subscriptions || [];
        state.pagination = {
          count: action.payload.count || 0,
          next: action.payload.next,
          previous: action.payload.previous,
        };
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
        const updatedSubscriptionType = action.payload;
        const index = state.subscriptionTypes.results.findIndex(
          (sub) => sub.id === updatedSubscriptionType.id
        );
        if (index !== -1) {
          state.subscriptionTypes.results[index] = updatedSubscriptionType;
        }
      })
      .addCase(putSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes.results = state.subscriptionTypes.results.filter(
          (sub) => sub.id !== action.payload
        );
        state.subscriptionTypes.count = Math.max(
          (state.subscriptionTypes.count || 0) - 1,
          0
        );
      })
      .addCase(deleteSubscriptionType.rejected, (state, action) => {
        state.loading = false;
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
        state.Activesubscription = action.payload || [];
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
        state.expiredSubscriptions = action.payload || [];
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
        state.upcomingSubscriptions = action.payload || [];
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
            ? {
                ...subscription,
                remaining_amount: action.payload.remaining_amount,
              }
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
        const index = state.subscriptions.findIndex(
          (sub) => sub.id === action.payload.id
        );
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
        state.status = 'loading';
      })
      .addCase(fetchMemberSubscriptions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.memberSubscriptions = action.payload || { results: [], count: 0, next: null, previous: null };
      })
      .addCase(fetchMemberSubscriptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'object' 
          ? action.payload.message || 'An error occurred' 
          : action.payload;
      })
      .addCase(addAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(addAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances.push(action.payload);
      })
      .addCase(addAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(requestSubscriptionFreeze.pending, (state, action) => {
        const { subscriptionId } = action.meta.arg;
        state.freezeStatus[subscriptionId] = 'loading';
        delete state.freezeError[subscriptionId];
        delete state.freezeSuccess[subscriptionId];
      })
      .addCase(requestSubscriptionFreeze.fulfilled, (state, action) => {
        const { subscriptionId, data } = action.payload || {};
        if (subscriptionId) {
          state.freezeStatus[subscriptionId] = 'succeeded';
          state.freezeSuccess[subscriptionId] = data.message || 'تم طلب تجميد الاشتراك بنجاح';
          delete state.freezeError[subscriptionId];
        }
      })
      .addCase(requestSubscriptionFreeze.rejected, (state, action) => {
        const { subscriptionId, error } = action.payload || {};
        if (subscriptionId) {
          state.freezeStatus[subscriptionId] = 'failed';
          state.freezeError[subscriptionId] = error || 'Unknown error';
          delete state.freezeSuccess[subscriptionId];
        }
      })
      .addCase(cancelSubscriptionFreeze.pending, (state, action) => {
        const { freezeRequestId } = action.meta.arg;
        state.cancelStatus[freezeRequestId] = 'loading';
        delete state.cancelError[freezeRequestId];
        delete state.cancelSuccess[freezeRequestId];
      })
      .addCase(cancelSubscriptionFreeze.fulfilled, (state, action) => {
        const { freezeRequestId, data } = action.payload || {};
        if (freezeRequestId) {
          state.cancelStatus[freezeRequestId] = 'succeeded';
          state.cancelSuccess[freezeRequestId] = data.message || 'تم إلغاء تجميد الاشتراك بنجاح';
          delete state.cancelError[freezeRequestId];
          if (data.id && state.memberSubscriptions.results) {
            const index = state.memberSubscriptions.results.findIndex(
              (sub) => sub.id === data.id
            );
            if (index !== -1) {
              state.memberSubscriptions.results[index] = {
                ...state.memberSubscriptions.results[index],
                ...data,
              };
            }
          }
        }
      })
      .addCase(cancelSubscriptionFreeze.rejected, (state, action) => {
        const { freezeRequestId, error } = action.payload || {};
        if (freezeRequestId) {
          state.cancelStatus[freezeRequestId] = 'failed';
          state.cancelError[freezeRequestId] = error || 'Unknown error';
          delete state.cancelSuccess[freezeRequestId];
        }
      })
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
        state.coachProfile.error = action.payload || 'Failed to fetch coach profile';
      });
  },
});

export const { clearFreezeFeedback, clearCoachProfile } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;