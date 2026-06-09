import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { application_id, pet_name, applicant_name, applicant_email, rescue_email } = payload;

    if (!application_id || !rescue_email) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send notification to rescue
    await base44.asServiceRole.functions.invoke("sendNotification", {
      user_email: rescue_email,
      type: "application",
      title: "New Adoption Application",
      message: `${applicant_name} submitted an application for ${pet_name}.`,
      related_entity_type: "AdoptionApplication",
      related_entity_id: application_id,
      action_url: `/RescueDashboard?tab=applications&id=${application_id}`,
      send_email: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating application notification:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});