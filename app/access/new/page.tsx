import { AppForm } from '@/components/access/app-form';

/**
 * Create Access Application page
 */
export default function NewAccessAppPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <AppForm mode="create" />
    </div>
  );
}
