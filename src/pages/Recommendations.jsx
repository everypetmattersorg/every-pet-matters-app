import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import AdoptablePetCard from "@/components/adopt/AdoptablePetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageUrl } from "@/utils";

export default function Recommendations() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [rankedPets, setRankedPets] = useState([]);
  const [matching, setMatching] = useState(false);
  const lastPrefsKey = useRef(null);

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ["adoptable-pets"],
    queryFn: () => base44.entities.AdoptablePet.list("-created_date", 100)
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!user?.preferences || pets.length === 0 || matching) return;
    // Only re-run if preferences have actually changed
    const prefsKey = JSON.stringify(user.preferences);
    if (lastPrefsKey.current === prefsKey && rankedPets.length > 0) return;
    lastPrefsKey.current = prefsKey;

    const runMatching = async () => {
      try {
        setMatching(true);
        setRankedPets([]);

        const prompt = `You are a pet adoption expert. Given the following user preferences and a list of adoptable pets, rank the pets from best to worst match.

User Preferences:
- Living: ${user.preferences.living_situation}
- Household: ${user.preferences.household_size} people${user.preferences.have_kids ? ", with children" : ""}${user.preferences.have_pets ? ", with other pets" : ""}
- Experience: ${user.preferences.experience_level}
- Activity Level: ${user.preferences.activity_level}
- Time Available: ${user.preferences.time_availability}
- Pet Types: ${user.preferences.preferred_pet_types?.length ? user.preferences.preferred_pet_types.join(", ") : "any"}
- Preferred Age: ${user.preferences.preferred_age}
- Preferred Size: ${user.preferences.preferred_size?.length ? user.preferences.preferred_size.join(", ") : "any"}
- Has Allergies: ${user.preferences.allergies}
- Additional Notes: ${user.preferences.lifestyle_notes || "None"}

Available Pets:
${pets.map((p) => `
ID: ${p.id}
Name: ${p.name}
Type: ${p.pet_type}
Age: ${p.age_years}y ${p.age_months}m
Size: ${p.size}
Energy: ${p.energy_level}
Good with kids: ${p.good_with_kids}
Good with dogs: ${p.good_with_dogs}
Good with cats: ${p.good_with_cats}
Special needs: ${p.special_needs}
Description: ${p.description}
`).join("\n")}

Return a JSON object with an array called "ranked_pet_ids" containing pet IDs ordered from best to worst match. Also include a "match_reason" field explaining the overall reasoning.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              ranked_pet_ids: {
                type: "array",
                items: { type: "string" },
                description: "Pet IDs ranked from best to worst match"
              },
              match_reason: {
                type: "string",
                description: "Explanation of the matching logic"
              }
            }
          }
        });

        if (result.ranked_pet_ids && Array.isArray(result.ranked_pet_ids)) {
          const ranked = result.ranked_pet_ids
            .map((id) => pets.find((p) => p.id === id))
            .filter(Boolean);
          // If LLM returned IDs that don't match (e.g. hallucinated IDs), fall back to all available pets
          setRankedPets(ranked.length > 0 ? ranked : pets.filter(p => p.status === "available" || !p.status));
        } else {
          // No ranked IDs returned — show all available pets as fallback
          setRankedPets(pets.filter(p => p.status === "available" || !p.status));
        }
      } finally {
        setMatching(false);
      }
    };

    runMatching();
  }, [user, pets]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  if (!loadingUser && user && !user?.preferences) {
    return (
      <div className="min-h-screen" style={{ background: '#faf5f0' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Preferences Set</h2>
            <p className="text-slate-600 mb-6">
              To get personalized pet recommendations, please set up your preferences first.
            </p>
            <Link to={createPageUrl("Preferences")}>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                Set My Preferences
              </Button>
            </Link>
          </div>
        </div>
      </div>);
  }

  return (
    <div className="min-h-screen" style={{ background: '#faf5f0' }}>
      {/* Split Header */}
      <div className="px-4 py-6" style={{ background: '#d4916e' }}>
        <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '320px' }}>
          {/* Left: Image */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/15444bd73_IMG_3036.JPG" alt="Happy pet" className="w-full h-full object-cover" style={{ display: 'block' }} />
          </div>
          {/* Right: Content Panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: '#d4916e' }}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: '#FDF0E8', color: '#D3713C' }}>
              🎯 personalized pet match
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight text-white">your perfect match</h1>
            <p className="text-lg leading-relaxed text-white/90">based on your preferences, here are pets ranked by compatibility. meet your next best friend.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Loading State */}
        {petsLoading || matching ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) =>
          <Skeleton key={i} className="h-96 rounded-2xl" />
          )}
          </div> :
        rankedPets.length > 0 ?
        <>
            {/* Match Confidence */}
            <div className="mb-8 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-semibold">{rankedPets.length} pets</span> found based on your preferences. Click on any pet to learn more!
              </p>
            </div>

            {/* Pets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rankedPets.map((pet, index) =>
            <div key={pet.id} className="relative">
                  {index === 0 &&
              <div className="absolute -top-4 left-0 right-0 text-center z-20">
                      <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🏆 Best Match
                      </span>
                    </div>
              }
                  {index < 3 &&
              <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold z-10">
                      #{index + 1}
                    </div>
              }
                  <AdoptablePetCard pet={pet} />
                </div>
            )}
            </div>
          </> :

        <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Matches Yet</h3>
            <p className="text-slate-600 mb-6">
              Check back soon as more pets are added. You can also browse all available pets.
            </p>
            <Link to={createPageUrl("Adopt")}>
              <Button className="hover:bg-blue-700 rounded-xl bg-[#d4916e]">
                Browse All Pets
              </Button>
            </Link>
          </div>
        }

        {/* Update Preferences Button */}
        <div className="mt-12 text-center flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              lastPrefsKey.current = null;
              setRankedPets([]);
              base44.auth.me().then(setUser);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" /> Refresh Recommendations
          </Button>
          <Link to={createPageUrl("Preferences")}>
            <Button variant="outline" className="rounded-xl">
              Update My Preferences
            </Button>
          </Link>
        </div>
      </div>
    </div>);

}