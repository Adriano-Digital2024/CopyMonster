import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';

export default function GDPR() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <Card className="max-w-4xl mx-auto p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">GDPR Compliance</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 14, 2024</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Our Commitment to GDPR</h2>
              <p className="text-muted-foreground">
                CopyMonster is committed to protecting the privacy and security of personal data in compliance with the General Data Protection Regulation (GDPR). This document outlines how we handle personal data for users in the European Economic Area (EEA), United Kingdom, and Switzerland.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Data Controller Information</h2>
              <p className="text-muted-foreground">
                CopyMonster acts as the Data Controller for personal data collected through our platform. Our contact details are:
              </p>
              <p className="text-muted-foreground mt-2">
                Company: CopyMonster<br />
                Email: gdpr@copymonster.app<br />
                Address: São Paulo, Brazil
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing</h2>
              <p className="text-muted-foreground mb-4">
                We process personal data under the following legal bases:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Contract Performance:</strong> Processing necessary to provide our services as agreed</li>
                <li><strong>Legitimate Interests:</strong> Improving our services, fraud prevention, and security</li>
                <li><strong>Consent:</strong> Marketing communications and non-essential cookies</li>
                <li><strong>Legal Obligation:</strong> Compliance with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Your Rights Under GDPR</h2>
              <p className="text-muted-foreground mb-4">
                As a data subject under GDPR, you have the following rights:
              </p>
              
              <h3 className="text-xl font-medium mb-2">4.1 Right of Access (Article 15)</h3>
              <p className="text-muted-foreground mb-4">
                You can request a copy of your personal data and information about how it is processed.
              </p>

              <h3 className="text-xl font-medium mb-2">4.2 Right to Rectification (Article 16)</h3>
              <p className="text-muted-foreground mb-4">
                You can request correction of inaccurate or incomplete personal data.
              </p>

              <h3 className="text-xl font-medium mb-2">4.3 Right to Erasure (Article 17)</h3>
              <p className="text-muted-foreground mb-4">
                You can request deletion of your personal data under certain circumstances ("right to be forgotten").
              </p>

              <h3 className="text-xl font-medium mb-2">4.4 Right to Restriction (Article 18)</h3>
              <p className="text-muted-foreground mb-4">
                You can request that we limit processing of your personal data in specific situations.
              </p>

              <h3 className="text-xl font-medium mb-2">4.5 Right to Data Portability (Article 20)</h3>
              <p className="text-muted-foreground mb-4">
                You can request your data in a structured, commonly used, machine-readable format.
              </p>

              <h3 className="text-xl font-medium mb-2">4.6 Right to Object (Article 21)</h3>
              <p className="text-muted-foreground mb-4">
                You can object to processing based on legitimate interests or for direct marketing purposes.
              </p>

              <h3 className="text-xl font-medium mb-2">4.7 Rights Related to Automated Decision-Making (Article 22)</h3>
              <p className="text-muted-foreground">
                You have rights related to automated decision-making, including profiling.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. How to Exercise Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                To exercise any of these rights, you can:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Email us at gdpr@copymonster.app</li>
                <li>Use the data management features in your account settings</li>
                <li>Submit a formal request through our website</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We will respond to your request within 30 days. In complex cases, we may extend this period by an additional 60 days with prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
              <p className="text-muted-foreground">
                When we transfer personal data outside the EEA, we ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions for specific countries</li>
                <li>Binding Corporate Rules where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Protection Measures</h2>
              <p className="text-muted-foreground mb-4">
                We implement robust technical and organizational measures:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>End-to-end encryption for data in transit</li>
                <li>Encryption at rest for stored data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Data Breach Notification</h2>
              <p className="text-muted-foreground">
                In the event of a personal data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours. If the breach is likely to result in high risk to you, we will also notify you directly without undue delay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Supervisory Authority</h2>
              <p className="text-muted-foreground">
                You have the right to lodge a complaint with a supervisory authority, particularly in the EU Member State of your residence, place of work, or place of the alleged infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Our Data Protection Team</h2>
              <p className="text-muted-foreground">
                For any GDPR-related inquiries or to exercise your rights:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: gdpr@copymonster.app<br />
                Subject: GDPR Request - [Your Request Type]
              </p>
            </section>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}