
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendPasswordResetEmail(to: string, resetToken: string) {
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Interview Simulator" <${process.env.EMAIL_USER || 'noreply@example.com'}>`,
        to,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #111; border-radius: 16px; color: #e4e4e7;">
                <h2 style="color: #fff; margin-top: 0;">Password Reset Request</h2>
                <p style="line-height: 1.6;">
                    You requested a password reset for your Interview Simulator account.
                    Click the button below to set a new password.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
                        Reset Password
                    </a>
                </div>
                <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                    This link expires in <strong>30 minutes</strong>.<br/>
                    If you did not request this, please ignore this email. Your password will remain unchanged.
                </p>
                <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;">
                <p style="font-size: 11px; color: #71717a;">
                    If the button doesn't work, copy and paste this URL into your browser:<br/>
                    <a href="${resetLink}" style="color: #818cf8; word-break: break-all;">${resetLink}</a>
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent to ${to}`);
}
