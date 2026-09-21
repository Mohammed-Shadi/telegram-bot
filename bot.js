const { createWriteStream } = require('fs');
const { unlink } = require('fs/promises');
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

                // معالجة الضغط على الأزرار
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
                        await sendMessage(chatId, "🎵 جاري تحميل وتحويل الملف الصوتي، قد يستغرق ذلك دقيقة...");
                        
                        try {
                            const audioPath = path.join(__dirname, `${chatId}.mp3`);
                            
                            // تحميل الصوت من يوتيوب
                            const stream = ytdl(videoUrl, { quality: highestaudio, filter: 'audioonly' });
                            const writeStream = createWriteStream(audioPath);
                            
                            stream.pipe(writeStream);

                            writeStream.on('finish', async () => {
                                // إرسال الملف الصوتي للمستخدم
                                const formData = new FormData();
                                formData.append('chat_id', chatId);
                                
                                const fileBlob = new Blob([await require('fs').promises.readFile(audioPath)]);
                                formData.append('audio', fileBlob, 'audio.mp3');
                                formData.append('title', 'YouTube Audio');

                                await fetch(`${url}/sendAudio`, {
                                    method: 'POST',
                                    body: formData
                                });

                                await sendMessage(chatId, "✅ تم إرسال الملف الصوتي بنجاح!");
                                
                                // حذف الملف المؤقت من السيرفر لتوفير المساحة
                                await unlink(audioPath).catch(() => {});
                            });

                            stream.on('error', async () => {
                                await sendMessage(chatId, "❌ حدث خطأ أثناء تحميل الصوت، يرجى المحاولة لاحقاً.");
                            });

                        } catch (err) {
                            await sendMessage(chatId, "❌ تعذر معالجة هذا الرابط.");
                        }
                    } else if (dataAction === 'dl_video') {
                        await sendMessage(chatId, "📹 تحميل الفيديوهات بحجم كبير يتطلب مساحة سيرفر إضافية، جارٍ التركيز على الصوت حالياً.");
                    }
                    continue;
                }

                // استقبال الروابط
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
                                text: "📥 تم استلام الرابط! اختر الصيغة:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "📹 فيديو (قريباً)", callback_data: "dl_video" },
                                            { text: "🎵 صوت (MP3)", callback_data: "dl_audio" }
                                        ]
                                    ]
                                }
                            })
                        });
                    } else {
                        await sendMessage(chatId, "📚 أرسل رابط يوتيوب لتحميله كملف صوتي.");
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

console.log("بوت التحميل يعمل بكفاءة...");
poll();