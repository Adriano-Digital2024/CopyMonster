import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';

export default function CookiePolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <Card className="max-w-4xl mx-auto p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 14, 2024</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience. CopyMonster uses cookies and similar technologies to provide, protect, and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium mb-2">2.1 Essential Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>User authentication and session management</li>
                <li>Security features and fraud prevention</li>
                <li>Load balancing and server optimization</li>
                <li>Remembering your login status</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">2.2 Performance Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Page load times and error tracking</li>
                <li>Most visited pages and user flow</li>
                <li>Feature usage analytics</li>
                <li>Performance optimization data</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">2.3 Functionality Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies enable personalized features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Language preferences</li>
                <li>Theme settings (dark/light mode)</li>
                <li>User interface preferences</li>
                <li>Recently used features</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">2.4 Marketing Cookies</h3>
              <p className="text-muted-foreground">
                With your consent, we may use cookies for marketing purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tracking advertising campaign effectiveness</li>
                <li>Personalizing ads based on your interests</li>
                <li>Measuring conversion rates</li>
                <li>Retargeting campaigns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use services from third parties that may set their own cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
                <li><strong>Supabase:</strong> Authentication and database services</li>
                <li><strong>Analytics providers:</strong> Website usage statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Note: Disabling essential cookies may affect the functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Retention</h2>
              <p className="text-muted-foreground">
                Cookie retention periods vary based on their purpose:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain for a set period (typically 30 days to 2 years)</li>
                <li><strong>Authentication cookies:</strong> Valid for the duration of your session or until logout</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy to reflect changes in our practices or for legal reasons. The "Last updated" date will be revised accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@copymonster.app<br />
                Address: São Paulo, Brazil
              </p>
            </section>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}