const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('انقطع الاتصال، جاري إعادة المحاولة...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('تم اتصال البوت بنجاح!');
        }
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = "380717572499"; 
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n\n=== كود الاقتران الخاص بك هو: ${code} ===\n\n`);
            } catch (err) {
                console.error("خطأ في طلب كود الاقتران:", err);
            }
        }, 4000);
    }
}

startBot();
