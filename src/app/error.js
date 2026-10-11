'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="container text-center py-5">
        <h1 className="display-4 fw-bold text-danger mb-3">Oops! Something went wrong.</h1>
        <p className="text-muted mb-5 max-w-md mx-auto">
          We encountered an unexpected error. Our technical team has been notified.
        </p>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="btn btn-primary px-4 py-2 rounded-pill shadow-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
