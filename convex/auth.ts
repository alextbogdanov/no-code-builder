// ============================================================================
// ### IMPORTS ###
// ============================================================================
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Google,
    // Email OTP provider using Resend
    Email({
      id: "resend-otp",
      apiKey: process.env.AUTH_RESEND_KEY,
      maxAge: 60 * 15, // 15 minutes
      async generateVerificationToken() {
        // Generate 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationRequest({ identifier: email, token }) {
        const resend = new ResendClient(process.env.AUTH_RESEND_KEY!);
        await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM || "Startup.ai <noreply@startup.ai>",
          to: email,
          subject: "Your startup.ai verification code",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #00f5d4; margin: 0; font-size: 28px;">Startup.ai</h1>
              </div>
              <div style="background: linear-gradient(135deg, #1a1b3a 0%, #0c0d24 100%); border-radius: 16px; padding: 40px; text-align: center;">
                <h2 style="color: #fff; margin: 0 0 16px 0; font-size: 24px;">Your verification code</h2>
                <p style="color: #a1a1aa; margin: 0 0 32px 0;">Enter this code to verify your email address</p>
                <div style="background: #0c0d24; border: 2px solid #00f5d4; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                  <span style="color: #00f5d4; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${token}</span>
                </div>
                <p style="color: #71717a; font-size: 14px; margin: 0;">This code expires in 15 minutes</p>
              </div>
              <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
});

// ============================================================================
// ### HELPERS ###
// ============================================================================
class ResendClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  emails = {
    send: async (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
      }

      return response.json();
    },
  };
}
