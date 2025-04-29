import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

const token = localStorage.getItem('token'); 
// Fetch users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    const res = await fetch("${BASE_URL}/members/api/members/", {
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
    const res = await fetch("${BASE_URL}/members/api/members/create/", {
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
    const res = await fetch(`${BASE_URL}/members/api/members/${id}/update/`, {
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
    await fetch(`${BASE_URL}/members/api/members/${id}/delete/`, { 
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' }
    });
    return id;
});

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (userId, { rejectWithValue }) => {
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
  
        // Check if the response is successful
        if (!res.ok) {
          if (res.status === 401) {
            return rejectWithValue("Unauthorized. Please log in again.");
          } else if (res.status === 404) {
            return rejectWithValue("User not found.");
          } else if (res.status === 500) {
            return rejectWithValue("Internal Server Error. Please try again later.");
          }
        }
  
        // Parse and return the user data
        const data = await res.json();
        return data;
  
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        return rejectWithValue("An unexpected error occurred. Please try again later.");
      }
    }
  );

  export const searchMember = createAsyncThunk(
    'users/searchMember',
    async (query, { rejectWithValue }) => {
        if (!token) {
            return rejectWithValue("Authentication token is missing. Please log in again.");
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/members/api/members/search/?q=${query}`, {
              
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
              if (Array.isArray(state.items)) {
                  const index = state.items.findIndex(user => user.id === id);
                  if (index !== -1) {
                      state.items.splice(index, 1); // Remove the user from the array
                  }
              }
            }).addCase(fetchUserById.fulfilled, (state, action) => {
                state.user = action.payload; // Store the fetched user data
                state.isloading = false;
              })
              .addCase(fetchUserById.pending, (state) => {
                state.isloading = true;
                state.error = null; // Clear any previous errors
              })
              .addCase(fetchUserById.rejected, (state, action) => {
                state.isloading = false;
                state.error = action.payload; // Store the error message
              }).addCase(searchMember.fulfilled, (state, action) => {
                state.items = action.payload; // Update the state with the search results
                state.isloading = false;
            })
            .addCase(searchMember.pending, (state) => {
                state.isloading = true;
                state.error = null; // Clear any previous errors
            })
            .addCase(searchMember.rejected, (state, action) => {
                state.isloading = false;
                state.error = action.payload; // Store the error message
            });
          
    },
});

export default userSlice
