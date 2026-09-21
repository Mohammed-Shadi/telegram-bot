const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive and running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const token = '8951195191:AAGDnKJq1m9L1zdV9xHiXlxsJyhi0bUVuCk';
const url = `https://api.telegram.org/bot${token}`;

let offset = 0;
const userState = {};

async function poll() {
    try {
        const res = await fetch(`${url}/getUpdates?offset=${offset}&timeout=10`);
        const data = await res.json();
        
        if (data && data.result) {
            for (const msg of data.result) {
                offset = msg.update_id + 1;

                if (msg.callback_query) {
                    const query = msg.callback_query;
                    const chatId = query.message.chat.id;
                    const dataAction = query.data;
                    const videoUrl = userState[chatId];

                    await fetch(`${url}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: query.id })
                    });

                    if (!videoUrl) {
                        await sendMessage(chatId, "⚠️ انتهت صلاحية الرابط، الرجاء إرسال رابط يوتيوب من جديد.");
                        continue;
                    }

                    if (dataAction === 'dl_audio') {
                        await sendMessage(chatId, "🎵 جاري استخراج وتحويل الصوت عبر الـ API، يرجى الانتظار...");
                        
                        try {
                            const apiRes = await fetch(`https://api.cobalt.tools/api/json`, {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    url: videoUrl,
                                    isAudioOnly: true,
                                    downloadMode: 'audio'
                                })
                            });

                            const apiData = await apiRes.json();

                            if (apiData && apiData.url) {
                                await fetch(`${url}/sendAudio`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        chat_id: chatId,
                                        audio: apiData.url,
                                        caption: "✅ تم تحميل الملف الصوتي بنجاح!"
                                    })
                                });
                            } else {
                                await sendMessage(chatId, "❌ تعذر استخراج الصوت من هذا الرابط.");
                            }
                        } catch (err) {
                            await sendMessage(chatId, "❌ حدث خطأ أثناء الاتصال بخدمة التحميل.");
                        }
                    }
                    continue;
                }

                if (msg.message && (msg.message.text || msg.message.caption)) {
                    const text = (msg.message.text || msg.message.caption).trim();
                    const chatId = msg.message.chat.id;
                    
                    if (text.includes('youtube.com') || text.includes('youtu.be')) {
                        userState[chatId] = text;
                        
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                chat_id: chatId, 
                                text: "📥 تم استلام الرابط بنجاح! اختر صيغة التحميل:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "🎵 تحميل الصوت (MP3)", callback_data: "dl_audio" }
                                        ]
                                    ]
                                }
                            })
                        });
                    } else if (msg.message.text && !msg.message.text.startsWith('/')) {
                        await sendMessage(chatId, " أهلاً بك! أرسل رابط يوتيوب لتحويله وتحميله كملف صوتي.");
                    }
                }
            }
        }
    } catch (e) {
        console.log("خطأ في الاتصال:", e);
    }
    setTimeout(poll, 1000);
}

async function sendMessage(chatId, text) {
    await fetch(`${url}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
}

console.log("البوت جاهز ويعمل بكفاءة...");
poll();