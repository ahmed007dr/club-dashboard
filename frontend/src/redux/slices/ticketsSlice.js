// src/redux/slices/ticketsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

// Create the async thunk for fetching tickets with pagination
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params, thunkAPI) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${BASE_URL}/tickets/api/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: params.page,
          page_size: params.page_size,
          club: params.club,
          buyer_name: params.buyer_name,
          ticket_type: params.ticket_type,
          used: params.used
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'An error occurred');
    }
  }
);

export const addTicket = createAsyncThunk(
  'tickets/addTicket',
  async (ticketData, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post(
        `${BASE_URL}/tickets/api/tickets/add/`,
        ticketData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
  
    try {
      const response = await axios.get(
        `${BASE_URL}/tickets/api/tickets/${ticketId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTicketById = createAsyncThunk(
  'tickets/deleteTicketById',
  async (ticketId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${BASE_URL}/tickets/api/tickets/${ticketId}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return ticketId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const editTicketById = createAsyncThunk(
  'tickets/editTicketById',
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `${BASE_URL}/tickets/api/tickets/${ticketId}/edit/`,
        ticketData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markTicketAsUsed = createAsyncThunk(
  'tickets/markTicketAsUsed',
  async ({ ticketId, used_by }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${BASE_URL}/tickets/api/tickets/${ticketId}/mark-used/`,
        { used_by },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    tickets: {
      results: [],
      count: 0,
      next: null,
      previous: null
    },
    currentTicket: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = {
          results: action.payload.results,
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Ticket
      .addCase(addTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicket.fulfilled, (state, action) => {
        state.loading = false;
        // Add new ticket to beginning of results
        state.tickets.results.unshift(action.payload);
        // Increment total count
        state.tickets.count += 1;
      })
      .addCase(addTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Ticket By ID
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Ticket
      .addCase(deleteTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicketById.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted ticket from results
        state.tickets.results = state.tickets.results.filter(
          (ticket) => ticket.id !== action.payload
        );
        // Decrement total count
        state.tickets.count -= 1;
      })
      .addCase(deleteTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Edit Ticket
      .addCase(editTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editTicketById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the ticket in results array
        const index = state.tickets.results.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (index !== -1) {
          state.tickets.results[index] = action.payload;
        }
      })
      .addCase(editTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark Ticket as Used
      .addCase(markTicketAsUsed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTicketAsUsed.fulfilled, (state, action) => {
        state.loading = false;
        // Find and update the ticket in results array
        const index = state.tickets.results.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        
        if (index !== -1) {
          state.tickets.results[index] = {
            ...state.tickets.results[index],
            used: action.payload.used,
            used_by: action.payload.used_by,
            ...action.payload
          };
        }
      })
      .addCase(markTicketAsUsed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ticketsSlice.reducer;