import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Link, Hash } from 'lucide-react';

interface InviteCodeProps {
  inviteCode: string;
  onClose: () => void;
}

export default function InviteCode({ inviteCode, onClose }: InviteCodeProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(inviteCode);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
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
            <p>Share this link or code to invite others to your trip</p>
          </div>

          <div className="invite-section">
            <label className="invite-label">
              <Link size={14} />
              <span>Invite Link</span>
            </label>
            <div className="invite-input-row">
              <input type="text" value={inviteUrl} readOnly className="invite-input" />
              <button className="copy-btn" onClick={handleCopyLink}>
                {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="invite-divider">
            <span>OR</span>
          </div>

          <div className="invite-section">
            <label className="invite-label">
              <Hash size={14} />
              <span>Invite Code</span>
            </label>
            <div className="invite-input-row">
              <input type="text" value={inviteCode} readOnly className="invite-input code-input" />
              <button className="copy-btn" onClick={handleCopyCode}>
                {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="invite-note">
            <p>Anyone with this link or code can view and suggest POIs for this trip.</p>
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

        .invite-section {
          margin-bottom: 0;
        }

        .invite-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
        }

        .invite-input-row {
          display: flex;
          gap: 10px;
        }

        .invite-input {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 13px;
          background: #f9fafb;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .invite-input.code-input {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-align: center;
          text-transform: uppercase;
          color: #1f2937;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          background: #5b76fe;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background: #4a63e8;
        }

        .invite-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 20px 0;
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .invite-divider::before,
        .invite-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .invite-note {
          text-align: center;
          margin-top: 20px;
        }

        .invite-note p {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
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

          .invite-input-row {
            flex-direction: column;
            gap: 10px;
          }

          .invite-input {
            font-size: 14px;
            padding: 12px 14px;
          }

          .copy-btn {
            width: 100%;
            justify-content: center;
            padding: 12px;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .invite-overlay {
            align-items: center;
            padding: 24px;
          }

          .invite-modal {
            border-radius: 24px;
            padding: 28px 26px;
            max-width: 480px;
          }

          .invite-icon {
            width: 60px;
            height: 60px;
            border-radius: 18px;
          }

          .invite-header h3 {
            font-size: 24px;
          }

          .invite-header {
            margin-bottom: 24px;
          }

          .copy-btn {
            padding: 14px 18px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}