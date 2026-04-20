import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import POICard from './POICard';
import { POI } from '../../types';

interface POIListProps {
  pois: POI[];
  tripId: string;
  userId: string;
  onVote: (poiId: string, type: 'up' | 'down') => void;
  onEdit: (poi: POI) => void;
  onDelete: (poiId: string) => void;
  onSelectPOI?: (poi: POI) => void;
}

export default function POIList({ pois, tripId, userId, onVote, onEdit, onDelete, onSelectPOI }: POIListProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'confirmed'>('suggestions');

  const confirmed = pois.filter(p => p.status === 'confirmed');
  const suggestions = pois.filter(p => p.status === 'suggestion');

  const displayList = activeTab === 'confirmed' ? confirmed : suggestions;

  return (
    <div className="poi-list-container">
      <div className="poi-tabs">
        <button
          className={`poi-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <span className="tab-label">Suggestions</span>
          <span className="tab-count">{suggestions.length}</span>
        </button>
        <button
          className={`poi-tab ${activeTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          <span className="tab-label">Confirmed</span>
          <span className="tab-count">{confirmed.length}</span>
        </button>
      </div>

      <div className="poi-cards">
        <AnimatePresence mode="popLayout">
          {displayList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="empty-state"
            >
              <p>{activeTab === 'confirmed' ? 'No confirmed places yet' : 'No suggestions yet'}</p>
              <p className="hint">Add a POI to get started!</p>
            </motion.div>
          ) : (
            displayList.map((poi, index) => (
              <POICard
                key={poi._id || `poi-${index}`}
                poi={poi}
                tripId={tripId}
                userId={userId}
                onVote={onVote}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelectPOI={onSelectPOI}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .poi-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .poi-tabs {
          display: flex;
          gap: 8px;
          background: #f3f4f6;
          padding: 6px;
          border-radius: 14px;
        }

        .poi-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .poi-tab.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .poi-tab:hover:not(.active) {
          color: #4b5563;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 600;
          background: #e5e7eb;
        }

        .poi-tab.active .tab-count {
          background: #5b76fe;
          color: white;
        }

        .poi-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #9ca3af;
        }

        .empty-state p {
          margin: 0;
        }

        .empty-state .hint {
          font-size: 13px;
          margin-top: 8px;
          color: #d1d5db;
        }

        @media (max-width: 768px) {
          .poi-tabs {
            padding: 4px;
            border-radius: 12px;
          }

          .poi-tab {
            padding: 10px 12px;
            font-size: 13px;
          }

          .tab-label {
            display: none;
          }

          .poi-tab::before {
            content: '';
          }

          .tab-count {
            min-width: 20px;
            height: 20px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .poi-list-container {
            gap: 12px;
          }

          .poi-tabs {
            position: sticky;
            top: 0;
            background: white;
            padding: 0;
            border-radius: 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
          }

          .poi-tab {
            flex-direction: row;
            background: #f3f4f6;
            padding: 10px 16px;
          }

          .poi-tab.active {
            background: white;
            box-shadow: none;
          }

          .tab-label {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}