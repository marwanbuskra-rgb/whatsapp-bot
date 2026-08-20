const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot Status: Online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if(connection === 'close') {
            console.log('Connection closed, reconnecting...');
            connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('WhatsApp Bot Connected Successfully!');
        }
    });
}

connectToWhatsApp();

