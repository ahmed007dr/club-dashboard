import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';

// Fetch tickets with pagination and optional filters
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async ({ page, page_size, club, ticket_type, issue_date }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        page_size,
        ...(ticket_type && { ticket_type }),
        ...(issue_date && { issue_date }),
      }).toString();
      const response = await fetch(`${BASE_URL}tickets/api/tickets/?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch tickets: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch ticket types
export const fetchTicketTypes = createAsyncThunk(
  'tickets/fetchTicketTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}tickets/api/ticket-types/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ticket types: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new ticket
export const addTicket = createAsyncThunk(
  'tickets/addTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
//       console.log('Token for addTicket:', token);
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate ticketData
      if (!ticketData.ticket_type || isNaN(ticketData.ticket_type)) {
        console.error('Invalid ticket_type:', ticketData.ticket_type);
        return rejectWithValue({ ticket_type: ['This field may not be null or invalid.'] });
      }

      // Prepare payload with correct field name (ticket_type instead of ticket_type_id)
      const payload = {
        ...ticketData,
        ticket_type: ticketData.ticket_type, // Ensure ticket_type is used
        notes: ticketData.notes || '', // Ensure notes is always included
      };
      delete payload.ticket_type_id; // Remove ticket_type_id if present

//       console.log('Sending ticketData:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${BASE_URL}tickets/api/tickets/add/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
//         console.log('addTicket error response:', JSON.stringify(errorData, null, 2));
        return rejectWithValue(errorData);
      }

      const data = await response.json();
//       console.log('addTicket success response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('addTicket error:', error.message);
      return rejectWithValue({ error: error.message });
    }
  }
);

// Add a new ticket type
export const addTicketType = createAsyncThunk(
  'tickets/addTicketType',
  async (ticketTypeData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}tickets/api/ticket-types/add/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketTypeData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add ticket type: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Edit an existing ticket
export const editTicketById = createAsyncThunk(
  'tickets/editTicketById',
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}tickets/api/tickets/${ticketId}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to edit ticket: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete a ticket
export const deleteTicketById = createAsyncThunk(
  'tickets/deleteTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}tickets/api/tickets/${ticketId}/delete/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ticket: ${response.status}`);
      }
      return ticketId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    tickets: { results: [], count: 0, next: null, previous: null },
    ticketTypes: [],
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
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Ticket Types
      .addCase(fetchTicketTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketTypes = action.payload.results || action.payload;
      })
      .addCase(fetchTicketTypes.rejected, (state, action) => {
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
        // Since addTicket returns an array of created tickets, add them to the start
        state.tickets.results = [...action.payload, ...state.tickets.results];
        state.tickets.count += action.payload.length;
      })
      .addCase(addTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Ticket Type
      .addCase(addTicketType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicketType.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketTypes.push(action.payload);
      })
      .addCase(addTicketType.rejected, (state, action) => {
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
        const index = state.tickets.results.findIndex((ticket) => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets.results[index] = action.payload;
        }
      })
      .addCase(editTicketById.rejected, (state, action) => {
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
        state.tickets.results = state.tickets.results.filter((ticket) => ticket.id !== action.payload);
        state.tickets.count -= 1;
      })
      .addCase(deleteTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ticketsSlice.reducer;