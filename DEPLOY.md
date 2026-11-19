# DEMO ওয়েবসাইট লাইভ করার নির্দেশিকা

মোট সময়: প্রায় ৩০–৪০ মিনিট। তিনটা free account লাগবে: **GitHub**, **Supabase**, **Vercel**।

---

## ধাপ ১: GitHub-এ কোড রাখা

1. github.com-এ গিয়ে **New repository** চাপুন।
2. নাম দিন `demo-website`, বেছে নিন **Private**। README, .gitignore কিছুই যোগ করবেন না, repo একদম খালি থাকবে।
3. **Create repository** চাপুন। তারপর Claude-কে repo-র নাম জানান, সে কোড push করে দেবে।

## ধাপ ২: Supabase (ডেটাবেস)

1. supabase.com → **New project**
   - Region: **Southeast Asia (Singapore)**, বাংলাদেশের সবচেয়ে কাছে।
   - Database password নিরাপদ জায়গায় লিখে রাখুন।
2. **Database → Extensions** → `pg_cron` খুঁজে চালু করুন। এটা অসমাপ্ত অনলাইন পেমেন্টের স্টক আবার ফেরত আনে।
3. **SQL Editor → New query** → `supabase/setup.sql` ফাইলের পুরো লেখা কপি-পেস্ট করে **Run** চাপুন। "Success" দেখাবে।
4. **Authentication → Sign In / Providers → Email** → **Allow new users to sign up** বন্ধ করুন, কারণ স্টোরে customer account নেই।
5. **Admin user বানানো:** Authentication → Users → **Add user → Create new user** → আপনার email ও শক্ত password দিন, **Auto Confirm User** টিক দিন।
   তারপর SQL Editor-এ এটা চালান (email বদলে):
   ```sql
   update profiles set role = 'admin', full_name = 'Mahedi Hasan'
   where id = (select id from auth.users where email = 'আপনার@email.com');
   ```
6. **Project Settings → API Keys** থেকে তিনটা জিনিস কপি করুন:
   - Project URL
   - `anon` / publishable key (public)
   - `service_role` / secret key (**গোপন, কাউকে দেবেন না**)

## ধাপ ৩: Vercel (ওয়েবসাইট হোস্টিং)

1. vercel.com → **Continue with GitHub** দিয়ে ঢুকুন।
2. **Add New → Project** → `demo-website` repo-র পাশে **Import** চাপুন।
3. **Environment Variables** অংশে এগুলো যোগ করুন:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key |
   | `ORDER_TOKEN_SECRET` | কমপক্ষে ৪০ অক্ষরের এলোমেলো লেখা (Claude একটা বানিয়ে দিতে পারে) |
   | `NEXT_PUBLIC_SITE_URL` | আপাতত `https://demo-website.vercel.app` (পরে আসল URL বসাবেন) |
   | `NEXT_PUBLIC_STORE_EMAIL` | স্টোরের email (ঐচ্ছিক) |
   | `NEXT_PUBLIC_STORE_PHONE` | স্টোরের ফোন, যেমন `+8801712345678` (ঐচ্ছিক) |
   | `NEXT_PUBLIC_STORE_WHATSAPP` | শুধু সংখ্যা, যেমন `8801712345678` (ঐচ্ছিক) |

   ⚠️ `STRIPE_*` key আসল Stripe account ছাড়া বসাবেন না।
4. **Deploy** চাপুন। ২–৩ মিনিট লাগবে।
5. Deploy শেষ হলে আসল URL দেখাবে। সেটা দিয়ে `NEXT_PUBLIC_SITE_URL` আপডেট করে **Redeploy** করুন।
6. Supabase → **Authentication → URL Configuration → Site URL**-এ একই URL বসান।

## ধাপ ৪: সব ঠিক আছে কিনা দেখা

1. `https://আপনার-সাইট/api/health` খুলুন। `"ready": true` দেখালে সব যুক্ত হয়েছে।
2. সাইটে একটা Cash on Delivery অর্ডার দিন, তারপর **Track an order** থেকে ট্র্যাক করুন।
3. `/admin`-এ login করে অর্ডারটা দেখুন, তারপর Cancel করুন (stock ফেরত আসবে)।
4. Admin → Settings-এ delivery fee আর USD rate মিলিয়ে নিন।

## লাইভ করার আগে মনে রাখবেন

- **ছবি:** `public/images`-এর ছবিগুলো ডিজাইনের জন্য দেওয়া নমুনা। নিজের তোলা বা লাইসেন্স করা ছবি দিয়ে বদলান।
- **Policy পেজ:** একজন আইন-জানা মানুষকে দিয়ে দেখিয়ে নিন।
- **Demo coupon:** `WELCOME10` আর `DEMO500` চালু আছে। না চাইলে Admin → Coupons থেকে বন্ধ করুন।
- **নিজের domain:** Vercel → Project → Settings → Domains থেকে যোগ করা যায়।
