import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchFreeInvites = createAsyncThunk(
  'invites/fetchFreeInvites',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
      const response = await axios.get(`${BASE_URL}/invites/api/free-invites/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { club_id: clubId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addInvite = createAsyncThunk(
  'invites/addInvite',
  async (inviteData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchInviteById = createAsyncThunk(
  'invites/fetchInviteById',
  async (inviteId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteInviteById = createAsyncThunk(
  'invites/deleteInviteById',
  async (inviteId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const editInviteById = createAsyncThunk(
  'invites/editInviteById',
  async ({ inviteId, inviteData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markInviteAsUsed = createAsyncThunk(
  'invites/markInviteAsUsed',
  async ({ inviteId, used_by }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
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
      return rejectWithValue(error.response?.data?.message || error.message);
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
        state.error = null;
      })
      .addCase(fetchFreeInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.invites = action.payload;
      })
      .addCase(fetchFreeInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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