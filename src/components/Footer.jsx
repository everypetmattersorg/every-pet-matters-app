import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#2B5242]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-[#faf5f0]">
              <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png" alt="every pet logo" className="w-20 h-20" />
              <span className="font-black text-lg text-[hsl(var(--background))]">every pet matters</span>
            </div>
            <p className="text-sm leading-relaxed text-[#faf5f0]">connecting pets, rescues, and communities — because every pet deserves a loving home.

            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-[#e7b008]">EXPLORE</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--background))]">
              <li><Link to={createPageUrl("Adopt")} className="hover:text-yellow-400 transition-colors">adopt a pet</Link></li>
              <li><Link to={createPageUrl("LostAndFound")} className="hover:text-yellow-400 transition-colors">lost and found</Link></li>
              <li><Link to={createPageUrl("Volunteer")} className="hover:text-yellow-400 transition-colors">volunteer</Link></li>
              <li><Link to={createPageUrl("Community")} className="hover:text-yellow-400 transition-colors">community</Link></li>
              <li><Link to={createPageUrl("RescueDirectory")} className="hover:text-yellow-400 transition-colors">find rescues</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide bg-transparent text-[#e7b008]">ABOUT US</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--background))]">
              <li><Link to={createPageUrl("About")} className="hover:text-yellow-400 transition-colors">about us</Link></li>
              <li><Link to={createPageUrl("Contact")} className="hover:text-yellow-400 transition-colors">contact</Link></li>
              <li><Link to={createPageUrl("TermsAndConditions")} className="hover:text-yellow-400 transition-colors">terms and conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <a href="https://facebook.com/everypetmattersorg" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--background))] hover:text-yellow-400 transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/everypetmattersorg" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--background))] hover:text-yellow-400 transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/in/company/every-pet-matters" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--background))] hover:text-yellow-400 transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-[hsl(var(--background))]">© {new Date().getFullYear()} every pet. all rights reserved.</span>
            <span className="hidden sm:flex items-center gap-1 text-[hsl(var(--background))]">made with <Heart className="w-4 h-4 text-red-500" /> for pets everywhere</span>
          </div>
        </div>
      </div>
    </footer>);
}