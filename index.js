const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = "213799518165"; 
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`📌 كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (err) {
                console.log('خطأ في طلب الكود، أعد المحاولة.');
            }
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('WhatsApp Bot Connected Successfully!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const from = msg.key.remoteJid;
        
        if (text === '.الاوامر') {
            await sock.sendMessage(from, { text: "✅ البوت يعمل بنجاح ومربوط برقمك!" });
        }
    });
}

connectToWhatsApp();
