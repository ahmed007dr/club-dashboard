import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem('token'); 
// Fetch users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    const res = await fetch("http://127.0.0.1:8000/members/api/members/", {
        method: 'GET',
        headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json' },
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
// Add user
export const addMember = createAsyncThunk('users/addUser', async (newUser) => {
    const res = await fetch("http://127.0.0.1:8000/members/api/members/create/", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
    });
    const data = await res.json();
    return data;
});

// Edit user
export const editMember = createAsyncThunk('users/editUser', async ({ id, updatedUser }) => {
    console.log("Updated user data:",id, updatedUser); // Log the updated user data
    const res = await fetch(`http://127.0.0.1:8000/members/api/members/${id}/update/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
    });
    const data = await res.json();
    return { id, updatedUser: data };
});

// Delete user
export const deleteMember = createAsyncThunk('users/deleteUser', async (id) => {
    await fetch(`http://127.0.0.1:8000/members/api/members/${id}/delete/`, { 
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' }
    });
    return id;
});



// User slice
const userSlice = createSlice({
    name: 'userslice',
    initialState: {
        items: [],
        isloading: true,
        user: null, // To store logged-in user
        error: null, // To store login/register errors
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isloading = false;
            })
            .addCase(fetchUsers.pending, (state) => {
                state.isloading = true;
            })
            .addCase(addMember.fulfilled, (state, action) => {
                if (Array.isArray(state.items)) {
                    state.items.push(action.payload);
                }
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
            .addCase(deleteMember.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(user => user.id !== id);
            })
          
    },
});

export default userSlice
