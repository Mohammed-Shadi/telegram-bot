const http = require('http');

const token = '8951195191:AAGDnKJq1m9L1zdV9xHiXlxsJyhi0bUVuCk';
const url = `https://api.telegram.org/bot${token}`;

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const update = JSON.parse(body);
                
                if (update.message) {
                    const msg = update.message;
                    const chatId = msg.chat.id;
                    const text = (msg.text || msg.caption || '').trim();

                    if (text.includes('http://') || text.includes('https://')) {
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                chat_id: chatId, 
                                text: "📥 تم استلام الرابط بنجاح! اختر صيغة التحميل:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "🎵 تحميل الصوت (MP3)", callback_data: `dl_audio_${text}` }
                                        ]
                                    ]
                                }
                            })
                        });
                    } else {
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, text: "أهلاً بك! أرسل رابط يوتيوب لتحويله وتحميله." })
                        });
                    }
                } else if (update.callback_query) {
                    const query = update.callback_query;
                    const chatId = query.message.chat.id;
                    const dataAction = query.data;

                    await fetch(`${url}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: query.id })
                    });

                    if (dataAction.startsWith('dl_audio_')) {
                        const videoUrl = dataAction.replace('dl_audio_', '');
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, text: "🎵 جاري استخراج وتحويل الصوت، يرجى الانتظار..." })
                        });

                        const apiRes = await fetch(`https://api.cobalt.tools/api/json`, {
                            method: 'POST',
                            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: videoUrl, isAudioOnly: true, downloadMode: 'audio' })
                        });
                        const apiData = await apiRes.json();

                        if (apiData && apiData.url) {
                            await fetch(`${url}/sendAudio`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: chatId, audio: apiData.url, caption: "✅ تم تحميل الملف الصوتي بنجاح!" })
                            });
                        } else {
                            await fetch(`${url}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: chatId, text: "❌ تعذر استخراج الصوت من الرابط." })
                            });
                        }
                    }
                }
            } catch (err) {
                console.log("Error:", err);
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running via Webhook!');
    }
});

// هذا السطر هو الأهم لأنه يلتقط المنفذ الصحيح من Render (مثل 10000)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});