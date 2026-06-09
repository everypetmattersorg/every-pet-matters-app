import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const {
      user_email,
      pet_name,
      appointment_type, // 'vaccination', 'checkup', 'medication'
      appointment_date,
      reminder_days_before = 3,
    } = payload;

    if (!user_email || !pet_name || !appointment_type || !appointment_date) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appointmentDateObj = new Date(appointment_date);
    const reminderDateObj = new Date(appointmentDateObj);
    reminderDateObj.setDate(reminderDateObj.getDate() - reminder_days_before);

    const typeLabels = {
      vaccination: "Vaccination",
      medication: "Medication",
      checkup: "Vet Checkup",
    };

    const typeKey = appointmentType === "medication" ? "medication" : "appointment";

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email,
      type: typeKey,
      title: `${typeLabels[appointmentType]} Reminder for ${pet_name}`,
      message: `Don't forget! ${pet_name}'s ${typeLabels[appointmentType].toLowerCase()} is scheduled for ${appointmentDateObj.toLocaleDateString()}.`,
      scheduled_for: reminderDateObj.toISOString(),
      is_read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating appointment reminder:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});