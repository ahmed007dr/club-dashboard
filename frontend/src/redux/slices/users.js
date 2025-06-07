import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../../config/api";

// Fetch users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ page = 1, search = "" }, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    if (!token) return rejectWithValue("Authentication token missing");

    try {
      const url = new URL(`${BASE_URL}/accounts/api/users/`);
      url.searchParams.append("page", page);
      if (search) url.searchParams.append("search", search);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.status === 200) {
        const errorData = await res.json();
        return rejectWithValue(errorData.message || "Failed to fetch users");
      }
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add user
export const addUser = createAsyncThunk(
  "users/addUser",
  async (newUser, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/accounts/api/users/create/`, newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, updatedUser }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BASE_URL}/accounts/api/users/${id}/update/`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: { count: 0, next: null, previous: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.items.findIndex((user) => user.id === updatedUser.id);
        if (index !== -1) {
          state.items[index] = updatedUser;
        }
      });
  },
});

export default usersSlice.reducer;