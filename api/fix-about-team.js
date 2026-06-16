const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEAM = [
  {
    name: "Erin Maxson",
    role: "Founder",
    bio: "lifelong animal lover with 10+ years in rescue work. dog mom of 3 and duck mom of 6. forever passionate about every pet getting the chance at love in a home where they can experience the joys of life.",
    emoji: "🐾",
    photo_url: ""
  },
  {
    name: "Rory",
    role: "Co-Founder",
    bio: "She's the reason we made every pet matters. Rescued from a kill shelter in Louisiana, she traveled all over the U.S., loved being on the water or paddleboard, and was the best co-pilot for any adventure. We miss her dearly, but she's forever our inspiration.",
    emoji: "🐾",
    photo_url: ""
  },
  {
    name: "Pasta",
    role: "Chief Outside Officer",
    bio: "Reminds us to take breaks, get outdoors, and lift our snoots to the sky. When she's not outside, she's at the front window watching the world go by.",
    emoji: "🌳",
    photo_url: ""
  },
  {
    name: "Moe",
    role: "Chief Guardian Officer",
    bio: "Head of security and loves to make you aware of any movement anywhere. When he's not actively securing the perimeter, you can find him cuddled up with his dad on the couch.",
    emoji: "🛡️",
    photo_url: ""
  },
  {
    name: "Finn",
    role: "Chief Nap Officer",
    bio: "Expert in finding the sunniest spots and coziest blankets. Finn ensures all team members take adequate rest breaks.",
    emoji: "😴",
    photo_url: ""
  },
  {
    name: "The Ducks",
    role: "HR Department",
    bio: "Keeping the flock together and making sure everyone is heard. The ducks handle all quacking concerns with grace.",
    emoji: "🦆",
    photo_url: ""
  },
  {
    name: "Alex",
    role: "Chief Treat Officer",
    bio: "Responsible for taste-testing all treats and ensuring quality control meets the highest standards. No treat goes unreviewed.",
    emoji: "🦴",
    photo_url: ""
  }
];

export default async function handler(req, res) {
  const getRes = await fetch(`${SUPABASE_URL}/rest/v1/about_page_content?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const rows = await getRes.json();

  if (!rows?.length) {
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/about_page_content`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ team_members: TEAM }),
    });
    const created = await createRes.json();
    return res.status(200).json({ action: 'created', result: created });
  }

  const id = rows[0].id;
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/about_page_content?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ team_members: TEAM }),
  });
  const patched = await patchRes.json();
  return res.status(200).json({ action: 'updated', result: patched });
}
