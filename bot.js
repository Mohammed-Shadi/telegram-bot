const { createWriteStream } = require('fs');
const { unlink, readFile } = require('fs/promises');
const path = require('path');
const ytdl = require('ytdl-core');

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
                        await sendMessage(chatId, "🎵 جاري تحميل الملف الصوتي، يرجى الانتظار...");
                        
                        try {
                            const audioPath = path.join(__dirname, `${chatId}_${Date.now()}.mp3`);
                            
                            const stream = ytdl(videoUrl, { 
                                quality: 'highestaudio', 
                                filter: 'audioonly',
                                highWaterMark: 1 << 25 
                            });
                            
                            const writeStream = createWriteStream(audioPath);
                            stream.pipe(writeStream);

                            writeStream.on('finish', async () => {
                                try {
                                    const fileBuffer = await readFile(audioPath);
                                    const formData = new FormData();
                                    formData.append('chat_id', chatId);
                                    
                                    const blob = new Blob([fileBuffer]);
                                    formData.append('audio', blob, 'audio.mp3');
                                    formData.append('title', 'YouTube Audio');

                                    await fetch(`${url}/sendAudio`, {
                                        method: 'POST',
                                        body: formData
                                    });

                                    await unlink(audioPath).catch(() => {});
                                } catch (uploadErr) {
                                    await sendMessage(chatId, "❌ حدث خطأ أثناء إرسال الملف الصوتي.");
                                }
                            });

                            stream.on('error', async () => {
                                await sendMessage(chatId, "❌ تعذر تحميل المقطع، تأكد من صحة الرابط.");
                            });

                        } catch (err) {
                            await sendMessage(chatId, "❌ حدث خطأ في معالجة الطلب.");
                        }
                    }
                    continue;
                }

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
                                text: "📥 تم استلام الرابط بنجاح! اضغط للتحميل:",
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
                        await sendMessage(chatId, " أهلاً بك! أرسل رابط يوتيوب لتحويله وتحميله كملف صوتي.");
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

console.log("البوت يعمل بثبات الآن...");
poll();