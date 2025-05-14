import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

// Fetch users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/members/api/members/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
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

// Add user
export const addMember = createAsyncThunk('users/addUser', async (newUser, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${BASE_URL}/members/api/members/create/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
        });
        if (!res.ok) {
            const errorData = await res.json();
            return rejectWithValue(errorData.message || 'Failed to add member');
        }
        const data = await res.json();
        console.log('Add member response data:', data); // Log the response data
        return data;
    } catch (error) {
        console.error('Error in addMember:', error);
        return rejectWithValue('An unexpected error occurred');
    }
});

// Edit user
export const editMember = createAsyncThunk('users/editUser', async ({ id, updatedUser }) => {
    const token = localStorage.getItem('token');
    console.log("Updated user data:", id, updatedUser);
    const res = await fetch(`${BASE_URL}/members/api/members/${id}/update/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
    });
    const data = await res.json();
    return { id, updatedUser: data };
});

// Delete user
export const deleteMember = createAsyncThunk('users/deleteUser', async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${BASE_URL}/members/api/members/${id}/delete/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return id;
});

// Fetch user by ID
export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (userId, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return rejectWithValue("Authentication token is missing. Please log in again.");
        }

        try {
            const res = await fetch(`${BASE_URL}/members/api/members/${userId}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    return rejectWithValue("Unauthorized. Please log in again.");
                } else if (res.status === 404) {
                    return rejectWithValue("User not found.");
                } else if (res.status === 500) {
                    return rejectWithValue("Internal Server Error. Please try again later.");
                }
            }

            const data = await res.json();
            return data;

        } catch (error) {
            console.error("Error fetching user by ID:", error);
            return rejectWithValue("An unexpected error occurred. Please try again later.");
        }
    }
);

// Search members
export const searchMember = createAsyncThunk(
    'users/searchMember',
    async (query, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return rejectWithValue("Authentication token is missing. Please log in again.");
        }

        try {
            const res = await fetch(`${BASE_URL}/members/api/members/search/?q=${query}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    return rejectWithValue("Unauthorized. Please log in again.");
                } else if (res.status === 404) {
                    return rejectWithValue("No members found matching the search query.");
                } else if (res.status === 500) {
                    return rejectWithValue("Internal Server Error. Please try again later.");
                }
            }

            const data = await res.json();
            return data;

        } catch (error) {
            console.error("Error searching for members:", error);
            return rejectWithValue("An unexpected error occurred. Please try again later.");
        }
    }
);

// User slice
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
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isloading = false;
            })
            .addCase(fetchUsers.pending, (state) => {
                state.isloading = true;
            })
      .addCase(addMember.fulfilled, (state, action) => {
  state.isloading = false;
  if (Array.isArray(state.items)) {
    state.items.unshift({ ...action.payload, club_name: action.payload.club?.name || '' }); // Ensure all fields are included
  } else {
    state.items = [{ ...action.payload, club_name: action.payload.club?.name || '' }];
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
                if (Array.isArray(state.items)) {
                    const index = state.items.findIndex(user => user.id === id);
                    if (index !== -1) {
                        state.items.splice(index, 1);
                    }
                }
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isloading = false;
            })
            .addCase(fetchUserById.pending, (state) => {
                state.isloading = true;
                state.error = null;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.isloading = false;
                state.error = action.payload;
            })
            .addCase(searchMember.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isloading = false;
            })
            .addCase(searchMember.pending, (state) => {
                state.isloading = true;
                state.error = null;
            })
            .addCase(searchMember.rejected, (state, action) => {
                state.isloading = false;
                state.error = action.payload;
            });
    },
});

export default userSlice;

