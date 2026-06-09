import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Entity name → Supabase table name mapping ───────────────────────────────
const TABLE_MAP = {
  AdoptablePet:            'adoptable_pets',
  AdoptedPetUpdate:        'adopted_pet_updates',
  AdoptionApplication:     'adoption_applications',
  AdoptionFollowUp:        'adoption_follow_ups',
  Alert:                   'alerts',
  CloakedEmail:            'cloaked_emails',
  Comment:                 'comments',
  Donation:                'donations',
  DonationGoal:            'donation_goals',
  EventRSVP:               'event_rsvps',
  EventReminder:           'event_reminders',
  Favorite:                'favorites',
  FosterApplication:       'foster_applications',
  FosterToAdoptPet:        'foster_to_adopt_pets',
  Invite:                  'invites',
  LostFoundPet:            'lost_found_pets',
  Notification:            'notifications',
  NotificationPreference:  'notification_preferences',
  OrganizationTag:         'organization_tags',
  OwnedPet:                'owned_pets',
  PartnershipNotification: 'partnership_notifications',
  Pet:                     'pets',
  PhotoMatchSearch:        'photo_match_searches',
  Post:                    'posts',
  Preferences:             'preferences',
  Rescue:                  'rescues',
  RescueAPIIntegration:    'rescue_api_integrations',
  RescueEvent:             'rescue_events',
  RescueReview:            'rescue_reviews',
  Resource:                'resources',
  Service:                 'services',
  ServiceReview:           'service_reviews',
  ShelterConnection:       'shelter_connections',
  ShelterDetails:          'shelter_details',
  SyncLog:                 'sync_logs',
  User:                    'profiles',
  VolunteerApplication:    'volunteer_applications',
  VolunteerInterest:       'volunteer_interests',
  VolunteerOpportunity:    'volunteer_opportunities',
  // Page content CMS tables
  HomePageContent:         'home_page_content',
  AboutPageContent:        'about_page_content',
  AdoptPageContent:        'adopt_page_content',
  LostFoundPageContent:    'lost_found_page_content',
  VolunteerPageContent:    'volunteer_page_content',
};

// Parse Base44-style sort string: "-created_date" → { col: "created_date", asc: false }
function parseSort(sortStr) {
  if (!sortStr) return { col: 'created_date', asc: false };
  const asc = !sortStr.startsWith('-');
  const col = asc ? sortStr : sortStr.slice(1);
  return { col, asc };
}

// Build a Supabase query with optional filter, sort, and limit
function buildQuery(table, filterObj, sortStr, limit) {
  let q = supabase.from(table).select('*');
  if (filterObj) {
    Object.entries(filterObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        q = q.eq(key, value);
      }
    });
  }
  const { col, asc } = parseSort(sortStr);
  q = q.order(col, { ascending: asc });
  if (limit) q = q.limit(limit);
  return q;
}

// Factory: create an entity client that mirrors the Base44 SDK interface
function createEntityClient(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);

  return {
    list: async (sortStr, limit) => {
      const { data, error } = await buildQuery(table, null, sortStr, limit);
      if (error) throw error;
      return data ?? [];
    },

    filter: async (filterObj, sortStr, limit) => {
      const { data, error } = await buildQuery(table, filterObj, sortStr, limit);
      if (error) throw error;
      return data ?? [];
    },

    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    create: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      const row = { ...payload };
      if (user) row.created_by = user.id;
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return data;
    },

    update: async (id, payload) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { id };
    },
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
const auth = {
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return { id: user.id, email: user.email, ...(profile ?? {}) };
  },

  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  updateMe: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...updates });
    if (error) throw error;
  },

  updateEmail: async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  },

  changePassword: async (_oldPassword, newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  },

  redirectToLogin: (returnUrl) => {
    const url = returnUrl || window.location.href;
    sessionStorage.setItem('login_return_url', url);
    window.location.href = '/Login';
  },
};

// ─── Integrations ─────────────────────────────────────────────────────────────
const integrations = {
  Core: {
    // Calls the /api/invoke-llm Vercel serverless function
    InvokeLLM: async ({ prompt, response_json_schema, file_urls, add_context_from_internet }) => {
      const res = await fetch('/api/invoke-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, response_json_schema, file_urls }),
      });
      if (!res.ok) throw new Error(`LLM call failed: ${res.statusText}`);
      const json = await res.json();
      return json.result;
    },

    // Calls the /api/send-email Vercel serverless function
    SendEmail: async ({ to, subject, body, html }) => {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, html }),
      });
      if (!res.ok) throw new Error(`Email send failed: ${res.statusText}`);
      return res.json();
    },

    // Upload directly to Supabase Storage
    UploadFile: async ({ file }) => {
      const ext = file.name?.split('.').pop() || 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      return { file_url: publicUrl };
    },
  },
};

// ─── Functions (stub — replace with real serverless functions as needed) ──────
const functions = {
  invoke: async (name, payload) => {
    console.warn(`base44.functions.invoke('${name}') is a stub — implement as a Vercel function if needed.`);
    return null;
  },
};

// ─── Assemble the drop-in replacement ────────────────────────────────────────
const entities = Object.fromEntries(
  Object.keys(TABLE_MAP).map((name) => [name, createEntityClient(name)])
);

export const base44 = { entities, auth, integrations, functions };
