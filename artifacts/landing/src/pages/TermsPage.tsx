import PageLayout from "@/components/PageLayout";

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-8">
          <div className="space-y-4 mb-16">
            <span className="text-[#8A3800] font-bold uppercase tracking-[0.4em] text-sm block">Legal</span>
            <h1 className="font-serif text-5xl md:text-6xl text-[#1C1A17]">Terms of Service</h1>
            <div className="w-20 h-1 bg-[#8A3800] rounded-full" />
            <p className="text-[#725a3c] text-sm">Last updated: March 2025</p>
          </div>

          <div className="space-y-10 text-[#725a3c]">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">1. Agreement to Terms</h2>
              <p className="leading-relaxed">By accessing or using Fork &amp; Compass (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">2. Description of Service</h2>
              <p className="leading-relaxed">Fork &amp; Compass is a premium culinary travel application that provides curated recipes, destination guides, cooking instructions, and grocery list functionality. The Service is currently in pre-launch and available to waitlist members and invited users.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">3. User Accounts</h2>
              <p className="leading-relaxed">When you join our waitlist or create an account, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
              <p className="leading-relaxed">You may not use another person's account without their permission. You may not create an account for anyone other than yourself without their permission.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">4. Intellectual Property</h2>
              <p className="leading-relaxed">The Service and its original content, features, and functionality are and will remain the exclusive property of Fork &amp; Compass and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Fork &amp; Compass.</p>
              <p className="leading-relaxed">Recipe content, photography, editorial writing, and app design are protected by copyright. You may not reproduce, distribute, or create derivative works from any content within the Service without our explicit written permission.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">5. Acceptable Use</h2>
              <p className="leading-relaxed">You agree not to use the Service:</p>
              <ul className="space-y-2 list-disc pl-6">
                {[
                  "In any way that violates applicable local, national, or international law or regulation",
                  "To transmit any unsolicited or unauthorized advertising or promotional material",
                  "To impersonate or attempt to impersonate Fork & Compass, a Fork & Compass employee, another user, or any other person or entity",
                  "To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service",
                  "To attempt to gain unauthorized access to any portion of the Service or any other systems or networks connected to the Service",
                ].map((item) => (
                  <li key={item} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">6. Third-Party Services</h2>
              <p className="leading-relaxed">The Service may contain links to or integrations with third-party services such as Instacart. These third-party services have their own terms and privacy policies, and we encourage you to review them. Fork &amp; Compass has no control over, and assumes no responsibility for, the content or practices of any third-party services.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">7. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties, expressed or implied. Fork &amp; Compass does not warrant that the Service will be uninterrupted, error-free, or free of harmful components.</p>
              <p className="leading-relaxed">Recipes are provided for informational purposes. Fork &amp; Compass is not responsible for any food safety issues, allergic reactions, or adverse outcomes resulting from the preparation of any recipe in the Service. Always follow proper food safety guidelines.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">8. Limitation of Liability</h2>
              <p className="leading-relaxed">In no event shall Fork &amp; Compass, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of (or inability to use) the Service.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">9. Governing Law</h2>
              <p className="leading-relaxed">These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located within the United States.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">10. Changes to Terms</h2>
              <p className="leading-relaxed">We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[#1C1A17]">11. Contact Us</h2>
              <p className="leading-relaxed">If you have any questions about these Terms, please contact us:</p>
              <a href="mailto:hello@forkandcompass.com" className="inline-block text-[#8A3800] font-bold text-lg border-b-2 border-[#8A3800]/20 hover:border-[#8A3800] transition-all pb-1">
                hello@forkandcompass.com
              </a>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
