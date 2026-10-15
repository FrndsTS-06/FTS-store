import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <PageContainer>
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-rose-500/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3 inline-block">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-black text-white font-display mb-2">
          Administrative Privileges Required
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The requested resource is strictly restricted to store administrators.
          {user ? (
            <>
              {' '}You are currently signed in as <strong className="text-slate-200">{user.email}</strong> ({user.role}).
            </>
          ) : null}
        </p>

        <div className="space-y-3">
          <Link to="/">
            <Button variant="primary" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Return to Storefront
            </Button>
          </Link>

          {user ? (
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<LogIn className="w-4 h-4" />}
              onClick={() => logout()}
            >
              Sign In with Another Account
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="secondary" className="w-full" leftIcon={<LogIn className="w-4 h-4" />}>
                Sign In as Administrator
              </Button>
            </Link>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
