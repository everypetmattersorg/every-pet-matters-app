import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: false, error: 'Invalid event' }, { status: 400 });
    }

    // Fetch all admin users
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    if (admins.length === 0) {
      return Response.json({ success: true, notified: 0 });
    }

    // Send notification to each admin
    const categoryLabel = {
      article: 'Blog / Article',
      organization: 'Local Organization',
      social_group: 'Social Media Group'
    }[data.category] || data.category;

    const title = `New Resource Submitted: ${data.title}`;
    const message = `A new ${categoryLabel} has been submitted by ${data.submitted_by_name || data.submitted_by_email} and is pending review.`;

    await Promise.all(
      admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title,
          message,
          type: 'resource_submission',
          related_entity_id: event.entity_id,
          related_entity_type: 'Resource',
          read: false
        })
      )
    );

    return Response.json({ success: true, notified: admins.length });
  } catch (error) {
    console.error('Error notifying admins:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});