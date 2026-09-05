'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, Loader2, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { loginWithGoogle, authError, clearAuthError, isConfigured, allowedDomain } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="login-screen-container">
      <div className="login-card glass-panel">
        {/* Top Header & Glow */}
        <div className="login-header">
          <div className="login-badge">
            <ShieldCheck size={18} className="text-accent" />
            <span>Authorized Access Only</span>
          </div>

          <div className="login-brand-icon">
            <Sparkles size={28} className="brand-sparkle" />
          </div>

          <h1 className="login-title">AutoAttendance</h1>
          <p className="login-subtitle">
            ICAT Design & Media College Attendance Portal
          </p>
        </div>

        {/* Not Configured Alert (When .env.local is pending) */}
        {!isConfigured && (
          <div className="login-config-alert">
            <div className="config-alert-header">
              <Lock size={16} />
              <span>Firebase Configuration Pending</span>
            </div>
            <p className="config-alert-text">
              Firebase credentials have not been configured yet. Please paste your Firebase web app config into <code>.env.local</code> to activate Google authentication.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-text">
              <strong>Authentication Error</strong>
              <p>{authError}</p>
            </div>
            <button 
              type="button" 
              onClick={clearAuthError} 
              className="error-dismiss"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Sign In Action Area */}
        <div className="login-action-area">
          <button
            type="button"
            className="btn-google-login"
            onClick={handleSignIn}
            disabled={isSigningIn || !isConfigured}
          >
            {isSigningIn ? (
              <>
                <Loader2 size={20} className="spin" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' Icon */}
                <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight size={18} className="login-arrow" />
              </>
            )}
          </button>
        </div>

        {/* Domain Constraint Notice */}
        <div className="login-footer">
          <div className="login-policy-tag">
            <span>Allowed Domain:</span>
            <code>@{allowedDomain}</code>
          </div>
          <p className="login-policy-note">
            Strictly limited to registered organization email addresses. External accounts and unauthorized users will be automatically rejected.
          </p>
        </div>
      </div>
    </div>
  );
}
