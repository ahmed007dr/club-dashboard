import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchTicketTypes = createAsyncThunk(
  'tickets/fetchTicketTypes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.get(`${BASE_URL}/tickets/api/ticket-types/?price__gt=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.results || [];
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch ticket types';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.get(`${BASE_URL}/tickets/api/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: params.page,
          page_size: params.page_size,
          club: params.club,
          ticket_type: params.ticket_type,
          issue_date: params.issue_date,
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch tickets';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addTicket = createAsyncThunk(
  'tickets/addTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
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
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add ticket';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
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
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch ticket';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTicketById = createAsyncThunk(
  'tickets/deleteTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
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
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete ticket';
      return rejectWithValue(errorMessage);
    }
  }
);

export const editTicketById = createAsyncThunk(
  'tickets/editTicketById',
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.put(
        `${BASE_URL}/tickets/api/tickets/${ticketId}/`,
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
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to edit ticket';
      return rejectWithValue(errorMessage);
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
      previous: null,
    },
    ticketTypes: [],
    currentTicket: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTicketTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketTypes = action.payload;
      })
      .addCase(fetchTicketTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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
          previous: action.payload.previous,
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.results.unshift(action.payload);
        state.tickets.count += 1;
      })
      .addCase(addTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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

      .addCase(deleteTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.results = state.tickets.results.filter(
          (ticket) => ticket.id !== action.payload
        );
        state.tickets.count -= 1;
      })
      .addCase(deleteTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(editTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editTicketById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tickets.results.findIndex(
          (ticket) => ticket.id === action.payload.ticketId
        );
        if (index !== -1) {
          state.tickets.results[index] = action.payload;
        }
      })
      .addCase(editTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ticketsSlice.reducer;