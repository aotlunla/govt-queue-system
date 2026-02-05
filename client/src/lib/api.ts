// src/lib/api.ts
import axios from 'axios';
import { io } from 'socket.io-client';

// URL ของ Server หลังบ้าน
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Request Interceptor - Add JWT Token
api.interceptors.request.use(request => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
  }

  return request;
});

// Response Interceptor - Handle Auth Errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized - Redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// เชื่อมต่อ Realtime Socket
export const socket = io(API_URL, {
  transports: ['websocket'],
  autoConnect: true,
});