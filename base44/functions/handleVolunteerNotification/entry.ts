import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { volunteer_shelter } = await req.json();

    if (!volunteer_shelter || volunteer_shelter.trim() === '') {
      return Response.json({ success: true, message: 'No volunteer shelter specified' });
    }

    // Search for matching rescues by name (case-insensitive)
    const allRescues = await base44.entities.Rescue.list();
    const matchingRescue = allRescues.find(
      r => r.name.toLowerCase().includes(volunteer_shelter.toLowerCase()) ||
           volunteer_shelter.toLowerCase().includes(r.name.toLowerCase())
    );

    if (!matchingRescue) {
      return Response.json({ success: true, message: 'No matching rescue found' });
    }

    // Check if volunteer interest already exists
    const existingInterests = await base44.entities.VolunteerInterest.filter({
      rescue_email: matchingRescue.email,
      volunteer_email: user.email,
    });

    if (existingInterests.length > 0) {
      return Response.json({ success: true, message: 'Volunteer interest already recorded' });
    }

    // Create volunteer interest
    await base44.entities.VolunteerInterest.create({
      rescue_email: matchingRescue.email,
      volunteer_name: user.full_name,
      volunteer_email: user.email,
      message: `${user.full_name} listed ${matchingRescue.name} as a shelter/rescue they volunteer with.`,
    });

    // Create notification for the rescue
    await base44.entities.Notification.create({
      user_email: matchingRescue.email,
      type: 'application',
      title: 'New Volunteer Approval Request',
      message: `${user.full_name} (${user.email}) has listed your organization as a place they volunteer. Please review and approve them as a volunteer.`,
      related_entity_type: 'VolunteerInterest',
      action_url: `/rescue-dashboard?section=volunteers`,
    });

    return Response.json({
      success: true,
      message: `Notification sent to ${matchingRescue.name}`,
      rescue_name: matchingRescue.name,
    });
  } catch (error) {
    console.error('Error handling volunteer notification:', error);
    return Response.json(
      { error: error.message || 'Failed to process volunteer notification' },
      { status: 500 }
    );
  }
});