# نظام بوت (Nizam Bot) - المرحلة 0: الأساس والنواة

نظام بوت هو بوت ديسكورد معياري مبني بهندسة متماسكة واحترافية بالاعتماد على Node.js وTypeScript وdiscord.js، ومخصص لخدمة مجتمعات ديسكورد الكبيرة بإعدادات صارمة ونظام سجلات وتدقيق متقدم.

## المتطلبات الأساسية

1. Node.js بإصدار 22 LTS أو أحدث.
2. Git.
3. تطبيق ديسكورد مع تفعيل الصلاحيات التالية (Privileged Gateway Intents):
   - Server Members Intent
   - Message Content Intent
4. سيرفر ديسكورد مخصص للتشغيل (قيد السيرفر الواحد الصارم).

## خطوات التثبيت والتشغيل

1. تثبيت الاعتماديات:
```bash
npm install
```

2. إعداد المتغيرات عبر المعالج التفاعلي:
```bash
npm run setup
```
أو عبر نسخ ملف `.env.example` إلى `.env` وتعبئة المتغيرات يدويًا:
- `DISCORD_TOKEN`: توكن البوت السري.
- `CLIENT_ID`: معرّف تطبيق البوت.
- `GUILD_ID`: معرّف السيرفر المخصص.
- `OWNER_ID`: معرّف مالك البوت.

3. تطبيق ترحيلات قاعدة البيانات (SQLite):
```bash
npm run db:migrate
```

4. تسجيل أوامر التطبيق في السيرفر:
```bash
npm run register
```

5. فحص الحالة والتشخيص:
```bash
npm run doctor
```

6. تشغيل البوت في بيئة التطوير:
```bash
npm run dev
```

للتشغيل في بيئة الإنتاج:
```bash
npm run build
npm start
```

## قائمة الأوامر المتاحة (65 أمرًا عبر 9 وحدات متكاملة)

1. **النواة والإعداد (Core & Setup - 6 أوامر):** `/setup`, `/settings`, `/module`, `/doctor`, `/ping`, `/help`
2. **نظام التذاكر والدعم الفني (Tickets - أمر تفاعلي متقدم):** `/ticket` مع أوامر فرعية `[setup|close|add|remove]` وأزرار تفاعلية فورية لفتح وإغلاق التذاكر
3. **نظام المستويات والنشاط (Leveling - أمران):** `/rank`, `/leaderboard` مع احتساب نقاط الخبرة (XP) والتفاعل تلقائيًا
4. **النظام الاقتصادي والمالي (Economy - 3 أوامر):** `/balance`, `/daily`, `/pay` لإدارة المحفظة والبنك والمكافآت اليومية والتحويلات
5. **الإشراف والرقابة (Moderation - 15 أمرًا):** `/ban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clearwarn`, `/purge`, `/slowmode`, `/lock`, `/unlock`, `/nick`, `/giverole`, `/removerole`
6. **الأدوات والمساعدة (Utility - 15 أمرًا):** `/userinfo`, `/serverinfo`, `/botinfo`, `/avatar`, `/banner`, `/roleinfo`, `/channelinfo`, `/poll`, `/announce`, `/remind`, `/calc`, `/timestamp`, `/snowflake`, `/color`, `/randomnumber`
7. **التسلية والألعاب (Fun - 10 أوامر):** `/dice`, `/coinflip`, `/eightball`, `/rps`, `/choose`, `/quote`, `/rate`, `/reverse`, `/trivia`, `/mathquiz`
8. **المجتمع والتفاعل (Community - 9 أوامر):** `/afk`, `/suggest`, `/report`, `/membercount`, `/rules`, `/emojis`, `/boosters`, `/roles`, `/invites`
9. **الأمان والحماية (Security - 4 أوامر):** `/lockdown`, `/raidmode`, `/whitelist`, `/scan`

## جدول الأوامر البرمجية (NPM Scripts)

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | تشغيل البوت في وضع التطوير مع المراقبة وإعادة التشغيل الآلي |
| `npm run build` | بناء المشروع وتصريف TypeScript ونسخ ملفات الترجمة إلى dist |
| `npm start` | تشغيل النسخة المترجمة في بيئة الإنتاج |
| `npm test` | تشغيل كافة اختبارات الوحدة والتكامل باستخدام Vitest |
| `npm run test:watch` | تشغيل الاختبارات في وضع المراقبة |
| `npm run test:coverage` | قياس تغطية الاختبارات |
| `npm run typecheck` | فحص الأنواع بواسطة مترجم TypeScript |
| `npm run lint` | فحص الكود بواسطة ESLint |
| `npm run format` | تنسيق الكود بالكامل بواسطة Prettier |
| `npm run check` | البوابة الكاملة: فحص الأنواع، التنسيق، الاختبارات، الإيموجي، والترجمة |
| `npm run db:generate` | توليد ترحيلات قاعدة البيانات من المخطط |
| `npm run db:migrate` | تطبيق ترحيلات SQLite |
| `npm run setup` | معالج التثبيت والإعداد التفاعلي |
| `npm run register` | تسجيل أوامر السلاش في سيرفر ديسكورد |
| `npm run doctor` | تشخيص الاتصال والصلاحيات وفحص الصحة العام |
| `npm run emoji:check` | الفحص الآلي لمنع وجود أي إيموجي في نصوص البوت |
| `npm run i18n:check` | التحقق من تطابق كافة مفاتيح اللغات بين العربية والإنجليزية |

## سياسة منع الإيموجي

يلتزم المشروع بسياسة صارمة تمنع استخدام الرموز التعبيرية (Emoji) في جميع النصوص والردود والأزرار والقوائم التي يكتبها البوت، للحفاظ على مظهر مهني ورصين. يتم فرض هذه السياسة عبر:
- فحص آلي في بيئة الاختبار والتطوير (`src/ui/emoji.ts`).
- فحص دوري ضمن أداة البناء (`npm run emoji:check`).
- إخفاق البناء في GitHub Actions عند رصد أي رمز تعبيري في مجلد `src`.

## قواعد الأمان والسرية

- لا ترفع ملف `.env` إلى مستودع git أبدًا (الملف مسجل تلقائيًا في `.gitignore`).
- لا تشارك توكن البوت السري في أي مكان عام.
- في حال تسرب التوكن، يجب تدويره وإعادة إنشائه فورًا من بوابة مطوري ديسكورد.
- نظام التسجيل (Logger) يطبّق تلقائيًا تنقيحًا وحجبًا للمفاتيح الحساسة لمنع تسربها للسجلات.

## التوثيق والمواصفات

- وثيقة التصميم الشاملة: [docs/superpowers/specs/2026-10-22-discord-bot-design.md](file:///c:/Users/User/Desktop/nizam-bot-phase-0/docs/superpowers/specs/2026-10-22-discord-bot-design.md)
- خطة تنفيذ المرحلة 0: [docs/superpowers/plans/2026-10-22-00-foundation.md](file:///c:/Users/User/Desktop/nizam-bot-phase-0/docs/superpowers/plans/2026-10-22-00-foundation.md)
- دليل العمليات والتشغيل: [docs/OPERATIONS.md](file:///c:/Users/User/Desktop/nizam-bot-phase-0/docs/OPERATIONS.md)
