import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function DataDeletionStatus() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <Card className="max-w-2xl mx-auto p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Data Deletion Request</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Your request to delete Meta-related data from CopyMonster has been received and processed.
          </p>
          {code && (
            <div className="mt-6 p-4 rounded-md bg-muted/50 border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Confirmation code
              </div>
              <div className="font-mono text-sm break-all">{code}</div>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-6">
            If you have questions about this request, contact us at{' '}
            <a className="underline" href="mailto:privacy@copymonster.me">privacy@copymonster.me</a>.
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}