const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendOTP = async (email, otpCode, purpose = 'signup') => {
    const subjectMap = {
        signup: '🔐 NutriVision - Verify Your Email',
        reset: '🔐 NutriVision - Reset Your Password',
    };

    const purposeText = purpose === 'signup'
        ? 'verify your email and create your account'
        : 'reset your password';

    const mailOptions = {
        from: `"NutriVision" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: subjectMap[purpose] || subjectMap.signup,
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #22c55e, #06b6d4); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🥗 NutriVision</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">AI-Powered Nutrition Analyzer</p>
            </div>
            <div style="padding: 32px; color: #e2e8f0;">
                <p style="font-size: 16px; margin: 0 0 16px;">Hello,</p>
                <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px;">Use the following OTP to ${purposeText}. This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22c55e; margin: 0;">${otpCode}</p>
                </div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">If you didn't request this, please ignore this email.</p>
            </div>
            <div style="padding: 16px 32px; background: rgba(0,0,0,0.2); text-align: center;">
                <p style="font-size: 11px; color: #475569; margin: 0;">Made by Shiva Karnati</p>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email} for ${purpose}`);
};

module.exports = { sendOTP };
