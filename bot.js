const token = '8951195191:AAGDnKJq1m9L1zdV9xHiXlxsJyhi0bUVuCk';
const url = `https://api.telegram.org/bot${token}`;

let offset = 0;

async function poll() {
    try {
        const res = await fetch(`${url}/getUpdates?offset=${offset}&timeout=10`);
        const data = await res.json();
        
        if (data.result) {
            for (const msg of data.result) {
                offset = msg.update_id + 1;
                if (msg.message && msg.message.text) {
                    const text = msg.message.text.trim().toLowerCase();
                    const chatId = msg.message.chat.id;
                    
                    console.log("رسالة جديدة وصلت: " + text);
                    
                    let replyText = "";

                    // موسوعة شاملة لأساسيات جافا سكريبت
                    if (text.includes('var') || text.includes('let') || text.includes('const') || text.includes('متغير')) {
                        replyText = "💡 **1. المتغيرات (Variables):**\nتُستخدم لتخزين القيم.\n- `let`: لتخزين بيانات قابلة للتغيير.\n- `const`: لقيم ثابتة لا تتغير.\nمثال:\n`let score = 100;`\n`const pi = 3.14;`";
                    } 
                    else if (text.includes('function') || text.includes('دال') || text.includes('دوال')) {
                        replyText = "⚡ **2. الدوال (Functions):**\nكتل برمجية لتنفيذ مهام محددة وإعادة استخدامها.\nمثال:\n`function greet(name) {\n  return 'Hello ' + name;\n}`";
                    } 
                    else if (text.includes('loop') || text.includes('تكرار') || text.includes('for') || text.includes('while')) {
                        replyText = "🔄 **3. الحلقات التكرارية (Loops):**\nTستخدم لتكرار تنفيذ الأكواد.\nمثال:\n`for (let i = 0; i < 5; i++) {\n  console.log(i);\n}`";
                    } 
                    else if (text.includes('array') || text.includes('مصفوف') || text.includes('مصفوفات')) {
                        replyText = "📦 **4. المصفوفات (Arrays):**\nتخزن مجموعة من القيم في متغير واحد.\nمثال:\n`let colors = ['red', 'green', 'blue'];\nconsole.log(colors[0]); // red`";
                    } 
                    else if (text.includes('object') || text.includes('كائن') || text.includes('كائنات')) {
                        replyText = "🏷️ **5. الكائنات (Objects):**\nتخزن بيانات على شكل خصائص (Key-Value).\nمثال:\n`let user = { name: 'Ahmed', age: 25 };\nconsole.log(user.name);`";
                    } 
                    else if (text.includes('if') || text.includes('شرط') || text.includes('شروط')) {
                        replyText = "🔀 **6. الجمل الشرطية (If / Else):**\nاتخاذ قرارات بناءً على شروط معينة.\nمثال:\n`if (age > 18) {\n  console.log('Allowed');\n} else {\n  console.log('Blocked');\n}`";
                    } 
                    else {
                        replyText = `📚 **موسوعة JavaScript الشاملة:**\nأنا جاهز لتعليمك! اسألني عن أي من هذه المواضيع:\n- المتغيرات (var / let / const)\n- الدوال (Functions)\n- التكرار (Loops)\n- المصفوفات (Arrays)\n- الكائنات (Objects)\n- الشروط (If / Else)`;
                    }
                    
                    // إرسال الرد بتنسيق Markdown
                    await fetch(`${url}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            chat_id: chatId, 
                            text: replyText,
                            parse_mode: 'Markdown'
                        })
                    });
                }
            }
        }
    } catch (e) {
        console.log("خطأ بالاتصال", e);
    }
    setTimeout(poll, 1000);
}

console.log("موسوعة بوت جافا سكريبت تعمل الآن...");
poll();