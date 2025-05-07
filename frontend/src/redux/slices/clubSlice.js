import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchClubs = createAsyncThunk('club/fetchClubs', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/core/api/club/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch clubs');
  }
});

export const editClub = createAsyncThunk('club/editClub', async ({ id, updatedClub }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${BASE_URL}/core/api/club/edit/`, updatedClub, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return { id, updatedClub: response.data };
  } catch (error) {
    console.error("Error editing club:", error);
    return rejectWithValue(error.response?.data?.message || 'Failed to edit club');
  }
});

const clubSlice = createSlice({
  name: 'club',
  initialState: {
    items: [],
    selectedClub: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedClub: (state, action) => {
      state.selectedClub = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClubs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClubs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        if (!state.selectedClub && action.payload.length > 0) {
          state.selectedClub = action.payload[0];
        }
      })
      .addCase(fetchClubs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editClub.fulfilled, (state, action) => {
        const { id, updatedClub } = action.payload;
        const index = state.items.findIndex(club => club.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedClub };
        }
      })
      .addCase(editClub.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setSelectedClub, clearError } = clubSlice.actions;
export default clubSlice.reducer;