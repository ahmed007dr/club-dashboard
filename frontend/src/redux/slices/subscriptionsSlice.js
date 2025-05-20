import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../../config/api";

export const fetchSubscriptionTypes = createAsyncThunk(
  "subscriptions/fetchSubscriptionTypes",
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Authentication token is missing.");
      }

      // Fetch all subscription types with pagination
      const allResponse = await axios.get(
        `${BASE_URL}/subscriptions/api/subscription-types/?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch active subscription types
      const activeResponse = await axios.get(
        `${BASE_URL}/subscriptions/api/subscription-types/active/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle paginated response for all subscriptions
      const allData = allResponse.data;
      let allSubscriptions = allData.results || [];
      if (!Array.isArray(allSubscriptions)) {
        console.warn(
          "allSubscriptions.results is not an array:",
          allSubscriptions
        );
        allSubscriptions = [];
      }

      // Handle response for active subscriptions
      let activeSubscriptions = activeResponse.data;
      if (!Array.isArray(activeSubscriptions)) {
        if (activeResponse.data && Array.isArray(activeResponse.data.results)) {
          activeSubscriptions = activeResponse.data.results;
        } else {
          console.warn(
            "activeSubscriptions is not an array:",
            activeSubscriptions
          );
          activeSubscriptions = [];
        }
      }

      // Create a Set of active subscription IDs
      const activeIds = new Set(activeSubscriptions.map((sub) => sub.id));

      // Merge isActive field, prioritizing active endpoint but falling back to is_active
      const modifiedSubscriptions = allSubscriptions.map((sub) => ({
        ...sub,
        isActive: activeIds.has(sub.id) ? true : sub.is_active ?? false,
      }))

      // Return paginated response structure
      return {
        count: allData.count ?? 0,
        results: modifiedSubscriptions,
        next: allData.next ?? null,
        previous: allData.previous ?? null,
      };
    } catch (error) {
      console.error("Error fetching subscription types:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch subscription types";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchActiveSubscriptionTypes = createAsyncThunk(
  "activeSubscriptionTypes/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscription-types/active/`,
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

export const fetchSubscriptionTypeById = createAsyncThunk(
  "subscriptions/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscription-types/${id}/`,
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

export const updateSubscription = createAsyncThunk(
  "subscriptions/updateSubscription",
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Authorization token is missing.");
      return rejectWithValue("Authorization token is missing.");
    }

    try {
      const response = await axios.put(
        `${BASE_URL}/subscriptions/api/subscriptions/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Update successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSubscriptionById = createAsyncThunk(
  "subscriptions/deleteById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      await axios.delete(
        `${BASE_URL}/subscriptions/api/subscriptions/${id}/`,
        config
      );
      console.log("Subscription deleted successfully:", id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to delete subscription"
      );
    }
  }
);

export const postSubscription = createAsyncThunk(
  "subscription/postSubscription",
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Access token not found");

      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const putSubscriptionType = createAsyncThunk(
  "subscriptionTypes/putSubscriptionType",
  async ({ id, subscriptionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Access token not found");
        throw new Error("Access token not found");
      }

      const response = await axios.put(
        `${BASE_URL}/subscriptions/api/subscription-types/${id}/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Subscription type updated successfully:", response.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      console.error("Error updating subscription type:", errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const deleteSubscriptionType = createAsyncThunk(
  "subscriptions/deleteSubscriptionType",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${BASE_URL}/subscriptions/api/subscription-types/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Subscription type deleted successfully:", response.data);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete subscription type"
      );
    }
  }
);

export const addSubscriptionType = createAsyncThunk(
  "subscriptions/addSubscriptionType",
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscription-types/`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Subscription type added successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to add subscription type"
      );
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk(
  "subscriptions/fetchSubscriptionById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Access token not found");

      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Fetched subscription:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching subscription:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchActiveSubscriptions = createAsyncThunk(
  "subscriptions/fetchActiveSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/active/`,
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

export const fetchExpiredSubscriptions = createAsyncThunk(
  "subscriptions/fetchExpiredSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/expired/`,
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

export const fetchMemberSubscriptions = createAsyncThunk(
  "subscriptions/fetchMemberSubscriptions",
  async ({ memberId, page = 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/member/`,
        {
          params: { 
            member_id: memberId,
            page: page
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const fetchSubscriptionStats = createAsyncThunk(
  "subscriptions/fetchSubscriptionStats",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/stats/`,
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

export const fetchUpcomingSubscriptions = createAsyncThunk(
  "subscriptions/fetchUpcomingSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/upcoming/`,
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

export const makePayment = createAsyncThunk(
  "subscriptions/makePayment",
  async ({ subscriptionId, amount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/${subscriptionId}/make-payment/`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const renewSubscription = createAsyncThunk(
  "subscription/renewSubscription",
  async ({ subscriptionId }, { rejectWithValue }) => {
    console.log(
      `API URL: ${BASE_URL}/subscriptions/api/subscriptions/${subscriptionId}/renew/`
    );
    const token = localStorage.getItem("token");
    if (!token) {
      return rejectWithValue("No token found in localStorage");
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/subscriptions/api/subscriptions/${subscriptionId}/renew/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Subscription renewed successfully:", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetchSubscriptions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("Authentication token missing");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Map frontend params to backend query parameters
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
        ...(params.remainingAmount && {
          remaining_amount: params.remainingAmount,
        }),
        ...(params.status && { status: params.status }),
        ...(params.entryCount && { entry_count: params.entryCount }),
        ...(params.sort && { ordering: params.sort }),
      };

      // Handle date range filters
      if (params.startDateGte) {
        queryParams.start_date_gte = params.startDateGte;
      }
      if (params.startDateLte) {
        queryParams.start_date_lte = params.startDateLte;
      }
      if (params.endDateGte) {
        queryParams.end_date_gte = params.endDateGte;
      }
      if (params.endDateLte) {
        queryParams.end_date_lte = params.endDateLte;
      }

      // Handle amount range filters
      if (params.paidAmountGte) {
        queryParams.paid_amount_gte = params.paidAmountGte;
      }
      if (params.paidAmountLte) {
        queryParams.paid_amount_lte = params.paidAmountLte;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await axios.get(
        `${BASE_URL}/subscriptions/api/subscriptions/?${queryString}`,
        config
      );

      // Since your endpoint doesn't have separate active/upcoming/expired endpoints,
      // we'll determine status on the client side based on dates
      const currentDate = new Date().toISOString().split("T")[0];

      const subscriptionsWithStatus = response.data.results.map((sub) => {
        if (sub.end_date < currentDate) {
          return { ...sub, status: "Expired" };
        } else if (sub.start_date > currentDate) {
          return { ...sub, status: "Upcoming" };
        } else {
          return { ...sub, status: "Active" };
        }
      });

      return {
        subscriptions: subscriptionsWithStatus,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      console.error("Error fetching subscriptions:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      return rejectWithValue(
        error.response?.data || "Error fetching subscriptions"
      );
    }
  }
);

export const addAttendance = createAsyncThunk(
  "attendance/addAttendance",
  async (newAttendance, { rejectWithValue }) => {
    try {
      console.log("Sending attendance data:", newAttendance);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/attendance/api/attendances/add/`,
        newAttendance,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Attendance response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding attendance:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to add attendance."
      );
    }
  }
);

const subscriptionsSlice = createSlice({
  name: "subscriptions",
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
    memberSubscriptions: [],
    upcomingSubscriptions: [],
    attendances: [],
 pagination: {
      page: 1,
      count: 0,
      next: null,
      previous: null,
    },
    stats: null,
    subscriptionType: null,
    subscription: null,
    payment: null,
    loading: false,
    error: null,
    status: "idle",
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
        console.log("addSubscriptionType: Added type:", action.payload);
      })

      .addCase(addSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("addSubscriptionType failed:", action.payload);
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
        state.updateStatus = "loading";
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const updatedSubscription = action.payload;
        const index = state.subscriptions.findIndex(
          (subscription) => subscription.id === updatedSubscription.id
        );
        if (index !== -1) {
          state.subscriptions[index] = updatedSubscription;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.updateStatus = "failed";
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
        state.status = "loading";
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.subscriptions = action.payload.subscriptions || [];
        state.pagination = {
          count: action.payload.count || 0,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.status = "failed";
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
        } else {
          console.warn(
            "putSubscriptionType: Subscription type ID not found:",
            updatedSubscriptionType.id
          );
        }
      })
      .addCase(putSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("putSubscriptionType failed:", action.payload);
      })
      .addCase(deleteSubscriptionType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionType.fulfilled, (state, action) => {
        state.loading = false;
        if (!Array.isArray(state.subscriptionTypes.results)) {
          state.subscriptionTypes.results = [];
        }
        state.subscriptionTypes.results =
          state.subscriptionTypes.results.filter(
            (sub) => sub.id !== action.payload
          );
        state.subscriptionTypes.count = Math.max(
          (state.subscriptionTypes.count || 0) - 1,
          0
        );
        console.log(
          "deleteSubscriptionType: Removed type ID:",
          action.payload,
          "New count:",
          state.subscriptionTypes.count
        );
      })
      .addCase(deleteSubscriptionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("deleteSubscriptionType failed:", action.payload);
      })
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.subscription = action.payload;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.status = "failed";
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
        console.log(
          "Expired subscriptions fetched successfully:",
          action.payload
        );
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
        state.paymentStatus = "succeeded";
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
        console.error("Payment Error: ", action.payload);
        state.loading = false;
        state.paymentStatus = "failed";
        state.error = action.payload;
      })
      .addCase(renewSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
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
        state.status = "failed";
      })
      .addCase(fetchMemberSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
   .addCase(fetchMemberSubscriptions.fulfilled, (state, action) => {
    state.loading = false;
    state.memberSubscriptions = action.payload || [];
})
.addCase(fetchMemberSubscriptions.rejected, (state, action) => {
  state.loading = false;
  // Ensure error is a string
  state.error = typeof action.payload === 'object' 
    ? action.payload.message || 'An error occurred' 
    : action.payload;
})
.addCase(addAttendance.fulfilled, (state, action) => {
    state.loading = false;
    state.attendances.push(action.payload);
});
  },
});

export default subscriptionsSlice.reducer;
