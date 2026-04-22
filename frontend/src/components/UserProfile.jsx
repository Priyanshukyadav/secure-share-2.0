import React from 'react';
import '../styles/Components.css';

export default function UserProfile({ user, onLogout }) {
  return (
    <div className="user-profile">
      {user && (
        <>
          <div className="user-info">
            <span className="user-name">👤 {user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button onClick={onLogout} className="btn-logout">
            🚪 Logout
          </button>
        </>
      )}
    </div>
  );
}
