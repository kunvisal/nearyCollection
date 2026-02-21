import { SettingsService } from "./settingsService";

export class TelegramService {
    /**
     * Sends a message to the configured Telegram chat.
     * @param message The text message to send
     * @param parseMode Optional parse mode (HTML or MarkdownV2)
     */
    static async sendMessage(message: string, parseMode: 'HTML' | 'MarkdownV2' = 'HTML'): Promise<boolean> {
        try {
            const settings = await SettingsService.getSettings();

            const botToken = settings.telegramBotToken;
            const chatId = settings.telegramChatId;

            if (!botToken || !chatId) {
                console.warn("Telegram bot token or chat ID is not configured. Skipping message.");
                return false;
            }

            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: parseMode,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Telegram API Error:", errorData);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to send Telegram message:", error);
            return false;
        }
    }

    /**
     * Formats and sends a new order notification.
     * @param order The order details
     */
    static async sendNewOrderNotification(order: any): Promise<void> {
        try {
            const message = `
🚨 <b>NEW ORDER RECEIVED</b> 🚨

<b>Order #:</b> ${order.orderCode}
<b>Customer:</b> ${order.customer?.fullName} (${order.customer?.phone})
<b>Total:</b> $${Number(order.total).toFixed(2)}
<b>Payment:</b> ${order.paymentMethod} (${order.paymentStatus})

<a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}">View Order Details</a>
            `.trim();

            await this.sendMessage(message, 'HTML');
        } catch (error) {
            console.error("Failed to format/send order notification:", error);
        }
    }
}
