import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { donation_id, amount, donation_type, donor_email, dedication_type, dedication_name, recipient_email } = await req.json();

    if (!donation_id || !amount || !donation_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For now, we'll create a pending payment intent
    // In production, you would integrate with Stripe
    // This is a placeholder that marks the donation as completed

    await base44.entities.Donation.update(donation_id, {
      status: 'completed',
      completed_date: new Date().toISOString(),
    });

    // Send dedication notification if applicable
    if (dedication_type && dedication_type !== 'none' && recipient_email) {
      const dedicationLabel = dedication_type === 'in_honor_of' ? 'In Honor Of' : 'In Memory Of';
      const emailBody = `A donation has been made ${dedicationLabel.toLowerCase()} ${dedication_name}! 💝\n\nAmount: $${amount.toFixed(2)}\n\nThis generous contribution will help us continue our mission.`;
      
      await base44.integrations.Core.SendEmail({
        to: recipient_email,
        subject: `A Donation Made ${dedicationLabel} ${dedication_name}`,
        body: emailBody,
      });
    }

    // If there's a donation goal associated, update its amount
    const donation = await base44.entities.Donation.filter({ id: donation_id }, undefined, 1);
    
    if (donation && donation[0]?.donation_goal_id) {
      const goal = await base44.entities.DonationGoal.filter(
        { id: donation[0].donation_goal_id },
        undefined,
        1
      );

      if (goal && goal[0]) {
        const newAmount = (goal[0].current_amount || 0) + amount;
        await base44.entities.DonationGoal.update(goal[0].id, {
          current_amount: newAmount,
        });
      }
    }

    // Send confirmation email to donor
    const donorEmailBody = `Thank you for your ${donation_type} donation of $${amount.toFixed(2)}. Your generosity makes a difference!\n\n${
      dedication_type && dedication_type !== 'none' 
        ? `This donation was made ${dedication_type === 'in_honor_of' ? 'in honor of' : 'in memory of'} ${dedication_name}.`
        : ''
    }`;

    await base44.integrations.Core.SendEmail({
      to: donor_email,
      subject: 'Thank You for Your Donation!',
      body: donorEmailBody,
    });

    return Response.json({
      success: true,
      donation_id,
      message: 'Donation processed successfully',
    });
  } catch (error) {
    console.error('Donation processing error:', error);
    return Response.json(
      { error: error.message || 'Failed to process donation' },
      { status: 500 }
    );
  }
});