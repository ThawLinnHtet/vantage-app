import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { auth, trips } from '../services/api';
import type { Trip } from '../types';

const getToday = () => new Date().toISOString().split('T')[0];

const VantageLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#5b76fe"/>
    <path d="M26 14L16 20L12 18V16L16 18L10 26H12L16 22L20 28V18L26 14Z" fill="white"/>
    <circle cx="8" cy="8" r="3" fill="#5b76fe" stroke="white" strokeWidth="1"/>
  </svg>
);

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function TripsPage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await trips.getAll();
      setTripsList(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
      addToast('Failed to load trips', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 border-b bg-white"
        style={{ borderColor: 'var(--color-ring)' }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <VantageLogo size={32} />
          <span className="text-lg md:text-xl font-display" style={{ color: 'var(--color-primary)', letterSpacing: '-0.72px' }}>Vantage</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-interactive flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-body-standard text-sm" style={{ color: '#555a6a' }}>{user?.name}</span>
          </div>
          <motion.button 
            onClick={handleLogout} 
            className="btn-secondary text-sm"
            style={{ padding: '8px 14px', borderRadius: '8px' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col items-center px-4 md:px-6 py-8 md:py-12 lg:py-16">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between gap-2 mb-6 md:mb-8">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg md:text-2xl font-display" 
              style={{ color: 'var(--color-primary)', letterSpacing: '-0.72px', whiteSpace: 'nowrap' }}
            >
              Your Trips
            </motion.h2>
            <motion.button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-xs md:text-sm shrink-0" 
              style={{ padding: '10px 16px', borderRadius: '8px' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Create New Trip
            </motion.button>
          </div>

          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 border animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-6 w-32 rounded bg-gray-200" />
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-4 w-24 rounded bg-gray-200 mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-16 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : tripsList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <motion.div 
                className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-teal-100 to-coral-100 flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-4xl">✈️</span>
              </motion.div>
              <h3 className="text-xl font-display mb-2" style={{ color: 'var(--color-primary)' }}>
                No trips yet
              </h3>
              <p className="text-body-standard text-center mb-6 max-w-md" style={{ color: '#555a6a' }}>
                Start planning your first adventure! Click the button above to create a new trip.
              </p>
            </motion.div>
          ) : (
<motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {tripsList.map((trip) => (
                <motion.div
                  key={trip._id}
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(91, 118, 254, 0.15)' }}
                  className="bg-white rounded-xl p-5 border cursor-pointer relative group"
                  style={{ borderColor: 'var(--color-ring)' }}
                  onClick={() => navigate(`/trip/${trip._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display text-base md:text-lg" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {trip.name}
                    </h3>
                  </div>
                  <p className="text-body-standard text-sm mb-3" style={{ color: '#555a6a' }}>
                    📍 {trip.destination.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-caption" style={{ color: '#555a6a' }}>
                      {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--color-interactive)' }}>
                      {trip.budget.currency} {trip.budget.total.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <CreateTripModal onClose={() => setShowCreateModal(false)} onCreated={loadTrips} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateTripModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: getToday(),
    endDate: '',
    budget: '',
    currency: 'USD'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addToast = useToastStore((state) => state.addToast);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Trip name is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = 'Budget must be greater than 0';
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) newErrors.endDate = 'End date must be after start date';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.startDate && new Date(formData.startDate) < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setIsGeocoding(true);
    try {
      await trips.create({
        name: formData.name,
        destination: { name: formData.destination, lat: 0, lng: 0 },
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: { total: Number(formData.budget), currency: formData.currency }
      });
      onCreated();
      addToast('Trip created successfully!', 'success');
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create trip';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
      setIsGeocoding(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-5 md:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display" style={{ color: 'var(--color-primary)' }}>Create New Trip</h3>
          <button onClick={onClose} className="text-2xl hover:opacity-60">&times;</button>
        </div>

        {errors.submit && (
          <div className="error-field mb-4">{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Trip Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Summer Vacation 2026"
                style={errors.name ? { borderColor: '#c53030' } : {}}
              />
              {errors.name && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.name}</p>}
            </div>
            <div>
              <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Destination *</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="input-field"
                placeholder="Paris, France"
                style={errors.destination ? { borderColor: '#c53030' } : {}}
              />
              {errors.destination && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.destination}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={getToday()}
                  className="input-field"
                  style={errors.startDate ? { borderColor: '#c53030' } : {}}
                />
                {errors.startDate && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || getToday()}
                  className="input-field"
                  style={errors.endDate ? { borderColor: '#c53030' } : {}}
                />
                {errors.endDate && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.endDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Budget *</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="input-field"
                  placeholder="5000"
                  style={errors.budget ? { borderColor: '#c53030' } : {}}
                />
                {errors.budget && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.budget}</p>}
              </div>
              <div>
                <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input-field"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <motion.button 
              type="submit" 
              disabled={isLoading || isGeocoding} 
              className="btn-primary flex-1"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isGeocoding ? 'Locating...' : isLoading ? 'Creating...' : 'Create Trip'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}