import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const {
      application_id,
      adopter_email,
      adopter_name,
      pet_name,
      rescue_email,
    } = payload;

    if (!application_id || !adopter_email) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send notification to adopter about approval and direct to finalize page
    await base44.asServiceRole.functions.invoke("sendNotification", {
      user_email: adopter_email,
      type: "system",
      title: "Application Approved!",
      message: `Congratulations! Your application for ${pet_name} has been approved. Please finalize the adoption to complete the process.`,
      related_entity_type: "AdoptionApplication",
      related_entity_id: application_id,
      action_url: `/FinalizeAdoption?id=${application_id}`,
      send_email: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error handling approved application:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});