import axios from 'axios';

const BASE_URL = "http://127.0.0.1:8000/";

export const fetchSubscriptionReport = async (params = {}, url = null) => {
  const requestUrl = url || `${BASE_URL}/members/api/members/subscription-report/`;
  const response = await axios.get(requestUrl, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    params: url ? {} : params,
  });
  return response.data;
};

export const fetchExportSubscriptionReport = async (params = {}) => {
  const requestUrl = `${BASE_URL}/members/api/members/export-subscription-report/`;
  const response = await axios.get(requestUrl, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    params,
  });
  return response.data;
};

export default BASE_URL;