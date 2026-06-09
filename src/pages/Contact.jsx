import { useState } from "react";
import { Heart, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: "bark@everypetmatters.org",
      subject: `[contact form] ${form.subject}`,
      body: `from: ${form.name} (${form.email})\n\n${form.message}`
    });
    toast.success("message sent! we'll get back to you soon.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#FAF5F0" }}>
      {/* Hero */}
      <div className="text-white px-4 py-14" style={{ background: "#0F3D1F" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-4" style={{ background: "rgba(222,192,170,0.2)", color: "#DEC0AA" }}>
            <MessageCircle className="w-4 h-4" /> get in touch
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#DEC0AA" }}>contact us</h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#DEC0AA", opacity: 0.85 }}>
            have a question, partnership inquiry, or just want to say hi? we'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black mb-2" style={{ color: "#0F3D1F" }}>let's talk</h2>
            <p className="text-stone-600">whether you're a rescue, a pet lover, or want to partner with us — reach out anytime.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border" style={{ borderColor: "#DEC0AA" }}>
              <Mail className="w-5 h-5" style={{ color: "#D3713C" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F3D1F" }}>general inquiries</p>
                <p className="text-sm text-stone-500">bark@everypetmatters.org</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border" style={{ borderColor: "#DEC0AA" }}>
              <Heart className="w-5 h-5" style={{ color: "#D3713C" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F3D1F" }}>rescues & partners</p>
                <p className="text-sm text-stone-500">partner@everypetmatters.org</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border" style={{ borderColor: "#DEC0AA" }}>
              <MapPin className="w-5 h-5" style={{ color: "#D3713C" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F3D1F" }}>based in</p>
                <p className="text-sm text-stone-500">Phoenix, Arizona, USA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8 space-y-4 border" style={{ borderColor: "#DEC0AA" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-stone-700 mb-1 block">name</label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="your name" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700 mb-1 block">email</label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1 block">subject</label>
            <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="what's this about?" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1 block">message</label>
            <Textarea value={form.message} onChange={e => set("message", e.target.value)} placeholder="tell us more..." className="h-32" required />
          </div>
          <Button type="submit" disabled={sending} className="w-full h-11 rounded-xl font-bold" style={{ background: "#0F3D1F" }}>
            {sending ? "sending..." : "send message"}
          </Button>
        </form>
      </div>
    </div>
  );
}