import pkg from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
const { Client, LocalAuth } = pkg;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE_MS = 10_000; // 10s, 20s, 30s … up to 60s

class WhatsAppService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.isReady = false;
    this.status = 'disconnected';
    this.connectedNumber = null;
    this._intentionalLogout = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
  }

  _clearLocks() {
    const sessionDir = path.resolve('.wwebjs_auth/session');
    for (const lock of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
      try { fs.unlinkSync(path.join(sessionDir, lock)); } catch {}
    }
  }

  async _destroyClient() {
    if (!this.client) return;
    const old = this.client;
    this.client = null;
    try { await old.destroy(); } catch {}
  }

  _scheduleReconnect() {
    if (this._intentionalLogout) return;
    if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WhatsApp] Max reconnect attempts reached. Please reconnect manually.');
      return;
    }
    this._reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY_BASE_MS * this._reconnectAttempts, 60_000);
    console.log(`[WhatsApp] Auto-reconnecting in ${delay / 1000}s (attempt ${this._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    this._reconnectTimer = setTimeout(() => this.init(), delay);
  }

  async init() {
    // Prevent duplicate init — only allow if no client or previous one failed/disconnected
    if (this.client && this.status !== 'disconnected' && this.status !== 'error') return;

    clearTimeout(this._reconnectTimer);
    await this._destroyClient();
    this._clearLocks();

    this.qrCode = null;
    this.isReady = false;
    this._intentionalLogout = false;
    this.status = 'initializing';
    console.log('[WhatsApp] Initializing client...');

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1015901745-alpha.html',
      },
      puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--hide-scrollbars',
          '--mute-audio'
        ],
        headless: true
      }
    });

    const c = this.client;

    c.on('qr', (qr) => {
      if (c !== this.client) return;
      this.qrCode = qr;
      this.status = 'qr_ready';
      console.log('[WhatsApp] QR Code ready — scan in admin panel');
    });

    c.on('loading_screen', (percent) => {
      if (c !== this.client) return;
      this.status = 'loading';
      console.log(`[WhatsApp] Loading ${percent}%`);
    });

    c.on('authenticated', () => {
      if (c !== this.client) return;
      this.status = 'authenticated';
      this.qrCode = null;
      console.log('[WhatsApp] Authenticated');
    });

    c.on('ready', async () => {
      if (c !== this.client) return;
      this.isReady = true;
      this.qrCode = null;
      this.status = 'ready';
      this._reconnectAttempts = 0; // reset counter on successful connect
      try {
        this.connectedNumber = this.client.info?.wid?.user || null;
      } catch {}
      console.log(`[WhatsApp] Ready! Connected: ${this.connectedNumber}`);
    });

    c.on('disconnected', (reason) => {
      if (c !== this.client) return;
      this.isReady = false;
      this.status = 'disconnected';
      this.qrCode = null;
      this.connectedNumber = null;
      this.client = null;
      console.log('[WhatsApp] Disconnected:', reason);
      this._scheduleReconnect();
    });

    c.initialize().catch((err) => {
      if (c !== this.client) return;
      console.error('[WhatsApp] Init error:', err.message);
      this.status = 'error';
      this._scheduleReconnect();
    });
  }

  async logout() {
    this._intentionalLogout = true;
    clearTimeout(this._reconnectTimer);
    this._reconnectAttempts = 0;
    try {
      if (this.client) await this.client.logout();
    } catch {}
    await this._destroyClient();
    this.isReady = false;
    this.status = 'disconnected';
    this.qrCode = null;
    this.connectedNumber = null;
  }

  async sendMessage(phone, message) {
    if (!this.isReady || !this.client) {
      return { success: false, error: 'WhatsApp not connected. Scan QR first.' };
    }
    try {
      const normalized = String(phone).replace(/\D/g, '');
      const chatId = normalized.startsWith('91') ? `${normalized}@c.us` : `91${normalized}@c.us`;
      await this.client.sendMessage(chatId, message);
      return { success: true };
    } catch (err) {
      console.error('[WhatsApp Send Error]', err.message);
      return { success: false, error: err.message };
    }
  }

  async sendBulk(numbers, message) {
    const results = [];
    for (const num of numbers) {
      const result = await this.sendMessage(num, message);
      results.push({ number: num, ...result });
      await new Promise(r => setTimeout(r, 500));
    }
    return results;
  }

  getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      hasQR: !!this.qrCode,
      connectedNumber: this.connectedNumber,
      reconnectAttempts: this._reconnectAttempts,
    };
  }
}

export const whatsappService = new WhatsAppService();
