import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;