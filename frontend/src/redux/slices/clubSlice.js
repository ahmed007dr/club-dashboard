import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

const token = localStorage.getItem('token');

export const fetchClubs = createAsyncThunk('clubs/fetchClubs', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/core/api/club/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Make sure token is included
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || "Failed to fetch clubs.");
    }

    const data = await response.json();

    // Normalize the response to always be an array
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return rejectWithValue(error.message || "An unexpected error occurred.");
  }
});


// Edit club
export const editClub = createAsyncThunk('clubs/editClub', async ({ id, updatedClub }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/core/api/club/edit/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedClub),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || "Failed to edit club.");
    }

    const data = await response.json();
    return { id, updatedClub: data };
  } catch (error) {
    console.error("Error editing club:", error);
    return rejectWithValue(error.message || "An unexpected error occurred.");
  }
});

const clubSlice = createSlice({
  name: 'clubSlice',
  initialState: {
    items: [], // List of clubs
    isLoading: true,
    selectedClub: null, // To store the selected club
    error: null, // To store errors
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClubs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchClubs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClubs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(editClub.fulfilled, (state, action) => {
        const { id, updatedClub } = action.payload;
        const index = state.items.findIndex(club => club.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedClub };
        }
      })
      .addCase(editClub.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export default clubSlice;