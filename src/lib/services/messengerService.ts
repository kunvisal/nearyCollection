const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface Conversation {
    id: string;
    customerName: string;
    customerId: string;
    lastMessageAt: string;
    snippet: string;
}

export interface ConversationMessage {
    id: string;
    message: string;
    createdAt: string;
}

export interface ParsedCustomerInfo {
    phone: string | null;
}

export class MessengerService {
    static async getRecentConversations(): Promise<Conversation[]> {
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;

        if (!token || !pageId) {
            throw new Error("Facebook credentials are not configured");
        }

        const url = new URL(`${FB_GRAPH_BASE}/${pageId}/conversations`);
        url.searchParams.set("fields", "participants{name,id},updated_time,snippet");
        url.searchParams.set("limit", "50");
        url.searchParams.set("access_token", token);

        const res = await fetch(url.toString());
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message ?? "Failed to fetch conversations");
        }

        const json = await res.json();
        const conversations: Conversation[] = [];

        for (const conv of json.data ?? []) {
            const participants: { id: string; name: string }[] =
                conv.participants?.data ?? [];
            const customer = participants.find((p) => p.id !== pageId);
            if (!customer) continue;

            conversations.push({
                id: conv.id,
                customerName: customer.name,
                customerId: customer.id,
                lastMessageAt: conv.updated_time,
                snippet: conv.snippet ?? "",
            });
        }

        return conversations;
    }

    static async getConversationMessages(
        conversationId: string
    ): Promise<ConversationMessage[]> {
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;

        if (!token || !pageId) {
            throw new Error("Facebook credentials are not configured");
        }

        const url = new URL(`${FB_GRAPH_BASE}/${conversationId}/messages`);
        url.searchParams.set("fields", "message,from,created_time");
        url.searchParams.set("limit", "50");
        url.searchParams.set("access_token", token);

        const res = await fetch(url.toString());
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message ?? "Failed to fetch messages");
        }

        const json = await res.json();
        const messages: ConversationMessage[] = [];

        for (const msg of json.data ?? []) {
            // Only skip the page's own replies — show all customer messages raw
            if (!msg.from || msg.from.id === pageId) continue;
            // Skip messages with no text content (stickers, images with no caption)
            if (!msg.message) continue;

            messages.push({
                id: msg.id,
                message: msg.message,
                createdAt: msg.created_time,
            });
        }

        // Facebook returns newest first — reverse to chronological order
        return messages.reverse();
    }

    static async sendMessage(recipientId: string, text: string): Promise<void> {
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        if (!token) throw new Error("Facebook credentials are not configured");

        const res = await fetch(`${FB_GRAPH_BASE}/me/messages?access_token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message ?? "Failed to send Messenger message");
        }
    }

    static async sendImage(recipientId: string, imageUrl: string): Promise<void> {
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        if (!token) throw new Error("Facebook credentials are not configured");

        const res = await fetch(`${FB_GRAPH_BASE}/me/messages?access_token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: "image",
                        payload: { url: imageUrl, is_reusable: true },
                    },
                },
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message ?? "Failed to send Messenger image");
        }
    }

    static parseCustomerInfo(messages: ConversationMessage[]): ParsedCustomerInfo {
        // Cambodian phone number: 0XX XXX XXX (9 digits) or +855 prefix, with optional spaces/dashes
        const phoneRegex = /(?:\+?855[-\s]?)?0[1-9][0-9][-\s]?[0-9]{3}[-\s]?[0-9]{3,4}/;

        const allText = messages.map((m) => m.message).join("\n");
        const phoneMatch = allText.match(phoneRegex);

        return {
            // Normalise to digits only (remove spaces/dashes)
            phone: phoneMatch ? phoneMatch[0].replace(/[-\s]/g, "") : null,
        };
    }
}
