import { prisma } from "@/lib/prisma";

export async function createSystemNotification(data: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  userId?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link,
        userId: data.userId,
      }
    });
  } catch (error) {
    console.error("Failed to create system notification:", error);
  }
}

export function generateEmailTemplate(title: string, htmlContent: string, actionUrl?: string, actionText?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px 10px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background-color: #0F1059; padding: 24px 32px; text-align: left; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
          .header p { color: #94a3b8; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 32px; color: #334155; font-size: 14px; line-height: 1.6; }
          .content h2 { color: #0f172a; margin-top: 0; font-size: 18px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
          .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .details-table th, .details-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
          .details-table th { width: 140px; color: #64748b; font-weight: 600; background-color: #f8fafc; vertical-align: top; }
          .details-table td { color: #1e293b; font-weight: 500; }
          .action-container { margin-top: 32px; text-align: center; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #0F1059; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
          .footer { background-color: #f1f5f9; padding: 20px 32px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NDC IT Service</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            ${htmlContent}
            ${actionUrl ? `
              <div class="action-container">
                <a href="${actionUrl}" class="btn">${actionText || 'View Details'}</a>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendOutlookEmail(data: {
  subject: string;
  content: string; // HTML content
}) {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const senderEmail = "noreply@ndcindustrial.co.th";
  const recipientEmail = process.env.MS_RECIPIENT_EMAIL;

  // If credentials are not set, log and skip (so it doesn't crash app)
  if (!tenantId || !clientId || !clientSecret) {
    console.warn("MS Graph API credentials not configured in .env (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET)");
    return false;
  }

  try {
    // 1. Get access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams();
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("scope", "https://graph.microsoft.com/.default");
    tokenParams.append("grant_type", "client_credentials");

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get MS token: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();

    // 2. Send email via Graph API
    const mailUrl = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;
    const mailPayload = {
      message: {
        subject: data.subject,
        body: {
          contentType: "HTML",
          content: data.content,
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipientEmail,
            },
          },
        ],
      },
      saveToSentItems: false,
    };

    const mailResponse = await fetch(mailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailPayload),
    });

    if (!mailResponse.ok) {
      const errBody = await mailResponse.text();
      throw new Error(`Failed to send email: ${mailResponse.statusText} - ${errBody}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending Outlook email:", error);
    return false;
  }
}
