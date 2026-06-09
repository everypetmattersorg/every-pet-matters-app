// Renders quality pill tags overlaid on a pet photo (bottom of image)
export default function PetPillTags({ pet, source = 'adoptable' }) {
  const tags = [];

  if (source === 'adoptable') {
    if (pet.good_with_kids)  tags.push({ label: '👶 kids ok',    color: 'bg-green-500' });
    if (pet.good_with_dogs)  tags.push({ label: '🐕 dogs ok',    color: 'bg-blue-500' });
    if (pet.good_with_cats)  tags.push({ label: '🐱 cats ok',    color: 'bg-purple-500' });
    if (pet.energy_level === 'low')    tags.push({ label: '😌 low energy',  color: 'bg-slate-500' });
    if (pet.energy_level === 'medium') tags.push({ label: '⚡ med energy',  color: 'bg-amber-500' });
    if (pet.energy_level === 'high')   tags.push({ label: '🔥 high energy', color: 'bg-orange-500' });
  } else {
    // Pet entity (lost/found/synced)
    if (pet.vaccinated)       tags.push({ label: '💉 vaccinated',      color: 'bg-green-500' });
    if (pet.spayed_neutered)  tags.push({ label: '✂️ spayed/neutered', color: 'bg-teal-500' });
    if (pet.dewormed)         tags.push({ label: '🐛 dewormed',        color: 'bg-emerald-600' });
    if (pet.kid_friendly === 'yes')  tags.push({ label: '👶 kids ok',  color: 'bg-green-500' });
    if (pet.dog_friendly === 'yes')  tags.push({ label: '🐕 dogs ok',  color: 'bg-blue-500' });
    if (pet.cat_friendly === 'yes')  tags.push({ label: '🐱 cats ok',  color: 'bg-purple-500' });
  }

  if (tags.length === 0) return null;

  return (
    <div className="absolute bottom-3 right-3 flex flex-wrap gap-1 justify-end max-w-[90%]">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`${tag.color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow`}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}