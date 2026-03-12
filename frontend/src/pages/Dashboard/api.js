import axios from 'axios';

const api = axios.create({
  baseURL: 'http://16.170.248.196:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;