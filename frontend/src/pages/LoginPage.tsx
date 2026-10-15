import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Sparkles, Shield, User } from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/profile';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const success = await login({ email: trimmedEmail, password });
    setIsSubmitting(false);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setValidationError(null);
  };

  return (
    <PageContainer>
      <div className="max-w-md mx-auto my-8 p-8 rounded-3xl glass-panel shadow-2xl animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Sign In to FTS Store</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your customer profile, order history, and saved addresses
          </p>
        </div>

        {/* Global Error Banner */}
        {(validationError || authError) && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Fast-Login Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quick Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoCredentials('customer@frndstech.com', 'Customer@FTS2026!')}
              className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="truncate text-[11px] text-slate-300">Customer Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('superadmin@frndstech.com', 'AdminMaster2026!')}
              className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 text-left transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="truncate text-[11px] text-slate-300">Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Register now
          </Link>
        </p>

      </div>
    </PageContainer>
  );
};
