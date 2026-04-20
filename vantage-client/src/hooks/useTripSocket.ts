import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToastStore } from '../stores/toastStore';
import { useAppStore } from '../stores/appStore';
import type { POI, User } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UseTripSocketOptions {
  tripId: string;
  onPOIAdded?: (poi: POI) => void;
  onPOIUpdated?: (poi: POI) => void;
  onPOIDeleted?: (poiId: string) => void;
  onPOIPromoted?: (poi: POI) => void;
  onTripUpdated?: (trip: any) => void;
  onPresenceUpdate?: (count: number) => void;
  onMemberJoined?: (member: { user: User; role: string; joinedAt: string }, count: number) => void;
}

export interface UseTripSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  emitPOIAdd: (poi: POI) => void;
  emitPOIUpdate: (poiId: string, data: Partial<POI>) => void;
  emitPOIDelete: (poiId: string) => void;
  emitPOIVote: (poiId: string) => void;
}

export function useTripSocket({
  tripId,
  onPOIAdded,
  onPOIUpdated,
  onPOIDeleted,
  onPOIPromoted,
  onTripUpdated,
  onPresenceUpdate,
  onMemberJoined
}: UseTripSocketOptions): UseTripSocketReturn {
  const addToast = useToastStore((state) => state.addToast);
  const user = useAppStore((state) => state.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: user?._id || ''
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-trip', tripId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('poi:added', (poi: POI) => {
      onPOIAdded?.(poi);
      addToast('New place added!', 'info');
    });

    newSocket.on('poi:updated', (poi: POI) => {
      onPOIUpdated?.(poi);
    });

    newSocket.on('poi:deleted', (poiId: string) => {
      onPOIDeleted?.(poiId);
    });

    newSocket.on('poi:promoted', (poi: POI) => {
      onPOIPromoted?.(poi);
      addToast('Place confirmed! 🎉', 'success');
    });

    newSocket.on('trip:updated', (trip: any) => {
      onTripUpdated?.(trip);
    });

    newSocket.on('presence:count', (count: number) => {
      setOnlineCount(count);
      onPresenceUpdate?.(count);
    });

    newSocket.on('member:joined', (data: { member: any; count: number }) => {
      onMemberJoined?.(data.member, data.count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-trip', tripId);
      newSocket.disconnect();
    };
  }, [user, tripId, onPOIAdded, onPOIUpdated, onPOIDeleted, onPOIPromoted, onTripUpdated, onPresenceUpdate, onMemberJoined]);

  const emitPOIAdd = useCallback((poi: POI) => {
    socket?.emit('poi:add', { tripId, poi });
  }, [socket, tripId]);

  const emitPOIUpdate = useCallback((poiId: string, data: Partial<POI>) => {
    socket?.emit('poi:update', { tripId, poiId, data });
  }, [socket, tripId]);

  const emitPOIDelete = useCallback((poiId: string) => {
    socket?.emit('poi:delete', { tripId, poiId });
  }, [socket, tripId]);

  const emitPOIVote = useCallback((poiId: string) => {
    socket?.emit('poi:vote', { tripId, poiId });
  }, [socket, tripId]);

  return {
    socket,
    isConnected,
    onlineCount,
    emitPOIAdd,
    emitPOIUpdate,
    emitPOIDelete,
    emitPOIVote,
  };
}