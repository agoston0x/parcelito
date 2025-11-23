import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, amount, parcelito } = await request.json();

    if (!email || !amount || !parcelito) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Generate claim link
    const claimId = Math.random().toString(36).substring(2, 15);
    const claimLink = `https://parcelito.app/claim/${claimId}`;

    const { data, error } = await resend.emails.send({
      from: 'Parcelito <onboarding@resend.dev>',
      to: email,
      subject: `🎁 You received a $${amount} Parcelito gift!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF7A00; margin: 0; font-size: 32px;">🎁 Parcelito Gift!</h1>
          </div>

          <p style="font-size: 18px; color: #333; line-height: 1.6;">
            Someone sent you a <strong style="color: #FF7A00;">$${amount} ${parcelito}</strong> parcelito!
          </p>

          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Parcelito is a token basket that gives you instant diversification in crypto. Your gift is waiting to be claimed.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${claimLink}" style="display: inline-block; background: linear-gradient(135deg, #FF7A00, #FF9A3D); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 18px;">
              Claim Your Gift
            </a>
          </div>

          <p style="font-size: 14px; color: #999; text-align: center;">
            Powered by Parcelito • Token baskets for everyone
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent',
      id: data?.id,
      claimLink
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
