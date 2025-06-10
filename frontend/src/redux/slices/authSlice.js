import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { username, password, rfidCode, useRfid },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const endpoint = useRfid
        ? `${BASE_URL}accounts/api/login/rfid/`
        : `${BASE_URL}accounts/api/login/`;

      const payload = useRfid
        ? { rfid_code: rfidCode }
        : { username, password };

      const response = await axios.post(endpoint, payload);
      const { access, refresh, user } = response.data;

      // Store tokens and user data in localStorage
      localStorage.setItem("token", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(user));
      const permissions = user?.permissions || [];
      localStorage.setItem("permissions", JSON.stringify(permissions));

      // Refresh token before expiration (assuming backend provides expires_in)
      const expiresIn = 30 * 60 * 1000; // Fallback to 30 minutes
      const refreshInterval = setInterval(async () => {
        try {
          await dispatch(refreshAccessToken()).unwrap();
        } catch (error) {
          console.error("Error refreshing access token:", error);
          clearInterval(refreshInterval);
        }
      }, expiresIn - 60 * 1000); // Refresh 1 minute before expiration

      // Store interval ID or handle cleanup elsewhere (e.g., logout action)
      return { access, refresh, user, permissions, refreshInterval };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(
        `${BASE_URL}accounts/api/token/refresh/`,
        { refresh }
      );
      const { access, refresh: newRefresh } = response.data;

      // Update localStorage
      localStorage.setItem("token", access);
      if (newRefresh) {
        localStorage.setItem("refreshToken", newRefresh);
      }

      // Retrieve existing user and permissions
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const permissions = JSON.parse(
        localStorage.getItem("permissions") || "[]"
      );

      return { access, user, permissions };
    } catch (error) {
      // Clear auth data on failure
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: (() => {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch {
        return null;
      }
    })(),
    permissions: (() => {
      try {
        const permissions = localStorage.getItem('permissions');
        return permissions ? JSON.parse(permissions) : [];
      } catch {
        return [];
      }
    })(),
    loading: false,
    error: null,
    refreshing: false,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.permissions = [];
      state.error = null;
      state.refreshing = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    loadUserFromStorage: (state) => {
      try {
        const user = localStorage.getItem('user');
        const permissions = localStorage.getItem('permissions');
        if (user) state.user = JSON.parse(user);
        if (permissions) state.permissions = JSON.parse(permissions);
        else if (state.user?.permissions) state.permissions = state.user.permissions;
      } catch {
        state.user = null;
        state.permissions = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.user = action.payload.user;
        
        // Set permissions from either payload or user object
        const permissions = action.payload.permissions || action.payload.user?.permissions || [];
        state.permissions = permissions;

        localStorage.setItem('token', action.payload.access);
        localStorage.setItem('refreshToken', action.payload.refresh);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('permissions', JSON.stringify(permissions));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshAccessToken.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.refreshing = false;
        state.token = action.payload.access;
        state.refreshToken = localStorage.getItem('refreshToken');
        state.user = action.payload.user || JSON.parse(localStorage.getItem('user') || 'null');
        state.permissions = action.payload.permissions || 
                           JSON.parse(localStorage.getItem('permissions') || '[]');
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.permissions = [];
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
      });
  },
});

export const { logout, clearError, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;