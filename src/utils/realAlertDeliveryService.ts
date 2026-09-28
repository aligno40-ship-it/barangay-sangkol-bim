/**
 * Real Alert Delivery Service for Barangay Sangkol BIMS
 * Integrates real Google Workspace / Gmail API (OAuth Scopes via Firebase Auth & GIS)
 * and native mobile SMS protocol launchers with web fallbacks.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';

// Load Firebase Config
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
let firebaseApp: any = null;
let auth: any = null;
try {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
} catch (e) {
  console.warn('Firebase Auth initialization deferred or unavailable:', e);
}
export { auth };

export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

// In-memory access token cache as specified in security guidelines
let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = 'aligno40@gmail.com';

const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope(GMAIL_SEND_SCOPE);
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Initialize Auth State Listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedUserEmail = user.email || 'aligno40@gmail.com';
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Prompt user to connect their Google / Gmail Account with Gmail.send scope
 */
export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
  email: string;
} | null> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      console.info('No access token returned in credential from Google popup');
      return null;
    }

    cachedAccessToken = credential.accessToken;
    cachedUserEmail = result.user.email || 'aligno40@gmail.com';

    // Store in session for tab persistence
    try {
      sessionStorage.setItem('bims_gmail_token', cachedAccessToken);
      sessionStorage.setItem('bims_gmail_email', cachedUserEmail);
    } catch {}

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      email: cachedUserEmail,
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle user closing popup or popup blocker gracefully without throwing
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-blocked' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('popup-blocked')
    ) {
      console.info('Google Sign-In popup was closed or dismissed by the user.');
      return null;
    }

    console.warn('Google Sign-In notice:', errorMsg || error);
    return null;
  }
};

export const getCachedGmailToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return sessionStorage.getItem('bims_gmail_token');
  } catch {
    return null;
  }
};

export const getConnectedGmailEmail = (): string => {
  return cachedUserEmail || sessionStorage.getItem('bims_gmail_email') || 'aligno40@gmail.com';
};

export const isGmailConnected = (): boolean => {
  return !!getCachedGmailToken();
};

export const disconnectGoogleWorkspace = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    sessionStorage.removeItem('bims_gmail_token');
    sessionStorage.removeItem('bims_gmail_email');
  } catch (e) {
    console.warn('Signout notice:', e);
  }
};

/**
 * Encode raw RFC 2822 email to Base64URL
 */
export const encodeRFC2822Email = (params: {
  to: string;
  subject: string;
  htmlBody: string;
  senderName?: string;
  fromEmail?: string;
}): string => {
  const fromHeader = params.senderName
    ? `${params.senderName} <${params.fromEmail || 'barangay.sangkol.office@gov.ph'}>`
    : (params.fromEmail || 'barangay.sangkol.office@gov.ph');

  const emailLines = [
    `To: ${params.to}`,
    `From: ${fromHeader}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    params.htmlBody,
  ];

  const raw = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Build rich HTML email template for Barangay Sangkol official notices
 */
export const buildOfficialBarangayHtmlEmail = (params: {
  recipientName: string;
  title: string;
  category: string;
  messageContent: string;
  details?: Record<string, string | number | undefined>;
  callToActionUrl?: string;
  callToActionLabel?: string;
}): string => {
  const { recipientName, title, category, messageContent, details, callToActionUrl, callToActionLabel } = params;

  const detailRows = details
    ? Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(
          ([k, v]) => `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${k}</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${v}</td>
          </tr>`
        )
        .join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Republic of the Philippines • City of Dipolog</div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">BARANGAY SANGKOL</div>
              <div style="font-size: 12px; color: #cbd5e1; font-weight: 500;">Information Management System (BIMS) Alert Gateway</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Category Ribbon -->
    <tr>
      <td style="background-color: #f8fafc; padding: 12px 24px; border-bottom: 1px solid #e2e8f0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">${category}</span>
            </td>
            <td align="right" style="font-size: 11px; color: #64748b; font-family: monospace;">
              ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Content Body -->
    <tr>
      <td style="padding: 28px 24px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
          ${title}
        </h2>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
          Dear <strong>${recipientName}</strong>,
        </p>

        <div style="font-size: 14px; line-height: 1.6; color: #334155; background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; white-space: pre-line;">
${messageContent}
        </div>

        ${
          detailRows
            ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px;">Summary & Notice Details</h3>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            ${detailRows}
          </table>
        </div>`
            : ''
        }

        ${
          callToActionUrl
            ? `
        <div style="text-align: center; margin: 28px 0;">
          <a href="${callToActionUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
            ${callToActionLabel || 'Open in Citizen Portal'}
          </a>
        </div>`
            : ''
        }

        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          If you have questions or require verification, please visit the Barangay Hall at Purok Mangga, Barangay Sangkol, Dipolog City, or contact <strong>(062) 991-8842 / 0917-890-4421</strong>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #0f172a; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
        <div style="color: #cbd5e1; font-weight: 600; margin-bottom: 4px;">Sangguniang Barangay ng Sangkol</div>
        <div>Office of the Punong Barangay • Dipolog City, Zamboanga del Norte, Philippines 7100</div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Send real email through Google Workspace Gmail REST API
 */
export const sendRealGmail = async (params: {
  to: string;
  subject: string;
  htmlBody: string;
  senderName?: string;
  accessToken?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  directComposeUrl: string;
}> => {
  const { to, subject, htmlBody, senderName = 'Barangay Sangkol BIMS' } = params;

  const directComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    to
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    htmlBody.replace(/<[^>]*>?/gm, '').trim()
  )}`;

  try {
    let token = params.accessToken || getCachedGmailToken();

    // If no token cached yet, attempt to trigger sign-in popup if user interaction is underway
    if (!token) {
      try {
        const authRes = await signInWithGoogleWorkspace();
        if (authRes) {
          token = authRes.accessToken;
        }
      } catch (e) {
        console.warn('Could not auto-prompt Google sign-in:', e);
      }
    }

    if (token) {
      const rawEncoded = encodeRFC2822Email({
        to,
        subject,
        htmlBody,
        senderName,
      });

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawEncoded }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          directComposeUrl,
        };
      }

      if (response.status === 401) {
        disconnectGoogleWorkspace();
      }

      const errData = await response.json().catch(() => ({}));
      console.warn('Gmail API response error:', errData);
    }

    return {
      success: false,
      error: 'Google Workspace authorization required to send background API email.',
      directComposeUrl,
    };
  } catch (err: any) {
    console.error('Failed to send email via Gmail API:', err);
    return {
      success: false,
      error: err.message || 'Network error sending via Gmail API',
      directComposeUrl,
    };
  }
};

/**
 * Open native mobile SMS application with pre-filled number and body
 */
export const openNativeSMS = (params: { phone: string; message: string }): boolean => {
  try {
    const cleanPhone = (params.phone || '0917-889-2231').replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${separator}body=${encodeURIComponent(params.message)}`;

    // Try creating a temporary invisible link element and clicking it to prevent page unload
    const link = document.createElement('a');
    link.href = smsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to launch SMS URL:', err);
    return false;
  }
};

/**
 * Open direct Gmail Web Client Compose window in new tab
 */
export const openGmailWebCompose = (params: { to: string; subject: string; body: string }) => {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    params.to
  )}&su=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.body)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open default mail client (mailto: protocol)
 */
export const openDefaultMailClient = (params: { to: string; subject: string; body: string }) => {
  const mailtoUrl = `mailto:${encodeURIComponent(params.to)}?subject=${encodeURIComponent(
    params.subject
  )}&body=${encodeURIComponent(params.body)}`;
  const link = document.createElement('a');
  link.href = mailtoUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Share alert via native device Web Share API
 */
export const shareAlertViaDevice = async (params: {
  title: string;
  text: string;
}): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed', err);
      }
      return false;
    }
  }
  return false;
};

/**
 * Validate Philippine Mobile Number format
 * Accepts: 09XXXXXXXXX (11 digits), +639XXXXXXXXX (13 chars), 639XXXXXXXXX (12 digits)
 */
export const validatePhilippineMobile = (phone?: string): {
  isValid: boolean;
  normalizedLocal: string;
  normalizedE164: string;
  error?: string;
} => {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return {
      isValid: false,
      normalizedLocal: '',
      normalizedE164: '',
      error: 'No phone number on file for this resident.',
    };
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('09')) {
    return {
      isValid: true,
      normalizedLocal: digits,
      normalizedE164: `+63${digits.substring(1)}`,
    };
  } else if (digits.length === 12 && digits.startsWith('639')) {
    return {
      isValid: true,
      normalizedLocal: `0${digits.substring(2)}`,
      normalizedE164: `+${digits}`,
    };
  } else if (digits.length === 10 && digits.startsWith('9')) {
    return {
      isValid: true,
      normalizedLocal: `0${digits}`,
      normalizedE164: `+63${digits}`,
    };
  }

  return {
    isValid: false,
    normalizedLocal: '',
    normalizedE164: '',
    error: `Invalid PH mobile number format ("${phone}"). Expected 09XXXXXXXXX (11 digits) or +639XXXXXXXXX.`,
  };
};

/**
 * Validate Email Format
 */
export const validateResidentEmail = (email?: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'No email address on file for this resident.',
    };
  }
  const trimmed = email.trim().toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      normalized: '',
      error: `Invalid email address format ("${email}").`,
    };
  }
  return { isValid: true, normalized: trimmed };
};

/**
 * Standardized Message Templating function
 * Matches requirement: "BRGY SANGKOL: Maayong adlaw [Name]! Your requested [Certificate Type] (Ctrl #[ControlNumber]) is APPROVED & READY. You can now view, download & print your official e-certificate via the Citizen Portal. Salamat!"
 */
export const formatCertificateReadySms = (vars: {
  residentName: string;
  controlNumber: string;
  certificateType: string;
  status?: string;
  barangayName?: string;
}): string => {
  const barangay = (vars.barangayName || 'BRGY SANGKOL').toUpperCase();
  const name = vars.residentName || 'Resident';
  const certType = vars.certificateType || 'Barangay Document';
  const controlNo = vars.controlNumber || 'PENDING';
  const statusText = vars.status ? vars.status.toUpperCase() : 'APPROVED & READY';

  return `${barangay}: Maayong adlaw ${name}! Your requested ${certType} (Ctrl #${controlNo}) is ${statusText}. You can now view, download & print your official e-certificate via the Citizen Portal. Salamat!`;
};

/**
 * Send real SMS notification via backend API endpoint (POST /api/notify/sms)
 */
export const sendRealSmsNotification = async (params: {
  phoneNumber: string;
  residentId?: string;
  residentName: string;
  certificateId?: string;
  controlNumber?: string;
  certificateType?: string;
  status?: string;
  message?: string;
  sentBy?: string;
}): Promise<{
  success: boolean;
  message: string;
  recipient?: string;
  provider?: string;
  providerMessageId?: string;
  log?: any;
  error?: string;
  retryable?: boolean;
}> => {
  try {
    const res = await fetch('/api/notify/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch SMS notification.',
        error: data.error || 'Server error',
        retryable: true,
        log: data.log,
      };
    }

    return {
      success: true,
      message: data.message || `SMS successfully dispatched to ${params.phoneNumber}.`,
      recipient: data.recipient,
      provider: data.provider,
      providerMessageId: data.providerMessageId,
      log: data.log,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to SMS Gateway endpoint.',
      error: err.message,
      retryable: true,
    };
  }
};

/**
 * Send real Email notification via backend API endpoint (POST /api/notify/email)
 */
export const sendRealEmailNotification = async (params: {
  email: string;
  residentId?: string;
  residentName: string;
  certificateId?: string;
  controlNumber?: string;
  certificateType?: string;
  status?: string;
  subject?: string;
  htmlBody?: string;
  plainText?: string;
  sentBy?: string;
}): Promise<{
  success: boolean;
  message: string;
  recipient?: string;
  provider?: string;
  providerMessageId?: string;
  log?: any;
  error?: string;
  retryable?: boolean;
}> => {
  try {
    const res = await fetch('/api/notify/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch Email notification.',
        error: data.error || 'Server error',
        retryable: true,
        log: data.log,
      };
    }

    return {
      success: true,
      message: data.message || `Email notice dispatched to ${params.email}.`,
      recipient: data.recipient,
      provider: data.provider,
      providerMessageId: data.providerMessageId,
      log: data.log,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to Email Gateway endpoint.',
      error: err.message,
      retryable: true,
    };
  }
};

/**
 * Fetch delivery notification logs from backend (GET /api/notify/logs)
 */
export const fetchNotificationLogs = async (params?: {
  channel?: string;
  status?: string;
  residentId?: string;
  search?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  logs: any[];
  totalLogs: number;
}> => {
  try {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    if (params?.residentId) query.append('residentId', params.residentId);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`/api/notify/logs?${query.toString()}`);
    const data = await res.json();
    return {
      success: data.success || false,
      logs: data.logs || [],
      totalLogs: data.totalLogs || 0,
    };
  } catch (err) {
    console.error('Failed to fetch notification logs:', err);
    return { success: false, logs: [], totalLogs: 0 };
  }
};

/**
 * Fetch gateway provider configuration status (GET /api/notify/gateway-status)
 */
export const fetchGatewayStatus = async () => {
  try {
    const res = await fetch('/api/notify/gateway-status');
    return await res.json();
  } catch {
    return null;
  }
};
