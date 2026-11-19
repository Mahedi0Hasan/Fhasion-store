/**
 * Info & policy page content in English and Bangla.
 * Policies describe how THIS store actually works (guest checkout, COD,
 * 7-day returns, the data we collect). They are a starting template, so
 * have them reviewed before launch (see README).
 */
import type { Locale } from "@/lib/i18n";

export type Block = { h?: string; p?: string[]; list?: string[] };
export type PageContent = { title: string; eyebrow: string; intro: string; blocks: Block[] };
type Bi<T> = Record<Locale, T>;

export const POLICY_SLUGS = ["shipping-policy", "return-policy", "privacy-policy", "terms"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const POLICIES: Record<PolicySlug, Bi<PageContent>> = {
  "shipping-policy": {
    en: {
      eyebrow: "Help", title: "Shipping policy",
      intro: "We deliver across Bangladesh and to most countries worldwide. Here is what to expect once you place an order.",
      blocks: [
        { h: "Delivery fees and times", p: ["Current fees, free-delivery thresholds and delivery times are listed in the table below. They update automatically when we change them, and checkout always shows the exact fee before you pay."] },
        { h: "Processing", p: ["Orders are packed within one working day of confirmation. For cash on delivery we call you first to confirm the order; unconfirmed orders may be held for up to 48 hours before we cancel them."] },
        { h: "Couriers and tracking", p: ["Inside Bangladesh we ship with trusted local couriers. As soon as your parcel leaves us, its courier and tracking number appear on the Track an order page. You only need your order number and the phone number used at checkout."] },
        { h: "International orders", list: ["International orders are paid by card in Bangladeshi Taka (BDT). Any USD amount shown is for reference only.", "Import duties, taxes and customs fees in your country are not included and are paid by the recipient.", "Delivery times exclude customs delays, which are outside our control."] },
        { h: "Failed delivery", p: ["If the courier can't reach you after repeated attempts, the parcel returns to us. We'll contact you to arrange redelivery; a second delivery fee may apply."] },
      ],
    },
    bn: {
      eyebrow: "সহায়তা", title: "শিপিং নীতি",
      intro: "আমরা সারা বাংলাদেশে এবং বিশ্বের বেশিরভাগ দেশে ডেলিভারি দিই। অর্ডার দেওয়ার পর কী কী হয়, এখানে জেনে নিন।",
      blocks: [
        { h: "ডেলিভারি খরচ ও সময়", p: ["বর্তমান ডেলিভারি খরচ, কত টাকার অর্ডারে ফ্রি ডেলিভারি এবং কত দিন লাগে, নিচের টেবিলে দেওয়া আছে। আমরা বদলালে এটি নিজে থেকেই আপডেট হয়, আর পেমেন্টের আগে চেকআউটে সঠিক খরচ সবসময় দেখানো হয়।"] },
        { h: "অর্ডার প্রস্তুত", p: ["অর্ডার নিশ্চিত হওয়ার এক কর্মদিবসের মধ্যে প্যাক করা হয়। ক্যাশ অন ডেলিভারির ক্ষেত্রে আমরা আগে ফোন করে নিশ্চিত করি; নিশ্চিত করা না গেলে অর্ডার ৪৮ ঘণ্টা পর্যন্ত রাখা হতে পারে, তারপর বাতিল করা হয়।"] },
        { h: "কুরিয়ার ও ট্র্যাকিং", p: ["বাংলাদেশের ভেতরে আমরা নির্ভরযোগ্য স্থানীয় কুরিয়ারে পাঠাই। পার্সেল পাঠানোর সাথে সাথে কুরিয়ারের নাম ও ট্র্যাকিং নম্বর \"অর্ডার ট্র্যাক করুন\" পেজে দেখা যায়। শুধু অর্ডার নম্বর আর চেকআউটে দেওয়া ফোন নম্বর লাগবে।"] },
        { h: "আন্তর্জাতিক অর্ডার", list: ["আন্তর্জাতিক অর্ডারের পেমেন্ট কার্ডে, বাংলাদেশি টাকায় (BDT) নেওয়া হয়। ডলারে দেখানো দাম শুধু রেফারেন্সের জন্য।", "আপনার দেশের আমদানি শুল্ক, কর ও কাস্টমস ফি এতে অন্তর্ভুক্ত নয়; এগুলো প্রাপক পরিশোধ করবেন।", "কাস্টমসের দেরি ডেলিভারির সময়ের মধ্যে ধরা হয়নি, এটি আমাদের নিয়ন্ত্রণের বাইরে।"] },
        { h: "ডেলিভারি ব্যর্থ হলে", p: ["কয়েকবার চেষ্টা করেও কুরিয়ার আপনাকে না পেলে পার্সেল আমাদের কাছে ফেরত আসে। আমরা যোগাযোগ করে আবার পাঠানোর ব্যবস্থা করব; দ্বিতীয়বার ডেলিভারি খরচ লাগতে পারে।"] },
      ],
    },
  },
  "return-policy": {
    en: {
      eyebrow: "Help", title: "Returns & refunds",
      intro: "If something isn't right, you can return it within 7 days of delivery. We want every piece you keep to be one you love.",
      blocks: [
        { h: "What can be returned", list: ["Full-price pieces, within 7 days of delivery.", "Unworn, unwashed, with all original tags and packaging.", "Sale items, underwear, swimwear, earrings and altered or personalised pieces can't be returned unless they arrive faulty."] },
        { h: "How to return", p: ["Contact us through the Contact page with your order number and the reason for return. We'll confirm, then arrange pickup inside Dhaka or send you return instructions. Please don't send items back without contacting us first."] },
        { h: "Exchanges", p: ["Need a different size? Tell us when you contact us. If it's in stock we'll exchange it; if not, we'll refund you."] },
        { h: "Refunds", list: ["We inspect returned items within 3 working days of receiving them.", "Card payments are refunded to the original card. Cash on delivery orders are refunded by bKash, Nagad or bank transfer to an account in your name.", "Original delivery fees are refunded only when the item was faulty or we sent the wrong item.", "Your bank or mobile wallet may take a few extra days to show the refund."] },
        { h: "Faulty or wrong items", p: ["If your item arrives damaged or isn't what you ordered, contact us within 48 hours of delivery with photos. We'll cover all return costs and send a replacement or a full refund."] },
      ],
    },
    bn: {
      eyebrow: "সহায়তা", title: "রিটার্ন ও রিফান্ড",
      intro: "কিছু ঠিক না লাগলে ডেলিভারির ৭ দিনের মধ্যে ফেরত দিতে পারবেন। আমরা চাই আপনার রাখা প্রতিটি পোশাক যেন আপনার প্রিয় হয়।",
      blocks: [
        { h: "কী ফেরত দেওয়া যায়", list: ["ফুল-প্রাইস পণ্য, ডেলিভারির ৭ দিনের মধ্যে।", "অব্যবহৃত, না ধোয়া, সব ট্যাগ ও প্যাকেজিংসহ।", "সেলের পণ্য, অন্তর্বাস, সাঁতারের পোশাক, কানের দুল এবং অল্টার বা কাস্টমাইজ করা পণ্য ফেরত নেওয়া হয় না, যদি না ত্রুটিপূর্ণ অবস্থায় পৌঁছায়।"] },
        { h: "কীভাবে ফেরত দেবেন", p: ["যোগাযোগ পেজে অর্ডার নম্বর ও ফেরতের কারণ লিখে আমাদের জানান। আমরা নিশ্চিত করে ঢাকার ভেতরে পিকআপের ব্যবস্থা করব, অথবা ফেরত পাঠানোর নির্দেশনা দেব। আগে যোগাযোগ না করে পণ্য পাঠাবেন না।"] },
        { h: "এক্সচেঞ্জ", p: ["অন্য সাইজ লাগবে? যোগাযোগের সময় জানান। স্টকে থাকলে বদলে দেব, না থাকলে টাকা ফেরত দেব।"] },
        { h: "রিফান্ড", list: ["ফেরত পণ্য হাতে পাওয়ার ৩ কর্মদিবসের মধ্যে আমরা যাচাই করি।", "কার্ডে পেমেন্ট করলে একই কার্ডে টাকা ফেরত যায়। ক্যাশ অন ডেলিভারির অর্ডারে আপনার নামের বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে টাকা ফেরত দেওয়া হয়।", "পণ্য ত্রুটিপূর্ণ হলে বা আমরা ভুল পণ্য পাঠালে তবেই মূল ডেলিভারি খরচ ফেরত দেওয়া হয়।", "ব্যাংক বা মোবাইল ওয়ালেটে রিফান্ড দেখাতে কয়েক দিন বেশি লাগতে পারে।"] },
        { h: "ত্রুটিপূর্ণ বা ভুল পণ্য", p: ["পণ্য নষ্ট অবস্থায় পৌঁছালে বা অর্ডার করা পণ্য না হলে, ডেলিভারির ৪৮ ঘণ্টার মধ্যে ছবিসহ আমাদের জানান। ফেরতের সব খরচ আমরা দেব, আর নতুন পণ্য বা পুরো টাকা ফেরত দেব।"] },
      ],
    },
  },
  "privacy-policy": {
    en: {
      eyebrow: "House", title: "Privacy policy",
      intro: "We collect only what we need to deliver your order and look after you, and we never sell your information.",
      blocks: [
        { h: "What we collect", list: ["When you order: your name, phone number, email, delivery address, the items you bought and any delivery notes.", "When you contact us: your name, email, optional phone and your message.", "When you subscribe: your email address.", "We do not ask you to create an account and we never see or store your full card number. Card payments are handled by Stripe."] },
        { h: "How we use it", list: ["To confirm, deliver and support your order, including sharing your name, phone and address with the courier.", "To answer your messages.", "To send our newsletter, only if you subscribed. You can unsubscribe at any time.", "To prevent fraud and keep the store secure."] },
        { h: "On your device", p: ["Your bag, wishlist and language choice are saved in your own browser so they're still there next time. We don't use advertising trackers. Our dashboard uses a sign-in cookie for staff only."] },
        { h: "Where it's stored", p: ["Order data is stored securely with our database provider (Supabase) and protected by access rules so only authorised staff can see it. We keep order records as long as required for accounting and legal purposes."] },
        { h: "Your choices", p: ["You can ask us to see, correct or delete your personal information, except where we must keep it by law. Contact us through the Contact page."] },
      ],
    },
    bn: {
      eyebrow: "আমাদের কথা", title: "গোপনীয়তা নীতি",
      intro: "আপনার অর্ডার পৌঁছে দিতে আর আপনাকে সেবা দিতে যতটুকু তথ্য দরকার, শুধু ততটুকুই আমরা নিই, এবং কখনো আপনার তথ্য বিক্রি করি না।",
      blocks: [
        { h: "আমরা কী তথ্য নিই", list: ["অর্ডার দেওয়ার সময়: আপনার নাম, ফোন নম্বর, ইমেইল, ডেলিভারি ঠিকানা, কেনা পণ্য ও ডেলিভারি নির্দেশনা।", "যোগাযোগ করার সময়: আপনার নাম, ইমেইল, ঐচ্ছিক ফোন নম্বর ও আপনার বার্তা।", "সাবস্ক্রাইব করলে: আপনার ইমেইল ঠিকানা।", "আমরা কোনো অ্যাকাউন্ট খুলতে বলি না, আর আপনার পুরো কার্ড নম্বর কখনো দেখি বা সংরক্ষণ করি না। কার্ড পেমেন্ট Stripe পরিচালনা করে।"] },
        { h: "তথ্য কীভাবে ব্যবহার করি", list: ["অর্ডার নিশ্চিত করা, পৌঁছে দেওয়া ও সহায়তার জন্য, যার মধ্যে কুরিয়ারকে আপনার নাম, ফোন ও ঠিকানা দেওয়া অন্তর্ভুক্ত।", "আপনার বার্তার উত্তর দিতে।", "নিউজলেটার পাঠাতে, শুধু আপনি সাবস্ক্রাইব করলে। যেকোনো সময় বাতিল করতে পারবেন।", "প্রতারণা রোধ ও স্টোর নিরাপদ রাখতে।"] },
        { h: "আপনার ডিভাইসে", p: ["আপনার ব্যাগ, উইশলিস্ট ও ভাষার পছন্দ আপনার নিজের ব্রাউজারে সেভ থাকে, যাতে পরের বারও পান। আমরা কোনো বিজ্ঞাপন ট্র্যাকার ব্যবহার করি না। ড্যাশবোর্ডে শুধু স্টাফদের জন্য সাইন-ইন কুকি ব্যবহার হয়।"] },
        { h: "তথ্য কোথায় থাকে", p: ["অর্ডারের তথ্য আমাদের ডেটাবেস সেবাদাতার (Supabase) কাছে নিরাপদে সংরক্ষিত থাকে, এবং অ্যাক্সেস নিয়মের মাধ্যমে শুধু অনুমোদিত স্টাফ দেখতে পারেন। হিসাব ও আইনি প্রয়োজনে যতদিন দরকার, অর্ডারের রেকর্ড রাখা হয়।"] },
        { h: "আপনার অধিকার", p: ["আইনত রাখতে বাধ্য এমন তথ্য ছাড়া, আপনার ব্যক্তিগত তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলতে বলতে পারেন। যোগাযোগ পেজের মাধ্যমে আমাদের জানান।"] },
      ],
    },
  },
  terms: {
    en: {
      eyebrow: "House", title: "Terms & conditions",
      intro: "These terms apply when you browse or buy from DEMO. By placing an order you agree to them.",
      blocks: [
        { h: "Orders", list: ["An order is accepted once we confirm it. For cash on delivery, that's after our confirmation call; for card payments, after the payment succeeds.", "We may cancel an order if an item is unavailable, a price was shown in error, or we suspect fraud. You'll be refunded in full for anything you've paid."] },
        { h: "Prices and payment", list: ["All prices are in Bangladeshi Taka (BDT) and include VAT where applicable. Delivery fees are shown at checkout.", "Prices and discounts are checked on our server when you place the order; the amount on your confirmation is the amount you pay.", "Cash on delivery is available inside Bangladesh only. Discount codes can't be combined and have no cash value."] },
        { h: "Products", p: ["We photograph our pieces as accurately as we can, but colours can look slightly different on different screens. Natural fibres may show small variations; these are part of the material, not faults."] },
        { h: "Returns", p: ["Returns and refunds follow our Returns & refunds policy."] },
        { h: "Liability", p: ["Nothing in these terms limits your rights as a consumer under Bangladeshi law. Our responsibility for any order is limited to the amount you paid for it, except where the law says otherwise."] },
        { h: "Changes", p: ["We may update these terms. The version shown when you placed your order applies to that order."] },
      ],
    },
    bn: {
      eyebrow: "আমাদের কথা", title: "শর্তাবলি",
      intro: "DEMO-তে ব্রাউজ বা কেনাকাটা করলে এই শর্তগুলো প্রযোজ্য। অর্ডার দেওয়ার মাধ্যমে আপনি এগুলোতে সম্মত হচ্ছেন।",
      blocks: [
        { h: "অর্ডার", list: ["আমরা নিশ্চিত করার পর অর্ডার গৃহীত হয়। ক্যাশ অন ডেলিভারিতে ফোনে নিশ্চিত করার পর; কার্ড পেমেন্টে পেমেন্ট সফল হওয়ার পর।", "পণ্য না থাকলে, ভুল দাম দেখালে বা প্রতারণার সন্দেহ হলে আমরা অর্ডার বাতিল করতে পারি। আপনি যা পরিশোধ করেছেন তার পুরোটা ফেরত পাবেন।"] },
        { h: "দাম ও পেমেন্ট", list: ["সব দাম বাংলাদেশি টাকায় (BDT), প্রযোজ্য ক্ষেত্রে ভ্যাটসহ। ডেলিভারি খরচ চেকআউটে দেখানো হয়।", "অর্ডার দেওয়ার সময় দাম ও ছাড় আমাদের সার্ভারে যাচাই হয়; কনফার্মেশনে যে পরিমাণ দেখায়, সেটাই আপনি পরিশোধ করবেন।", "ক্যাশ অন ডেলিভারি শুধু বাংলাদেশের ভেতরে। ডিসকাউন্ট কোড একসাথে ব্যবহার করা যায় না এবং এর কোনো নগদ মূল্য নেই।"] },
        { h: "পণ্য", p: ["আমরা যতটা সম্ভব নিখুঁতভাবে ছবি তুলি, তবে বিভিন্ন স্ক্রিনে রং সামান্য ভিন্ন দেখাতে পারে। প্রাকৃতিক সুতায় ছোটখাটো পার্থক্য থাকতে পারে; এগুলো কাপড়ের বৈশিষ্ট্য, ত্রুটি নয়।"] },
        { h: "রিটার্ন", p: ["রিটার্ন ও রিফান্ড আমাদের \"রিটার্ন ও রিফান্ড\" নীতি অনুযায়ী হয়।"] },
        { h: "দায়বদ্ধতা", p: ["এই শর্তাবলির কোনো কিছুই বাংলাদেশের আইনে ভোক্তা হিসেবে আপনার অধিকার সীমিত করে না। আইনে অন্যরকম না বললে, কোনো অর্ডারের জন্য আমাদের দায় সেই অর্ডারে আপনি যা পরিশোধ করেছেন তার মধ্যে সীমাবদ্ধ।"] },
        { h: "পরিবর্তন", p: ["আমরা এই শর্তাবলি হালনাগাদ করতে পারি। অর্ডার দেওয়ার সময় যে সংস্করণ ছিল, সেই অর্ডারে সেটিই প্রযোজ্য।"] },
      ],
    },
  },
};

export const ABOUT: Bi<{ eyebrow: string; title: string; lead: string; sections: { h: string; p: string }[]; values: { k: string; v: string }[]; cta: string }> = {
  en: {
    eyebrow: "About DEMO", title: "Fewer, better pieces.",
    lead: "DEMO began in a small atelier in Dhaka with a simple belief: clothes should be made with care, worn for years and loved for longer.",
    sections: [
      { h: "How we make", p: "We work with natural fibres (cashmere, linen, organic cotton and wool) and with small mills and ateliers we know by name. Patterns are cut to drape well rather than to follow a season, so a coat bought this year still feels right in five." },
      { h: "What we stand for", p: "Quiet colour, honest materials and fair work. We'd rather make less and make it properly, then help you repair a piece than replace it." },
      { h: "From Dhaka to everywhere", p: "Every piece is designed in Dhaka. We deliver across Bangladesh within days and ship worldwide, with prices shown clearly and no surprises at checkout." },
    ],
    values: [{ k: "100%", v: "Natural fibres" }, { k: "12", v: "Partner ateliers" }, { k: "7 days", v: "Easy returns" }],
    cta: "Explore the collection",
  },
  bn: {
    eyebrow: "DEMO সম্পর্কে", title: "কম পোশাক, ভালো পোশাক।",
    lead: "DEMO-র শুরু ঢাকার ছোট্ট এক কারখানায়, একটি সহজ বিশ্বাস নিয়ে: পোশাক তৈরি হবে যত্নে, পরা হবে বছরের পর বছর, ভালোবাসা থাকবে তার চেয়েও বেশি দিন।",
    sections: [
      { h: "আমরা কীভাবে তৈরি করি", p: "আমরা প্রাকৃতিক সুতা (ক্যাশমিয়ার, লিনেন, অর্গানিক কটন ও উল) নিয়ে কাজ করি, আর এমন ছোট মিল ও কারখানার সাথে, যাদের আমরা নাম ধরে চিনি। আমাদের কাট মৌসুম অনুসরণ করে না, সুন্দরভাবে পড়ার জন্য তৈরি। তাই এ বছর কেনা কোট পাঁচ বছর পরেও মানানসই লাগে।" },
      { h: "আমরা যা বিশ্বাস করি", p: "শান্ত রং, সৎ উপকরণ, ন্যায্য পরিশ্রম। আমরা কম তৈরি করে ঠিকভাবে তৈরি করতে চাই, আর পোশাক ফেলে না দিয়ে মেরামত করতে সাহায্য করতে চাই।" },
      { h: "ঢাকা থেকে সবখানে", p: "প্রতিটি পোশাক ঢাকায় ডিজাইন করা। সারা বাংলাদেশে কয়েক দিনে ডেলিভারি দিই, বিশ্বজুড়ে পাঠাই। দাম স্পষ্টভাবে দেখানো, চেকআউটে কোনো চমক নেই।" },
    ],
    values: [{ k: "১০০%", v: "প্রাকৃতিক সুতা" }, { k: "১২", v: "সহযোগী কারখানা" }, { k: "৭ দিন", v: "সহজ রিটার্ন" }],
    cta: "কালেকশন দেখুন",
  },
};

export const FAQ: Bi<{ eyebrow: string; title: string; intro: string; groups: { h: string; items: { q: string; a: string }[] }[]; more: string; contact: string }> = {
  en: {
    eyebrow: "Help", title: "Frequently asked questions", intro: "Quick answers about ordering, delivery, payment and returns.",
    groups: [
      { h: "Ordering", items: [
        { q: "Do I need an account to order?", a: "No. You check out as a guest with your name, phone and address. You'll get an order number to track your order." },
        { q: "How do I know my order went through?", a: "You'll see a confirmation page with your order number straight away. For cash on delivery, we'll also call you to confirm before sending it." },
        { q: "Can I change or cancel my order?", a: "Yes, until it ships. Contact us with your order number as soon as possible." },
      ] },
      { h: "Delivery", items: [
        { q: "How long does delivery take?", a: "Usually 1–2 days inside Dhaka, 2–4 days elsewhere in Bangladesh, and 7–14 days internationally (plus any customs time)." },
        { q: "How much is delivery?", a: "It depends on where you are and how much you spend. Orders above a set amount get free delivery. See the Shipping policy for current fees; checkout always shows the exact amount." },
        { q: "How do I track my order?", a: "Go to Track an order and enter your order number and the phone number you used at checkout." },
      ] },
      { h: "Payment", items: [
        { q: "Which payment methods do you accept?", a: "Cash on delivery inside Bangladesh. Card payments for international orders are being set up. bKash and Nagad are coming soon." },
        { q: "Are prices in Taka?", a: "Yes, all prices are in Bangladeshi Taka (BDT). International customers see a USD reference at checkout, but the charge is made in BDT." },
        { q: "Can I use a discount code?", a: "Yes. Enter it in your bag or at checkout. One code per order." },
      ] },
      { h: "Returns & sizing", items: [
        { q: "What is your return policy?", a: "Full-price pieces can be returned within 7 days of delivery if unworn with tags. See Returns & refunds for details." },
        { q: "How do I choose my size?", a: "Our pieces are cut relaxed. If you're between sizes, size down for a closer fit. Message us with your height and usual size and we'll help." },
        { q: "My item arrived damaged. What now?", a: "We're sorry! Contact us within 48 hours with photos and we'll replace it or refund you, and cover the return." },
      ] },
    ],
    more: "Still need help?", contact: "Contact us",
  },
  bn: {
    eyebrow: "সহায়তা", title: "সাধারণ প্রশ্ন", intro: "অর্ডার, ডেলিভারি, পেমেন্ট ও রিটার্ন নিয়ে দ্রুত উত্তর।",
    groups: [
      { h: "অর্ডার", items: [
        { q: "অর্ডার দিতে কি অ্যাকাউন্ট লাগবে?", a: "না। নাম, ফোন আর ঠিকানা দিয়ে গেস্ট হিসেবে অর্ডার দিতে পারবেন। অর্ডার ট্র্যাক করার জন্য একটি অর্ডার নম্বর পাবেন।" },
        { q: "অর্ডার হয়েছে কিনা বুঝব কীভাবে?", a: "সাথে সাথেই অর্ডার নম্বরসহ একটি কনফার্মেশন পেজ দেখবেন। ক্যাশ অন ডেলিভারিতে পাঠানোর আগে আমরা ফোন করেও নিশ্চিত করব।" },
        { q: "অর্ডার বদলানো বা বাতিল করা যাবে?", a: "হ্যাঁ, পাঠানোর আগ পর্যন্ত। যত দ্রুত সম্ভব অর্ডার নম্বরসহ আমাদের জানান।" },
      ] },
      { h: "ডেলিভারি", items: [
        { q: "ডেলিভারিতে কত দিন লাগে?", a: "সাধারণত ঢাকার ভেতরে ১–২ দিন, বাংলাদেশের অন্যত্র ২–৪ দিন, আর বিদেশে ৭–১৪ দিন (কাস্টমসের সময় ছাড়া)।" },
        { q: "ডেলিভারি খরচ কত?", a: "আপনি কোথায় আছেন আর কত টাকার অর্ডার, তার ওপর নির্ভর করে। নির্দিষ্ট পরিমাণের বেশি অর্ডারে ফ্রি ডেলিভারি। বর্তমান খরচ শিপিং নীতিতে দেখুন; চেকআউটে সবসময় সঠিক পরিমাণ দেখায়।" },
        { q: "অর্ডার ট্র্যাক করব কীভাবে?", a: "\"অর্ডার ট্র্যাক করুন\" পেজে গিয়ে অর্ডার নম্বর এবং চেকআউটে দেওয়া ফোন নম্বর লিখুন।" },
      ] },
      { h: "পেমেন্ট", items: [
        { q: "কোন কোন পদ্ধতিতে পেমেন্ট করা যায়?", a: "বাংলাদেশের ভেতরে ক্যাশ অন ডেলিভারি। আন্তর্জাতিক অর্ডারের কার্ড পেমেন্ট চালুর কাজ চলছে। বিকাশ ও নগদ শিগগির আসছে।" },
        { q: "দাম কি টাকায়?", a: "হ্যাঁ, সব দাম বাংলাদেশি টাকায় (BDT)। বিদেশি ক্রেতারা চেকআউটে ডলারে রেফারেন্স দেখবেন, তবে চার্জ হবে টাকায়।" },
        { q: "ডিসকাউন্ট কোড ব্যবহার করা যাবে?", a: "হ্যাঁ। ব্যাগে বা চেকআউটে কোডটি লিখুন। প্রতি অর্ডারে একটি কোড।" },
      ] },
      { h: "রিটার্ন ও সাইজ", items: [
        { q: "রিটার্ন নীতি কী?", a: "ফুল-প্রাইস পণ্য অব্যবহৃত ও ট্যাগসহ থাকলে ডেলিভারির ৭ দিনের মধ্যে ফেরত দেওয়া যায়। বিস্তারিত \"রিটার্ন ও রিফান্ড\" পেজে।" },
        { q: "সাইজ কীভাবে বাছব?", a: "আমাদের পোশাক একটু ঢিলেঢালা কাটের। দুই সাইজের মাঝামাঝি হলে ছোটটা নিন। আপনার উচ্চতা ও সাধারণ সাইজ জানিয়ে মেসেজ দিন, আমরা সাহায্য করব।" },
        { q: "পণ্য নষ্ট অবস্থায় এসেছে, এখন কী করব?", a: "আমরা দুঃখিত! ৪৮ ঘণ্টার মধ্যে ছবিসহ জানান, আমরা বদলে দেব বা টাকা ফেরত দেব, আর ফেরতের খরচও আমাদের।" },
      ] },
    ],
    more: "আরও সাহায্য লাগবে?", contact: "যোগাযোগ করুন",
  },
};
