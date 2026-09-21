const token = '8951195191:AAGDnKJq1m9L1zdV9xHiXlxsJyhi0bUVuCk';
const url = `https://api.telegram.org/bot${token}`;

let offset = 0;
const userState = {};

async function poll() {
    try {
        const res = await fetch(`${url}/getUpdates?offset=${offset}&timeout=10`);
        const data = await res.json();
        
        if (data.result) {
            for (const msg of data.result) {
                offset = msg.update_id + 1;

                // معالجة الأزرار
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
                        await sendMessage(chatId, "⚠️ الرجاء إرسال رابط يوتيوب من جديد.");
                        continue;
                    }

                    if (dataAction === 'dl_audio') {
                        await sendMessage(chatId, "🔄 جاري تجهيز واستخراج الملف الصوتي...");
                        
                        try {
                            // استخدام خدمة API سريعة ومضمونة لاستخراج رابط التحميل المباشر للصوت
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
                                // إرسال رابط التحميل المباشر للمستخدم فوراً
                                await fetch(`${url}/sendAudio`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        chat_id: chatId,
                                        audio: apiData.url,
                                        caption: "🎵 تم استخراج الملف الصوتي بنجاح بواسطة البوت!"
                                    })
                                });
                            } else {
                                await sendMessage(chatId, "❌ تعذر استخراج الصوت من هذا الرابط، تأكد أنه رابط يوتيوب صحيح.");
                            }
                        } catch (err) {
                            await sendMessage(chatId, "❌ حدث خطأ أثناء الاتصال بخدمة التحميل.");
                        }
                    }
                    continue;
                }

                // استقبال الرسائل والروابط
                if (msg.message && msg.message.text) {
                    const text = msg.message.text.trim();
                    const chatId = msg.message.chat.id;
                    
                    if (text.includes('youtube.com/') || text.includes('youtu.be/')) {
                        userState[chatId] = text;
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                chat_id: chatId, 
                                text: "📥 تم استلام الرابط بنجاح! اضغط على الزر أدناه لتحميل الصوت:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "🎵 تحميل الصوت (MP3)", callback_data: "dl_audio" }
                                        ]
                                    ]
                                }
                            })
                        });
                    } else {
                        await sendMessage(chatId, " أهلاً بك! أرسل لي رابط يوتيوب وسأقوم بتحويله وتحميله لك كملف صوتي.");
                    }
                }
            }
        }
    } catch (e) {
        console.log("خطأ:", e);
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

console.log("البوت يعمل بنظام الاستخراج السريع...");
poll();