import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/States';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-canvas p-6">
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        description="The link may be broken or the page may have moved."
        action={
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
