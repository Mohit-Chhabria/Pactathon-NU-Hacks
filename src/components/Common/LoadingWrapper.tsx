import React from 'react';

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ loading, children }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
