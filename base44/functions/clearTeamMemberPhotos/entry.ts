import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch the AboutPageContent
    const aboutContent = await base44.entities.AboutPageContent.list();
    
    if (!aboutContent || aboutContent.length === 0) {
      return Response.json({ error: 'AboutPageContent not found' }, { status: 404 });
    }

    const record = aboutContent[0];

    // Update team members to clear photos for Finn and Alex
    const updatedTeamMembers = record.team_members.map(member => {
      if (member.name.toLowerCase() === 'finn' || member.name.toLowerCase() === 'alex') {
        return { ...member, photo_url: '' };
      }
      return member;
    });

    // Update the record
    await base44.entities.AboutPageContent.update(record.id, {
      team_members: updatedTeamMembers
    });

    return Response.json({ 
      success: true, 
      message: 'Team member photos cleared for Finn and Alex' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});