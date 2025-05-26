// src/api/payroll.js
import axios from 'axios';
import BASE_URL from '../config/api';

export const fetchPayrollPeriods = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${BASE_URL}/payroll/periods/`, {
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    throw error;
  }
};

export const createPayrollPeriod = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(`${BASE_URL}/payroll/periods/create/`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating payroll period:', error);
    throw error;
  }
};

export const fetchCurrentPeriod = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${BASE_URL}/payroll/current-period/`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching current period:', error);
    throw error;
  }
};

export const fetchPayrollReport = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${BASE_URL}/payroll/report/`, {
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll report:', error);
    throw error;
  }
};


export const createPayroll = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(`${BASE_URL}/payroll/payrolls/create/`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating payroll:', error);
    throw error;
  }
};

export const createDeduction = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(`${BASE_URL}/payroll/deductions/create/`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating deduction:', error);
    throw error;
  }
};

export const finalizePayroll = async (periodId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(
      `${BASE_URL}/payroll/finalize/`,
      null,
      { headers, params: { period_id: periodId } }
    );
    return response.data;
  } catch (error) {
    console.error('Error finalizing payroll:', error);
    throw error;
  }
};

export const fetchPayrollDetails = async (payrollId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${BASE_URL}/payroll/payrolls/${payrollId}/`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      throw error;
    }
  };

