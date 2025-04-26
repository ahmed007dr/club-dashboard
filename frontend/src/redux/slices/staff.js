import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem('token');

// Fetch staff
export const fetchStaff = createAsyncThunk('staff/fetchStaff', async () => {
    const res = await fetch("http://127.0.0.1:8000/staff/api/shifts/", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
        } else if (res.status === 500) {
            throw new Error("Internal Server Error. Please try again later.");
        }
    }
    const data = await res.json();
    return data;
});

// Add staff
export const addStaff = createAsyncThunk('staff/addStaff', async (newStaff) => {
    const res = await fetch("http://127.0.0.1:8000/staff/api/shifts/create/", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStaff),
    });
    const data = await res.json();
    return data;
});

// Edit staff
export const editStaff = createAsyncThunk('staff/editStaff', async ({ id, updatedStaff }) => {
    console.log("Editing staff with ID:", id, "Updated data:", updatedStaff);
    const res = await fetch(`http://127.0.0.1:8000/staff/api/shifts/${id}/edit/`, {
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
    await fetch(`http://127.0.0.1:8000/staff/api/shifts/${id}/delete/`, {
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
    const res = await fetch(`http://127.0.0.1:8000/staff/api/staff/${id}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error("Staff not found.");
        }
    }
    const data = await res.json();
    return data;
});

// Staff slice
const staffSlice = createSlice({
    name: 'staffslice',
    initialState: {
        items: [],
        isloading: true,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStaff.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isloading = false;
            })
            .addCase(fetchStaff.pending, (state) => {
                state.isloading = true;
            })
            .addCase(addStaff.fulfilled, (state, action) => {
                if (Array.isArray(state.items)) {
                    state.items.push(action.payload);
                }
            })
            .addCase(editStaff.fulfilled, (state, action) => {
                const { id, updatedStaff } = action.payload;
                if (Array.isArray(state.items)) {
                    const index = state.items.findIndex(staff => staff.id === id);
                    if (index !== -1) {
                        state.items[index] = { ...state.items[index], ...updatedStaff };
                    }
                }
            })
            .addCase(deleteStaff.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(staff => staff.id !== id);
            })
            .addCase(getStaffById.fulfilled, (state, action) => {
                state.user = action.payload; // Store the fetched staff by ID
            });
    },
});

export default staffSlice;