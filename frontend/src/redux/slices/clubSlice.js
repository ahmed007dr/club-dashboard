import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const token = localStorage.getItem('token'); 

// Fetch clubs
export const fetchClubs = createAsyncThunk('clubs/fetchClubs', async () => {
    const res = await fetch("http://localhost:3000/clubs", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data;
});
export const editClub = createAsyncThunk('clubs/editClub', async ({ id, updatedClub }) => {
    // console.log("Updated club data:", id, updatedClub); // Log the updated club data
    const res = await fetch(`http://localhost:3000/clubs/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClub),
    });
    const data = await res.json();
    return { id, updatedClub: data };
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
            .addCase(editClub.fulfilled, (state, action) => {
                const { id, updatedClub } = action.payload;
                const index = state.items.findIndex(club => club.id === id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...updatedClub };
                }
            });
    },
});

export default clubSlice;