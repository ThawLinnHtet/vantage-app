import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Link } from 'lucide-react';

interface InviteCodeProps {
  inviteCode: string;
  onClose: () => void;
}

export default function InviteCode({ inviteCode, onClose }: InviteCodeProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="invite-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="invite-modal"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>

          <div className="invite-header">
            <div className="invite-icon">
              <Link size={24} />
            </div>
            <h3>Invite Collaborators</h3>
            <p>Share this link to invite others to your trip</p>
          </div>

          <div className="invite-code-box">
            <input type="text" value={inviteUrl} readOnly />
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="invite-note">
            <p>Anyone with this link can view and suggest POIs for this trip.</p>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .invite-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .invite-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
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

        .invite-header {
          text-align: center;
          margin-bottom: 24px;
          padding-right: 40px;
        }

        .invite-icon {
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

        .invite-header h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 600;
          color: #1f2937;
        }

        .invite-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .invite-code-box {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .invite-code-box input {
          flex: 1;
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 13px;
          background: #f9fafb;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          background: #5b76fe;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background: #4a63e8;
        }

        .invite-note {
          text-align: center;
        }

        .invite-note p {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
        }

        @media (max-width: 1024px) {
          .invite-overlay {
            align-items: center;
            padding: 20px;
          }

          .invite-modal {
            border-radius: 20px;
            padding: 24px 24px 28px;
          }
        }

        @media (max-width: 640px) {
          .invite-overlay {
            align-items: center;
            padding: 16px;
          }

          .invite-modal {
            border-radius: 20px;
            padding: 24px 20px calc(28px + env(safe-area-inset-bottom, 0px));
          }

          .invite-header {
            padding-right: 0;
            margin-bottom: 20px;
          }

          .invite-header h3 {
            font-size: 20px;
          }

          .invite-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
          }

          .invite-icon svg {
            width: 22px;
            height: 22px;
          }

          .invite-code-box {
            flex-direction: column;
            gap: 12px;
          }

          .invite-code-box input {
            font-size: 14px;
            padding: 12px 14px;
          }

          .copy-btn {
            width: 100%;
            justify-content: center;
            padding: 14px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}