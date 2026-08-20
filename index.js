const⁠ { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot Status: Online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });
    
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if(connection === 'close') {
            connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('WhatsApp Bot Connected Successfully!');
        }
    });

    // استلام الرسائل والرد عليها
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const from = msg.key.remoteJid;

        // الرد على كلمة مرحبا أو الأوامر
        if (text.toLowerCase() === 'مرحبا' || text.toLowerCase() === 'مرحباً') {
            await sock.sendMessage(from, { text: 'أهلاً وسهلاً بك! كيف يمكنني مساعدتك؟' });
        } else if (text === '.الاوامر') {
            await sock.sendMessage(from, { text: 'قائمة الأوامر المتاحة:\n- مرحبا\n- .الاوامر' });
        }
    });

    setTimeout(async () => {
        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode("213799518165");
            console.log(`YOUR PAIRING CODE: ${code}`);
        }
    }, 5000);
}

connectToWhatsApp();
