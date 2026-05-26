// WhatsApp notification utility
// To enable: add Twilio credentials to .env and uncomment the Twilio lines

export const sendWhatsApp = async (phone, message) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

    if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
      // Mock mode: log the message
      console.log(`[WhatsApp Mock] To: ${phone}\nMessage: ${message}\n`);
      return { success: true, mock: true };
    }

    // Real Twilio WhatsApp
    const { default: twilio } = await import('twilio');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone.startsWith('+') ? phone : '+91' + phone}`
    });
    console.log(`[WhatsApp Sent] SID: ${result.sid} To: ${phone}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error(`[WhatsApp Error] ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendBulkWhatsApp = async (numbers, message) => {
  const results = [];
  for (const num of numbers) {
    const result = await sendWhatsApp(num, message);
    results.push({ number: num, ...result });
    await new Promise(r => setTimeout(r, 200)); // rate limit
  }
  return results;
};
