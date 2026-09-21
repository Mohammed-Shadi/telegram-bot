const token = '8951195191:AAGDnKJq1m9L1zdV9xHiXlxsJyhi0bUVuCk';
const url = `https://api.telegram.org/bot${token}`;

let offset = 0;

// تخزين مؤقت للروابط لكل مستخدم
const userState = {};

async function poll() {
    try {
        const res = await fetch(`${url}/getUpdates?offset=${offset}&timeout=10`);
        const data = await res.json();
        
        if (data.result) {
            for (const msg of data.result) {
                offset = msg.update_id + 1;

                // 1. معالجة الضغط على الأزرار (Callback Queries)
                if (msg.callback_query) {
                    const query = msg.callback_query;
                    const chatId = query.message.chat.id;
                    const dataAction = query.data; // مثل 'dl_video' أو 'dl_audio'
                    const videoUrl = userState[chatId];

                    // الرد على الضغطة لإيقاف علامة التحميل في الزر
                    await fetch(`${url}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: query.id })
                    });

                    if (!videoUrl) {
                        await sendMessage(chatId, "⚠️ انتهت صلاحية الرابط، الرجاء إرسال رابط يوتيوب من جديد.");
                        continue;
                    }

                    if (dataAction === 'dl_video') {
                        await sendMessage(chatId, `📹 جاري تجهيز تحميل الفيديو...\nالرابط: ${videoUrl}`);
                        // TODO: أضف هنا كود تحميل وتحويل وإرسال الفيديو للمستخدم
                    } else if (dataAction === 'dl_audio') {
                        await sendMessage(chatId, `🎵 جاري استخراج وتحويل الملف الصوتي (MP3)...\nالرابط: ${videoUrl}`);
                        // TODO: أضف هنا كود استخراج الصوت وإرساله للمستخدم
                    }
                    continue;
                }

                // 2. معالجة الرسائل النصية العادية
                if (msg.message && msg.message.text) {
                    const text = msg.message.text.trim();
                    const chatId = msg.message.chat.id;
                    const lowerText = text.toLowerCase();
                    
                    console.log("رسالة جديدة وصلت: " + text);
                    
                    // التحقق مما إذا كان النص رابط يوتيوب
                    if (text.includes('youtube.com/') || text.includes('youtu.be/')) {
                        // حفظ الرابط مؤقتاً لهذا المستخدم
                        userState[chatId] = text;

                        // إرسال رسالة مع أزرار الاختيار (فيديو أو صوت)
                        await fetch(`${url}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                chat_id: chatId, 
                                text: "📥 تم استلام الرابط بنجاح! اختر صيغة التحميل المطلوبة:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "📹 فيديو (MP4)", callback_data: "dl_video" },
                                            { text: "🎵 صوت (MP3)", callback_data: "dl_audio" }
                                        ]
                                    ]
                                }
                            })
                        });
                    } 
                    // الردود القديمة الخاصة بموسوعة الجافا سكريبت
                    else {
                        let replyText = "";

                        if (lowerText.includes('var') || lowerText.includes('let') || lowerText.includes('const') || lowerText.includes('متغير')) {
                            replyText = "💡 **1. المتغيرات (Variables):**\nتُستخدم لتخزين القيم.\n- `let`: لتخزين بيانات قابلة للتغيير.\n- `const`: لقيم ثابتة لا تتغير.";
                        } 
                        else if (lowerText.includes('function') || lowerText.includes('دال') || lowerText.includes('دوال')) {
                            replyText = "⚡ **2. الدوال (Functions):**\nكتل برمجية لتنفيذ مهام محددة.";
                        } 
                        else {
                            replyText = `📚 **موسوعة JavaScript وبوت التحميل:**\nأرسل لي رابط يوتيوب لتحميله، أو اسألني عن أساسيات جافا سكريبت (متغيرات، دوال، مصفوفات...).`;
                        }
                        
                        await sendMessage(chatId, replyText, 'Markdown');
                    }
                }
            }
        }
    } catch (e) {
        console.log("خطأ بالاتصال", e);
    }
    setTimeout(poll, 1000);
}

// دالة مساعدة لإرسال الرسائل بسهولة
async function sendMessage(chatId, text, parseMode = null) {
    const body = { chat_id: chatId, text: text };
    if (parseMode) body.parse_mode = parseMode;

    await fetch(`${url}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

console.log("البوت المحدث يعمل الآن...");
poll();