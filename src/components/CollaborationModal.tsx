import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Users } from 'lucide-react';
import ModernButton from './ModernButton';
import './CollaborationModal.css';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onInviteCollaborator: (email: string, role: 'editor' | 'viewer') => Promise<void>;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  project,
  onInviteCollaborator
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    try {
      await onInviteCollaborator(email, role);
      setEmail('');
      setRole('viewer');
    } catch (error) {
      console.error('Error inviting collaborator:', error);
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="collaboration-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="collaboration-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Users className="w-5 h-5" />
            <h3>Invite Collaborators</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="project-info">
            <h4>{project?.name || 'Project'}</h4>
            <p>Invite team members to collaborate on this project</p>
          </div>

          <form onSubmit={handleSubmit} className="invite-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter collaborator's email"
                required
                disabled={isInviting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                disabled={isInviting}
              >
                <option value="viewer">Viewer - Can view and comment</option>
                <option value="editor">Editor - Can edit and share</option>
              </select>
            </div>

            <div className="form-actions">
              <ModernButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isInviting}
              >
                Cancel
              </ModernButton>
              <ModernButton
                type="submit"
                variant="primary"
                icon={<UserPlus className="w-4 h-4" />}
                loading={isInviting}
                disabled={!email.trim() || isInviting}
              >
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </ModernButton>
            </div>
          </form>

          <div className="collaboration-info">
            <h5>About Project Collaboration</h5>
            <ul>
              <li><strong>Viewers</strong> can see the project, preview models, and leave comments</li>
              <li><strong>Editors</strong> can upload files, modify settings, and share the project</li>
              <li>Collaborators will receive an email invitation to join the project</li>
              <li>You can manage permissions anytime in project settings</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CollaborationModal;
