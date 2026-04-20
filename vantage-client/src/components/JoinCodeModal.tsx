import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { trips } from '../services/api';
import { useToastStore } from '../stores/toastStore';

interface JoinCodeModalProps {
  onClose: () => void;
}

export default function JoinCodeModal({ onClose }: JoinCodeModalProps) {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateCode = (value: string): string => {
    if (!value.trim()) return 'Code is required';
    if (value.length !== 6) return 'Code must be 6 characters';
    if (!/^[A-Z0-9]+$/.test(value)) return 'Code must be uppercase letters/numbers only';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const joinedTrip = await trips.join(code);
      addToast(`Joined "${joinedTrip.name}" successfully!`, 'success');
      onClose();
      navigate(`/trip/${joinedTrip._id}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid code. Please check and try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="join-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="join-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>

          <div className="join-header">
            <div className="join-icon">
              <Link size={24} />
            </div>
            <h3>Join a Trip</h3>
            <p>Enter the 6-character code to join a trip</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="join-input-group">
              <input
                type="text"
                value={code}
                onChange={handleChange}
                placeholder="ABC123"
                className="join-input"
                style={error ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                maxLength={6}
                autoFocus
              />
              <motion.button
                type="submit"
                className="join-submit-btn"
                disabled={isLoading || !code.trim()}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
              </motion.button>
            </div>

            {error && (
              <div className="join-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="join-note">
            <p>Ask the trip organizer for the invite code.</p>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .join-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .join-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          padding: 28px 24px 32px;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
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
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #1f2937;
        }

        .join-header {
          text-align: center;
          margin-bottom: 24px;
          padding-right: 0;
        }

        .join-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #5b76fe 0%, #8b5cf6 100%);
          border-radius: 16px;
          color: white;
          margin-bottom: 16px;
        }

        .join-header h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 600;
          color: #1f2937;
        }

        .join-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .join-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .join-input {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-align: center;
          text-transform: uppercase;
          color: #1f2937;
          background: #f9fafb;
          transition: all 0.2s;
        }

        .join-input:focus {
          outline: none;
          border-color: #5b76fe;
          background: white;
        }

        .join-input::placeholder {
          letter-spacing: normal;
          font-size: 14px;
          font-weight: 400;
          color: #9ca3af;
        }

        .join-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: #5b76fe;
          color: white;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .join-submit-btn:hover:not(:disabled) {
          background: #4a63e8;
        }

        .join-submit-btn:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .join-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border-radius: 12px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .join-note {
          text-align: center;
        }

        .join-note p {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .join-modal {
            border-radius: 24px;
            padding: 32px 28px;
            max-width: 440px;
          }

          .join-icon {
            width: 60px;
            height: 60px;
            border-radius: 18px;
          }

          .join-icon svg {
            width: 28px;
            height: 28px;
          }

          .join-header h3 {
            font-size: 24px;
          }

          .join-input {
            padding: 18px 20px;
            font-size: 22px;
          }

          .join-submit-btn {
            width: 60px;
            height: 60px;
            border-radius: 16px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .join-modal {
            padding: 36px 32px;
            max-width: 480px;
          }

          .join-header {
            margin-bottom: 28px;
          }

          .join-icon {
            width: 64px;
            height: 64px;
          }

          .join-header h3 {
            font-size: 26px;
          }

          .join-header p {
            font-size: 16px;
          }
        }

        @media (max-width: 640px) {
          .join-modal {
            border-radius: 20px;
            padding: 24px 20px calc(28px + env(safe-area-inset-bottom, 0px));
          }

          .join-header {
            margin-bottom: 20px;
          }

          .join-header h3 {
            font-size: 20px;
          }

          .join-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
          }

          .join-icon svg {
            width: 22px;
            height: 22px;
          }

          .join-input {
            padding: 14px 16px;
            font-size: 18px;
          }

          .join-submit-btn {
            width: 50px;
            height: 50px;
          }
        }

        @media (min-width: 1025px) {
          .join-modal:hover {
            box-shadow: 0 25px 60px rgba(0,0,0,0.25);
          }

          .close-btn:hover {
            transform: scale(1.05);
          }
        }
      `}</style>
    </AnimatePresence>
  );
}