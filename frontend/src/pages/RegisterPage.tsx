import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters long.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLength || !hasLetter || !hasDigit) {
      setValidationError('Password does not meet the security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const success = await register({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (success) {
      navigate('/profile', { replace: true });
    }
  };

  return (
    <PageContainer>
      <div className="max-w-md mx-auto my-8 p-8 rounded-3xl glass-panel shadow-2xl animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Create Your Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Join FTS Store to manage orders, save addresses, and enjoy faster checkout
          </p>
        </div>

        {/* Error Alert */}
        {(validationError || authError) && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Connor"
            leftIcon={<User className="w-4 h-4" />}
            required
            autoComplete="name"
          />

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
                placeholder="Minimum 8 characters"
                required
                autoComplete="new-password"
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

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Password Complexity Checklist */}
          {password.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasLetter ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>Contains at least one letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasDigit ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>Contains at least one number</span>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Passwords match</span>
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Customer Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign in
          </Link>
        </p>

      </div>
    </PageContainer>
  );
};
