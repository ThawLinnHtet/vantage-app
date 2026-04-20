import { io, Socket } from 'socket.io-client';
import type { Trip, POI } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
    
    this.socket.connect();
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinTrip(tripId: string) {
    this.socket?.emit('join-trip', tripId);
  }

  leaveTrip(tripId: string) {
    this.socket?.emit('leave-trip', tripId);
  }

  onTripUpdated(callback: (trip: Trip) => void) {
    this.socket?.on('trip:updated', callback);
  }

  onPOIAdded(callback: (poi: POI) => void) {
    this.socket?.on('poi:added', callback);
  }

  onPOIUpdated(callback: (poi: POI) => void) {
    this.socket?.on('poi:updated', callback);
  }

  onPOIDeleted(callback: (poiId: string) => void) {
    this.socket?.on('poi:deleted', callback);
  }

  onPOIPromoted(callback: (poi: POI) => void) {
    this.socket?.on('poi:promoted', callback);
  }

  onMemberJoined(callback: (data: { userId: string; name: string }) => void) {
    this.socket?.on('member:joined', callback);
  }

  onMemberLeft(callback: (data: { userId: string }) => void) {
    this.socket?.on('member:left', callback);
  }

  onPresenceCount(callback: (count: number) => void) {
    this.socket?.on('presence:count', callback);
  }

  emitPOIAdd(poi: POI) {
    this.socket?.emit('poi:add', poi);
  }

  emitPOIUpdate(poi: POI) {
    this.socket?.emit('poi:update', poi);
  }

  emitPOIDelete(poiId: string) {
    this.socket?.emit('poi:delete', poiId);
  }

  emitPOIVote(poiId: string) {
    this.socket?.emit('poi:vote', poiId);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
export default socketService;