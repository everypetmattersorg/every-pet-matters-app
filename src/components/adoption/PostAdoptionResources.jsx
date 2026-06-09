import { BookOpen, Heart, Activity, Users, AlertCircle, HomeIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PostAdoptionResources() {
  const resources = [
    {
      icon: Activity,
      title: "Pet Health & Wellness",
      description: "Regular vet checkups, vaccination schedules, and health tips for your new pet.",
      tips: [
        "Schedule a vet visit within the first week of adoption",
        "Keep up with vaccination and flea/tick prevention schedules",
        "Monitor eating, drinking, and bathroom habits",
      ],
    },
    {
      icon: Users,
      title: "Training & Behavior",
      description: "Resources to help your pet adjust and address common behavioral issues.",
      tips: [
        "Give your pet 2-3 weeks to adjust to their new home",
        "Use positive reinforcement training methods",
        "Consider working with a professional trainer if needed",
      ],
    },
    {
      icon: Heart,
      title: "Building Bonds",
      description: "Tips for creating a loving relationship with your newly adopted pet.",
      tips: [
        "Spend quality time with your pet daily",
        "Establish consistent routines and boundaries",
        "Use play and treats to build positive associations",
      ],
    },
    {
      icon: HomeIcon,
      title: "Home Preparation",
      description: "Making your home safe and comfortable for your new family member.",
      tips: [
        "Puppy/kitten-proof your home",
        "Set up a designated safe space for your pet",
        "Have essential supplies ready (food, water bowls, toys, bedding)",
      ],
    },
    {
      icon: AlertCircle,
      title: "Emergency Preparedness",
      description: "Be ready for emergencies and know how to handle common health issues.",
      tips: [
        "Keep emergency vet clinic contact info handy",
        "Get pet microchip information registered",
        "Know signs of common emergencies",
      ],
    },
    {
      icon: Users,
      title: "Support Community",
      description: "Connect with other pet owners and get advice from experienced adopters.",
      tips: [
        "Join local pet owner groups and meetups",
        "Share your adoption story and help others",
        "Reach out to your rescue for additional support",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl p-8 border border-rose-200">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-bold text-slate-900">Post-Adoption Support</h2>
        </div>
        <p className="text-slate-600">
          Your pet's transition to their new home is an important time. Here are resources to help ensure a smooth adjustment and healthy, happy life together.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, idx) => {
          const Icon = resource.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Icon className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{resource.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">{resource.description}</p>
              <ul className="space-y-2">
                {resource.tips.map((tip, tipIdx) => (
                  <li key={tipIdx} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Need Additional Help?</h3>
        <p className="text-slate-700 mb-4">
          Your rescue organization is here to support you! Feel free to reach out with any questions, concerns, or just to share updates about your new pet. They're invested in your success as pet parents!
        </p>
        <p className="text-sm text-slate-600">
          Share updates using the "Add Update" button on your pet's profile. Your rescue loves hearing about how your pet is doing!
        </p>
      </div>
    </div>
  );
}