# creative-rtl

پیش‌نمایش Markdown برای متن‌های ترکیبی فارسی و انگلیسی، با تشخیص خودکار جهت هر بلوک.

## اجرا

```bash
npm install
cp .env.example .env.local
npm run dev
```

سپس `http://localhost:3000` را باز کنید. برای بررسی نهایی:

```bash
npm run typecheck
npm run test
npm run build
```

برای خروجی PDF/PNG سمت سرور، Chromium را یک بار نصب کنید:

```bash
npx playwright install chromium
```

## معماری

- `/editor` ورودی را با debounce به `POST /api/render` می‌فرستد.
- Markdown و HTML در `src/lib/markdown/pipeline.ts` با unified parse و sanitize می‌شوند.
- منطق تشخیص جهت در `src/lib/bidi` مستقل از React است.
- سند در `localStorage` ذخیره می‌شود و اشتراک با `deflate-raw` در hash آدرس انجام می‌شود.

متن برای رندر به سرور ارسال می‌شود اما ذخیره یا لاگ نمی‌شود. لینک اشتراک بدون بک‌اند کار می‌کند.

## خروجی PDF و PNG

- `POST /api/export` همان pipeline رندر و CSS کاغذ را در Chromium اجرا می‌کند؛ PDF و PNG با فونت‌های inline، Mermaid سمت سرور و رنگ کاغذ تولید می‌شوند.
- موتور پیش‌فرض `playwright` است. برای محیطی که Chromium ندارد، `PDF_ENGINE=disabled` بگذارید تا API با `503` پاسخ دهد و رابط کاربری به چاپ مرورگر برگردد.
- `PDF_NO_SANDBOX=1` فقط در کانتینرهای ایزوله استفاده شود. در محیط عادی sandbox Chromium فعال می‌ماند.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` برای تعیین مسیر Chromium سفارشی است.
- اندازه‌ی خروجی از تنظیمات با A4 یا Letter انتخاب می‌شود. PNG با عرض ثابت و PDF با `@page` تولید می‌شود.
- برای جلوگیری از SSRF، تصاویر خارجی فقط با HTTPS، بررسی DNS و محدودیت اندازه/redirect در خروجی inline می‌شوند؛ تصویر نامعتبر با placeholder جایگزین می‌شود.
- محدودیت‌های حجم، خطوط، Mermaid، نرخ درخواست و هم‌زمانی روی API اعمال می‌شوند. خروجی بزرگ یا موتور غیرفعال، پیام قابل‌فهم و fallback چاپ دارد.

در استقرار Docker/VPS، از imageای استفاده کنید که Chromium سازگار با نسخه‌ی Playwright را داشته باشد؛ اجرای موتور headless هم‌زمان برای بیش از دو درخواست در هر instance عمداً محدود شده است.
