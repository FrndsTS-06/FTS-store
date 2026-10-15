import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="text-center py-16 sm:py-24 max-w-xl mx-auto">
        <div className="relative inline-block mb-6">
          <div className="text-8xl sm:text-9xl font-black font-display bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-display">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          The requested page could not be located in the FTS Store catalog. It might have moved, or the URL might be mistyped.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
