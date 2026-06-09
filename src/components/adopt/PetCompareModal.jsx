import { X, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Row = ({ label, values }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50">
    <td className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50 border-r border-slate-100 w-32">{label}</td>
    {values.map((val, i) => (
      <td key={i} className="py-3 px-4 text-sm text-slate-700 text-center">
        {val === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> :
         val === false ? <Minus className="w-4 h-4 text-red-400 mx-auto" /> :
         val || <span className="text-slate-300">—</span>}
      </td>
    ))}
  </tr>
);

export default function PetCompareModal({ pets, onClose }) {
  const ageDisplay = (pet) => {
    if (pet.age_years && pet.age_months) return `${pet.age_years}y ${pet.age_months}m`;
    if (pet.age_years) return `${pet.age_years} yr${pet.age_years !== 1 ? "s" : ""}`;
    if (pet.age_months) return `${pet.age_months} mo`;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Compare Pets</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            {/* Pet Photos & Names */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 bg-slate-50 border-r border-slate-100 w-32" />
                {pets.map(pet => (
                  <th key={pet.id} className="py-4 px-4 text-center min-w-[160px]">
                    <div className="flex flex-col items-center gap-2">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">🐾</div>
                      )}
                      <span className="font-bold text-slate-800 text-base">{pet.name}</span>
                      <span className="text-xs text-rose-600 font-medium">{pet.rescue_name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Species"     values={pets.map(p => p.pet_type)} />
              <Row label="Breed"       values={pets.map(p => p.breed)} />
              <Row label="Age"         values={pets.map(ageDisplay)} />
              <Row label="Gender"      values={pets.map(p => p.gender !== "unknown" ? p.gender : null)} />
              <Row label="Weight"      values={pets.map(p => p.weight_lbs ? `${p.weight_lbs} lbs` : null)} />
              <Row label="Energy"      values={pets.map(p => p.energy_level)} />
              <Row label="Special Needs" values={pets.map(p => p.special_needs === true ? true : p.special_needs === false ? false : null)} />
              <Row label="Good w/ Kids" values={pets.map(p => p.good_with_kids)} />
              <Row label="Good w/ Dogs" values={pets.map(p => p.good_with_dogs)} />
              <Row label="Good w/ Cats" values={pets.map(p => p.good_with_cats)} />
              <Row label="Adoption Fee" values={pets.map(p => p.adoption_fee !== undefined ? `$${p.adoption_fee}` : null)} />
              <Row label="Location"    values={pets.map(p => [p.rescue_city, p.rescue_state].filter(Boolean).join(", ") || null)} />
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </div>
  );
}