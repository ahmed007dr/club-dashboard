// src/redux/slices/invitesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

// Fetch all invites with pagination
export const fetchFreeInvites = createAsyncThunk(
  'invites/fetchFreeInvites',
  async (params = {}, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${BASE_URL}/invites/api/free-invites/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: params.page,
          page_size: params.page_size,
          // Add any other filter params here
          used: params.used,
          // ... other filters
        }
      });
      return response.data; // Should return {count, next, previous, results}
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add new invite
export const addInvite = createAsyncThunk(
  'invites/addInvite',
  async (inviteData, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${BASE_URL}/invites/api/free-invites/add/`,
        inviteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

// Fetch single invite by ID
export const fetchInviteById = createAsyncThunk(
  'invites/fetchInviteById',
  async (inviteId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${BASE_URL}/invites/api/free-invites/${inviteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

// Delete invite
export const deleteInviteById = createAsyncThunk(
  'invites/deleteInviteById',
  async (inviteId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${BASE_URL}/invites/api/free-invites/${inviteId}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return inviteId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Edit invite
export const editInviteById = createAsyncThunk(
  'invites/editInviteById',
  async ({ inviteId, inviteData }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `${BASE_URL}/invites/api/free-invites/${inviteId}/edit/`,
        inviteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

// Mark invite as used
export const markInviteAsUsed = createAsyncThunk(
  'invites/markInviteAsUsed',
  async ({ inviteId, used_by }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${BASE_URL}/invites/api/free-invites/${inviteId}/mark-used/`,
        { used_by },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

const invitesSlice = createSlice({
  name: 'invites',
  initialState: {
    invites: {
      results: [],
      count: 0,
      next: null,
      previous: null
    },
    currentInvite: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Invites
      .addCase(fetchFreeInvites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFreeInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.invites = {
          results: action.payload.results,
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous
        };
      })
      .addCase(fetchFreeInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Invite
      .addCase(addInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInvite.fulfilled, (state, action) => {
        state.loading = false;
        // Add new invite to beginning of results
        state.invites.results.unshift(action.payload);
        // Increment total count
        state.invites.count += 1;
      })
      .addCase(addInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Invite By ID
      .addCase(fetchInviteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInviteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvite = action.payload;
      })
      .addCase(fetchInviteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Invite
      .addCase(deleteInviteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInviteById.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted invite from results
        state.invites.results = state.invites.results.filter(
          (invite) => invite.id !== action.payload
        );
        // Decrement total count
        state.invites.count -= 1;
      })
      .addCase(deleteInviteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Edit Invite
      .addCase(editInviteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editInviteById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the invite in results array
        const index = state.invites.results.findIndex(
          (invite) => invite.id === action.payload.id
        );
        if (index !== -1) {
          state.invites.results[index] = action.payload;
        }
      })
      .addCase(editInviteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark Invite as Used
      .addCase(markInviteAsUsed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markInviteAsUsed.fulfilled, (state, action) => {
        state.loading = false;
        // Find and update the invite in results array
        const index = state.invites.results.findIndex(
          (invite) => invite.id === action.payload.id
        );
        
        if (index !== -1) {
          state.invites.results[index] = {
            ...state.invites.results[index],
            used: action.payload.used,
            used_by: action.payload.used_by,
            ...action.payload
          };
        }
      })
      .addCase(markInviteAsUsed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default invitesSlice.reducer;