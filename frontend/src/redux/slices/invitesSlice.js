import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

// Fetch all free invites with pagination and filters
export const fetchFreeInvites = createAsyncThunk(
  'invites/fetchFreeInvites',
  async (params = {}, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${BASE_URL}invites/api/free-invites/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: params.page || 1,
          page_size: params.page_size || 20,
          club: params.club,
          guest_name: params.guest_name,
          status: params.status,
          date: params.date,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch invites');
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
        `${BASE_URL}invites/api/free-invites/add/`,
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
        `${BASE_URL}invites/api/free-invites/${inviteId}/`,
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

// Delete invite
export const deleteInviteById = createAsyncThunk(
  'invites/deleteInviteById',
  async (inviteId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${BASE_URL}invites/api/free-invites/${inviteId}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
        `${BASE_URL}invites/api/free-invites/${inviteId}/edit/`,
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
  async (inviteId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${BASE_URL}invites/api/free-invites/${inviteId}/mark-used/`,
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
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch remaining invites for a member
export const fetchRemainingInvites = createAsyncThunk(
  'invites/fetchRemainingInvites',
  async (memberId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${BASE_URL}invites/api/free-invites/remaining/${memberId}/`,
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

// Search member by RFID code
export const searchMemberByRfid = createAsyncThunk(
  'invites/searchMemberByRfid',
  async (rfidCode, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      // Step 1: Search for member by RFID
      const memberResponse = await axios.get(
        `${BASE_URL}api/members/search/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { q: rfidCode },
        }
      );

      if (!memberResponse.data.results || memberResponse.data.results.length === 0) {
        return rejectWithValue({ error: 'لم يتم العثور على عضو بهذا الـ RFID' });
      }

      const member = memberResponse.data.results[0];
      // Step 2: Fetch remaining invites for the member
      const invitesResponse = await axios.get(
        `${BASE_URL}invites/api/free-invites/remaining/${member.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        member: member,
        subscriptions: invitesResponse.data.remaining_invites,
        member_id: member.id,
        member_name: member.name,
        membership_number: member.membership_number,
      };
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
      previous: null,
    },
    currentInvite: null,
    remainingInvites: null,
    memberData: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMemberData: (state) => {
      state.memberData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Invites
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
      // Add Invite
      .addCase(addInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.invites.results.unshift(action.payload);
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
        state.invites.results = state.invites.results.filter(
          (invite) => invite.id !== action.payload
        );
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
        const index = state.invites.results.findIndex(
          (invite) => invite.id === action.payload.id
        );
        if (index !== -1) {
          state.invites.results[index] = action.payload;
        }
        state.currentInvite = action.payload;
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
        const index = state.invites.results.findIndex(
          (invite) => invite.id === action.payload.id
        );
        if (index !== -1) {
          state.invites.results[index] = action.payload;
        }
      })
      .addCase(markInviteAsUsed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Remaining Invites
      .addCase(fetchRemainingInvites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRemainingInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.remainingInvites = action.payload;
      })
      .addCase(fetchRemainingInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search Member by RFID
      .addCase(searchMemberByRfid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMemberByRfid.fulfilled, (state, action) => {
        state.loading = false;
        state.memberData = action.payload;
      })
      .addCase(searchMemberByRfid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMemberData } = invitesSlice.actions;
export default invitesSlice.reducer;