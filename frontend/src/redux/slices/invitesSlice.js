// src/redux/slices/invitesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch all invites
export const fetchFreeInvites = createAsyncThunk(
    'invites/fetchFreeInvites',
    async () => {
      const token = localStorage.getItem('token');  // Get token from localStorage
      const response = await axios.get('http://127.0.0.1:8000/invites/api/free-invites/', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '', // Add token if it exists
        },
      });
      return response.data; // Assuming the API returns an array or object
    }
  );

// Add new invite
export const addInvite = createAsyncThunk(
  'invites/addInvite',
  async (inviteData, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/invites/api/free-invites/add/',
        inviteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Invite added successfully:', response.data); // Log success message
      return response.data;
    } catch (error) {
      console.error('Error adding invite:', error.response?.data || error.message); // Log error details
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
        `http://127.0.0.1:8000/invites/api/free-invites/${inviteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Fetched invite:', response.data); // Log the fetched invite data
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
        `http://127.0.0.1:8000/invites/api/free-invites/${inviteId}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Invite with ID ${inviteId} deleted successfully.`); // Log success message
      return inviteId;
    } catch (error) {
      console.error(`Error deleting invite with ID ${inviteId}:`, error.response?.data || error.message); // Log error details
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
        `http://127.0.0.1:8000/invites/api/free-invites/${inviteId}/edit/`,
        inviteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Invite with ID ${inviteId} updated successfully:`, response.data); // Log success message
      return response.data;
    } catch (error) {
      console.error(`Error updating invite with ID ${inviteId}:`, error.response?.data || error.message); // Log error details
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Mark invite as used (similar to markTicketAsUsed)
export const markInviteAsUsed = createAsyncThunk(
  'invites/markInviteAsUsed',
  async ({ inviteId, used_by }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/invites/api/free-invites/${inviteId}/mark-used/`,
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
    invites: [],
    currentInvite: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
    .addCase(fetchFreeInvites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFreeInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.invites = action.payload;
      })
      .addCase(fetchFreeInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.invites.push(action.payload);
      })
      .addCase(addInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
      .addCase(deleteInviteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInviteById.fulfilled, (state, action) => {
        state.loading = false;
        state.invites = state.invites.filter(
          (invite) => invite.id !== action.payload
        );
      })
      .addCase(deleteInviteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editInviteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editInviteById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.invites.findIndex(
          (invite) => invite.id === action.payload.id
        );
        if (index !== -1) {
          state.invites[index] = action.payload;
        }
      })
      .addCase(editInviteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markInviteAsUsed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markInviteAsUsed.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.invites.findIndex(
          (invite) => invite.id === action.payload.id
        );
        if (index !== -1) {
          state.invites[index] = {
            ...state.invites[index],
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