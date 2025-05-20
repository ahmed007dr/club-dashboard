import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

// Fetch staff
export const fetchStaff = createAsyncThunk(
  "staff/fetchStaff",
  async (
    { page = 1, club = "", staff = "", date_min = "", date_max = "" },
    { rejectWithValue }
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return rejectWithValue("Authentication token missing");

    try {
      const url = new URL(`${BASE_URL}/staff/api/shifts/`);
      url.searchParams.append("page", page);
      if (club) url.searchParams.append("club_name", club); 
      if (staff) url.searchParams.append("staff_search", staff); 
      if (date_min) url.searchParams.append("date_min", date_min);
      if (date_max) url.searchParams.append("date_max", date_max);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData.message || "Failed to fetch shifts");
      }
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add staff
export const addStaff = createAsyncThunk('staff/addStaff', async (newStaff, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        console.log('Attempting to add staff shift with data:', newStaff);
        
        const res = await fetch(`${BASE_URL}/staff/api/shifts/add/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStaff),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Failed to add staff shift. Server responded with:', data);
            return rejectWithValue(data);
        }

        console.log('Successfully added staff shift:', data);
        return data;
    } catch (error) {
        console.error('Error while adding staff shift:', error);
        return rejectWithValue(error.response ? error.response.data : error.message);
    }
});

// Edit staff
export const editStaff = createAsyncThunk('staff/editStaff', async ({ id, updatedStaff }) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/staff/api/shifts/${id}/edit/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStaff),
    });
    const data = await res.json();
    return { id, updatedStaff: data };
});

// Delete staff
export const deleteStaff = createAsyncThunk('staff/deleteStaff', async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${BASE_URL}/staff/api/shifts/${id}/delete/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return id;
});

// Get staff by ID
export const getStaffById = createAsyncThunk('staff/getStaffById', async (id) => {
    const token = localStorage.getItem('token');
    
    console.log("Fetching staff data for ID:", id); // Debugging line

    try {
        const res = await fetch(`${BASE_URL}/staff/api/staff/${id}/shifts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        // Check if response is OK
        if (!res.ok) {
            if (res.status === 404) {
                console.log("Staff not found (404).");
                throw new Error("Staff not found.");
            }
            console.log("Failed to fetch staff by ID, status:", res.status);
            throw new Error("Failed to fetch staff by ID.");
        }

        const data = await res.json();
        console.log("Fetched staff data:", data);  // ✅ Console log added

        return data; // Returning the staff data
    } catch (error) {
        console.log("Error occurred during staff data fetch:", error.message);
        throw error; // Rethrow the error for Redux to handle
    }
});



// Staff slice
const staffSlice = createSlice({
  name: "staff",
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: { count: 0, next: null, previous: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addStaff
      .addCase(addStaff.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      // editStaff
      .addCase(editStaff.fulfilled, (state, action) => {
        const { id, updatedStaff } = action.payload;
        const index = state.items.findIndex((staff) => staff.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedStaff };
        }
      })

      // deleteStaff
      .addCase(deleteStaff.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((staff) => staff.id !== id);
      })

      .addCase(getStaffById.fulfilled, (state, action) => {
        console.log("Staff data fetched successfully:", action.payload); // Log the payload here
        state.user = action.payload;
      })
      .addCase(getStaffById.rejected, (state, action) => {
        console.log("Error fetching staff data:", action.error); // Log if there's an error
      });
  },
});

export default staffSlice;
