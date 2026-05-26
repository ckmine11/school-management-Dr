import MessageQueue from '../models/MessageQueue.js';
import { whatsappService } from './whatsappClient.js';

const POLL_INTERVAL_MS = 5_000;   // check queue every 5 seconds
const RETRY_DELAY_MS   = 30_000;  // wait 30s × attempt before retry

class MessageQueueService {
  constructor() {
    this._timer = null;
    this._processing = false;
  }

  /** Add a single message to the queue */
  async enqueue(phone, message) {
    return MessageQueue.create({ phone, message });
  }

  /** Add many messages at once (bulk broadcast) */
  async enqueueBulk(numbers, message) {
    const docs = numbers.map(phone => ({ phone, message, scheduledFor: new Date() }));
    return MessageQueue.insertMany(docs);
  }

  /** Start the background processor */
  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this._tick(), POLL_INTERVAL_MS);
    // Process any leftover pending messages immediately on startup
    setTimeout(() => this._tick(), 2_000);
    console.log('[MessageQueue] Started');
  }

  async _tick() {
    if (this._processing || !whatsappService.isReady) return;
    this._processing = true;

    try {
      // Claim one pending message atomically
      const msg = await MessageQueue.findOneAndUpdate(
        { status: 'pending', scheduledFor: { $lte: new Date() } },
        { $set: { status: 'processing' }, $inc: { attempts: 1 } },
        { new: true, sort: { scheduledFor: 1 } }
      );
      if (!msg) return;

      const result = await whatsappService.sendMessage(msg.phone, msg.message);

      if (result.success) {
        await MessageQueue.findByIdAndUpdate(msg._id, { status: 'sent', sentAt: new Date(), error: null });
      } else {
        const exhausted = msg.attempts >= msg.maxAttempts;
        const retryAt = new Date(Date.now() + msg.attempts * RETRY_DELAY_MS);
        await MessageQueue.findByIdAndUpdate(msg._id, {
          status: exhausted ? 'failed' : 'pending',
          error: result.error,
          scheduledFor: retryAt
        });
        if (exhausted) {
          console.warn(`[MessageQueue] Permanently failed for ${msg.phone}: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('[MessageQueue] Tick error:', err.message);
    } finally {
      this._processing = false;
    }
  }

  /** Stats for admin dashboard */
  async getStats() {
    const [pending, sent, failed] = await Promise.all([
      MessageQueue.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      MessageQueue.countDocuments({ status: 'sent' }),
      MessageQueue.countDocuments({ status: 'failed' })
    ]);
    return { pending, sent, failed };
  }

  /** Recent queue entries for admin view */
  async getRecent(limit = 50) {
    return MessageQueue.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('phone status attempts error sentAt createdAt scheduledFor');
  }

  /** Retry all failed messages */
  async retryFailed() {
    const result = await MessageQueue.updateMany(
      { status: 'failed' },
      { $set: { status: 'pending', scheduledFor: new Date(), error: null }, $unset: { sentAt: '' } }
    );
    return result.modifiedCount;
  }
}

export const messageQueueService = new MessageQueueService();
