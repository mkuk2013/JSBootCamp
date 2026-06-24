import dotenv from 'dotenv';
dotenv.config();

export const sendApprovalEmail = async (email: string, name: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@jsbootcamp.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'JS Bootcamp Team';

  if (!apiKey || apiKey.includes('your_brevo_api_key_here') || apiKey === '') {
    console.log('\n--- [DEVELOPMENT MAIL LOG] ---');
    console.log(`To: ${name} <${email}>`);
    console.log(`From: ${senderName} <${senderEmail}>`);
    console.log('Subject: Welcome to JS Bootcamp - Account Approved!');
    console.log('Body: Congratulations! Your account registration has been approved by the administrator. You can now log in and start learning.');
    console.log('------------------------------\n');
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name }],
        subject: 'Welcome to JS Bootcamp - Account Approved!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #eab308; margin: 0;">JS Bootcamp ⚡</h2>
            </div>
            <h3 style="color: #0f172a;">Congratulations, ${name}!</h3>
            <p style="color: #334155; line-height: 1.6;">
              Your student registration request has been approved by our administration.
            </p>
            <p style="color: #334155; line-height: 1.6;">
              You can now log in to the dashboard to begin your JavaScript learning journey. We've set up three comprehensive levels (Beginner, Intermediate, and Advanced) with auto-graded coding challenges and an AI-powered tutor to help you along the way!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/login" style="background-color: #eab308; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px;">Log In to Dashboard</a>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-t: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
              This is an automated notification from the JS Bootcamp team.
            </p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log(`[Mail] Approved student email notification sent successfully to ${email}.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Mail] Brevo API responded with error status ${response.status}:`, errText);
      return false;
    }
  } catch (error) {
    console.error('[Mail] Failed to send approval email via Brevo API:', error);
    return false;
  }
};
