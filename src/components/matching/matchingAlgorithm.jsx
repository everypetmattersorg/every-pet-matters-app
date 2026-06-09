/**
 * Comprehensive pet-adopter matching algorithm
 * Calculates compatibility based on multiple factors with weighted scoring
 */

export async function matchAdoptersForPet(pet, adopters) {
  if (!adopters || adopters.length === 0) return [];

  return adopters
    .map(adopter => ({
      adopter,
      score: calculateCompatibilityScore(pet, adopter),
      reasons: getMatchReasons(pet, adopter)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 matches
}

export async function matchPetsForAdopter(adopter, pets) {
  if (!pets || pets.length === 0) return [];

  return pets
    .map(pet => ({
      pet,
      score: calculateCompatibilityScore(pet, adopter),
      reasons: getMatchReasons(pet, adopter)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 matches
}

function calculateCompatibilityScore(pet, adopter) {
  let score = 0;
  let maxScore = 0;

  // 1. Pet type preference match (25 points)
  if (adopter.pet_preferences?.preferred_pet_types) {
    maxScore += 25;
    if (adopter.pet_preferences.preferred_pet_types.includes(pet.pet_type)) {
      score += 25;
    } else {
      score += 5; // Slight credit for being open
    }
  }

  // 2. Energy level compatibility (20 points)
  if (adopter.pet_preferences?.preferred_energy_level && pet.energy_level) {
    maxScore += 20;
    const energyMatch = scoreEnergyMatch(pet.energy_level, adopter.pet_preferences.preferred_energy_level);
    score += energyMatch * 20;
  }

  // 3. Size/weight compatibility with living situation (20 points)
  if (adopter.pet_preferences?.living_situation && pet.weight_lbs) {
    maxScore += 20;
    const sizeScore = scoreSizeForLiving(pet.weight_lbs, adopter.pet_preferences.living_situation);
    score += sizeScore * 20;
  }

  // 4. Household compatibility (25 points)
  if (adopter.pet_preferences) {
    maxScore += 25;
    let householdScore = 0;
    let householdFactors = 0;

    if (adopter.pet_preferences.has_kids !== undefined) {
      householdFactors++;
      if (adopter.pet_preferences.has_kids && pet.good_with_kids) householdScore += 1;
      else if (!adopter.pet_preferences.has_kids) householdScore += 1;
    }

    if (adopter.pet_preferences.has_other_dogs !== undefined) {
      householdFactors++;
      if (adopter.pet_preferences.has_other_dogs && pet.good_with_dogs) householdScore += 1;
      else if (!adopter.pet_preferences.has_other_dogs) householdScore += 1;
    }

    if (adopter.pet_preferences.has_other_cats !== undefined) {
      householdFactors++;
      if (adopter.pet_preferences.has_other_cats && pet.good_with_cats) householdScore += 1;
      else if (!adopter.pet_preferences.has_other_cats) householdScore += 1;
    }

    if (householdFactors > 0) {
      score += (householdScore / householdFactors) * 25;
    } else {
      score += 25; // Full credit if no household preferences specified
    }
  }

  // 5. Special needs compatibility (10 points)
  if (pet.special_needs) {
    maxScore += 10;
    if (adopter.pet_preferences?.willing_special_needs) {
      score += 10;
    } else {
      score += 0;
    }
  }

  // 6. Adopter experience level (10 points)
  if (adopter.pet_preferences?.experience_level) {
    maxScore += 10;
    const expScore = scoreExperienceMatch(pet, adopter.pet_preferences.experience_level);
    score += expScore * 10;
  }

  // 7. Adoption fee affordability (10 points)
  if (pet.adoption_fee && adopter.pet_preferences?.budget) {
    maxScore += 10;
    if (pet.adoption_fee <= adopter.pet_preferences.budget) {
      score += 10;
    } else {
      score += 0;
    }
  }

  // Calculate percentage score (0-100)
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

function scoreEnergyMatch(petEnergy, preferredEnergy) {
  const energyLevels = { low: 1, medium: 2, high: 3 };
  const petEng = energyLevels[petEnergy] || 2;
  const prefEng = energyLevels[preferredEnergy] || 2;

  const diff = Math.abs(petEng - prefEng);
  if (diff === 0) return 1; // Perfect match
  if (diff === 1) return 0.7; // Close match
  return 0.3; // Not ideal
}

function scoreSizeForLiving(weightLbs, livingSituation) {
  // Apartment living suits smaller pets
  if (livingSituation === "apartment") {
    if (weightLbs < 30) return 1;
    if (weightLbs < 60) return 0.7;
    return 0.3;
  }

  // House living suits all sizes
  if (livingSituation === "house") {
    if (weightLbs < 100) return 1;
    return 0.8;
  }

  // Farm/rural suits larger pets
  if (livingSituation === "farm_rural") {
    if (weightLbs > 50) return 1;
    return 0.8;
  }

  return 0.7; // Unknown living situation
}

function scoreExperienceMatch(pet, adopterExperience) {
  const isComplexPet = pet.special_needs || pet.energy_level === "high";

  if (adopterExperience === "experienced") return 1;
  if (adopterExperience === "moderate") {
    return isComplexPet ? 0.6 : 1;
  }
  if (adopterExperience === "first_time") {
    return isComplexPet ? 0.2 : 0.9;
  }

  return 0.7;
}

function getMatchReasons(pet, adopter) {
  const reasons = [];

  // Pet type match
  if (adopter.pet_preferences?.preferred_pet_types?.includes(pet.pet_type)) {
    reasons.push(`Looking for ${pet.pet_type}s`);
  }

  // Energy level match
  if (adopter.pet_preferences?.preferred_energy_level) {
    const energyMatch = scoreEnergyMatch(pet.energy_level, adopter.pet_preferences.preferred_energy_level);
    if (energyMatch >= 0.7) {
      reasons.push(`Energy level match (${pet.energy_level})`);
    }
  }

  // Good with kids
  if (adopter.pet_preferences?.has_kids && pet.good_with_kids) {
    reasons.push("Pet is great with children");
  }

  // Good with other pets
  if (adopter.pet_preferences?.has_other_dogs && pet.good_with_dogs) {
    reasons.push("Good with other dogs");
  }
  if (adopter.pet_preferences?.has_other_cats && pet.good_with_cats) {
    reasons.push("Good with cats");
  }

  // Size match
  if (adopter.pet_preferences?.living_situation) {
    const sizeScore = scoreSizeForLiving(pet.weight_lbs, adopter.pet_preferences.living_situation);
    if (sizeScore >= 0.7) {
      reasons.push(`Good fit for ${adopter.pet_preferences.living_situation}`);
    }
  }

  // Special needs
  if (pet.special_needs && adopter.pet_preferences?.willing_special_needs) {
    reasons.push("Adopter open to special needs pets");
  }

  // Budget
  if (pet.adoption_fee && adopter.pet_preferences?.budget && pet.adoption_fee <= adopter.pet_preferences.budget) {
    reasons.push("Adoption fee is within budget");
  }

  return reasons.slice(0, 3); // Top 3 reasons
}