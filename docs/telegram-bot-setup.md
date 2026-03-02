# Telegram Bot Setup Guide

This guide will walk you through creating a Telegram Bot and finding the required **Bot Token** and **Chat ID** to receive order notifications inside your Admin Dashboard settings.

---

## 1. Create a Telegram Bot (Get the Bot Token)

1. Open the Telegram app on your phone or computer.
2. Search for the user `@BotFather` (ensure it has a verified blue checkmark) and start a chat with it.
3. Send the command: `/newbot`
4. **Choose a name** for your bot (e.g., `Shopline Orders Bot`).
5. **Choose a username** for your bot. It must end in "bot" (e.g., `Shopline_Orders_bot`).
6. **Congratulations!** `BotFather` will reply with a message containing your **HTTP API Token** (it looks like a long string of letters and numbers: `1234567890:ABCdefGhI_jklMNOpqrSTUvwxYZ`).
7. **Copy this Token.** You will paste this into the **"Telegram Bot Token"** field in your Admin Settings.

---

## 2. Get Your Chat ID

The bot needs to know exactly *which chat* or *who* to send the messages to. This requires your unique Chat ID.

### Option A: Send it to your personal Telegram

1. Search for `@userinfobot` in Telegram and start a chat.
2. Send any message or type `/start`.
3. The bot will instantly reply with your `Id: 123456789`.
4. **Copy this number.** You will paste this into the **"Telegram Chat ID"** field in your Admin Settings.

### Option B: Send it to a Group Chat (e.g., a Team Chat)

1. Create a new Telegram Group containing your team members.
2. Go to the group settings and **add the Bot you just created** (search for its username, e.g., `@Shopline_Orders_bot`) as a member.
3. Once the bot is in the group, send a random message in the group like "Hello bot!".
4. Go to this URL in your web browser, replacing `<YourBotToken>` with the token from Step 1:
   ```
   https://api.telegram.org/bot<YourBotToken>/getUpdates
   ```
5. Look at the text response on your screen. You will see something like `"chat":{"id":-100987654321}`.
6. **Copy this Negative Number (including the `-`).** You will paste this into the **"Telegram Chat ID"** field in your Admin Settings.

---

## 3. Save Settings & Test

1. Go to your Admin Dashboard -> **Settings**.
2. Paste the **Token** and the **Chat ID** into the respective fields.
3. Click "Save Settings".
4. To test, you can go place a fake order on the frontend shop. Your phone should instantly receive a Telegram message with the new order details!
