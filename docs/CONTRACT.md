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

**QuestionTypes (A يبنيه في `store.js`، B و C بيسجلوا فيه):**

```js
QuestionTypes.register('mcq', {
  render(q, ctx) { return '<div>...</div>'; },   // ctx = {room, qIndex, email, solve()}
  mount(root, q, ctx) { },                        // اختياري: ربط الأحداث بعد ما الـ HTML يتحط
  check(q, answer) { return true; }               // للأنواع اللي بتتصحح من إجابة واحدة
});
// لما الإجابة تبقى صح: ctx.solve() → بيسجل النقاط ويحدّث الصفحة من غير ما يرجع لفوق
```