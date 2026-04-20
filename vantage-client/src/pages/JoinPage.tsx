import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { trips } from '../services/api';
import { Plane, ArrowRight } from 'lucide-react';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(true);
  const joinAttempted = useRef(false);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    // Save invite code to localStorage for after login/signup
    if (code) {
      localStorage.setItem('pendingInviteCode', code);
    }

    const processJoin = async () => {
      if (!user || !code) {
        localStorage.setItem('pendingInviteCode', code || '');
        setIsLoading(false);
        return;
      }

      try {
        const trip = await trips.getByCode(code);
        
        const isAlreadyMember = trip.members.some((m: any) => {
          if (!m.user) return false;
          const memberId = typeof m.user === 'object' ? String(m.user._id) : String(m.user);
          const currentUserId = String(user._id);
          return memberId === currentUserId;
        });

        if (isAlreadyMember) {
          addToast('You are already a member of this trip', 'info');
          setTimeout(() => {
            processed.current = true;
            navigate(`/trip/${trip._id}`);
          }, 1500);
          setIsLoading(false);
          return;
        }

        const joinedTrip = await trips.join(code);
        addToast(`Joined "${joinedTrip.name}" successfully!`, 'success');
        setTimeout(() => {
          processed.current = true;
          navigate(`/trip/${joinedTrip._id}`);
        }, 1500);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to join trip';
        addToast(message, 'error');
        setTimeout(() => {
          processed.current = true;
          navigate('/trips');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (!joinAttempted.current && !processed.current) {
      joinAttempted.current = true;
      processJoin();
    }
  }, [user, code, navigate, addToast]);

  if (isLoading) {
    return (
      <div className="join-page">
        <div className="join-loading">
          <div className="spinner"></div>
          <p>Joining trip...</p>
        </div>
        <style>{`
          .join-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
          }
          .join-loading {
            text-align: center;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #5b76fe;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .join-loading p {
            color: #6b7280;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div 
        className="join-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="join-card">
          <div className="join-icon">
            <Plane size={40} />
          </div>
          <h1>Join Trip</h1>
          <p className="join-subtitle">
            You've been invited to join a trip! Please log in to continue.
          </p>
          
          <div className="join-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate(`/login?redirect=/join/${code}`)}
            >
              <span>Login to Join</span>
              <ArrowRight size={18} />
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate(`/signup?redirect=/join/${code}`)}
            >
              Create Account
            </button>
          </div>

          <p className="join-note">
            Already have an account? Login to join this trip.
          </p>
        </div>

        <style>{`
          .join-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            padding: 20px;
          }
          .join-card {
            background: white;
            border-radius: 20px;
            padding: 48px 40px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .join-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: #5b76fe;
          }
          .join-card h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px;
          }
          .join-subtitle {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.5;
            margin: 0 0 32px;
          }
          .join-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 24px;
            background: #5b76fe;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-primary:hover {
            background: #4a63e8;
          }
          .btn-secondary {
            padding: 14px 24px;
            background: white;
            color: #374151;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-secondary:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
          .join-note {
            margin-top: 24px;
            font-size: 13px;
            color: #9ca3af;
          }
        `}</style>
      </motion.div>
    );
  }

  return null;
}