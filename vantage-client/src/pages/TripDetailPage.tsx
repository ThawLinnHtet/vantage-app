import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Share2, Calendar, Users, Trash2, Map, List, Menu } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { trips, geocode } from '../services/api';
import { useTripSocket } from '../hooks/useTripSocket';
import { useToastStore } from '../stores/toastStore';
import { POI, Trip } from '../types';

import LeafletMap from '../components/Map/LeafletMap';
import BudgetMeter from '../components/BudgetMeter';
import POIList from '../components/POI/POIList';
import POIForm from '../components/POI/POIForm';
import InviteCode from '../components/InviteCode';

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPOIForm, setShowPOIForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingPOI, setEditingPOI] = useState<POI | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [showMobileActions, setShowMobileActions] = useState(false);

  const getDefaultCenter = (): [number, number] => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (trip?.destination?.lat) return [trip.destination.lat, trip.destination.lng];
    return [48.8566, 2.3522];
  };

  const handleLocateMe = useCallback(() => {
    setSelectedPOI(null);
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  const handlePOIUpdate = useCallback((updatedPOI: POI) => {
    setTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pois: prev.pois.map(p => p._id === updatedPOI._id ? updatedPOI : p)
      };
    });
  }, []);

  const handleMapLongPress = useCallback(async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setEditingPOI(null);
    setShowPOIForm(true);
    
    try {
      const result = await geocode.reverse(lat, lng);
      if (result.display_name) {
        setSelectedLocation(prev => prev ? { ...prev, address: result.display_name } : null);
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
  }, []);

  const handlePOICreate = useCallback((newPOI: POI) => {
    setTrip(prev => {
      if (!prev) return null;
      return { ...prev, pois: [...prev.pois, newPOI] };
    });
  }, []);

  const handlePOIDelete = useCallback((poiId: string) => {
    setTrip(prev => {
      if (!prev) return null;
      return { ...prev, pois: prev.pois.filter(p => p._id !== poiId) };
    });
  }, []);

  const handleMemberJoined = useCallback((member: any, _newCount: number) => {
    setTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        members: [...prev.members, member]
      };
    });
    const memberName = member.user?.name || 'Someone';
    addToast(`${memberName} joined the trip! 👋`, 'info');
  }, [addToast]);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    try {
      await trips.delete(trip._id);
      addToast('Trip deleted', 'success');
      navigate('/trips');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete trip', 'error');
    }
  };

  const isOwner = user && (
    trip?.createdBy === user._id || 
    (trip?.createdBy as any)?._id === user._id
  );

  const { socket, isConnected } = useTripSocket({
    tripId: id!,
    onPOIUpdated: handlePOIUpdate,
    onPOIAdded: handlePOICreate,
    onPOIDeleted: handlePOIDelete,
    onMemberJoined: handleMemberJoined,
  });

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const data = await trips.getById(id!);
        setTrip(data);
      } catch (err) {
        console.error('Failed to load trip:', err);
        addToast('Failed to load trip', 'error');
        navigate('/trips');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadTrip();
  }, [id, navigate, addToast]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (error) => {
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Unknown error');
        }
      }
    );
  }, []);

  const handleVote = async (poiId: string, type: 'up' | 'down') => {
    if (!trip) return;
    if (!socket || !isConnected) {
      addToast('Not connected. Please refresh.', 'error');
      return;
    }
    socket.emit('poi:vote', { tripId: trip._id, poiId, type });
  };

  const handleEditPOI = async (data: Partial<POI>) => {
    if (!trip) return;
    if (!socket || !isConnected) {
      addToast('Not connected. Please refresh.', 'error');
      return;
    }
    if (!editingPOI?._id) {
      addToast('Invalid POI', 'error');
      return;
    }
    socket.emit('poi:update', { tripId: trip._id, poiId: editingPOI._id, ...data });
    setEditingPOI(null);
    setShowPOIForm(false);
  };

  const handleDeletePOI = async (poiId: string) => {
    if (!trip) return;
    if (!socket || !isConnected) {
      addToast('Not connected. Please refresh.', 'error');
      return;
    }
    socket.emit('poi:delete', { tripId: trip._id, poiId });
  };

  const handleCreatePOI = async (data: Partial<POI>) => {
    if (!trip) return;
    if (!socket || !isConnected) {
      addToast('Not connected. Please refresh.', 'error');
      return;
    }
    socket.emit('poi:create', { tripId: trip._id, poi: data });
    setShowPOIForm(false);
    setSelectedLocation(null);
  };

  if (isLoading || !trip) {
    return (
      <div className="trip-detail-loading">
        <div className="spinner"></div>
        <p>Loading trip...</p>
      </div>
    );
  }

  const confirmedPOIs = trip.pois.filter(p => p.status === 'confirmed');
  const totalBudget = confirmedPOIs.reduce((sum, p) => sum + (p.cost || 0), 0);

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <motion.div 
      className="trip-detail-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="trip-header">
        <div className="trip-header-top">
          <button className="back-btn" onClick={() => navigate('/trips')}>
            <ArrowLeft size={22} />
          </button>
          
          <div className="trip-info">
            <h1>{trip.name}</h1>
            <div className="trip-meta">
              <span><Calendar size={13} /> {formatDateRange(trip.startDate, trip.endDate)}</span>
              <span><Users size={13} /> {trip.members.length}</span>
            </div>
          </div>

          <div className="trip-actions-desktop">
            {isOwner && (
              <button className="icon-btn delete-btn" onClick={() => setShowDeleteModal(true)} title="Delete trip">
                <Trash2 size={20} />
              </button>
            )}
            <button className="icon-btn" onClick={() => {
              if (!trip?.inviteCode) {
                addToast('No invite code available for this trip', 'error');
                return;
              }
              setShowInvite(true);
            }}>
              <Share2 size={20} />
            </button>
            <button className="primary-btn" onClick={() => setShowPOIForm(true)}>
              <Plus size={18} />
              <span>Add POI</span>
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setShowMobileActions(!showMobileActions)}>
            <Menu size={22} />
          </button>
        </div>

        <AnimatePresence>
          {showMobileActions && (
            <motion.div
              className="mobile-actions-popup"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isOwner && (
                <button onClick={() => { setShowDeleteModal(true); setShowMobileActions(false); }}>
                  <Trash2 size={18} /> Delete trip
                </button>
              )}
              <button onClick={() => { 
                if (!trip?.inviteCode) {
                  addToast('No invite code available for this trip', 'error');
                  setShowMobileActions(false);
                  return;
                }
                setShowInvite(true); 
                setShowMobileActions(false); 
              }}>
                <Share2 size={18} /> Share
              </button>
              <button onClick={() => { setShowPOIForm(true); setShowMobileActions(false); }}>
                <Plus size={18} /> Add POI
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="trip-content">
        <motion.div 
          className={`map-section ${mobileView === 'list' ? 'hidden-mobile' : ''}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <LeafletMap
            pois={trip.pois}
            center={mapCenter || getDefaultCenter()}
            userLocation={userLocation}
            locationStatus={locationStatus}
            locationError={locationError}
            addMode={showPOIForm && !editingPOI}
            selectedPOI={selectedPOI}
            onMapClick={(lat, lng) => {
              if (showPOIForm && !editingPOI) {
                setSelectedLocation({ lat, lng });
              }
            }}
            onMapLongPress={handleMapLongPress}
            onLocateClick={handleLocateMe}
            onPOIClick={(poi) => {
              setSelectedPOI(poi);
            }}
          />
        </motion.div>

        <motion.div 
          className={`sidebar-section ${mobileView === 'map' ? 'hidden-mobile' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        >
          <BudgetMeter spent={totalBudget} total={trip.budget.total} currency={trip.budget.currency} />
          
          <POIList
            pois={trip.pois}
            tripId={trip._id}
            userId={user?._id || ''}
            onVote={handleVote}
            onEdit={(poi) => {
              setEditingPOI(poi);
              setShowPOIForm(true);
            }}
            onDelete={handleDeletePOI}
            onSelectPOI={(poi) => setSelectedPOI(poi)}
          />
        </motion.div>
      </div>

      <div className="mobile-view-toggle">
        <button 
          type="button"
          className={mobileView === 'map' ? 'active' : ''} 
          onClick={() => setMobileView('map')}
        >
          <Map size={18} /> Map
        </button>
        <button 
          type="button"
          className={mobileView === 'list' ? 'active' : ''} 
          onClick={() => setMobileView('list')}
        >
          <List size={18} /> POIs
        </button>
      </div>

      {showPOIForm && (
        <POIForm
          poi={editingPOI}
          selectedLocation={!editingPOI ? selectedLocation : null}
          tripCurrency={trip?.budget?.currency || 'MMK'}
          onSubmit={editingPOI ? handleEditPOI : handleCreatePOI}
          onClose={() => {
            setShowPOIForm(false);
            setEditingPOI(null);
            setSelectedLocation(null);
          }}
        />
      )}

      {showInvite && (
        <InviteCode
          inviteCode={trip.inviteCode}
          onClose={() => setShowInvite(false)}
        />
      )}

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Trip?</h3>
              <p>This action cannot be undone. All POIs will be permanently deleted.</p>
              <div className="modal-actions">
                <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">Cancel</button>
                <button onClick={handleDeleteTrip} className="confirm-delete-btn">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .trip-detail-page {
          min-height: 100vh;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
        }

        .trip-detail-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
          color: #6b7280;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e5e7eb;
          border-top-color: #5b76fe;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .trip-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          z-index: 200;
        }

        .trip-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: none;
          background: #f3f4f6;
          border-radius: 12px;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: #e5e7eb;
        }

        .trip-info {
          flex: 1;
          min-width: 0;
        }

        .trip-info h1 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trip-meta {
          display: flex;
          gap: 12px;
          color: #6b7280;
          font-size: 13px;
        }

        .trip-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trip-actions-desktop {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          border-color: #5b76fe;
          color: #5b76fe;
        }

        .delete-btn {
          color: #ef4444;
          border-color: #fecaca;
        }

        .delete-btn:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #dc2626;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 20px;
          background: #5b76fe;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: #4a63e8;
        }

        .mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          color: #5b76fe;
        }

        .mobile-actions-popup {
          position: absolute;
          top: 100%;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 8px;
          z-index: 260;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 160px;
        }

        .mobile-actions-popup button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: none;
          background: none;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          text-align: left;
        }

        .mobile-actions-popup button:hover {
          background: #f3f4f6;
        }

        .mobile-actions-popup button:first-child {
          color: #dc2626;
        }

        .trip-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          padding: 24px;
        }

        .trip-content > .map-section,
        .trip-content > .sidebar-section {
          display: flex;
        }

        .map-section {
          position: relative;
          z-index: 1;
          top: 24px;
          height: calc(100vh - 140px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 100%;
          background: #f0f0f0 !important;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .map-section.hidden-mobile {
          display: none !important;
        }

        .sidebar-section.hidden-mobile {
          display: none !important;
        }

        @media (min-width: 1025px) {
          .trip-content {
            display: grid;
            grid-template-columns: 1fr 400px;
          }
          
          .map-section.hidden-mobile,
          .sidebar-section.hidden-mobile {
            display: flex !important;
          }
        }

        .mobile-view-toggle {
          display: none;
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          padding: 6px;
          z-index: 250;
          gap: 4px;
        }

        .mobile-view-toggle button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          min-height: 44px;
          min-width: 44px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.2s;
        }

        .mobile-view-toggle button.active {
          background: #5b76fe;
          color: white;
        }

        .mobile-view-toggle button:active {
          transform: scale(0.96);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          padding: 16px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .modal-content h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px;
        }

        .modal-content p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .cancel-btn {
          flex: 1;
          padding: 14px 20px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #f9fafb;
        }

        .confirm-delete-btn {
          flex: 1;
          padding: 14px 20px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .confirm-delete-btn:hover {
          background: #dc2626;
        }

        @media (max-width: 1024px) {
          .trip-content {
            display: flex !important;
            flex-direction: column;
            padding: 16px;
            gap: 0;
          }

          .trip-actions-desktop {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .map-section {
            position: relative;
            height: calc(100vh - 160px);
            top: 0;
            border-radius: 0;
            width: 100%;
          }

          .sidebar-section {
            display: flex !important;
            flex-direction: column;
            gap: 20px;
            min-height: calc(100vh - 160px);
            width: 100%;
            padding-bottom: 96px;
            background: #f0f0f0 !important;
          }

          .mobile-view-toggle {
            display: flex;
            z-index: 100;
            padding: 6px;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            background: white;
            padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
          }

          .mobile-view-toggle button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 20px;
            min-height: 44px;
            border: none;
            background: transparent;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: all 0.2s ease;
          }

          .mobile-view-toggle button.active {
            background: #5b76fe;
            color: white;
          }

          .mobile-view-toggle button:active {
            transform: scale(0.96);
          }
        }

        @media (max-width: 640px) {
          .trip-info h1 {
            font-size: 15px;
          }

          .trip-meta {
            display: none;
          }

          .map-section {
            height: calc(100vh - 140px);
            min-height: 300px;
          }

          .sidebar-section {
            min-height: calc(100vh - 90px);
          }

          .mobile-view-toggle button span {
            display: none;
          }

          .mobile-view-toggle button {
            padding: 12px 16px;
            min-height: 44px;
          }

          .mobile-view-toggle {
            bottom: calc(16px + env(safe-area-inset-bottom, 0px));
            padding: 4px;
            border-radius: 14px;
          }
        }
      `}</style>
    </motion.div>
  );
}