import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen" style={{ background: '#faf5f0' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🐾</span>
              <h2 className="text-xl font-bold">terms & conditions</h2>
            </div>
            <p className="text-sm text-muted-foreground">please read our terms before signing up with an every pet matters account.</p>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="h-[600px] px-6 py-4">
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <section>
                <h3 className="font-semibold text-base mb-1">1. acceptance of terms</h3>
                <p>by creating an account and using every pet matters, you agree to be bound by these terms & conditions. if you do not agree, please do not use this platform.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">2. use of the platform</h3>
                <p>every pet matters is a platform connecting animal shelters, rescues, and adopters. you agree to use it solely for lawful purposes related to animal welfare, adoption, and rescue coordination.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">3. account responsibilities</h3>
                <p>you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. you agree to provide accurate and current information.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">4. animal listings</h3>
                <p>shelters and rescues are responsible for the accuracy of their animal listings. every pet matters does not guarantee the availability, health, or status of any animal listed on the platform.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">5. privacy policy</h3>
                <p>we collect and process personal data as described in our privacy policy. by using every pet matters, you consent to this data processing. we do not sell your personal information to third parties.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">6. content & conduct</h3>
                <p>you agree not to post false, misleading, or harmful content. every pet matters reserves the right to remove any content or suspend accounts that violate these terms or community standards. you are responsible for turning off or hiding information that you do not want shared within this platform related to animals, shelter contact information, and personal information. you will always have the option to either hide or remove information, but it's up to you on how you decide to use this platform and share your data.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">7. limitation of liability</h3>
                <p>every pet matters is provided "as is." we are not liable for any damages arising from your use of the platform, including issues related to animal adoptions, transfers, or partnerships arranged through the service. we are not liable for any changes to api documentation, security, or connections from third party shelter software. please read the documentation around your software's api before joining this platform. you are responsible for reading this information and if you accept these terms & conditions, we are not liable for any issues related to data, security, or connection in relation to your software, api connection, or public data.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">8. changes to terms</h3>
                <p>we may update these terms & conditions from time to time. continued use of every pet matters after changes constitutes acceptance of the revised terms.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">9. contact</h3>
                <p>for questions about these terms, please contact us through the platform or reach out to your shelter's administrator at <a href="mailto:bark@everypetmatters.org" className="text-primary underline">bark@everypetmatters.org</a>.</p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>);

}