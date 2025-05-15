import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import BASE_URL from '../../config/api';

// Fetch paginated members
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1 }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue("Authentication token is missing. Please log in again.");
    }

    try {
      const res = await fetch(`${BASE_URL}/members/api/members/?page=${page}`, {
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
          return rejectWithValue("No members found for this page.");
        } else if (res.status === 500) {
          return rejectWithValue("Internal Server Error. Please try again later.");
        }
        const errorData = await res.json();
        return rejectWithValue(errorData.message || "Failed to fetch members.");
      }

      const data = await res.json();
      return data; // Expect { count, next, previous, results }
    } catch (error) {
      console.error("Error fetching members:", error);
      return rejectWithValue("An unexpected error occurred. Please try again later.");
    }
  }
);

// Add member
export const addMember = createAsyncThunk(
  'users/addUser',
  async (newUser, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue("Authentication token is missing. Please log in again.");
    }

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
      console.log('Add member response data:', data);
      return data;
    } catch (error) {
      console.error('Error in addMember:', error);
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Edit member
export const editMember = createAsyncThunk(
  'users/editUser',
  async ({ id, updatedUser }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue("Authentication token is missing. Please log in again.");
    }

    try {
      console.log("Updated user data:", id, updatedUser);
      const res = await fetch(`${BASE_URL}/members/api/members/${id}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData.message || 'Failed to update member');
      }

      const data = await res.json();
      return { id, updatedUser: data };
    } catch (error) {
      console.error('Error in editMember:', error);
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Delete member
export const deleteMember = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue("Authentication token is missing. Please log in again.");
    }

    try {
      const res = await fetch(`${BASE_URL}/members/api/members/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData.message || 'Failed to delete member');
      }

      return id;
    } catch (error) {
      console.error('Error in deleteMember:', error);
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

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

// Search members with pagination
export const searchMember = createAsyncThunk(
  'users/searchMember',
  async ({ query, page = 1 }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue("Authentication token is missing. Please log in again.");
    }

    try {
      const res = await fetch(
        `${BASE_URL}/members/api/members/search/?q=${encodeURIComponent(query)}&page=${page}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          return rejectWithValue("Unauthorized. Please log in again.");
        } else if (res.status === 404) {
          return rejectWithValue("No members found matching the search query.");
        } else if (res.status === 500) {
          return rejectWithValue("Internal Server Error. Please try again later.");
        }
        const errorData = await res.json();
        return rejectWithValue(errorData.message || "Failed to search members.");
      }

      const data = await res.json();
      return data; // Expect { count, next, previous, results }
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
    pagination: { count: 0, next: null, previous: null }, // Added for pagination metadata
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isloading = false;
        state.items = action.payload.results; // Store results in items
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      // Add Member
      .addCase(addMember.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.isloading = false;
        state.items.unshift(action.payload); // Add new member to the beginning
        state.pagination.count += 1;
      })
      .addCase(addMember.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      // Edit Member
      .addCase(editMember.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(editMember.fulfilled, (state, action) => {
        state.isloading = false;
        const { id, updatedUser } = action.payload;
        const index = state.items.findIndex(user => user.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedUser };
        }
      })
      .addCase(editMember.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      // Delete Member
      .addCase(deleteMember.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        state.isloading = false;
        const id = action.payload;
        state.items = state.items.filter(user => user.id !== id);
        state.pagination.count -= 1;
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      // Fetch User by ID
      .addCase(fetchUserById.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isloading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      })
      // Search Members
      .addCase(searchMember.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(searchMember.fulfilled, (state, action) => {
        state.isloading = false;
        state.items = action.payload.results; // Store results in items
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(searchMember.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice;