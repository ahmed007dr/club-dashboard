import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

// Fetch staff
export const fetchStaff = createAsyncThunk('staff/fetchStaff', async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/staff/api/shifts/`, {
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
        throw new Error("Failed to fetch staff.");
    }
    const data = await res.json();
    return data;
});

// Add staff
export const addStaff = createAsyncThunk('staff/addStaff', async (newStaff) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/staff/api/shifts/create/`, {
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
    const res = await fetch(`${BASE_URL}/staff/api/staff/${id}/`, {
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
        throw new Error("Failed to fetch staff by ID.");
    }
    const data = await res.json();
    return data;
});

// Staff slice
const staffSlice = createSlice({
    name: 'staffslice',
    initialState: {
        items: [],
        user: null,
        isloading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // fetchStaff
            .addCase(fetchStaff.pending, (state) => {
                state.isloading = true;
                state.error = null;
            })
            .addCase(fetchStaff.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isloading = false;
            })
            .addCase(fetchStaff.rejected, (state, action) => {
                state.isloading = false;
                state.error = action.error.message;
            })

            // addStaff
            .addCase(addStaff.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })

            // editStaff
            .addCase(editStaff.fulfilled, (state, action) => {
                const { id, updatedStaff } = action.payload;
                const index = state.items.findIndex(staff => staff.id === id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...updatedStaff };
                }
            })

            // deleteStaff
            .addCase(deleteStaff.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(staff => staff.id !== id);
            })

            // getStaffById
            .addCase(getStaffById.fulfilled, (state, action) => {
                state.user = action.payload;
            });
    },
});

export default staffSlice;
