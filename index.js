const { default: makeWASocket, useMultiFileAuthState, disconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' })
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const phoneNumber = "213770388383"; // 👈 استبدل هذا برقم هاتفك الحقيقي مع رمز الدولة وبدون +
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n=================================\n🔑 رمز الإقران الخاص بك: ${code}\n=================================\n`);
            } catch (err) {
                console.log('حدث خطأ أثناء طلب رمز الإقران:', err);
            }
        }, 5000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== disconnectReason.loggedOut;
            console.log('انقطع الاتصال، جاري إعادة المحاولة...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم اتصال البوت بنجاح!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim().toLowerCase();

        if (body === 'الاوامر' || body === 'الأوامر' || body === 'مساعدة') {
            const menuText = `
🤖 *قائمة أوامر البوت* 🤖
────────────────
⚡ *.تست* - للتأكد من عمل البوت
🖼️ *.لعبة* - خمن اسم الشخصية
            `;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }

        if (body === 'تست' || body === '.تست') {
            await sock.sendMessage(from, { text: 'البوت شغال بنجاح 100%! 🚀🔥' }, { quoted: msg });
        }

        if (body === 'لعبة' || body === '.لعبة') {
            const gameText = `
🏆 *لعبة الصور* 🖼️
────────────────
🧠 خمن اسم الشخصية!
⏱️ أول واحد يجاوب صح يفوز 🏆

🎯 الإجابة: غارب
💰 +500 AURA
🔥 برافو عليك!
            `;
            await sock.sendMessage(from, { text: gameText }, { quoted: msg });
        }
    });
}

startBot();
