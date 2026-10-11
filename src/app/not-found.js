import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="container text-center py-5">
        <h1 className="display-1 fw-bold text-primary mb-3">404</h1>
        <h2 className="h3 mb-4">Page Not Found</h2>
        <p className="text-muted mb-5 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" className="btn btn-primary px-4 py-2 rounded-pill shadow-sm">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
