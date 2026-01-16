// src/lib/api.ts
import axios from 'axios';
import { io } from 'socket.io-client';

// URL ของ Server หลังบ้าน
const API_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// เชื่อมต่อ Realtime Socket
export const socket = io(API_URL, {
  transports: ['websocket'],
  autoConnect: true,
});