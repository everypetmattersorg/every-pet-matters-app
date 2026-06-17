import { useState } from "react";
import { Heart, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #FAF5F0;">
        <div style="background: #0F3D1F; padding: 28px 32px; text-align: center;">
          <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png" alt="every pet matters" width="48" height="48" style="display: block; margin: 0 auto 12px;" />
          <h1 style="color: #DEC0AA; font-size: 20px; margin: 0; font-weight: 700;">new contact form submission</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #DEC0AA; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #0F3D1F; font-weight: 700; font-size: 13px; width: 90px; vertical-align: top;">name</td>
              <td style="padding: 8px 0; color: #44403c; font-size: 14px;">${form.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #0F3D1F; font-weight: 700; font-size: 13px; vertical-align: top;">email</td>
              <td style="padding: 8px 0; color: #44403c; font-size: 14px;"><a href="mailto:${form.email}" style="color: #D3713C; text-decoration: none;">${form.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #0F3D1F; font-weight: 700; font-size: 13px; vertical-align: top;">subject</td>
              <td style="padding: 8px 0; color: #44403c; font-size: 14px;">${form.subject}</td>
            </tr>
          </table>
          <div style="background: #FAF5F0; border-radius: 12px; padding: 18px; border: 1px solid #DEC0AA;">
            <p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${form.message}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 16px; color: #a8a29e; font-size: 12px;">
          sent from the contact form on everypetmatters.org
        </div>
      </div>
    `;
    try {
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ["bark@everypetmatters.org", "erin@everypetmatters.org"],
          subject: `[contact form] ${form.subject}`,
          body: `from: ${form.name} (${form.email})\n\n${form.message}`,
          html
        }),
      });
      if (!emailRes.ok) throw new Error(await emailRes.text());
      toast.success("message sent! we'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error('send-email failed:', err);
      toast.error("something went wrong sending your message. please email us directly at bark@everypetmatters.org");
    }
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