import { base44 } from '@/api/base44Client';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function petMatchesAlert(pet, alert) {
  if (alert.status_filter !== 'both' && pet.status !== alert.status_filter) return false;
  if (alert.pet_type !== 'any' && pet.pet_type !== alert.pet_type) return false;
  if (alert.breed && pet.breed) {
    if (!pet.breed.toLowerCase().includes(alert.breed.toLowerCase())) return false;
  }
  if (alert.latitude && alert.longitude && pet.latitude && pet.longitude) {
    const dist = haversineDistance(alert.latitude, alert.longitude, pet.latitude, pet.longitude);
    if (dist > alert.radius_miles) return false;
  }
  return true;
}

function buildEmailBody(pet) {
  const petTypeLabels = { dog: '🐕 Dog', cat: '🐱 Cat', bird: '🐦 Bird', rabbit: '🐰 Rabbit', other: '🐾 Other' };
  const statusLabel = pet.status === 'lost' ? '🚨 Lost' : '✅ Found';

  return `
A new pet report matches your alert!

${statusLabel} ${petTypeLabels[pet.pet_type] || pet.pet_type}
${pet.name ? `Name: ${pet.name}` : ''}
${pet.breed ? `Breed: ${pet.breed}` : ''}
${pet.color ? `Color: ${pet.color}` : ''}
Location: ${pet.location}
Description: ${pet.description}

Contact: ${pet.contact_name}${pet.contact_phone ? ` · ${pet.contact_phone}` : ''}${pet.contact_email ? ` · ${pet.contact_email}` : ''}
  `.trim();
}

export async function fireMatchingAlerts(pet) {
  const alerts = await base44.entities.Alert.filter({ is_active: true });
  const matching = alerts.filter(a => petMatchesAlert(pet, a));

  await Promise.all(matching.map(alert =>
    base44.integrations.Core.SendEmail({
      to: alert.email,
      subject: `🐾 Pet Alert: ${pet.status === 'lost' ? 'Lost' : 'Found'} ${pet.pet_type}${pet.name ? ` (${pet.name})` : ''} near you`,
      body: buildEmailBody(pet)
    })
  ));
}