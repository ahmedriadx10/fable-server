import transporter from "../config/mailer.js";

/**
 * POST /welcome-user
 * Sends a welcome email to a newly registered user.
 */
export const sendWelcomeEmail = async (req, res) => {
  const { email, name } = req.body;

  const mailOption = {
    from: `"Fable Team" <${process.env.EMAIL}>`,
    to: email,
    subject: `Welcome aboard, ${name}! ✨ Unleash your creativity on Fable`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #6d28d9; text-align: center;">Welcome to Fable! 📖✨</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering at <strong>Fable</strong>. We are absolutely thrilled to welcome you to our community of readers, writers, and storytellers!</p>
        
        <p>Fable is a place where your imagination takes flight. From today, you can craft your own magical stories, explore wonderful worlds created by others, and connect with fellow enthusiasts.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #6d28d9; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #333;">Quick tip to get started:</p>
          <p style="margin: 5px 0 0 0; color: #666;">Set up your profile, browse through the trending genres, and don't hesitate to publish your very first draft!</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="https://fable-client-sepia.vercel.app" style="background-color: #6d28d9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Fable</a>
        </p>

        <p>Happy writing and reading!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          Best regards,<br>
          <strong>The Fable Team</strong><br>
          <a href="https://fable-client-sepia.vercel.app" style="color: #6d28d9; text-decoration: none;">https://fable-client-sepia.vercel.app</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOption);
    return res
      .status(200)
      .json({ success: true, message: "Welcome email sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email." });
  }
};
