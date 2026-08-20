const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const yts = require('yt-search');
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

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (text.startsWith('.طرد') && isGroup) {
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) {
                await sock.groupParticipantsUpdate(from, mentioned, "remove");
                await sock.sendMessage(from, { text: 'تم طرد العضو بنجاح 🚫' });
            } else {
                await sock.sendMessage(from, { text: 'يرجى الإشارة (منشن) للشخص المراد طرده.' });
            }
        }
        else if (text.startsWith('.شغل')) {
            const searchQuery = text.replace('.شغل', '').trim();
            if (!searchQuery) {
                return await sock.sendMessage(from, { text: 'اكتب اسم الأغنية بعد الأمر، مثال: .شغل اسم الأغنية' });
            }
            await sock.sendMessage(from, { text: 'جاري البحث عن الصوتية... 🎵' });
            const r = await yts(searchQuery);
            const videos = r.videos;
            if (videos.length > 0) {
                const song = videos[0];
                await sock.sendMessage(from, { 
                    text: `🎵 *تم العثور على المقطع:*\n📌 *العنوان:* ${song.title}\n⏱️ *المدة:* ${song.timestamp}\n🔗 *الرابط:* ${song.url}` 
                });
            } else {
                await sock.sendMessage(from, { text: 'لم يتم العثور على نتائج.' });
            }
        }
        else if (text === 'مرحبا' || text === 'مرحباً') {
            await sock.sendMessage(from, { text: 'أهلاً وسهلاً بك! كيف يمكنني مساعدتك؟' });
        } else if (text === '.الاوامر') {
            await sock.sendMessage(from, { 
                text: "📌 *قائمة الأوامر المتاحة:*\n\n1️⃣ `.شغل اسم الأغنية`\n2️⃣ `.طرد @عضو`\n3️⃣ `مرحبا`\n4️⃣ `.الاوامر`" 
            });
        }
    });
}

connectToWhatsApp();
