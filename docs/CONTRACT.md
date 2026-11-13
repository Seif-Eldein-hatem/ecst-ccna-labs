## 5. العقد بين الأجزاء

A يحفظ القسم ده كملف `docs/CONTRACT.md` **يوم 1**. أي تغيير فيه بموافقة A بس، لأن كل الأجزاء مبنية عليه.

**الغرفة والسؤال**

```js
// Room
{ id: 22, title: '', cat: '', diff: 'Easy|Medium|Hard|Expert', min: 15, desc: '',
  edited: true,            // اختياري: الأدمن عدّلها فمتتحدّثش من الـ SEED
  qs: [Question] }

// Question
{ id: 0,                   // ثابت جوه الغرفة، عمره ما يتغير ولا يتكرر
  type: 'text',            // 'text' (الافتراضي) | 'mcq' | 'terminal'
  q: 'نص السؤال',
  exhibit: '...',          // اختياري: output/config يتعرض ثابت الخط فوق السؤال
  explain: '...',          // اختياري: شرح بعد الحل
  pts: 10,                 // اختياري (الافتراضي 10)
  // text:     a: 'show ip route;sh ip route'   (lowercase، مفصولة بـ ;)   norm: 'ios' اختياري
  // mcq:      options: ['..','..','..','..'], correct: 2                   (رقم من 0)
  // terminal: expect: ['enable', 'show ip route']                          (بالترتيب، C يحدد التفاصيل)
}
```

**ملفات البيانات** (كل ملف بالشكل ده، والـ Store بيدمجهم):

```js
window.SEED = (window.SEED || []).concat([ /* rooms */ ]);
```

**نطاقات الـ ids:** الأصلية 1–21 · F (سيناريو) 22–30 · C (terminal) 90 · B (demo مؤقت) 91.

**الحالة (localStorage `ecst_v4`)**: نفس الهيكل الحالي (`users`, `prog`, `rooms`, `me`) + حقول جديدة بس:
`deleted: [roomIds]` · `exams: { email: [{date, correct, total, secs}] }`. التقدم في `prog` بيحتفظ بشكله، والأرقام جواه بقت **ids الأسئلة**.
مستخدم: `{name, email, pass, role}` من غير أي تغيير.

**دمج البيانات وقت التحميل:** الغرف المحفوظة بتفضل زي ما هي · الغرف الجديدة من الـ SEED (id مش موجود ومش في `deleted`) بتتضاف في **آخر** القائمة · الغرف اللي مفيهاش `edited` بتتحدّث من الـ SEED · الغرفة المعدّلة ما بتتلمسش.

**Store API (A يبنيه):**

```js
Store.get() / Store.save()
Store.isSolved(email, roomId, qId)   Store.markSolved(email, roomId, q)
Store.pts(q)   Store.userPoints(email)   Store.roomCleared(email, room)
Store.resetStudent(email)   Store.deleteRoom(roomId)        // بيمسح التقدم اليتيم
Store.saveRoom(room)        // sets edited:true, preserves question IDs/fields by text match, auto-assigns non-reused IDs
Store.exportBackup()  // → JSON string
Store.importBackup(str)  // → {ok:true|false, msg}
Store.resetAll()
```

- **تفاصيل `Store.saveRoom(room)`:**
  - يضبط `edited: true` على الغرفة لمنع إعادة كتابتها من الـ `SEED`.
  - يطابق الأسئلة القديمة بالجديدة بناءً على نص السؤال `q.q.trim()`. في حالة تكرار نص السؤال يطابق كل سؤال قديم مرة واحدة كحد أقصى.
  - يحتفظ بـ question IDs القديمة والحقول الإضافية (`type`, `options`, `correct`, `exhibit`, `pts`, `explain`, `norm`).
  - الأسئلة الجديدة غير المطابقة تأخذ IDs جديدة تصاعدية غير مكررة بواسطة عداد الغرفة `nextQId`.

**عقد وضع الاختبار (Exam Contract - يبنيه Part B):**

- كائن الاختبار العام: `window.Exam = { render(rootEl) }`.
- بيانات نتائج الامتحانات في الـ Store:
  ```js
  S.exams[email] = [
    { date: 'YYYY-MM-DD HH:mm', correct: 45, total: 50, secs: 1800 }
  ];
  ```
- **تنبيه هام:** `S.exams` قد يكون `undefined` في بعض الحالات القديمة، ويجب على Part B تهيئته قبل الكتابة دائمًا:
  ```js
  S.exams = S.exams || {};
  ```

**المسار `#exam` والـ Router (يبنيه Part A في `js/app.js`):**

- يدعم الـ Router مسار `#exam`.
- في حالة وجود `window.Exam && typeof Exam.render === 'function'`، يستدعي `Exam.render(rootEl)` مع تمرير عنصر المحتوى الرئيسي `<main>`.
- في حالة عدم وجود `window.Exam` أو عدم جاهزيته، يعرض كارت بديل أنيق: `'Exam mode is coming soon'`.
- يظهر رابط `Exam` في الـ Header للطلاب المسجلين فقط (`role !== 'admin'`)، ولا يظهر للأدمن/المشرف.

**تطبيع أوامر سيسكو `q.norm = 'ios'` و `window.Norm.ios(str)` (يبنيه Part B):**

- يوفر Part B كائن `window.Norm = { ios(str) }`.
- نوع السؤال الافتراضي `'text'` في `js/rooms.js`: عندما يحتوي السؤال على `q.norm === 'ios'` وتتوفر دالة `window.Norm && typeof Norm.ios === 'function'`، يتم قبول الإجابة إذا كان `Norm.ios(input) === Norm.ios(candidate)` لأي إجابة مقبولة في `q.a` (المفصولة بـ `;`).
- في حالة عدم وجود `q.norm` أو غياب `window.Norm`، يتصرف كما هو بدون أي انهيار (fallback to exact text normalization `NM`).
- دالة `check(q, answer)` تظل دالة نقية (pure function) بدون أي تعامل مباشر مع الـ DOM.

**QuestionTypes (A يبنيه في `store.js`، B و C بيسجلوا فيه):**

```js
QuestionTypes.register('mcq', {
  render(q, ctx) { return '<div>...</div>'; },   // ctx = {room, qIndex, email, solve()}
  mount(root, q, ctx) { },                        // اختياري: ربط الأحداث بعد ما الـ HTML يتحط
  check(q, answer) { return true; }               // للأنواع اللي بتتصحح من إجابة واحدة
});
// لما الإجابة تبقى صح: ctx.solve() → بيسجل النقاط ويحدّث الصفحة من غير ما يرجع لفوق
```