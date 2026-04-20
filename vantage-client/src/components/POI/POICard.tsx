import { motion } from 'framer-motion';
import { ThumbsUp, Pencil, Trash2, Check } from 'lucide-react';
import type { POI, POICategory } from '../../types';

interface POICardProps {
  poi: POI;
  tripId: string;
  userId: string;
  onVote: (poiId: string, type: 'up' | 'down') => void;
  onEdit: (poi: POI) => void;
  onDelete: (poiId: string) => void;
  onSelectPOI?: (poi: POI) => void;
}

const CATEGORY_COLORS: Record<POICategory, { bg: string; border: string }> = {
  restaurant: { bg: '#ffc6c6', border: '#ff9999' },
  hotel: { bg: '#ffd8f4', border: '#f4a8c4' },
  activity: { bg: '#c3faf5', border: '#8fdde6' },
  transport: { bg: '#ffe6cd', border: '#ffcc99' },
  attractions: { bg: '#fff8c6', border: '#efe8a8' },
  other: { bg: '#d4f5d9', border: '#a8dcb0' },
};

const CATEGORY_LABELS: Record<POICategory, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  activity: 'Activity',
  transport: 'Transport',
  attractions: 'Attraction',
  other: 'Other',
};

export default function POICard({
  poi,
  userId,
  onVote,
  onEdit,
  onDelete,
  onSelectPOI,
}: POICardProps) {
  const colors = CATEGORY_COLORS[poi.category] || CATEGORY_COLORS.other;
  
  let addedById = '';
  if (poi.addedBy) {
    if (typeof poi.addedBy === 'object') {
      addedById = String((poi.addedBy as any)._id || (poi.addedBy as any).toString() || '');
    } else {
      addedById = String(poi.addedBy);
    }
  }
  
  const isOwner = !!(userId && userId.length > 0 && addedById.length > 0 && 
    (addedById === userId || 
     addedById.toLowerCase() === userId.toLowerCase()));
  
  const hasVoted = poi.votes?.some((v: any) => {
    const voteId = typeof v === 'object' ? (v as any)._id?.toString() || (v as any).toString() : v?.toString();
    return voteId === userId || voteId?.toLowerCase() === userId?.toLowerCase();
  });

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.poi-actions')) {
      return;
    }
    onSelectPOI?.(poi);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(poi);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(poi._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-xl border overflow-hidden cursor-pointer"
      style={{ borderColor: poi.status === 'confirmed' ? '#00b473' : colors.border }}
      onClick={handleCardClick}
    >
      <div style={{ display: 'flex' }}>
        <div
          style={{
            width: 4,
            background: colors.bg,
            minHeight: '100%',
          }}
        />
        
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1f2937' }}>{poi.name}</h4>
              <span
                style={{
                  fontSize: 11,
                  color: colors.border,
                  background: colors.bg,
                  padding: '2px 8px',
                  borderRadius: 10,
                  display: 'inline-block',
                  marginTop: 4,
                }}
              >
                {CATEGORY_LABELS[poi.category]}
              </span>
            </div>
            
            {poi.status === 'confirmed' && (
              <span style={{ fontSize: 11, color: '#00b473', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Check size={12} /> Confirmed
              </span>
            )}
          </div>

          {poi.description && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
              {poi.description}
            </p>
          )}

          {poi.cost ? (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                {poi.currency || 'USD'} {poi.cost.toLocaleString()}
              </span>
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(poi._id, 'up');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  border: `1px solid ${hasVoted ? '#5b76fe' : '#e5e7eb'}`,
                  borderRadius: 6,
                  background: hasVoted ? '#eef2ff' : 'white',
                  fontSize: 12,
                  color: hasVoted ? '#5b76fe' : '#374151',
                  fontWeight: hasVoted ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <ThumbsUp size={14} fill={hasVoted ? '#5b76fe' : 'none'} />
                <span>{(poi.votes?.length || 0) === 0 ? 'No votes yet' : `${(poi.votes?.length || 0)} ${((poi.votes?.length || 0) === 1 ? 'vote' : 'votes')}`}</span>
              </button>
            </div>

            {isOwner && (
              <div className="poi-actions" style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleEditClick}
                  title="Edit"
                  style={{
                    padding: '8px 10px',
                    border: 'none',
                    background: '#f3f4f6',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  title="Delete"
                  style={{
                    padding: '8px 10px',
                    border: 'none',
                    background: '#fee2e2',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#dc2626',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}