export const sendPushNotification = async ({ title, message, url = '/' }) => {
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } = process.env;

  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'your_onesignal_app_id') {
    console.log(`[Push Mock] "${title}": ${message}`);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: title },
        contents: { en: message },
        url,
        chrome_web_badge: '/favicon.ico',
      })
    });

    const data = await response.json();
    if (data.errors) {
      console.error('[Push Error]', data.errors);
      return { success: false, errors: data.errors };
    }
    console.log(`[Push Sent] ID: ${data.id} recipients: ${data.recipients}`);
    return { success: true, id: data.id, recipients: data.recipients };
  } catch (err) {
    console.error('[Push Error]', err.message);
    return { success: false, error: err.message };
  }
};
