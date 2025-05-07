import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/members/api/members/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { club_id: clubId },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users.");
    }
  }
);

export const addMember = createAsyncThunk(
  'users/addUser',
  async (newUser, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/members/api/members/create/`, newUser, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add user.");
    }
  }
);

export const editMember = createAsyncThunk(
  'users/editUser',
  async ({ id, updatedUser }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${BASE_URL}/members/api/members/${id}/update/`, updatedUser, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return { id, updatedUser: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to edit user.");
    }
  }
);

export const deleteMember = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${BASE_URL}/members/api/members/${id}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.status !== 204) {
        throw new Error("Failed to delete user.");
      }
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete user.");
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue("Authentication token is missing. Please log in again.");
      }
      const res = await axios.get(`${BASE_URL}/members/api/members/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user.");
    }
  }
);

export const searchMember = createAsyncThunk(
  'users/searchMember',
  async (query, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue("Authentication token is missing. Please log in again.");
      }
      const res = await axios.get(`${BASE_URL}/members/api/members/search/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { q: query },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to search members.");
    }
  }
);

const userSlice = createSlice({
  name: 'userslice',
  initialState: {
    items: [],
    isloading: true,
    user: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isloading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        if (Array.isArray(state.items)) {
          state.items.push(action.payload);
        }
      })
      .addCase(addMember.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(editMember.fulfilled, (state, action) => {
        const { id, updatedUser } = action.payload;
        if (Array.isArray(state.items)) {
          const index = state.items.findIndex(user => user.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updatedUser };
          }
        }
      })
      .addCase(editMember.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        const id = action.payload;
        if (Array.isArray(state.items)) {
          const index = state.items.findIndex(user => user.id === id);
          if (index !== -1) {
            state.items.splice(index, 1);
          }
        }
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isloading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      .addCase(searchMember.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(searchMember.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isloading = false;
      })
      .addCase(searchMember.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice;