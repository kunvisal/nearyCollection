"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    ChevronDown, ChevronUp, Loader2, MessageCircle,
    ArrowLeft, Phone, MapPin, RefreshCw, Copy, ArrowDownToLine,
} from "lucide-react";

interface Conversation {
    id: string;
    customerName: string;
    customerId: string;
    lastMessageAt: string;
    snippet: string;
}

interface ConversationMessage {
    id: string;
    message: string;
    createdAt: string;
}

interface MessengerImportProps {
    onFill: (data: { name?: string; phone?: string; address?: string }) => void;
}

type View = "collapsed" | "list" | "detail";

function formatRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const PHONE_REGEX = /(?:\+?855[-\s]?)?0[1-9][0-9][-\s]?[0-9]{3}[-\s]?[0-9]{3,4}/;

/**
 * Split a combined customer message into phone + address.
 * Lines that match a Cambodian phone pattern → phone.
 * All other non-empty lines → address.
 * Falls back to the full message text if a field can't be extracted.
 */
function splitMessageFields(message: string): { phone: string; address: string } {
    const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
    let phone: string | null = null;
    const addressLines: string[] = [];

    for (const line of lines) {
        const match = line.match(PHONE_REGEX);
        if (match && !phone) {
            phone = match[0].replace(/[-\s]/g, "");
        } else {
            addressLines.push(line);
        }
    }

    return {
        phone: phone ?? message.trim(),
        address: addressLines.length > 0 ? addressLines.join("\n") : message.trim(),
    };
}

function findPhoneSourceId(
    messages: ConversationMessage[],
    phone: string | null
): string | null {
    if (!phone) return null;
    const normalized = phone.replace(/[-\s]/g, "");
    return messages.find((m) =>
        m.message.replace(/[-\s]/g, "").includes(normalized)
    )?.id ?? null;
}

export function MessengerImport({ onFill }: MessengerImportProps) {
    const [view, setView] = useState<View>("collapsed");

    // List state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Detail state
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [detectedPhone, setDetectedPhone] = useState<string | null>(null);
    const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Refs for scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-scroll to newest message when messages load
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const fetchConversations = useCallback(async () => {
        setLoadingList(true);
        setListError(null);
        try {
            const res = await fetch("/api/admin/messenger/conversations");
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? "Unknown error");
            setConversations(json.data);
        } catch (e: unknown) {
            setListError(e instanceof Error ? e.message : "Failed to load conversations");
        } finally {
            setLoadingList(false);
        }
    }, []);

    const handleToggle = () => {
        if (view === "collapsed") {
            setView("list");
            fetchConversations();
        } else {
            setView("collapsed");
            setSelected(null);
        }
    };

    const handleSelectConversation = async (conv: Conversation) => {
        // Auto-fill name immediately on selection
        onFill({ name: conv.customerName });

        setSelected(conv);
        setView("detail");
        setLoadingDetail(true);
        setDetailError(null);
        setMessages([]);
        setDetectedPhone(null);
        setDetectedAddress(null);
        messageRefs.current.clear();

        try {
            const res = await fetch(
                `/api/admin/messenger/conversations/${conv.id}/messages`
            );
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? "Unknown error");
            const loadedMessages: ConversationMessage[] = json.data.messages;
            const phone: string | null = json.data.phone ?? null;
            setMessages(loadedMessages);
            setDetectedPhone(phone);

            // Extract address from the non-phone lines of the message that contains the phone
            if (phone) {
                const phoneMsg = loadedMessages.find((m) => PHONE_REGEX.test(m.message));
                if (phoneMsg) {
                    const addrLines = phoneMsg.message
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0 && !PHONE_REGEX.test(l));
                    setDetectedAddress(addrLines.length > 0 ? addrLines.join("\n") : null);
                }
            }
        } catch (e: unknown) {
            setDetailError(e instanceof Error ? e.message : "Failed to load messages");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleFillAll = () => {
        if (!selected) return;
        onFill({
            name: selected.customerName,
            ...(detectedPhone ? { phone: detectedPhone } : {}),
            ...(detectedAddress ? { address: detectedAddress } : {}),
        });
        setView("collapsed");
        setSelected(null);
    };

    const handleScrollToPhone = () => {
        const targetId = findPhoneSourceId(messages, detectedPhone);
        if (targetId) {
            messageRefs.current
                .get(targetId)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const handleCopy = async (msg: ConversationMessage) => {
        await navigator.clipboard.writeText(msg.message);
        setCopiedId(msg.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const filteredConversations = conversations.filter((c) =>
        c.customerName.toLowerCase().includes(search.toLowerCase())
    );

    const phoneSourceId = findPhoneSourceId(messages, detectedPhone);

    // ── Collapsed ─────────────────────────────────────────────────────────────
    if (view === "collapsed") {
        return (
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors text-blue-700 dark:text-blue-300"
            >
                <span className="flex items-center gap-2 font-medium text-[15px]">
                    <MessageCircle className="w-4 h-4" />
                    Import from Messenger
                </span>
                <ChevronDown className="w-4 h-4" />
            </button>
        );
    }

    // ── List view ──────────────────────────────────────────────────────────────
    if (view === "list") {
        return (
            <div className="rounded-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
                <button
                    type="button"
                    onClick={handleToggle}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                >
                    <span className="flex items-center gap-2 font-medium text-[15px]">
                        <MessageCircle className="w-4 h-4" />
                        Import from Messenger
                    </span>
                    <ChevronUp className="w-4 h-4" />
                </button>

                <div className="bg-white dark:bg-gray-900">
                    <div className="px-3 pt-3 pb-2">
                        <input
                            type="text"
                            placeholder="Search customer name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    {loadingList && (
                        <div className="px-3 pb-3 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {listError && (
                        <div className="px-4 pb-4 text-center">
                            <p className="text-sm text-red-500 mb-2">{listError}</p>
                            <button
                                type="button"
                                onClick={fetchConversations}
                                className="text-sm text-blue-600 flex items-center gap-1 mx-auto"
                            >
                                <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                        </div>
                    )}

                    {!loadingList && !listError && (
                        <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-60 overflow-y-auto pb-1">
                            {filteredConversations.length === 0 && (
                                <li className="px-4 py-6 text-center text-sm text-gray-400">
                                    {search ? "No customers match your search" : "No recent conversations"}
                                </li>
                            )}
                            {filteredConversations.map((conv) => (
                                <li key={conv.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectConversation(conv)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                            {getInitials(conv.customerName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {conv.customerName}
                                                </span>
                                                <span className="text-xs text-gray-400 shrink-0">
                                                    {formatRelativeTime(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{conv.snippet}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    // ── Detail view ────────────────────────────────────────────────────────────
    return (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/40">
                <button
                    type="button"
                    onClick={() => { setView("list"); setSelected(null); }}
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-[15px] text-blue-700 dark:text-blue-300 truncate">
                    {selected?.customerName}
                </span>
                <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 shrink-0">
                    Name auto-filled ✓
                </span>
            </div>

            <div className="bg-white dark:bg-gray-900 p-3 space-y-3">
                {/* Loading */}
                {loadingDetail && (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Error */}
                {detailError && (
                    <div className="text-center">
                        <p className="text-sm text-red-500 mb-2">{detailError}</p>
                        <button
                            type="button"
                            onClick={() => selected && handleSelectConversation(selected)}
                            className="text-sm text-blue-600 flex items-center gap-1 mx-auto"
                        >
                            <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                    </div>
                )}

                {!loadingDetail && !detailError && (
                    <>
                        {/* Detected phone badge */}
                        {detectedPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full w-fit">
                                <Phone className="w-3 h-3" />
                                <span className="font-medium">{detectedPhone}</span>
                            </div>
                        )}

                        {/* Message list — oldest at top, newest at bottom */}
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                            {messages.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    No messages found
                                </p>
                            )}
                            {messages.map((msg) => {
                                const isPhoneSource = msg.id === phoneSourceId;

                                return (
                                    <div
                                        key={msg.id}
                                        ref={(el) => {
                                            if (el) messageRefs.current.set(msg.id, el);
                                            else messageRefs.current.delete(msg.id);
                                        }}
                                        className={`rounded-lg px-3 py-2 transition-colors ${
                                            isPhoneSource
                                                ? "bg-green-50 dark:bg-green-950/40 ring-1 ring-green-200 dark:ring-green-800"
                                                : "bg-gray-50 dark:bg-gray-800"
                                        }`}
                                    >
                                        {/* Phone detected label */}
                                        {isPhoneSource && (
                                            <span className="inline-block text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded mb-1">
                                                Phone detected
                                            </span>
                                        )}

                                        {/* Raw message text */}
                                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                            {msg.message}
                                        </p>

                                        {/* Per-message action row */}
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <span className="text-[11px] text-gray-400 mr-auto">
                                                {formatRelativeTime(msg.createdAt)}
                                            </span>

                                            {/* Copy */}
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(msg)}
                                                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                            >
                                                <Copy className="w-3 h-3" />
                                                {copiedId === msg.id ? "Copied!" : "Copy"}
                                            </button>

                                            {/* → Phone */}
                                            <button
                                                type="button"
                                                onClick={() => onFill({ phone: splitMessageFields(msg.message).phone })}
                                                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 transition-colors"
                                            >
                                                <Phone className="w-3 h-3" />
                                                → Phone
                                            </button>

                                            {/* → Address */}
                                            <button
                                                type="button"
                                                onClick={() => onFill({ address: splitMessageFields(msg.message).address })}
                                                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-400 transition-colors"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                → Addr
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Anchor — auto-scrolls here on load */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Main action buttons */}
                        {detectedPhone && (
                            <button
                                type="button"
                                onClick={handleFillAll}
                                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                            >
                                Fill All Fields
                            </button>
                        )}

                        {!detectedPhone && messages.length > 0 && (
                            <>
                                <p className="text-xs text-center text-gray-400">
                                    No phone detected — use the per-message buttons above
                                </p>
                                <button
                                    type="button"
                                    onClick={handleScrollToPhone}
                                    className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowDownToLine className="w-4 h-4" />
                                    Go to detected phone message
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
