const baileys = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await baileys.useMultiFileAuthState('auth_info');
    
    const sock = baileys.makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode("213670424893");
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log('YOUR PAIRING CODE IS: ' + code);
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('تم الربط بنجاح!');
        }
    });
}

startBot();
