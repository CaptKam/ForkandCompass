import PageLayout from "@/components/PageLayout";

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-8">
          <div className="space-y-4 mb-16">
            <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">Legal</span>
            <h1 className="font-serif text-5xl md:text-6xl text-[#1C1A17]">Privacy Policy</h1>
            <div className="w-20 h-1 bg-[#9A4100] rounded-full" />
            <p className="text-[#725a3c] text-sm">Last updated: March 2025</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-10 text-[#725a3c]">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">1. Introduction</h2>
              <p className="leading-relaxed">Fork &amp; Compass ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our website and mobile application (collectively, the "Service").</p>
              <p className="leading-relaxed">By using Fork &amp; Compass, you agree to the collection and use of information in accordance with this policy.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">2. Information We Collect</h2>
              <p className="leading-relaxed">We collect several types of information for various purposes:</p>
              <ul className="space-y-3 list-none pl-0">
                {[
                  { title: "Email address", desc: "Collected when you join our waitlist or create an account. Used to send you updates, early access invitations, and product news." },
                  { title: "Usage data", desc: "We collect information on how you access and use the Service, including which recipes you view, save, or cook, and which countries you explore." },
                  { title: "Device information", desc: "We may collect information about the device you use to access the Service, including the hardware model, operating system, and mobile network information." },
                  { title: "Grocery and shopping data", desc: "If you use the Instacart integration, we transmit your ingredient list to Instacart to facilitate your shopping. We do not store your Instacart credentials." },
                ].map((item) => (
                  <li key={item.title} className="border-l-2 border-[#9A4100]/20 pl-4">
                    <span className="font-bold text-[#1C1A17]">{item.title}:</span> {item.desc}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">3. How We Use Your Information</h2>
              <p className="leading-relaxed">We use the collected data for the following purposes:</p>
              <ul className="space-y-2 list-disc pl-6">
                {[
                  "To provide and maintain the Service",
                  "To notify you about changes to the Service or your early access status",
                  "To allow you to participate in interactive features of the Service",
                  "To provide customer support",
                  "To gather usage analysis to improve the Service",
                  "To monitor the usage of the Service for technical and security purposes",
                ].map((item) => (
                  <li key={item} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">4. Data Retention</h2>
              <p className="leading-relaxed">We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.</p>
              <p className="leading-relaxed">Waitlist email addresses are retained until you unsubscribe or request deletion. You may do so at any time by emailing <a href="mailto:hello@forkandcompass.com" className="text-[#9A4100] underline">hello@forkandcompass.com</a>.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">5. Data Security</h2>
              <p className="leading-relaxed">The security of your data is important to us. We use commercially reasonable measures to protect your personal information, including encrypted database storage and secure HTTPS connections. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">6. Third-Party Services</h2>
              <p className="leading-relaxed">Our Service may contain links to or integrations with third-party websites and services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
              <p className="leading-relaxed">We use Instacart's developer API to power the grocery list feature. Your use of this feature is subject to <a href="https://www.instacart.com/privacy" className="text-[#9A4100] underline" target="_blank" rel="noopener noreferrer">Instacart's Privacy Policy</a>.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">7. Your Rights</h2>
              <p className="leading-relaxed">Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul className="space-y-2 list-disc pl-6">
                {[
                  "The right to access the personal data we hold about you",
                  "The right to request correction of inaccurate personal data",
                  "The right to request deletion of your personal data",
                  "The right to object to or restrict our processing of your personal data",
                  "The right to data portability",
                ].map((item) => (
                  <li key={item} className="leading-relaxed">{item}</li>
                ))}
              </ul>
              <p className="leading-relaxed">To exercise any of these rights, please contact us at <a href="mailto:hello@forkandcompass.com" className="text-[#9A4100] underline">hello@forkandcompass.com</a>.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">8. Children's Privacy</h2>
              <p className="leading-relaxed">Our Service is not directed at anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected personal data from a child under 13 without verification of parental consent, we will take steps to remove that information from our servers.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">9. Changes to This Policy</h2>
              <p className="leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top. We encourage you to review this Privacy Policy periodically.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">10. Contact Us</h2>
              <p className="leading-relaxed">If you have any questions about this Privacy Policy, please contact us:</p>
              <a href="mailto:hello@forkandcompass.com" className="inline-block text-[#9A4100] font-bold text-lg border-b-2 border-[#9A4100]/20 hover:border-[#9A4100] transition-all pb-1">
                hello@forkandcompass.com
              </a>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
