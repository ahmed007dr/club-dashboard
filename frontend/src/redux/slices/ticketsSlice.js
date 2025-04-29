// src/redux/slices/ticketsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

// Create the async thunk for fetching tickets with token authorization
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (_, thunkAPI) => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    try {
      const response = await axios.get(`${BASE_URL}/tickets/api/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the request header
        },
      });
      return response.data; // return the response data to the fulfilled action
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'An error occurred'); // handle error response
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
        console.log('Ticket added successfully:', response.data); // Log success message
        return response.data; // Return the added ticket data
      } catch (error) {
        console.error('Error adding ticket:', error.response?.data || error.message); // Log error details
        return rejectWithValue(error.response?.data || error.message); // Return error message if fails
      }
    }
  );

  // Define the async thunk to fetch a ticket by ID
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
        return response.data; // Return the fetched ticket data
      } catch (error) {
        return rejectWithValue(error.response?.data || error.message); // Return error message if fails
      }
    }
  );

  // Delete Ticket
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
        console.log(`Ticket with ID ${ticketId} deleted successfully.`); // Log success message
        return ticketId; // Return the deleted ticket ID
      } catch (error) {
        console.error(`Error deleting ticket with ID ${ticketId}:`, error.response?.data || error.message); // Log error details
        return rejectWithValue(error.response?.data || error.message);
      }
    }
  );
  
  // Edit Ticket
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
        console.log(`Ticket with ID ${ticketId} updated successfully:`, response.data); // Log success message
        return response.data; // Return the updated ticket data
      } catch (error) {
        console.error(`Error updating ticket with ID ${ticketId}:`, error.response?.data || error.message); // Log error details
        return rejectWithValue(error.response?.data || error.message);
      }
    }
  );
  
  // Mark Ticket as Used
  export const markTicketAsUsed = createAsyncThunk(
    'tickets/markTicketAsUsed',
    async ({ ticketId, used_by }, { rejectWithValue }) => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.post(
          `${BASE_URL}/tickets/api/tickets/${ticketId}/mark-used/`,
          { used_by }, // Send the used_by in the request body
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`Ticket ${ticketId} marked as used by ${used_by}:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`Error marking ticket ${ticketId} as used:`, error.response?.data || error.message);
        return rejectWithValue(error.response?.data || error.message);
      }
    }
  );
  

// Create the tickets slice
const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    tickets: [],
    currentTicket: null, 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      .addCase(addTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.push(action.payload); // Add the new ticket to the list
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
        state.currentTicket = action.payload; // Store the fetched ticket data
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete ticket
      .addCase(deleteTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.filter(
          (ticket) => ticket.id !== action.payload
        ); // Remove the deleted ticket from the list
      })
      .addCase(deleteTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit ticket
      .addCase(editTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editTicketById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the ticket in the list
        const index = state.tickets.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(editTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark ticket as used
      .addCase(markTicketAsUsed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTicketAsUsed.fulfilled, (state, action) => {
        state.loading = false;
        
        // Find the index of the updated ticket
        const index = state.tickets.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        
        if (index !== -1) {
          // Update both used status and used_by fields
          state.tickets[index] = {
            ...state.tickets[index], // Keep existing properties
            used: action.payload.used, // Update used status
            used_by: action.payload.used_by, // Update used_by
            // Include any other fields that might have changed
            ...action.payload
          };
        }
      })
      .addCase(markTicketAsUsed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default ticketsSlice.reducer;
