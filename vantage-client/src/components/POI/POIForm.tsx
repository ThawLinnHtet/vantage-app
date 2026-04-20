import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import type { POI, POICategory, GeocodingResult } from '../../types';
import { geocode } from '../../services/api';

interface POIFormProps {
  poi?: POI | null;
  selectedLocation?: { lat: number; lng: number } | null;
  onSubmit: (data: Partial<POI>) => void;
  onClose: () => void;
}

const CATEGORIES: { value: POICategory; label: string; color: string }[] = [
  { value: 'restaurant', label: 'Restaurant', color: '#ffc6c6' },
  { value: 'hotel', label: 'Hotel', color: '#ffd8f4' },
  { value: 'activity', label: 'Activity', color: '#c3faf5' },
  { value: 'transport', label: 'Transport', color: '#ffe6cd' },
  { value: 'attractions', label: 'Attractions', color: '#fff8c6' },
  { value: 'other', label: 'Other', color: '#d4f5d9' },
];

export default function POIForm({ poi, selectedLocation, onSubmit, onClose }: POIFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other' as POICategory,
    cost: undefined as number | undefined,
    lat: 0,
    lng: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (poi) {
      setFormData({
        name: poi.name,
        description: poi.description || '',
        category: poi.category,
        cost: poi.cost,
        lat: poi.lat,
        lng: poi.lng,
      });
    } else if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      }));
    }
  }, [poi, selectedLocation]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geocode.search(value);
        setSearchResults(results.slice(0, 5));
        setShowResults(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectSearchResult = (result: GeocodingResult) => {
    setFormData(prev => ({
      ...prev,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    }));
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Required';
    }
    if (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) {
      newErrors.location = 'Required';
    }
    if (formData.cost === undefined || formData.cost === null || isNaN(formData.cost)) {
      newErrors.cost = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        cost: formData.cost,
        lat: formData.lat,
        lng: formData.lng,
        status: 'suggestion',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="poi-form-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="poi-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="poi-form-header">
          <h3>{poi ? 'Edit Place' : 'Add New Place'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="poi-form-content-scroll">
          <form onSubmit={handleSubmit} className="poi-form-content">
          <div className="form-row">
            <div className="form-field">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Eiffel Tower, Paris"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div className="form-field">
              <label>Location *</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search address..."
                  className={errors.location ? 'error' : ''}
                />
                <div className="search-icon">
                  {isSearching ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <Search size={18} />
                  )}
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <div className="result-name">{result.name || result.display_name.split(',')[0]}</div>
                        <div className="result-address">{result.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(formData.lat !== 0 && formData.lng !== 0) && (
                <p className="success-text">
                  <MapPin size={14} /> Location set
                </p>
              )}
              {errors.location && <p className="error-text">{errors.location}</p>}
              <p className="hint-text">Or click on the map</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={formData.category === cat.value ? 'selected' : ''}
                    style={{
                      background: formData.category === cat.value ? cat.color : 'white',
                      borderColor: formData.category === cat.value ? '#1f2937' : '#e5e7eb',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label>Estimated Cost</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.cost || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, cost: value ? Number(value) : undefined });
                }}
                placeholder="0"
                className={`cost-input ${errors.cost ? 'error' : ''}`}
              />
              {errors.cost && <p className="error-text">{errors.cost}</p>}
            </div>
          </div>

          <div className="form-field full-width">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add some notes about this place..."
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              className="submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {poi ? 'Save Changes' : 'Add Place'}
            </motion.button>
          </div>
        </form>
        </div>
      </motion.div>

      <style>{`
        .poi-form-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }

        .poi-form-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0,0,0,0.25);
        }

        .poi-form-content-scroll {
          overflow-y: auto;
          max-height: calc(85vh - 80px);
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .poi-form-content-scroll::-webkit-scrollbar {
          display: none;
        }

        .poi-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 0;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }

        .poi-form-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: #f3f4f6;
          border-radius: 12px;
          cursor: pointer;
          color: #6b7280;
        }

        .poi-form-content {
          padding: 20px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .form-field input,
        .form-field textarea {
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #1f2937;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: #5b76fe;
          box-shadow: 0 0 0 3px rgba(91, 118, 254, 0.15);
        }

        .form-field input.error,
        .form-field textarea.error {
          border-color: #dc2626;
        }

        .form-field input.cost-input.error {
          border-color: #dc2626;
        }

        .form-field textarea {
          resize: none;
        }

        .search-input-wrapper {
          position: relative;
        }

        .search-input-wrapper input {
          width: 100%;
          padding-right: 48px;
        }

        .search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-results {
          position: absolute;
          z-index: 10;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          max-height: 200px;
          overflow-y: auto;
        }

        .search-results button {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
        }

        .search-results button:hover {
          background: #f9fafb;
        }

        .search-results button:last-child {
          border-bottom: none;
        }

        .result-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .result-address {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .success-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #10b981;
          margin: 0;
        }

        .error-text {
          font-size: 12px;
          color: #dc2626;
          margin: 4px 0 0;
          font-weight: 500;
        }

        .hint-text {
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0 0;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .category-grid button {
          padding: 10px 6px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cost-input {
          max-width: 160px;
        }

        .category-grid button.selected {
          border-color: #1f2937;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          padding-top: 8px;
        }

        .cancel-btn {
          flex: 1;
          padding: 16px 20px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #f9fafb;
        }

        .submit-btn {
          flex: 1;
          padding: 16px 20px;
          border: none;
          background: #5b76fe;
          color: white;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .submit-btn:hover {
          background: #4a63e8;
        }

        @media (max-width: 640px) {
          .poi-form-overlay {
            align-items: center;
            padding: 16px;
          }

          .poi-form-modal {
            border-radius: 20px;
            max-height: 60vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .poi-form-content-scroll {
            max-height: calc(60vh - 80px);
            padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
          }

          .poi-form-header {
            flex-shrink: 0;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .cost-input {
            max-width: none;
          }

          .poi-form-content {
            padding: 16px 20px 28px;
            gap: 16px;
          }

          .category-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .category-grid button {
            padding: 10px 6px;
            font-size: 12px;
          }

          .form-actions {
            gap: 10px;
          }

          .cancel-btn,
          .submit-btn {
            padding: 14px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </motion.div>
  );
}