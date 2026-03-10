import axios from 'axios';

const api = axios.create({
  baseURL: 'http://13.48.25.209:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;