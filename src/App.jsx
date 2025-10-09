import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, Bot, BookOpen, Layers, Home, ChevronRight, ChevronDown, Bug, SlidersHorizontal, ShieldAlert, CheckCircle2, X, RefreshCw, Wrench, Stethoscope, ZoomIn } from "lucide-react";
import './index.css'


// ------------------------
// Utility
// ------------------------
const cx = (...classes) => classes.filter(Boolean).join(" ");
const initials = (name='') => name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const makePhotoUrl = (s) => `https://source.unsplash.com/600x400/?tarantula,${encodeURIComponent(s.commonName)}`; // online photo placeholder
const resolveImg = (id, fallbackCommonName = "tarantula") => {
  const s = SPECIES.find(sp => sp.id === id);
  if (s?.img) return s.img; // ใช้รูปโลคอลก่อน
  const name = s?.commonName ?? fallbackCommonName;
  return makePhotoUrl({ commonName: name }); // ไม่มีก็ไป Unsplash
};

const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;

const getSpeciesImage = (s) => {
  if (!s) return "";
  if (s.img) return asset(s.img);
  return asset(`species/${s.id}.jpg`);
};


const LANG = {
  en: {
    appName: "TaraCare",
    tagline: "Less risk, more joy.",
    nav: { home: "Home", care: "Care Guide", species: "Species", knowledge: "Knowledge", ai: "AI Consultation", diseases: "Common Issues", troubleshoot: "Troubleshooting" },
    search: "Search species…",
    filters: "Filters",
    clearAll: "Clear all",
    newWorld: "New World",
    oldWorld: "Old World",
    habitat: "Habitat",
    arboreal: "Arboreal",
    terrestrial: "Terrestrial",
    fossorial: "Fossorial",
    difficulty: "Difficulty",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    sortBy: "Sort by",
    name: "Name",
    difficultyLabel: "Difficulty",
    quickCare: "Quick care",
    humidity: "Humidity",
    temperature: "Temperature",
    lifespan: "Lifespan",
    growth: "Growth rate",
    enclosure: "Enclosure",
    venom: "Venom",
    urticating: "Urticating hairs",
    yes: "Yes",
    no: "No",
    results: (n) => `${n} result${n === 1 ? "" : "s"}`,
    heroCTA: "Explore Species",
    print: "Print / Export",
    language: "ภาษาไทย",
    aiHint: "If you have any questions or need any help, please feel free to ask.",
    startChat: "Start a conversation",
    beginnerMode: "Beginner Mode",
    beginnerNote: "Hides advanced/Old World and shows safety tips.",
    safety: {
      advanced: "Advanced species. Not recommended for beginners.",
      oldworld: "Old World species have stronger venom and no urticating hairs.",
    },
    knowledge: [
    {
      id: "new-vs-old",
      q: "New World vs Old World",
      fit: "contain", // ให้รูปเทียบสองโลกเห็นเต็มตอนขยาย
      a: `Quick differences
    • Urticating hairs: New World (NW) usually have them and can flick, Old World (OW) do not.
    • Defense & venom: OW rely on speed and stronger venom, bites are more medically significant. NW are usually milder.
    • Temperament/speed: NW tend to be calmer and slower, OW are faster and more defensive.
    • Handling: Avoid for both; absolutely no recreational handling for OW.
    • Enclosure & safety: Secure lids for all, for OW use extra caution (longer tools, clear catch-cup plan). Keep species-specific humidity/temps.
    • Behavior: Many OW are fossorial or heavy webbers and stay reclusive, NW includes many calm terrestrials.

    Beginner guidance
    • Start with NW genera: Grammostola, Brachypelma/Tliltocatl, Avicularia/Caribena.
    • Avoid OW until experienced: Poecilotheria, Pterinochilus (OBT), Heteroscodra, Cyriopagopus, Omothymus.

    Examples
    • NW: Brazilian Black (G. pulchra), Chaco Golden Knee (G. pulchripes), Mexican Redknee (B. hamorii).
    • OW: Indian Ornamental (P. regalis), Orange Baboon/OBT (P. murinus), Cobalt Blue (C. lividus).

    TL;DR
    • Beginners → New World. Old World = fast + stronger venom + no urticating hairs.`
    },


    {
      id: "feeding-by-stage",
      q: "Feeding by Life Stage: what/how much/how often",
      fit: "contain",
      a: `Basics
    • Prey ≤ carapace width (slings ~½ carapace)
    • Remove uneaten prey within 24h
    • Do not feed around molts (fangs harden: slings ~5–7d; adults ~7–14+d)
    • Adjust to temperature, species, and abdomen size

    Slings (~0.5–2 cm)
    • Prey: fruit flies, mealworm cut in half (pre-killed piece), small red runner roach nymph (pre-killed before offering)
    • Amount: 1–3 tiny items
    • Frequency: every 2–4 days

    Juveniles (~2–6 cm)
    • Prey: small–medium crickets, small roach nymphs, small worms
    • Amount: 1–2 items (or 2–3 very small ones)
    • Frequency: every 7–10 days

    Sub-adult/Adult (>6 cm)
    • Prey: one medium cricket or suitably sized dubia/lateralis nymph; occasional (super)worm
    • Amount: typically 1 item
    • Frequency: every 10–21 days (long fasts can be normal)

    Tips
    • If abdomen tightens or strikes are frantic → smaller prey/longer interval
    • Very small slings: prefer pre-killed pieces
    • Water dish from juvenile upward; moist spot for tiny slings`
    },


    {
      id: "not-eating",
      q: "Why is my tarantula not eating?",
      a:
        "Common reasons: pre-molt, being overfed recently, or environmental stress (wrong humidity/temperature, too much disturbance). Check parameters, give privacy, and remove uneaten prey within 24 hours."
    },


    {
      id: "handling",
      q: "Can I handle my tarantula? (Safe handling/rehousing)",
      fit: "contain",
      a: `Key points
    • Recreational handling is discouraged: high fall risk and stress; tarantulas are not tactile pets.
    • If you must move/rehouse, use tools (catch cup, card, soft brush) rather than hands.

    Avoid handling when
    • Pre/during/post-molt (soft exoskeleton) • Fast Old-World species (potent venom, no urticating hairs)
    • Gravid/defensive individuals • Above hard surfaces or at height

    Catch-Cup method (safer)
    1) Prepare a clear cup and a stiff card (or lid).
    2) Gently lower the cup from the front/top—slow, steady.
    3) Slide the card underneath to form a base.
    4) Carry close to the ground; avoid shaking or squeezing.

    Stress/defense signs
    • Threat posture, bolting, urticating hair flick (New World)
    → Stop, reduce light/vibration, let it settle before retrying.

    Keeper safety
    • Urticating hairs can irritate skin/eyes: rinse with water; use tape to lift from skin; avoid rubbing eyes.
    • For minor bites: wash and monitor; seek care if unusual symptoms occur.

    Tips
    • Work over soft/low areas to reduce fall severity • Provide anchor points (cork bark) for a retreat path
    • Open enclosures during calm periods; plan your moves before opening.`
    },


    {
      id: "humidity-ventilation",
      q: "Humidity & ventilation basics",
      a:
        "Keep within species ranges and ensure cross-ventilation—especially for arboreals. " +
        "Stale, overly damp air can cause issues; slightly drier with good airflow is often safer than constantly wet. " +
        "You can check species-specific humidity targets on the Species page—open a species card to see its recommended range."
    },


    {
      id: "feeding-schedule",
      q: "When to Feed?",
      fit: "contain",
      a: `How to use
    • Compare current abdomen size to recent baseline; check skin tension/wrinkles.
    • Watch behavior: heavy webbing, sealed burrow, lethargy (often pre-molt).
    • Decide with the colors below (adjust for age/temperature/species).

    Color meanings
    🟢 Slim/flat abdomen (very hungry) → Feed
      - Good after molts or during fast growth. Start with smaller prey.
    🟡 Moderate abdomen (partly full) → Feed or skip
      - If feeding, use smaller prey or increase the interval.
      - If pre-molt signs appear, do NOT feed.
    🔴 Very plump/tight abdomen → Avoid feeding
      - Higher risk of rupture from falls/stress; wait until abdomen shrinks.

    Prey size guidelines
    • Slings: prey ≈ ½ carapace/abdomen width, or pre-killed pieces.
    • Juvenile–adult: prey no larger than carapace width (or multiple smaller items).

    Typical frequency (tune to temp/species)
    • Slings: every 2–4 days
    • Juveniles: every 7–10 days
    • Adults: every 10–21 days (long fasts can be normal)

    Do NOT feed when
    • Pre-molt / during molt / right after molt (wait until fangs harden: slings ~5–7 days; adults ~7–14+ days)
    • Prey remains >24h — remove it
    • Abdomen is very tight or behavior shows unusual stress

    Safety tips
    • Fresh water dish always • Good cross-ventilation • Under-feed slightly and observe`
    },

    
    {
      id: "health-common",
      q: "Common Issues & Prevention (incl. DKS)",
      fit: "contain",
      a: `Beginner-friendly overview
    • Dehydration/overheat: lethargic, wrinkly abdomen, legs curl (death curl)
      → Provide fresh water, a small moist spot, cool down; never force-feed.
    • Stuck molt: caused by dryness/disturbance
      → Avoid touching the spider at all costs, but increase the humidity in the tank by spraying water mist on the tank walls or nearby to help the spider escape the stain more easily.
    • Mold/clean-up mites: white fuzz/tiny dots on leftovers/substrate
      → Remove scraps within 24h, improve airflow, refresh substrate and moisture balance.
    • Ectoparasites (blood-feeding mites): cream dots on joints/mouthparts
      → Isolate, deep-clean enclosure, review feeder source, seek experienced help.
    • Fall injuries/bleeding: clear hemolymph leaks
      → Dab with cornstarch/baby powder to stop bleeding; reduce enclosure height.

    DKS (Dyskinetic Syndrome)
    • Signs: tremors, jerky/looping walk, loss of coordination
    • Cause: unclear (toxins/parasites/neurologic)
    • No proven cure; prognosis poor
    • What to do: isolate, quiet, constant water, good ventilation, remove possible toxins (insecticides, air fresheners, perfumes),
      switch to a new feeder batch/source, consult experienced keepers.

    Prevention checklist
    • Clean, captive-bred feeders; quarantine or raise your own — avoid wild-caught insects.
    • Water dish always; clean/refresh often • Remove leftovers within 24h.
    • Good cross-ventilation; avoid stale, soggy setups • Provide a hide; minimize stress; avoid handling.
    • Quarantine new spiders ~30 days; separate tools.
    • Keep chemicals away: pesticides, sprays, strong solvents, cigarette smoke.`
    },


    {
      id: "molting-aftercare",
      q: "Molting & Post-Molt Care",
      fit: "contain",
      a: `Premolt signs
    • Refuses food for days–weeks, more lethargic, heavy webbing/sealed burrow or digging
    • Abdomen darkens/dulls (mirror patch darkening)
    • Remove all feeders, minimize disturbance, ensure secure lid and a slightly wetter spot (not stuffy)

    During molt (Do NOT intervene)
    • Do not move, handle, or pull the exuviae; avoid vibration and bright lights
    • Observe from a distance; the process may take 2–12+ hours depending on size
    • Remove any feeder insects immediately—they can injure the soft spider

    Right after molt
    • Provide fresh water immediately; slightly higher humidity for 2–3 days with good cross-ventilation
    • Do not feed until the fangs change color: clear/white → pink/red → black (hardened)

    When to resume feeding?
    • Slings: wait ~5–7 days; start with very small/pre-killed pieces
    • Juveniles: wait ~7–10 days
    • Adults: wait ~10–14+ days
    • Rule of thumb: the larger the spider, the longer the wait

    Safety tips
    • Reduce fall risk while the exoskeleton is soft; provide anchor points for climbing
    • Remove the exuviae once dry; you may keep it for sexing/reference
    • Minor leg damage often regenerates in the next molt

    If things go wrong
    • Partial “stuck molt”: increase localized humidity and monitor closely
    • Avoid pulling/peeling; if severe, seek advice from an experienced keeper`
    },

    {
      id: "dehydration-overheat",
      type: "troubleshoot",
      severity: "danger",
      q: "Dehydration/Overheat (lethargic, wrinkly abdomen, legs curling)",
      checks: [
        "Empty water dish / no moist corner",
        "High ambient temp (~>28–30°C) or direct sun/warm airflow",
        "Stale air, poor cross-ventilation"
      ],
      fixes: [
        "Provide fresh water + one small moist spot (don’t soak the whole tank)",
        "Move away from heat/sun; increase airflow",
        "Stop feeding; keep quiet and monitor"
      ],
      prevent: [
        "Water dish at all times; refresh regularly",
        "Avoid window sun/heaters and hot drafts",
        "Stay within species temperature range"
      ],
      related: ["humidity-ventilation","feeding-schedule"]
    },
    {
      id: "stuck-molt",
      type: "troubleshoot",
      severity: "danger",
      q: "Stuck molt: what to do",
      checks: [
        "Pieces of exuviae stuck on legs/abdomen",
        "Low humidity or feeder insects left inside"
      ],
      fixes: [
        "Do NOT pull/peel the exuviae",
        "Increase localized humidity (mist wall/substrate nearby, never on the spider)",
        "Remove all feeders and observe quietly"
      ],
      prevent: [
        "Slightly higher humidity premolt–postmolt with good airflow",
        "At premolt signs → remove feeders and reduce disturbance"
      ],
      related: ["molting-aftercare","humidity-ventilation"]
    },
    {
      id: "mold-mites",
      type: "troubleshoot",
      severity: "caution",
      q: "Mold / clean-up mites",
      checks: [
        "White fuzz on leftovers/substrate",
        "Tiny moving dots + musty smell"
      ],
      fixes: [
        "Remove leftovers within 24h",
        "Improve ventilation; reduce watering/misting",
        "Replace part (or all) of the substrate if severe"
      ],
      prevent: [
        "Right-size feeding, avoid many feeders at once",
        "Clean water dish regularly; keep airflow",
        "Use clean/quarantined feeders"
      ],
      related: ["feeding-by-stage","feeding-schedule","humidity-ventilation"]
    },
    {
      id: "injury-bleeding",
      type: "troubleshoot",
      severity: "danger",
      q: "Injury/bleeding after a fall",
      checks: [
        "Clear hemolymph seeping/bleeding",
        "Abnormal gait / cracked exoskeleton / broken leg"
      ],
      fixes: [
        "Dab with cornstarch/baby powder to stop bleeding",
        "Lower heights; pad/arrange decor for safety",
        "No feeding for 48–72h; reassess"
      ],
      prevent: [
        "Limit height for terrestrials; add cork bark anchors",
        "No recreational handling; work low",
        "Check lid and escape gaps every time"
      ],
      related: ["handling"]
    },
    {
      id: "escape-handling",
      type: "troubleshoot",
      severity: "caution",
      q: "Escape recovery: safe recapture",
      checks: [
        "Close doors/windows and floor gaps",
        "Search dark edges: wall bases, under furniture/behind curtains"
      ],
      fixes: [
        "Use a clear cup + stiff card; guide into a tub",
        "Work slowly; dim lights/turn off fans; use red light",
        "Do not grab/squeeze with hands or tongs"
      ],
      prevent: [
        "Check lid/locks; vent holes must be small enough",
        "Work on wide/low surfaces; have a spare tub ready",
        "Do rehousing at calm evening hours"
      ],
      related: ["handling","rehousing"]
    },
    {
      id: "humidity-issues",
      type: "troubleshoot",
      severity: "info",
      q: "Too wet / too dry: quick fixes",
      checks: [
        "Too wet: condensation across glass, musty smell",
        "Too dry: crumbly substrate, wrinkly abdomen, frequent drinking"
      ],
      fixes: [
        "Too wet → add vents / crack lid briefly; reduce watering",
        "Too dry → water one ‘moist corner’ or lightly mist substrate"
      ],
      prevent: [
        "Follow species humidity range + ensure cross-ventilation",
        "Prefer water dish over misting the entire tank; use a hygrometer"
      ],
      related: ["humidity-ventilation"]
    }
  ],
    recommend: "Recommended for beginners",
    readMore: "Read more",
  },
  th: {
    appName: "TaraCare",
    tagline: "ลดความเสี่ยง เพิ่มความสุข",
    nav: { home: "หน้าแรก", care: "คู่มือการเลี้ยง", species: "สายพันธุ์", knowledge: "ความรู้ทั่วไป", ai: "AI ช่วยเหลือ", diseases: "โรคที่พบบ่อย", troubleshoot: "แก้ปัญหาเบื้องต้น" },
    search: "ค้นหาสายพันธุ์…",
    filters: "ตัวกรอง",
    clearAll: "ล้างทั้งหมด",
    newWorld: "โลกใหม่",
    oldWorld: "โลกเก่า",
    habitat: "ถิ่นอาศัย",
    difficulty: "เหมาะกับผู้เลี้ยง",
    beginner: "มือใหม่",
    intermediate: "ปานกลาง",
    advanced: "ชำนาญ",
    sortBy: "เรียงตาม",
    name: "ชื่อ",
    difficultyLabel: "ความยากง่าย",
    quickCare: "สรุปการดูแล",
    humidity: "ความชื้น",
    temperature: "อุณหภูมิ",
    lifespan: "อายุขัย",
    growth: "อัตราการเติบโต",
    enclosure: "ตู้เลี้ยง",
    venom: "พิษ",
    urticating: "ขนป้องกันตัว",
    yes: "มี",
    no: "ไม่มี",
    results: (n) => `${n} รายการ`,
    heroCTA: "ดูสายพันธุ์",
    print: "พิมพ์ / ส่งออก",
    language: "English",
    aiHint: "มีอะไรสงสัยหรืออยากให้ช่วยเหลืออะไรสามารถถามมาได้เลย",
    startChat: "เริ่มสนทนา",
    beginnerMode: "โหมดมือใหม่",
    beginnerNote: "ซ่อนสายพันธุ์ขั้นสูง/โลกเก่า และแสดงคำเตือนความปลอดภัย",
    arboreal: "สายต้นไม้",
    terrestrial: "สายดิน",
    fossorial: "สายขุด",

    safety: {
      advanced: "สายพันธุ์ระดับชำนาญ ไม่เหมาะกับมือใหม่",
      oldworld: "โลกเก่ามีพลังพิษสูงและไม่มีขนป้องกันตัว",
    },
    knowledge: [
      {
        id: "new-vs-old",
        q: "โลกใหม่ vs โลกเก่า",
        fit: "contain",
        a: `สรุปความต่างแบบเร็ว ๆ
      • ขนป้องกันตัว: โลกใหม่ (NW) ส่วนใหญ่มีและดีดขนได้ โลกเก่า (OW) ไม่มีขนป้องกันตัว
      • การป้องกัน/พิษ: OW พึ่งความเร็วและพิษแรงกว่า (การถูกกัดเสี่ยงเกิดอาการรุนแรงจนต้องพบแพทย์) ส่วน NW มักอ่อนกว่า
      • นิสัย/ความเร็ว: NW โดยรวมสงบและช้ากว่า OW ไวและตั้งรับมากกว่า
      • การจับต้อง: ทั้งสองไม่แนะนำ โดยเฉพาะ OW หลีกเลี่ยงการ “จับเล่น” เด็ดขาด
      • ตู้เลี้ยง & ความปลอดภัย: ทุกชนิดต้องฝาแน่น สำหรับ OW เพิ่มความระวัง (มีแผนใช้ catch-cup/อุปกรณ์ยาว) คุมความชื้น/อุณหภูมิเป็นรายสปีชีส์
      • พฤติกรรม: OW จำนวนมากเป็นสายขุดหรือปั่นใยหนัก ชอบหลบ NW มีชนิดพื้นดินสายชิลเยอะ

      คำแนะนำมือใหม่
      • เริ่มจาก NW เช่น Grammostola, Brachypelma/Tliltocatl, Avicularia/Caribena
      • เลี่ยง OW จนกว่าจะมีประสบการณ์: Poecilotheria, Pterinochilus (OBT), Heteroscodra, Cyriopagopus, Omothymus

      ตัวอย่าง
      • NW: Brazilian Black (G. pulchra), Chaco Golden Knee (G. pulchripes), Mexican Redknee (B. hamorii)
      • OW: Indian Ornamental (P. regalis), Orange Baboon/OBT (P. murinus), Cobalt Blue (C. lividus)

      สรุปสั้น
      • มือใหม่ → โลกใหม่จะปลอดภัยกว่า โลกเก่า = ไว + พิษแรง + ไม่มีขนป้องกันตัว`
      },


      {
        id: "feeding-by-stage",
        q: "การให้อาหารตามช่วงวัย: อะไร/กี่ชิ้น/ถี่แค่ไหน",
        fit: "contain",
        a: `กฎพื้นฐาน
      • ขนาดเหยื่อไม่เกินความกว้างกระดอง (slings ~½ กระดอง)
      • เก็บเหยื่อที่ไม่กินออกใน 24 ชม.
      • ก่อน/หลังลอกคราบงดให้อาหาร (fangs แข็ง: วัยเล็ก ~5–7 วัน, วัยโต ~7–14+ วัน)
      • ปรับตามอุณหภูมิ สายพันธุ์ และ “ขนาดท้อง”

      วัยเล็ก (Slings, ~0.5–2 ซม.)
      • เหยื่อ: แมลงหวี่, หนอนนกตัดครึ่ง, ลูกเรดรันตัวเล็ก (ทำให้ตายก่อน)
      • ปริมาณ/ครั้ง: 1–3 ชิ้นจิ๋ว
      • ความถี่: ทุก 2–4 วัน

      วัยกลาง (Juveniles, ~2–6 ซม.)
      • เหยื่อ: จิ้งหรีด/โรเช่นิมฟ์เล็ก–กลาง, หนอนน้อย
      • ปริมาณ/ครั้ง: 1–2 ตัว (หรือ 2–3 ตัวเล็ก)
      • ความถี่: ทุก 7–10 วัน

      วัยกึ่งโต/โตเต็มวัย (>6 ซม.)
      • เหยื่อ: จิ้งหรีดกลาง 1 ตัว หรือ dubia/lateralis นิมฟ์ขนาดเหมาะ, (ซูเปอร์)หนอนเป็นครั้งคราว
      • ปริมาณ/ครั้ง: ส่วนใหญ่ 1 ตัวพอดีตัว
      • ความถี่: ทุก 10–21 วัน (งดกินยาวพบได้ปกติ)

      ทิปส์
      • ถ้าท้องเริ่มตึง/ตอบสนองแรง → ลดขนาดหรือเว้นระยะ
      • slings ไซส์เล็กมาก ทำให้เหยื่อตายก่อน
      • วัยกลางขึ้นไปมีถ้วยน้ำ; วัยเล็กให้ความชื้นจุดหนึ่ง`
      },


      {
        id: "not-eating",
        q: "ทำไมแมงมุมไม่กินอาหาร?",
        a:
          "สาเหตุพบบ่อย: ก่อนลอกคราบ, เพิ่งอิ่มเกินไป, หรือเครียดจากสภาพแวดล้อม (ความชื้น/อุณหภูมิไม่พอดี รบกวนบ่อย) ให้ความเป็นส่วนตัว และเก็บเหยื่อที่เหลือภายใน 24 ชม."
      },
      {
        id: "handling",
        q: "จับเล่นได้ไหม? (แนวทางจับ/ย้ายอย่างปลอดภัย)",
        fit: "contain",
        a: `หลักการสำคัญ
      • ไม่แนะนำให้ “จับเล่น” เพราะเสี่ยงตกกระแทก/เครียด แมงมุมไม่ใช่สัตว์สำหรับสัมผัส
      • ถ้าจำเป็นต้องย้าย/จัดการ ให้ใช้เครื่องมือ (catch cup, แผ่นการ์ด, แปรงปลายอ่อน) แทนมือ

      กรณีควรหลีกเลี่ยงการจับ
      • ช่วงก่อน/ระหว่าง/หลังลอกคราบ (เปลือกนิ่ม) • ตัวที่ว่องไว/โลกเก่า (พิษแรง/ไม่มีขนป้องกัน)
      • แม่ท้อง/อารมณ์ก้าวร้าว • พื้นที่เสี่ยงตก/พื้นแข็ง

      วิธี Catch-Cup (ปลอดภัยกว่า)
      1) เตรียมแก้ว/กล่องใส + การ์ดแข็ง (เช่น กระดาษแข็ง/ฝาปิด)
      2) ค่อย ๆ ครอบจากด้านหน้า/ด้านบนอย่างช้า ๆ
      3) สอดการ์ดใต้พื้น ค่อย ๆ เลื่อนปิดเป็นฐาน
      4) เคลื่อนย้ายโดยถือใกล้พื้นเสมอ หลีกเลี่ยงการเขย่า

      สัญญาณความเครียด/ป้องกันตัว
      • มีท่าทีคุกคาม, วิ่งพรวด, ดีดขน (โลกใหม่), ยกขาหน้าขู่
      → หยุดรบกวน ลดแสง/สั่น ปิดฝาให้สงบก่อน

      ความปลอดภัยผู้เลี้ยง
      • ขนป้องกันตัวระคายเคืองผิว/ตา: ล้างด้วยน้ำ, ใช้เทปดึงออกจากผิว หลีกเลี่ยงขยี้ตา
      • ถูกกัดให้ล้างทำความสะอาด บรรเทาปวดตามอาการ และสังเกตอาการผิดปกติ

      เคล็ดลับ
      • ทำงานใกล้พื้น/บนภาชนะกว้าง ลดความสูงการตก
      • สังเกตล่วงหน้าก่อนเปิดฝา: เวลาที่เขาสงบจะจัดการง่ายกว่า`
      },


      {
        id: "humidity-ventilation",
        q: "พื้นฐานความชื้นและการระบายอากาศ",
        a:
          "รักษาระดับตามสปีชีส์ และมีการระบายอากาศแบบไขว้ โดยเฉพาะสายบนต้นไม้ อากาศอับชื้นเกินไปเสี่ยงปัญหา " +
          "เลือกชื้นพอดีพร้อมลมไหลเวียนจะปลอดภัยกว่าแฉะตลอดเวลา " +
          "ดูช่วงความชื้นที่แนะนำรายสายพันธุ์ได้ที่หน้า ‘สายพันธุ์’ เพียงเปิดการ์ดของสายพันธุ์นั้น ๆ จะมีช่วงความชื้นระบุไว้ชัดเจน"
      },


      {
        id: "feeding-schedule",
        q: "ตอนไหนควรให้อาหาร?",
        fit: "contain", // ให้เห็นรูปทั้งใบตอนขยาย
        a: `วิธีดู
      • ดูขนาดท้อง (abdomen) เทียบช่วงก่อนหน้า และสังเกตความตึง/ย่นของผิวท้อง
      • พิจารณาพฤติกรรม เช่น ปั่นใย ปิดประตูรัง ซบ ๆ (มักเป็นสัญญาณก่อนลอกคราบ)
      • ตัดสินใจให้อาหารตามสีด้านล่าง (ปรับตามวัย/อุณหภูมิ/สายพันธุ์)

      ความหมายของสี
      🟢 ท้องเล็ก/แฟบ (หิวมาก) → ให้อาหารได้
        - เหมาะช่วงฟื้นตัวหลังลอกคราบหรือโตไว เริ่มจากเหยื่อชิ้นเล็กก่อน
      🟡 ท้องปานกลาง (เริ่มอิ่ม) → จะให้อาหารหรือพักก็ได้
        - ถ้าให้อาหารให้ลดขนาดเหยื่อ หรือเว้นระยะให้นานขึ้น
        - หากมีสัญญาณก่อนลอกคราบให้ “งด”
      🔴 ท้องโตมาก/ตึงมาก → งดให้อาหาร
        - เสี่ยงท้องแตกหากตก/เครียด ควรรอน้ำหนักท้องลดลงก่อน

      ขนาดเหยื่อที่แนะนำ
      • วัยเล็ก (slings): เหยื่อ ≈ ½ ความกว้างกระดอง/ท้อง หรือใช้เหยื่อชิ้น (ทำให้ตายก่อน)
      • วัยกลาง–โต: เหยื่อไม่เกินความกว้างกระดอง (หรือหลายตัวเล็กแทน 1 ตัวใหญ่)

      ความถี่โดยคร่าว (ปรับตามอุณหภูมิ/ชนิด)
      • วัยเล็ก: ทุก 2–4 วัน
      • วัยกลาง (juvenile): ทุก 7–10 วัน
      • วัยโต: ทุก 10–21 วัน (การงดกินนานเป็นเรื่องปกติ)

      งดให้อาหารเมื่อ
      • ก่อน/ระหว่าง/หลังลอกคราบ (รอให้เขี้ยวแข็ง: วัยเล็ก ~5–7 วัน, วัยโต ~7–14+ วัน)
      • มีเหยื่อค้าง >24 ชม. ให้เก็บออก
      • ท้องตึงมากหรือมีพฤติกรรมเครียดผิดปกติ

      ทิปส์ความปลอดภัย
      • มีถ้วยน้ำสะอาดตลอดเวลา • ระบายอากาศดี ลดการรบกวน • ให้ทีละน้อยแล้วสังเกตผล`
      },


      {
        id: "health-common",
        q: "โรค/ปัญหาที่พบบ่อย & วิธีป้องกัน (รวม DKS)",
        fit: "contain",
        a: `ปัญหาพบบ่อย (เข้าใจง่าย)
      • ขาดน้ำ/ร้อนเกิน: ซบ ท้องย่น ขางอเข้าหาลำตัว (death curl)
        → เติมน้ำทันที ทำมุมชื้น ลดความร้อน ห้ามฝืนป้อน
      • ลอกคราบติด (stuck molt): เกิดจากแห้ง/ถูกรบกวน
        → หลีกเลี่ยงการไปสัมผัส โดยเด็ดขาด แต่ให้เพิ่มความชื้นในตู้เลี้ยง โดยการฉีดพ่นละอองน้ำที่ผนังตู้หรือใกล้ๆ เพื่อช่วยให้แมงมุมหลุดจากคราบได้ง่ายขึ้น
      • เชื้อรา/ไรกินซาก: เห็นฝ้าขาว/ตัวจิ๋ว ๆ ที่ซากอาหาร/พื้น
        → เก็บเศษใน 24 ชม. เพิ่มลม เปลี่ยนวัสดุ/จัดระเบียบความชื้น
      • ปรสิต/ไรดูดเลือด: จุดขาวครีมเกาะข้อขา/รอบปาก
        → แยกเลี้ยงชั่วคราว ทำความสะอาดทั้งตู้ ตรวจแหล่งเหยื่อ ปรึกษาผู้มีประสบการณ์
      • บาดเจ็บจากการตก: เลือดสีใส (ฮีโมลิมฟ์) ไหล
        → แต้ม “แป้งข้าวโพด/แป้งเด็ก” ห้ามเลือดชั่วคราว ลดความสูงตู้

      DKS (Dyskinetic Syndrome)
      • ลักษณะ: สั่น/กระตุก เดินเป็นวง ควบคุมตัวเองไม่ได้
      • สาเหตุ: ยังไม่ชัด (สารเคมี/ปรสิต/ระบบประสาท)
      • ไม่มีวิธีรักษามาตรฐาน โอกาสรอดต่ำ
      • ทำได้: แยกเลี้ยงเงียบ มีถ้วยน้ำ อากาศดี งดสารเคมีรอบตู้ (ยาฆ่าแมลง สเปรย์ปรับอากาศ น้ำหอม)
        เปลี่ยนชุดเหยื่อใหม่/แหล่งใหม่ และขอคำแนะนำจากผู้มีประสบการณ์

      ป้องกันแบบเช็กลิสต์
      • เหยื่อสะอาด เลี้ยง/เพาะเองได้ยิ่งดี → ไม่ใช้แมลงจับจากธรรมชาติ
      • มีถ้วยน้ำเสมอ ล้าง/เติมประจำ • เก็บเศษใน 24 ชม.
      • ระบายอากาศดี ไม่ให้ชื้นอับ • จัดที่หลบ ลดความเครียด • เลี่ยงจับเล่น
      • ตัวใหม่ “กักกัน 30 วัน” แยกอุปกรณ์
      • หลีกเลี่ยงสารเคมีในห้อง: ยาฆ่าแมลง สเปรย์ต่างๆ ควันบุหรี่ สารระเหยเข้มข้น`
      },


      {
        id: "molting-aftercare",
        q: "การลอกคราบและดูแลหลังลอก",
        fit: "contain",
        a: `สัญญาณก่อนลอก (Premolt)
      • งดอาหารหลายวัน–หลายสัปดาห์ ซบ ๆ หรือปั่นใย/ปิดประตูรัง ขุดโพรง
      • สีท้องเข้มขึ้น/ด้านขึ้น (โดยเฉพาะแผ่นสะท้อน)
      • ควรเอาเหยื่อออก ลดการรบกวน ตรวจฝาปิดให้แน่น เพิ่มความชื้นเฉพาะจุด (ไม่อับ)

      ระหว่างลอก (Do NOT disturb)
      • ห้ามจับ/ย้าย/ช่วยดึงเปลือกลอกคราบ หลีกเลี่ยงการสั่นสะเทือนและแสงจ้า
      • เฝ้าดูห่าง ๆ ได้ อาจใช้เวลา 2–12+ ชม. ขึ้นกับขนาด
      • ถ้ามีเหยื่อค้างอยู่ให้เก็บออกทันที เพราะอาจกัดตัวนิ่มที่เพิ่งลอก

      หลังลอกทันที (Post-molt)
      • จัดน้ำสะอาดให้ทันที เพิ่มความชื้นเล็กน้อยใน 2–3 วันแรกแต่ยังต้องมีการระบายอากาศดี
      • ห้ามให้อาหารจนกว่า “เขี้ยว” จะเปลี่ยนสี: ขาวใส → ชมพู/แดง → ดำ (แข็ง)

      เริ่มให้อาหารเมื่อไรดี?
      • วัยเล็ก (slings): รอ ~5–7 วัน แล้วเริ่มด้วยเหยื่อชิ้นเล็ก/ชิ้น pre-kill
      • วัยกลาง (juveniles): รอ ~7–10 วัน
      • วัยโต (adults): รอ ~10–14+ วัน
      • หลักจำง่าย: ยิ่งตัวใหญ่ ยิ่งต้องรอนานขึ้น

      ทิปส์ความปลอดภัย
      • ลดความสูงที่อาจทำให้ตกแรงในช่วงเปลือกนิ่ม / มีจุดยึดสำหรับปีน
      • เก็บเปลือกลอก (exuviae) เมื่อแห้งแล้ว หากอยากตรวจเพศสามารถเก็บไว้ศึกษา
      • หากเห็นขาหรือส่วนใดเสียหาย มักงอกใหม่ในการลอกคราบครั้งถัดไป

      กรณีฉุกเฉินเบื้องต้น
      • ติดลอก (stuck molt) บางส่วน: เพิ่มความชื้นเฉพาะจุดและเฝ้าดูใกล้ชิด
      • หลีกเลี่ยงการดึง/แงะเอง หากรุนแรงให้ขอคำแนะนำจากผู้มีประสบการณ์`
      },

      {
        id: "dehydration-overheat",
        type: "troubleshoot",
        severity: "danger",
        q: "ขาดน้ำ/ร้อนเกิน (ซบ ท้องย่น ขางอเข้า)",
        checks: [
          "ถ้วยน้ำแห้ง/ไม่มีมุมชื้น",
          "อุณหภูมิสูงเกิน (~>28–30°C) หรือโดนแดด/ลมร้อน",
          "อากาศอับ ระบายไม่ดี"
        ],
        fixes: [
          "เติมน้ำทันที + ทำมุมชื้น 1 จุด (ไม่ต้องชุ่มทั้งตู้)",
          "ย้ายพ้นแดด/แหล่งความร้อน เปิดทางลม",
          "งดให้อาหาร ให้สงบและสังเกตอาการ"
        ],
        prevent: [
          "มีถ้วยน้ำตลอด ล้าง/เติมสม่ำเสมอ",
          "ไม่วางใกล้หน้าต่างแดดจัด/ฮีตเตอร์",
          "ยึดช่วงอุณหภูมิของสายพันธุ์"
        ],
        related: ["humidity-ventilation","feeding-schedule"]
      },
      {
        id: "stuck-molt",
        type: "troubleshoot",
        severity: "danger",
        q: "ลอกคราบติด (Stuck molt): ทำยังไง",
        checks: [
          "เห็นชิ้นคราบติดตามขา/ท้อง",
          "ความชื้นต่ำหรือมีเหยื่อค้างในตู้"
        ],
        fixes: [
          "ห้ามดึง/แงะคราบออกเอง",
          "เพิ่มความชื้นเฉพาะจุด (พรมน้ำที่ผนัง/พื้นใกล้ ๆ ไม่พ่นโดนตัว)",
          "เอาเหยื่อออกทั้งหมดและเฝ้าดู"
        ],
        prevent: [
          "ช่วง premolt–postmolt เพิ่มชื้นเล็กน้อยและลมผ่านดี",
          "เห็นสัญญาณ premolt → เอาเหยื่อออกและลดการรบกวน"
        ],
        related: ["molting-aftercare","humidity-ventilation"]
      },
      {
        id: "mold-mites",
        type: "troubleshoot",
        severity: "caution",
        q: "เชื้อรา/ไรกินซากในตู้",
        checks: [
          "มีฝ้าขาวบนซากอาหาร/พื้น",
          "เห็นจุดเล็กเคลื่อนที่ (ไร) + กลิ่นอับ"
        ],
        fixes: [
          "เก็บซาก/เศษอาหารใน 24 ชม.",
          "เพิ่มการระบายอากาศ ลดการรดน้ำ/พ่น",
          "เปลี่ยนวัสดุรองพื้นบางส่วน (หรือทั้งตู้ถ้าหนัก)"
        ],
        prevent: [
          "ให้อาหารพอดีตัว ไม่ปล่อยหลายชิ้นพร้อมกัน",
          "ล้างถ้วยน้ำประจำ และให้ลมผ่านดี",
          "ใช้เหยื่อสะอาด/กักกันก่อนใช้"
        ],
        related: ["feeding-by-stage","feeding-schedule","humidity-ventilation"]
      },
      {
        id: "injury-bleeding",
        type: "troubleshoot",
        severity: "danger",
        q: "บาดเจ็บ/เลือดไหลหลังตกกระแทก",
        checks: [
          "มีของเหลวใส (ฮีโมลิมฟ์) ซึมหรือไหล",
          "เดินผิดปกติ/เกราะแตก/ขาหัก"
        ],
        fixes: [
          "แต้มแป้งข้าวโพด/แป้งเด็กบาง ๆ เพื่อห้ามเลือด",
          "ลดความสูง/ปรับของในตู้ให้นิ่มและปลอดภัย",
          "งดให้อาหาร 48–72 ชม. แล้วประเมินอีกครั้ง"
        ],
        prevent: [
          "จำกัดความสูงในตู้สายดิน, ใส่คอร์กบาร์กยึดเกาะ",
          "ไม่จับเล่น ให้อยู่ในพื้นที่ต่ำ",
          "ตรวจฝา/ช่องหนีให้แน่นเสมอ"
        ],
        related: ["handling"]
      },
      {
        id: "escape-handling",
        type: "troubleshoot",
        severity: "caution",
        q: "หนีหลุด: จับกลับยังไงให้ปลอดภัย",
        checks: [
          "ปิดประตู/หน้าต่างและช่องใต้ประตู",
          "ค้นหามุมมืด ขอบผนัง ใต้เฟอร์นิเจอร์"
        ],
        fixes: [
          "ใช้แก้วใส + การ์ดแข็ง (catch-cup) ไล่ให้เดินเข้ากระปุก",
          "ทำงานช้า ๆ ลดแสง/ปิดพัดลม ใช้ไฟแดงช่วยส่อง",
          "ไม่ใช้มือเปล่าคว้าหรือบีบคีบ"
        ],
        prevent: [
          "เช็กฝาและตัวล็อกทุกครั้ง รูระบายต้องเล็กพอ",
          "ทำงานบนพื้นที่กว้าง/ใกล้พื้น มีกล่องสำรอง",
          "ย้ายตู้ช่วงค่ำที่เงียบ"
        ],
        related: ["handling","rehousing"]
      },
      {
        id: "humidity-issues",
        type: "troubleshoot",
        severity: "info",
        q: "ตู้แฉะเกิน/แห้งเกิน แก้ยังไงดี",
        checks: [
          "แฉะเกิน: ไอน้ำเกาะกระจกทั้งบาน/กลิ่นอับ",
          "แห้งเกิน: พื้นร่วน/ผิวท้องย่น/ดื่มน้ำบ่อย"
        ],
        fixes: [
          "แฉะเกิน → เพิ่มรู/เปิดฝาชั่วคราว ลดการรดน้ำ",
          "แห้งเกิน → รดน้ำ ‘มุมชื้น’ 1 จุด หรือพรมน้ำพื้นเบา ๆ"
        ],
        prevent: [
          "ยึดความชื้นของแต่ละสปีชีส์ + ตู้ระบายอากาศดี",
          "ใช้ถ้วยน้ำแทนการพ่นทั้งตู้ และวางไฮโกรมิเตอร์ช่วย"
        ],
        related: ["humidity-ventilation"]
      }
    ],
    
    recommend: "แนะนำสำหรับมือใหม่",
    readMore: "อ่านต่อ",
  }
};

const KNOWLEDGE_IMAGES = {
  "new-vs-old": "/knowledge/new-vs-old.jpg",
  "feeding-by-stage": "/knowledge/feeding-by-stage.jpg",
  "not-eating": "/knowledge/not-eating.jpg",
  "handling": "/knowledge/handling.jpg",
  "humidity-ventilation": "/knowledge/humidity-ventilation.jpg",
  "feeding-schedule": "/knowledge/feeding-schedule.jpg",
  "molting-aftercare": "/knowledge/molting-aftercare.jpg",
  "health-common": "/knowledge/health-common.jpg",
  "dehydration-overheat": "/knowledge/dehydration-overheat.jpg",
  "stuck-molt": "/knowledge/stuck-molt.jpg",
  "mold-mites": "/knowledge/mold-mites.jpg",
  "injury-bleeding": "/knowledge/injury-bleeding.jpg",
  "escape-handling": "/knowledge/escape-handling.jpg",
  "humidity-issues": "/knowledge/humidity-issues.jpg",
};

// ------------------------
// Species Data (25 entries)
// world: New/Old, habitat: Terrestrial/Arboreal/Fossorial, difficulty: Beginner/Intermediate/Advanced
// urticating: New World mostly true; Old World false
const SPECIES = [
  { id: "pulchripes", img: "/species/pulchripes.jpg", commonName: "Chaco Golden Knee", thaiName: "ชาโค โกลเดน นี", scientificName: "Grammostola pulchripes", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "60–70%", temperature: "22–26°C", lifespan: "♂ 5–7y / ♀ 15–20y", growth: "Slow–Medium", enclosure: "Terrestrial, 30×30×30cm, deep substrate", notes: "Calm temperament. Great for beginners.", recommended: true },
  { id: "hamorii", img: "/species/hamorii.jpg", commonName: "Mexican Redknee", thaiName: "เม็กซิกัน เรดนี", scientificName: "Brachypelma hamorii", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "60–70%", temperature: "22–26°C", lifespan: "♂ 6–8y / ♀ 15–20y", growth: "Slow", enclosure: "Terrestrial, 30×30×30cm", notes: "Docile, iconic beginner species.", recommended: true },
  { id: "albopilosus", img: "/species/albopilosus.jpg", commonName: "Curly Hair", thaiName: "เคิร์ลี แฮร์", scientificName: "Tliltocatl albopilosus", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "65–75%", temperature: "22–26°C", lifespan: "♂ 5–7y / ♀ 10–15y", growth: "Medium", enclosure: "Terrestrial, deep substrate", notes: "Hardy and forgiving.", recommended: true },
  { id: "vagans", img: "/species/vagans.jpg", commonName: "Mexican Red Rump", thaiName: "เม็กซิกัน เรดรัมป์", scientificName: "Tliltocatl vagans", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Low–Moderate", urticating: true, humidity: "65–75%", temperature: "22–26°C", lifespan: "♂ 5–7y / ♀ 15–20y", growth: "Medium", enclosure: "Terrestrial", notes: "Can be a bit flicky." },
  { id: "pulchra", img: "/species/pulchra.jpg", commonName: "Brazilian Black", thaiName: "บราซิลเลียน แบล็ก", scientificName: "Grammostola pulchra", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "60–70%", temperature: "22–26°C", lifespan: "♂ 6–8y / ♀ 20+ y", growth: "Slow", enclosure: "Terrestrial", notes: "Jet-black, very calm.", recommended: true },
  { id: "geniculata", img: "/species/geniculata.jpg", commonName: "Brazilian Whiteknee", thaiName: "ไวท์นี", scientificName: "Acanthoscurria geniculata", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Moderate", urticating: true, humidity: "65–75%", temperature: "23–27°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Terrestrial", notes: "Voracious eater." },
  { id: "chromatus", img: "/species/chromatus.jpg", commonName: "Brazilian Red & White", thaiName: "เรดแอนด์ไวท์", scientificName: "Nhandu chromatus", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Moderate", urticating: true, humidity: "65–75%", temperature: "23–27°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Terrestrial", notes: "Striking contrast." },
  { id: "parahybana", img: "/species/parahybana.jpg", commonName: "Salmon Pink Birdeater", thaiName: "ซอลมอนพิงก์", scientificName: "Lasiodora parahybana", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Moderate", urticating: true, humidity: "70–80%", temperature: "23–27°C", lifespan: "♂ 5–7y / ♀ 12–15y", growth: "Fast", enclosure: "Large terrestrial", notes: "Gets very large." },
  { id: "cyaneopubescens", img: "/species/cyaneopubescens.jpg", commonName: "Greenbottle Blue", thaiName: "กรีนบอตเทิล บลู", scientificName: "Chromatopelma cyaneopubescens", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Low–Moderate", urticating: true, humidity: "55–65%", temperature: "23–27°C", lifespan: "♂ 4–6y / ♀ 10–12y", growth: "Fast", enclosure: "Dry, lots of web anchors", notes: "Colorful heavy webber." },
  { id: "avicularia", img: "/species/avicularia.jpg", commonName: "Pink Toe", thaiName: "พิงก์โท", scientificName: "Avicularia avicularia", world: "New", habitat: "Arboreal", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "70–80%", temperature: "23–27°C", lifespan: "♂ 3–5y / ♀ 8–10y", growth: "Medium", enclosure: "Arboreal, tall with ventilation", notes: "Needs cross-ventilation.", recommended: true },
  { id: "versicolor", img: "/species/versicolor.jpg", commonName: "Antilles Pinktoe", thaiName: "แอนทิลลีส พิงก์โท", scientificName: "Caribena versicolor", world: "New", habitat: "Arboreal", difficulty: "Intermediate", venom: "Low", urticating: true, humidity: "70–80%", temperature: "23–27°C", lifespan: "♂ 3–5y / ♀ 8–10y", growth: "Medium", enclosure: "Arboreal, good ventilation", notes: "Beautiful color change." },
  { id: "chalcodes", img: "/species/chalcodes.jpg", commonName: "Arizona Blonde", thaiName: "อะริโซนา บลอนด์", scientificName: "Aphonopelma chalcodes", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "40–55%", temperature: "22–28°C", lifespan: "♂ 10–12y / ♀ 20+ y", growth: "Slow", enclosure: "Dry terrestrial", notes: "Very hardy desert species.", recommended: true },
  { id: "cambridgei", img: "/species/cambridgei.jpg", commonName: "Trinidad Chevron", thaiName: "ตรินิแดด เชฟรอน", scientificName: "Psalmopoeus cambridgei", world: "New", habitat: "Arboreal", difficulty: "Intermediate", venom: "Moderate", urticating: false, humidity: "70–80%", temperature: "23–27°C", lifespan: "♂ 5–7y / ♀ 12–15y", growth: "Fast", enclosure: "Arboreal", notes: "No urticating hairs; quick." },
  { id: "regalis", img: "/species/regalis.jpg", commonName: "Indian Ornamental", thaiName: "อินเดียน ออร์นาเมนทัล", scientificName: "Poecilotheria regalis", world: "Old", habitat: "Arboreal", difficulty: "Advanced", venom: "High", urticating: false, humidity: "70–80%", temperature: "24–28°C", lifespan: "♂ 4–5y / ♀ 12–15y", growth: "Fast", enclosure: "Arboreal, secure lid", notes: "Fast, potent venom." },
  { id: "metallica", img: "/species/metallica.jpg", commonName: "Gooty Sapphire", thaiName: "กูตี แซฟไฟร์", scientificName: "Poecilotheria metallica", world: "Old", habitat: "Arboreal", difficulty: "Advanced", venom: "High", urticating: false, humidity: "70–80%", temperature: "24–28°C", lifespan: "♂ 4–5y / ♀ 12–15y", growth: "Fast", enclosure: "Arboreal", notes: "Striking blue; advanced only." },
  { id: "murinus", img: "/species/murinus.jpg", commonName: "Orange Baboon (OBT)", thaiName: "ออเรนจ์ บาบูน", scientificName: "Pterinochilus murinus", world: "Old", habitat: "Terrestrial", difficulty: "Advanced", venom: "High", urticating: false, humidity: "50–60%", temperature: "24–28°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Dry terrestrial, secure lid", notes: "Very defensive." },
  { id: "maculata", img: "/species/maculata.jpg", commonName: "Togo Starburst", thaiName: "โทโก สตาร์เบิร์สต์", scientificName: "Heteroscodra maculata", world: "Old", habitat: "Arboreal", difficulty: "Advanced", venom: "High", urticating: false, humidity: "70–80%", temperature: "24–28°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Arboreal", notes: "Lightning fast." },
  { id: "balfouri", img: "/species/balfouri.jpg", commonName: "Socotra Blue Baboon", thaiName: "โซโครต้า บลู บาบูน", scientificName: "Monocentropus balfouri", world: "Old", habitat: "Terrestrial", difficulty: "Advanced", venom: "High", urticating: false, humidity: "55–65%", temperature: "24–28°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Medium", enclosure: "Terrestrial (communal setups exist)", notes: "Beautiful; advanced care." },
  { id: "minax", img: "/species/minax.jpg", commonName: "Thai Black", thaiName: "ไทยแบล็ก", scientificName: "Cyriopagopus minax", world: "Old", habitat: "Terrestrial", difficulty: "Advanced", venom: "High", urticating: false, humidity: "70–80%", temperature: "24–28°C", lifespan: "♂ 5–7y / ♀ 12–15y", growth: "Medium–Fast", enclosure: "Fossorial/terrestrial, deep substrate", notes: "Defensive; not for beginners." },
  { id: "huahini", img: "/species/huahini.jpg", commonName: "Asian Fawn", thaiName: "เอเชียนฟอว์น", scientificName: "Chilobrachys huahini", world: "Old", habitat: "Fossorial", difficulty: "Advanced", venom: "High", urticating: false, humidity: "75–85%", temperature: "24–28°C", lifespan: "♂ 5–7y / ♀ 10–12y", growth: "Fast", enclosure: "Tall, deep substrate; heavy webber", notes: "Fast and defensive; heavy webbing." },
  { id: "lividus", img: "/species/lividus.jpg", commonName: "Cobalt Blue", thaiName: "บึ้งน้ำเงิน", scientificName: "Cyriopagopus lividus", world: "Old", habitat: "Fossorial", difficulty: "Advanced", venom: "High", urticating: false, humidity: "75–85%", temperature: "24–28°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Deep substrate, secure lid", notes: "Striking color, very defensive." },
  { id: "schioedtei", img: "/species/schioedtei.jpg", commonName: "Malaysian Earth Tiger", thaiName: "มาเลเชียน เอิร์ธไทเกอร์", scientificName: "Omothymus schioedtei", world: "Old", habitat: "Arboreal", difficulty: "Advanced", venom: "High", urticating: false, humidity: "70–80%", temperature: "24–28°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Arboreal", notes: "Large arboreal Old World." },
  { id: "cancerides", img: "/species/cancerides.jpg", commonName: "Hispaniolan Giant", thaiName: "ฮิสปานิโอลัน ไจแอนท์", scientificName: "Phormictopus cancerides", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Moderate", urticating: true, humidity: "65–75%", temperature: "23–27°C", lifespan: "♂ 5–7y / ♀ 15–20y", growth: "Fast", enclosure: "Large terrestrial", notes: "Big New World species." },
  { id: "pentaloris", img: "/species/pentaloris.jpg", commonName: "Guatemalan Tiger Rump", thaiName: "ไทเกอร์รัมป์", scientificName: "Davus pentaloris", world: "New", habitat: "Terrestrial", difficulty: "Beginner", venom: "Low", urticating: true, humidity: "60–70%", temperature: "22–26°C", lifespan: "♂ 4–6y / ♀ 10–12y", growth: "Medium", enclosure: "Terrestrial", notes: "Compact and pretty.", recommended: true },
  { id: "boehmei", img: "/species/boehmei.jpg", commonName: "Mexican Fireleg", thaiName: "ไฟร์เลก เม็กซิกัน", scientificName: "Brachypelma boehmei", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Low–Moderate", urticating: true, humidity: "60–70%", temperature: "22–26°C", lifespan: "♂ 6–8y / ♀ 15–20y", growth: "Slow", enclosure: "Terrestrial, 30×30×30cm", notes: "Beautiful coloration; can flick hairs when stressed." },
  { id: "geniculata2", img: "/species/geniculata2.jpg", commonName: "Brazilian Giant Whiteknee", thaiName: "ไวท์นี ไจแอนท์", scientificName: "Acanthoscurria geniculata (large)", world: "New", habitat: "Terrestrial", difficulty: "Intermediate", venom: "Moderate", urticating: true, humidity: "65–75%", temperature: "23–27°C", lifespan: "♂ 4–6y / ♀ 12–15y", growth: "Fast", enclosure: "Large terrestrial", notes: "Alternate listing to reach 25 with size variant." },
];

const DEFAULT_FILTERS = { world: new Set(), habitat: new Set(), difficulty: new Set(), sort: "name", q: "" };

// ------------------------
// Test helpers (runtime smoke tests in dev)
// ------------------------
function runSmokeTests() {
  try {
    // 1) Text search should find Chaco by "chaco"
    const q = "chaco";
    const list1 = SPECIES.filter((s) => [s.commonName, s.scientificName, s.thaiName].some(v => v.toLowerCase().includes(q)));
    console.assert(list1.some(s => s.id === "pulchripes"), "Test 1 failed: search 'chaco' should include pulchripes");

    // 2) World filter OLD should exclude New World species
    const list2 = SPECIES.filter((s) => s.world === "Old");
    console.assert(list2.every(s => s.world === "Old"), "Test 2 failed: world filter Old only");

    // 3) Combined habitat + world should include huahini & lividus
    const list3 = SPECIES.filter((s) => s.world === "Old" && s.habitat === "Fossorial");
    const ids3 = new Set(list3.map(s=>s.id));
    console.assert(ids3.has("huahini") && ids3.has("lividus"), "Test 3 failed: expected huahini & lividus in Old+Fossorial");

    // 4) Difficulty sort: Beginner should appear before Advanced in a naive sort
    const order = { Beginner: 0, Intermediate: 1, Advanced: 2 };
    const list4 = [...SPECIES].sort((a,b)=> order[a.difficulty]-order[b.difficulty] || a.commonName.localeCompare(b.commonName));
    const idxBeg = list4.findIndex(s=>s.difficulty === "Beginner");
    const idxAdv = list4.findIndex(s=>s.difficulty === "Advanced");
    console.assert(idxBeg !== -1 && idxAdv !== -1 && idxBeg < idxAdv, "Test 4 failed: Beginner should precede Advanced");

    // 5) i18n presence for Thai knowledge items
    const isThai = LANG.th.knowledge[0].q.includes('โลก');
    console.assert(isThai, "Test 5 failed: Thai knowledge items should be Thai");

    // 6) Ensure we have at least 25 species
    console.assert(SPECIES.length >= 25, `Test 6 failed: expected >=25 species, got ${SPECIES.length}`);

    console.log("✅ Smoke tests passed");
  } catch (e) {
    console.error("❌ Smoke tests error", e);
  }
}

// ------------------------
// Main App
// ------------------------
export default function App() {
  // 1) ประกาศ state ให้ครบ ก่อนมี useEffect ใด ๆ
  const [page, setPage] = useState(() => {
    const allowed = new Set(["home", "care", "species", "knowledge", "ai", "diseases", "troubleshoot"]);
    const fromHash = window.location.hash.replace("#", "");
    if (allowed.has(fromHash)) return fromHash;
    const saved = localStorage.getItem("tc_page");
    return allowed.has(saved) ? saved : "home";
  });

  const [lang, setLang] = useState("th");
  const t = LANG[lang];
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 2) effects มาทีหลัง
  useEffect(() => {
  setMounted(true);
  if (import.meta.env?.DEV) runSmokeTests();
  }, []);

  // sync page -> localStorage + URL hash
  useEffect(() => {
    localStorage.setItem("tc_page", page);
    if (window.location.hash.replace("#", "") !== page) {
      window.location.hash = page; // ให้ back/forward ทำงาน
    }
  }, [page]);

  // sync hash -> page (รองรับ back/forward/paste hash)
  useEffect(() => {
    const onHashChange = () => {
      const p = window.location.hash.replace("#", "");
      if (p && p !== page) setPage(p);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [page]);

  const filtered = useMemo(() => {
    let list = SPECIES.filter((s) => {
      const q = filters.q.trim().toLowerCase();
      const matchQ = !q || [s.commonName, s.scientificName, s.thaiName].some(v => v.toLowerCase().includes(q));
      const matchWorld = filters.world.size === 0 || filters.world.has(s.world);
      const matchHabitat = filters.habitat.size === 0 || filters.habitat.has(s.habitat);
      const matchDifficulty = filters.difficulty.size === 0 || filters.difficulty.has(s.difficulty);
      const matchBeginner = !beginnerMode || (s.difficulty !== 'Advanced' && s.world !== 'Old');
      return matchQ && matchWorld && matchHabitat && matchDifficulty && matchBeginner;
    });
    if (filters.sort === "name") list.sort((a,b)=>a.commonName.localeCompare(b.commonName));
    if (filters.sort === "difficulty") {
      const order = { Beginner: 0, Intermediate: 1, Advanced: 2 };
      list.sort((a,b)=> order[a.difficulty]-order[b.difficulty] || a.commonName.localeCompare(b.commonName));
    }
    return list;
  }, [filters, beginnerMode]);

  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => setPage(id)} className={cx("flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-zinc-100 transition", page===id && "bg-zinc-100")}> 
      <Icon className="w-5 h-5"/>
      <span>{label}</span>
      {page===id && <ChevronRight className="w-4 h-4 ml-auto"/>}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Bug className="w-5 h-5"/>
            <span>{t.appName}</span>
            <span className="hidden sm:inline-block text-zinc-400 font-normal">— {t.tagline}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Beginner mode switch */}
            <label className="flex items-center gap-2 text-sm mr-2 select-none font-bold">
              <input
                type="checkbox"
                checked={beginnerMode}
                onChange={(e)=>setBeginnerMode(e.target.checked)}
                className="scale-110 accent-emerald-600"
              />
              <span className="font-bold leading-none tracking-tight">{t.beginnerMode}</span>
            </label>
            <button
              onClick={()=> setLang(lang==='th' ? 'en' : 'th')}
              className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 font-bold"
            >
              {t.language}
            </button>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <nav className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <div className="text-xs font-medium text-zinc-500 px-2 mb-2">Menu</div>
            <div className="flex flex-col gap-1">
              <NavItem id="home" icon={Home} label={t.nav.home} />
              <NavItem id="care" icon={BookOpen} label={t.nav.care} />
              <NavItem id="species" icon={Layers} label={t.nav.species} />
              <NavItem id="knowledge" icon={Globe} label={t.nav.knowledge} />
              <NavItem id="ai" icon={Bot} label={t.nav.ai} />
              <NavItem id="diseases"    icon={Stethoscope}  label={t.nav.diseases} />
              <NavItem id="troubleshoot"icon={Wrench}       label={t.nav.troubleshoot} />
            </div>
          </nav>

          {/* Tips card */}
          <div className="mt-6">
            <SpeciesSpotlight
              t={t}
              lang={lang}
              beginnerMode={beginnerMode}
              go={(id)=> setPage(id)}         // ใช้เปิดไปหน้าสายพันธุ์
              setFilters={setFilters}         // ใช้ตั้งค่า search ให้ตรง species
            />
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          <AnimatePresence mode="wait">
            {page === "home" && (
              <motion.section key="home" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}}> 
                <HeroShowcase lang={lang} t={t} onExplore={()=> setPage("species")} go={(id)=> setPage(id)} />
                <Highlights lang={lang} t={t} go={(id)=> setPage(id)} />
                <BeginnerPicks t={t} go={(id)=> setPage(id)} />
              </motion.section>  
            )}
            {page === "species" && (
              <motion.section key="species" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}}>
                <SpeciesExplorer t={t} filters={filters} setFilters={setFilters} results={filtered} resetFilters={resetFilters} beginnerMode={beginnerMode} lang={lang} />
              </motion.section>
            )}
            {page === "care" && (
              <motion.section key="care" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}}>
                <CareGuide t={t} lang={lang} />
              </motion.section>
            )}
            {page === "knowledge" && (
              <motion.section key="knowledge" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}}>
                <Knowledge t={t} lang={lang} />
              </motion.section>
            )}
            {page === "ai" && (
              <motion.section key="ai" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}}>
                <AIConsult t={t} lang={lang} />
              </motion.section>
            )}
            {page === "diseases" && (
              <motion.section key="diseases" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
                <DiseasesGuide t={t} lang={lang} />
              </motion.section>
            )}
            {page === "troubleshoot" && (
              <motion.section key="troubleshoot" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
                <TroubleshootGuide t={t} lang={lang} />
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-10 text-center text-xs text-zinc-500">© {new Date().getFullYear()} TaraCare • UX prototype for thesis</footer>
      <style>{mounted ? "" : "*{transition:none!important}"}</style>
    </div>
  );
}

function DiseasesGuide({ t, lang }) {
  const item = (t.knowledge || []).find(it => it.id === "health-common");
  if (!item) return <div className="text-sm text-zinc-500">No content</div>;
  const img = resolveKnowledgeImg(item);

  return (
    <article className="space-y-4">
      <header className="flex items-center gap-2">
        <Stethoscope className="w-5 h-5" />
        <h2 className="text-xl font-bold">
          {lang === "th" ? "โรค/ปัญหาที่พบบ่อย" : "Common Issues & Prevention"}
        </h2>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        {img && (
          <div className="relative aspect-[16/9] bg-zinc-100">
            <img src={img} alt={item.q} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <div className="font-semibold mb-2">{item.q}</div>
          <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {item.a}
          </div>
        </div>
      </div>
    </article>
  );
}

function TroubleshootGuide({ t, lang }) {
  const labels = lang === "th"
    ? { title: "แก้ปัญหาเบื้องต้น", checks: "ตรวจเช็ก", fixes: "วิธีแก้", prevent: "ป้องกัน", zoom: "ขยาย",
        sev: { danger: "ฉุกเฉิน", caution: "ควรระวัง", info: "ข้อมูล" } }
    : { title: "Troubleshooting", checks: "Checks", fixes: "Fixes", prevent: "Prevention", zoom: "Zoom",
        sev: { danger: "Danger", caution: "Caution", info: "Info" } };

  const all = (t.knowledge || []);
  const typed = all.filter(it => it.type === "troubleshoot");
  const fallbackIds = ["not-eating", "molting-aftercare"];
  const fallback = all.filter(it => fallbackIds.includes(it.id));
  const items = (typed.length ? typed : fallback).map(it => ({ ...it, img: resolveKnowledgeImg(it) }));

  if (!items.length) return <div className="text-sm text-zinc-500">No content</div>;

  const sevOrder = { danger: 0, caution: 1, info: 2 };
  items.sort((a, b) =>
    (sevOrder[(a.severity || "info")] - sevOrder[(b.severity || "info")]) ||
    String(a.q).localeCompare(String(b.q))
  );

  const sevTheme = {
    danger: "bg-red-50 border-red-200 text-red-800",
    caution: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };

  // ป้ายหัวข้อสั้นบนภาพ (ถ้าอยากตั้งเองต่อไอเท็ม ให้เพิ่ม shortTh/shortEn ใน knowledge ได้)
  const shortLabel = (it) => {
    if (lang === "th") {
      if (it.shortTh) return it.shortTh;
      if (it.id === "not-eating") return "ไม่กินอาหาร";
      if (it.id === "molting-aftercare") return "หลังลอกคราบ";
      if (it.id === "dehydration-overheat") return "ขาดน้ำ/ร้อนเกิน";
      return it.q;
    }
    if (it.shortEn) return it.shortEn;
    if (it.id === "not-eating") return "Not eating";
    if (it.id === "molting-aftercare") return "Post-molt care";
    if (it.id === "dehydration-overheat") return "Dehydration / Overheat";
    return it.q;
  };

  const SectionList = ({ icon: Icon, title, items }) => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center gap-2 font-medium mb-2">
        <Icon className="w-4 h-4" /> <span>{title}</span>
      </div>
      {Array.isArray(items) && items.length ? (
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700">
          {items.map((li, i) => <li key={i}>{li}</li>)}
        </ul>
      ) : (
        <div className="text-sm text-zinc-500">—</div>
      )}
    </div>
  );

  const [zoom, setZoom] = React.useState(null);

  return (
    <article className="space-y-4">
      <header className="flex items-center gap-2">
        <Wrench className="w-5 h-5" />
        <h2 className="text-xl font-bold">{labels.title}</h2>
      </header>

      {items.map((it) => (
        <section key={it.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          {it.img && (
            <div className="group relative aspect-[4/3] bg-zinc-100">
              <img
                src={it.img}
                alt={it.q}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover will-change-transform transition-transform duration-300 group-hover:scale-[1.01]"
                onClick={() => setZoom(it)}
                role="button"
                aria-label={labels.zoom}
              />
              {/* ไล่เฉดช่วยให้อ่านง่าย */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none" />
              {/* ป้ายหัวข้อสั้นบนภาพ */}
              <div className="absolute left-3 top-3">
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/55 backdrop-blur-sm">
                  {shortLabel(it)}
                </span>
              </div>
              {/* ปุ่มซูม */}
              <button
                onClick={() => setZoom(it)}
                className="absolute right-3 bottom-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/85 hover:bg-white text-zinc-800 text-xs border border-zinc-200"
                aria-label={labels.zoom}
              >
                <ZoomIn className="w-3.5 h-3.5" /> {labels.zoom}
              </button>
            </div>
          )}

          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="font-semibold flex-1">{it.q}</div>
              {it.severity && (
                <span className={`text-xs px-2 py-0.5 rounded-lg border ${sevTheme[it.severity] || sevTheme.info}`}>
                  {labels.sev[it.severity] || labels.sev.info}
                </span>
              )}
            </div>

            {it.checks || it.fixes || it.prevent ? (
              <div className="grid md:grid-cols-3 gap-3">
                <SectionList icon={Search} title={labels.checks} items={it.checks} />
                <SectionList icon={Wrench} title={labels.fixes} items={it.fixes} />
                <SectionList icon={ShieldAlert} title={labels.prevent} items={it.prevent} />
              </div>
            ) : (
              <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{it.a}</div>
            )}
          </div>
        </section>
      ))}

      {/* Lightbox ดูภาพใหญ่ */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setZoom(null)} />
            <motion.div
              className="absolute inset-0 p-4 md:p-8 flex items-center justify-center"
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <div className="relative w-full max-w-4xl rounded-3xl bg-white overflow-hidden border border-zinc-200">
                <button
                  onClick={() => setZoom(null)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-white/85 border border-zinc-200 hover:bg-zinc-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="bg-zinc-100 w-full h-[min(82vh,860px)] flex items-center justify-center">
                  <img
                    src={resolveKnowledgeImg(zoom)}
                    alt={zoom.q}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ------------------------
// Sections
// ------------------------
function HeroShowcase({ t, onExplore, lang, go }) {

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.12),transparent_45%)]" />

      <div className="relative p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.appName}</h1>
          <p className="text-zinc-600 mt-3 max-w-xl">{t.tagline}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800">Beginner Mode</span>
            <span className="px-2 py-1 rounded-lg bg-sky-100 border border-sky-200 text-sky-800">{lang==='th'?'สองภาษา ไทย/อังกฤษ':'Bilingual TH/EN'}</span>
            <span className="px-2 py-1 rounded-lg bg-amber-100 border border-amber-200 text-amber-800">{lang==='th'?'คู่มือการเลี้ยงเข้าใจง่าย':'Friendly care guides'}</span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button onClick={onExplore} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              {lang==='th' ? 'ดูสายพันธุ์' : t.heroCTA}
            </button>
            <button onClick={()=>go('care')} className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Highlights({ t, lang, go }) {
  const cards = [
    {
      id: "species",
      title: lang === 'th' ? 'เลือกสายพันธุ์แรกให้ถูกใจ' : 'Pick your first species',
      desc: lang === 'th' ? 'เริ่มจาก New World นิสัยสงบ ดูแลง่าย' : 'Start with calm New World species.',
      img: "/species/versicolor.jpg",
      fallback: 'Antilles Pinktoe',
    },
    {
      id: "care",
      title: lang === 'th' ? 'จัดตู้เลี้ยงให้เหมาะ' : 'Build a safe enclosure',
      desc: lang === 'th' ? 'พื้นลึก ระบายอากาศดี น้ำพร้อมเสมอ' : 'Deep substrate, ventilation, fresh water.',
      img: "/home/box.jpg",
      fallback: 'box',
    },
    {
      id: "knowledge",
      title: lang === 'th' ? 'สิ่งที่มือใหม่ควรรู้' : 'Things beginners should know',
      desc: lang === 'th' ? 'ความชื้น, อาหาร, การจับต้อง, แสงแดด, ความเครียด' : 'Humidity, feeding, handling, sunlight, stress.',
      img: "/home/knowledge.jpg",
      fallback: 'Greenbottle Blue',
    },
    {
      id: "ai",
      title: lang === 'th' ? 'ถามผู้ช่วย AI ได้เลย' : 'Ask the AI helper',
      desc: lang === 'th' ? 'สงสัยอะไรลองพิมพ์ถามแบบภาษาคน' : 'Type natural questions any time.',
      img: "/home/ai.jpg",
      fallback: 'tarantula web',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          onClick={() => go(c.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(c.id); }
          }}
          className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden text-left hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {/* กรอบรูป (ไม่มีช่องขาวแล้ว) */}
          <div className="relative aspect-[4/3] w-full bg-zinc-100 [line-height:0]">
            <img
              src={c.img}
              alt={c.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 block w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = makePhotoUrl({ commonName: c.fallback || 'tarantula' });
              }}
            />
          </div>

          <div className="p-4">
            <div className="font-semibold leading-tight">{c.title}</div>
            <div className="text-xs text-zinc-600 mt-1 line-clamp-2">{c.desc}</div>
            <div className="mt-3 inline-flex items-center text-sm text-emerald-700 group-hover:translate-x-1 transition">
              <span>{lang === 'th' ? 'เปิด' : 'Open'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


function BeginnerPicks({ t, go }) {
  // หยิบสายพันธุ์ที่ติดป้าย recommended ไว้แล้ว
  const picks = SPECIES.filter(s=>s.recommended).slice(0,4);
  if (!picks.length) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-semibold">{t.recommend}</div>
        <div className="h-px bg-zinc-200 flex-1"/>
        <button onClick={()=>go('species')} className="text-xs text-emerald-700 hover:underline">{t.language==='English' ? 'ดูทั้งหมด' : 'View all'}</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {picks.map(s=> <SpeciesThumb key={s.id} s={s} go={go} />)}
      </div>
    </div>
  );
}

function SpeciesThumb({ s, go }) {
  return (
    <button onClick={()=>go('species')} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden text-left hover:shadow-sm transition">
      <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        <img
         src={getSpeciesImage(s)}
         onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src = makePhotoUrl(s); }}
         alt={s.commonName}
         className="w-full h-full object-cover"
       />
      </div>
      <div className="p-3">
        <div className="font-medium leading-tight">{s.commonName}</div>
        <div className="text-[11px] text-zinc-500">{s.scientificName}</div>
      </div>
    </button>
  );
}

// ------------------------
// Species Explorer
// ------------------------
function SpeciesExplorer({ t, filters, setFilters, results, resetFilters, beginnerMode, lang }) {
  // state สำหรับเปิด/ปิดโมดัล
  const [selected, setSelected] = useState(null);

  const toggle = (key, value) => {
    setFilters(prev => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...prev, [key]: next };
    });
  };
  const setSort = (sort) => setFilters(prev => ({ ...prev, sort }));
  const setQ = (q) => setFilters(prev => ({ ...prev, q }));

  return (
    <div>
      {beginnerMode && (
        <div className="mb-3 p-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5"/>
          <div className="text-sm">{t.beginnerNote}</div>
        </div>
      )}

      <div className="mb-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input
            className="w-full pl-10 pr-3 py-3 rounded-2xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={t.search}
            value={filters.q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SortSelect t={t} value={filters.sort} onChange={setSort} />
          <button onClick={resetFilters} className="px-3 py-2 rounded-2xl border border-zinc-300 bg-white hover:bg-zinc-100 text-sm">
            {t.clearAll}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <FilterGroup label={t.newWorld + "/" + t.oldWorld}>
          <Chip active={filters.world.has("New")} onClick={()=>toggle("world","New")}>{t.newWorld}</Chip>
          <Chip active={filters.world.has("Old")} onClick={()=>toggle("world","Old")}>{t.oldWorld}</Chip>
        </FilterGroup>
        <FilterGroup label={t.habitat}>
          <Chip active={filters.habitat.has("Arboreal")} onClick={()=>toggle("habitat","Arboreal")}>{t.arboreal}</Chip>
          <Chip active={filters.habitat.has("Terrestrial")} onClick={()=>toggle("habitat","Terrestrial")}>{t.terrestrial}</Chip>
          <Chip active={filters.habitat.has("Fossorial")} onClick={()=>toggle("habitat","Fossorial")}>{t.fossorial}</Chip>
        </FilterGroup>
        <FilterGroup label={t.difficulty}>
          <Chip active={filters.difficulty.has("Beginner")} onClick={()=>toggle("difficulty","Beginner")}>{t.beginner}</Chip>
          <Chip active={filters.difficulty.has("Intermediate")} onClick={()=>toggle("difficulty","Intermediate")}>{t.intermediate}</Chip>
          <Chip active={filters.difficulty.has("Advanced")} onClick={()=>toggle("difficulty","Advanced")}>{t.advanced}</Chip>
        </FilterGroup>
      </div>

      <div className="text-xs text-zinc-500 mb-2">{t.results(results.length)}</div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((s) => (
          <SpeciesCard
            key={s.id}
            s={s}
            t={t}
            lang={lang}
            onOpen={() => setSelected(s)}   // คลิกการ์ด → เปิดโมดัล
          />
        ))}
      </div>

      {/* โมดัลแสดงรายละเอียด/รูปใหญ่ */}
      <AnimatePresence>
        {selected && (
          <SpeciesModal
            s={selected}
            t={t}
            lang={lang}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function SortSelect({ t, value, onChange }){
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-zinc-300 bg-white">
      <SlidersHorizontal className="w-4 h-4"/>
      <label className="text-sm text-zinc-600">{t.sortBy}</label>
      <select className="bg-transparent text-sm outline-none" value={value} onChange={(e)=>onChange(e.target.value)}>
        <option value="name">{t.name}</option>
        <option value="difficulty">{t.difficultyLabel}</option>
      </select>
    </div>
  );
}

function FilterGroup({ label, children }){
  return (
    <div className="p-3 rounded-2xl border border-zinc-200 bg-white">
      <div className="text-xs font-medium text-zinc-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, children, onClick }){
  return (
    <button onClick={onClick} className={cx("px-3 py-1.5 rounded-xl border text-sm", active ? "bg-emerald-600 text-white border-emerald-700" : "bg-white border-zinc-300 hover:bg-zinc-100")}>{children}</button>
  );
}

function Badge({ children }){
  return <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200">{children}</span>;
}

function SpeciesImage({ s }){
  const [ok, setOk] = useState(true);
  const url = s.img || makePhotoUrl(s);
  return (
    <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 relative">
      {ok && <img src={url} alt={`${s.commonName} (${s.scientificName})`} className="w-full h-full object-cover" onError={()=>setOk(false)} />}
      {!ok && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-100 text-zinc-600">
          <Bug className="w-8 h-8 mb-1"/>
          <div className="text-sm font-semibold">{initials(s.commonName)}</div>
        </div>
      )}
    </div>
  );
}

function SpeciesCard({ s, t, lang, onOpen }) {
  const [open, setOpen] = useState(false);
  const showAdvanced = s.difficulty === 'Advanced' || s.world === 'Old';

  const openModal = () => { if (onOpen) onOpen(); };

  return (
    <div
      onClick={openModal}
      onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openModal()}
      role="button"
      tabIndex={0}
      className="rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm transition cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <SpeciesImage s={s} />

      <div className="flex items-start justify-between gap-3 mt-3">
        <div className="min-w-0">
          <div className="font-semibold leading-tight line-clamp-2 break-words">
            {s.commonName} <span className="text-zinc-400">({s.scientificName})</span>
          </div>
          <div className="text-xs text-zinc-500 truncate">
            {localizeWorld(s.world, lang, t)} • {localizeHabitat(s.habitat, lang, t)} • {localizeDifficulty(s.difficulty, lang, t)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {s.recommended && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800">
              <CheckCircle2 className="w-3 h-3"/>{t.recommend}
            </span>
          )}
          {s.urticating ? <Badge>{t.urticating}: {t.yes}</Badge> : <Badge>{t.urticating}: {t.no}</Badge>}
          <Badge>{t.venom}: {s.venom}</Badge>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1 inline-flex items-center gap-1">
          <ShieldAlert className="w-3 h-3"/> {t.safety.advanced} {s.world==='Old' && `• ${t.safety.oldworld}`}
        </div>
      )}

      {/* ปุ่มย่อยต้องกันการเปิดโมดัลด้วย stopPropagation() */}
      <button
        onClick={(e)=>{ e.stopPropagation(); setOpen(v=>!v); }}
        className="mt-3 w-full text-left text-sm px-3 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 inline-flex items-center justify-between"
      >
        <span>{t.quickCare}</span>
        {open ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}} transition={{duration:0.2}}>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <InfoRow label={t.humidity} value={s.humidity} />
              <InfoRow label={t.temperature} value={s.temperature} />
              <InfoRow label={t.lifespan} value={s.lifespan} />
              <InfoRow label={t.growth} value={s.growth} />
              <InfoRow label={t.enclosure} value={s.enclosure} full />
            </div>
            <p className="mt-2 text-xs text-zinc-600">{s.notes}</p>
            <a
              href="#"
              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
              className="mt-2 inline-flex items-center text-xs text-emerald-700 hover:underline"
            >
              {t.readMore} <ChevronRight className="w-3 h-3"/>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function InfoRow({ label, value, full }){
  return (
    <div className={cx("p-2 rounded-xl border border-zinc-200 bg-zinc-50", full && "col-span-2")}> 
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// ------------------------
// Species Modal (lightbox)
// ------------------------
function SpeciesModal({ s, t, onClose, lang }) {
  if (!s) return null;

  // เลือกรูปจากฟังก์ชันที่มีอยู่ในโปรเจกต์
  const img = (getSpeciesImage?.(s)) || s.img || makePhotoUrl(s);

  return (
    <motion.div className="fixed inset-0 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      {/* คลิกพื้นหลังเพื่อปิด */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <motion.div
        className="absolute inset-0 p-4 md:p-8 flex items-start justify-center"
        initial={{ y: 20, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/85 border border-zinc-200 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="aspect-video bg-zinc-100">
            {img && <img src={img} alt={s.commonName} className="w-full h-full object-cover" />}
          </div>

          <div className="p-5">
            <div className="font-semibold text-lg leading-tight mb-1 break-words">
              {s.commonName} <span className="text-zinc-400 italic">({s.scientificName})</span>
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              {localizeWorld(s.world, lang, t)} • {localizeHabitat(s.habitat, lang, t)} • {localizeDifficulty(s.difficulty, lang, t)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoRow label={t.humidity} value={s.humidity} />
              <InfoRow label={t.temperature} value={s.temperature} />
              <InfoRow label={t.lifespan} value={s.lifespan} />
              <InfoRow label={t.growth} value={s.growth} />
              <InfoRow label={t.enclosure} value={s.enclosure} full />
            </div>

            <p className="mt-3 text-sm text-zinc-700 break-words">{s.notes}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ------------------------
// Care Guide (data + images)
// ------------------------
const CARE_SECTIONS = [
  {
    id: "setup",
    title: { th: "การจัดตู้เลี้ยง", en: "Enclosure Setup" },
    summary: {
      th: "รองพื้นกาบมะพร้าว/ดินปลอดปุ๋ย กดแน่น • กล่องเลือกตามพฤติกรรม: สายดินกว้างเตี้ย, สายต้นไม้ทรงสูง, สายขุดลึก • มีที่หลบและถ้วยน้ำ (ตั้งแต่วัย juvenile)",
      en: "Coco/ unfertilized soil packed firm • Box by behavior: terrestrial low & wide, arboreal tall, fossorial deep • Add a hide and a water dish (from juveniles)."
    },
    cover: "/home/setup.jpg",
    details: {
      th: [
        "รองพื้น: ขุยมะพร้าว/ดินพีทมอส กดแน่นให้ยืน/ขุดได้ เลี่ยงขี้เลื่อย กรวด และทรายแคลเซียม",
        "ความชื้นรองพื้น: สายดิน/สายขุด ชื้นเล็กน้อย; สายต้นไม้เน้นโปร่งแห้ง มีมุมชื้นเล็ก ๆ พอ",
        "ทรงกล่อง — สายดิน: กว้าง-เตี้ย พื้นเยอะ สูงไม่มาก ลดเสี่ยงตก",
        "ทรงกล่อง — สายต้นไม้: ทรงสูง ใส่คอร์กบาร์กตั้ง/เป็นท่อให้ปีนและพัก",
        "ทรงกล่อง — สายขุด: กะทัดรัดแต่ลึก ใส่วัสดุหนาและเริ่มรูให้เขาขุดต่อ",
        "ที่หลบ/จุดเกาะ: ไม้คอร์กหรือถ้ำซ่อนตัว 1 จุด สายใยเยอะแมงมุมจะไปหาจุดเกาะใยตามมุมต่างๆ",
        "ถ้วยน้ำ: วัย juvenile ขึ้นไปต้องมีตลอด; วัยเล็ก (slings) ใช้มุมชื้น/หยดน้ำเล็กๆ เป็นครั้งคราว (ไม่ใช้ฟองน้ำ/เจลน้ำ)",
        "การไหลเวียนอากาศ: ทำรูสองฝั่งคนละระดับ (รูต่ำ + รูสูง/ฝาบน) ให้ลมผ่าน อากาศไม่อับ",
        "วางถ้วยน้ำ: วางชิดผนังบนพื้นแน่น เพื่อลดการคว่ำ เติม-ล้างสม่ำเสมอ",
        "ความร้อน/ไฟ: อาศัยอุณหภูมิห้อง ~22–27°C."
      ],
      en: [
        "Substrate: coco fiber / unfertilized topsoil, packed firm so it can stand/burrow; avoid wood chips, gravel, calcium sand.",
        "Moisture: terrestrial/fossorial slightly moist; arboreal mostly dry with a small moist corner.",
        "Box shape — Terrestrial: low & wide, big floor space, limited height to reduce fall risk.",
        "Box shape — Arboreal: tall enclosure with a vertical/Tube cork bark to climb and rest.",
        "Box shape — Fossorial: compact footprint but deep substrate with a starter hole.",
        "Hide/anchors: a cork hide; for heavy webbers add more web anchor points.",
        "Water dish: required from juveniles upward; tiny slings use a moist corner or occasional small water drop (no sponge/gel).",
        "Airflow: holes on two sides at different heights (low intake + high/top exhaust) to keep air moving.",
        "Water dish placement: against a wall on firm substrate to prevent tipping; refresh regularly.",
        "Heat/light: rely on room temp ~22–27°C."
      ]
    }
  },    
  {
    id: "humidity-temp",
    title: { th: "ความชื้นและอุณหภูมิ", en: "Humidity & Temperature" },
    summary: {
      th: "ยึดช่วงของสายพันธุ์ ไม่ต้องไล่ตัวเลข: มีถ้วยน้ำ ลมไหลเวียน มุมชื้นเล็ก ๆ; อุณหภูมิโดยทั่วไป 22–27°C กลางคืนลดได้",
      en: "Follow species ranges—don’t chase numbers: water dish, gentle airflow, a small moist corner; typical 22–27°C with a night drop."
    },
    cover: "/home/humidity-temp.jpg",
    details: {
      th: [
        "อุณหภูมิทั่วไป: 22–27°C ได้ ลดตอนกลางคืนเล็กน้อย • เลี่ยงแดดตรง/ลมแอร์เป่าตรง",
        "ความชื้นพื้นฐาน: มีถ้วยน้ำเสมอ (ตั้งแต่วัย juvenile) • วัยเล็กให้ ‘มุมชื้น’ แทนถ้วย",
        "พื้นรอง: สายดิน/สายขุดชื้นเล็กน้อย • สายต้นไม้ส่วนใหญ่แห้งโปร่งแต่มีมุมชื้น",
        "ระบายอากาศ: ทำรูสองฝั่งคนละระดับ (รูต่ำเข้า • รูสูง/ฝาบนออก) โดยเฉพาะสายต้นไม้",
        "ปรับชื้นให้พอดี: ถ้าแห้งไป → รดน้ำมุมหนึ่ง/พ่นเบา ๆ ที่พื้น (ไม่พ่นโดนตัว) • ถ้าชื้นไป/มีไอน้ำทั่วกระจก → เปิดฝาเพิ่มรูให้ลมผ่าน",
        "สังเกตอาการ: แห้งไป = ผิวท้องย่น/พื้นร่วน • ชื้นไป = กลิ่นอับ/เชื้อรา/ผนังเปียกทั้งบาน",
        "อุปกรณ์วัด: ไฮโกรมิเตอร์/เทอร์โมมิเตอร์วางระดับพื้นหรือกลางตู้ • ใช้เป็นแนวทางและดูพฤติกรรมร่วม",
        "ช่วงลอกคราบ/หลังลอก: เพิ่มความชื้นเล็กน้อย 2–3 วัน แต่ยังต้องมีอากาศถ่ายเทดี",
        "หลีกเลี่ยง: ฟองน้ำ/เจลน้ำ เครื่องทำหมอกต่อเนื่อง และการพ่นจนชุ่มทั้งตู้"
      ],
      en: [
        "Typical temp: 22–27°C with a small night drop • Avoid direct sun and AC drafts.",
        "Baseline humidity: always provide a water dish (from juveniles) • tiny slings get a small ‘moist corner’.",
        "Substrate: terrestrial/fossorial slightly moist • arboreal mostly dry with one moist spot.",
        "Airflow: two sides at different heights (low intake + high/top exhaust), crucial for arboreals.",
        "Tuning humidity: too dry → water one corner/lightly mist the substrate (never on the spider) • too wet/condensation everywhere → open the lid/add vents for airflow.",
        "Watch signals: too dry = wrinkly abdomen/crumbly substrate • too wet = musty smell/mold/constant condensation.",
        "Meters: place thermo–hygrometer near the floor or mid-height; use numbers as guidance plus behavior.",
        "Molt/after molt: slightly higher humidity for 2–3 days with good ventilation.",
        "Avoid: sponges/water gels, continuous foggers, and soaking the whole enclosure."
      ]
    }
  },
  {
    id: "feeding",
    title: { th: "การให้อาหาร", en: "Feeding" },
    summary: {
      th: "กฎง่าย ๆ: เหยื่อพอดีตัว • วัยเล็ก 2–3×/สัปดาห์ • วัยกลาง ~1×/สัปดาห์ • วัยโต ทุก 1–3 สัปดาห์ • เก็บเศษใน 24 ชม. และงดรอบลอกคราบ",
      en: "Basics: right-size prey • Slings 2–3×/week • Juveniles ~1×/week • Adults every 1–3 weeks • Clear leftovers in 24h; skip around molts."
    },
    cover: "/home/feeding.jpg",
    details: {
      th: [
        "เลือกชนิดเหยื่อ: จิ้งหรีด/แมลงสาบ (dubia/lateralis) เป็นหลัก; หนอนนก/ซูเปอร์หนอน เสริมเป็นครั้งคราว",
        "ขนาดเหยื่อ: วัยเล็ก ≈ ½ ความกว้างกระดอง/ท้อง • วัยกลาง–โต ≤ ความกว้างกระดอง (เล็กดีกว่าใหญ่ไป)",
        "วัยเล็ก (slings): 2–3 ครั้ง/สัปดาห์ • เหยื่อชิ้น/ทำให้ตายก่อน เช่น หนอนนกตัด, ลูกแมลงสาบเรดรันเล็ก, แมลงหวี่ • วางใกล้ทางเข้าที่หลบ",
        "วัยกลาง (juveniles): ประมาณ 1 ครั้ง/สัปดาห์ • จิ้งหรีด/แมลงสาบเรดรันขนาดเล็ก–กลาง 1–2 ตัว • ใช้ชิ้นเหยื่อได้ถ้ากลัว",
        "วัยกึ่งโต/โต (sub-adult/adult): ทุก 1–3 สัปดาห์ • จิ้งหรีดกลางหรือแมลงสาบดูเบีย dubia/lateralis ที่พอดีตัว 1 ตัว; หนอนเป็นของว่างนานๆ ครั้ง",
        "ควรทำ: ให้อาหารช่วงค่ำ ใกล้ที่หลบ วางทีละชิ้น • หนอนกัดเก่งให้บีบหัวก่อน • เลี้ยงแมลงเหยื่อให้สะอาด (gut-load) ก่อนป้อน",
        "ไม่ควรทำ: ไม่ปล่อยเหยื่อหลายตัวพร้อมกัน • ไม่ใช้แมลงจับจากธรรมชาติ/เสี่ยงสารเคมี • ไม่โรยแคลเซียม/วิตามิน",
        "ช่วงลอกคราบ: งดให้อาหารก่อน/ระหว่าง/หลังลอก จนกว่าเขี้ยวกลับเป็นสีดำ (วัยเล็ก ~5–7 วัน, วัยโต ~7–14+ วัน)",
        "ความสะอาด: เก็บซาก/เหยื่อที่ไม่กินภายใน 24 ชม. เพื่อลดไรและเชื้อรา",
        "เช็กด้วยสายตา: ท้องแฟบ → ให้อาหารได้; ท้องกลมหรือแน่น → เว้นระยะให้นานขึ้นหรือลดขนาดเหยื่อ"
      ],
      en: [
        "Feeder types: crickets/roaches (dubia/lateralis) as staples; (super)worms only occasionally.",
        "Prey size: slings ≈ ½ carapace/abdomen width • juv/adults ≤ carapace width (smaller is safer than larger).",
        "Slings: 2–3×/week • pre-killed pieces (cut mealworm, tiny roach nymph, fruit flies) placed near the hide.",
        "Juveniles: ~1×/week • 1–2 small–medium crickets/roach nymphs; pre-killed is fine if skittish.",
        "Sub-adult/Adult: every 1–3 weeks • one medium cricket or suitably sized roach nymph; worms as occasional treats.",
        "Do: feed at dusk, near the hide, one item at a time • crush worm heads • gut-load feeders.",
        "Avoid: releasing many feeders at once • wild-caught insects/pesticides • calcium/vitamin dusting.",
        "Molts: no feeding pre/during/post-molt; resume when fangs turn black (slings ~5–7d, adults ~7–14+d).",
        "Hygiene: remove leftovers within 24h to prevent mites/mold.",
        "Visual check: flat abdomen → OK to feed; very round/tight → lengthen interval or downsize prey."
      ]
    }
  },
  {
    id: "rehousing",
    title: { th: "การย้ายตู้ & ดูแลประจำ", en: "Rehousing & Routine Care" },
    summary: {
      th: "ย้ายตู้เมื่อเริ่มคับแคบ จัดตู้ใหม่ให้พร้อมก่อนย้าย ใช้แก้วครอบ+การ์ด ไม่จับด้วยมือ ทำงานเงียบและต่ำจากพื้น หลังย้ายพัก 24–48 ชม.",
      en: "Rehouse when cramped; set up the new tank first; use catch-cup + card, no hand handling; work low and calm; rest 24–48h after."
    },
    cover: "/home/rehousing.jpg",
    details: {
      th: [
        "เมื่อไหร่ต้องย้ายตู้: ตัวเริ่มใหญ่จนเดินแล้วอึดอัด/ชนฝา สายดิน—ช่องว่างจากดินถึงฝาดูสูงเกินไปเสี่ยงตก สายต้นไม้—ปีนแล้วแตะฝาบ่อยหรือไม่มีคอร์กแนวตั้งให้เกาะ หรือวางที่หลบ+ถ้วยน้ำไม่พอ/ทำความสะอาดลำบาก",
        "เตรียมตู้ใหม่ให้เสร็จก่อน: วัสดุรองพื้น/ที่หลบ/ถ้วยน้ำ ฝาแน่น ทดสอบตัวล็อก",
        "อุปกรณ์ที่ต้องมี: แก้วใส (catch cup) + การ์ดแข็ง + แปรงปลายอ่อน + กล่องสำรองใบใหญ่เผื่อวิ่ง",
        "ช่วงเวลาที่เหมาะ: ช่วงค่ำและเงียบ ลดแสง/การสั่นสะเทือน เอาเหยื่อออกจากตู้เก่า",
        "วิธีพื้นฐาน: ค่อย ๆ ครอบแก้วจากด้านหน้า/บน แล้วสอดการ์ดใต้ฐาน ยกย้ายทั้งแก้วไปวางในตู้ใหม่ เปิดให้เดินออกเอง",
        "ทริก: ทำงานใกล้พื้นหรือเหนือพื้นนุ่ม ลดความสูงตก • สายต้นไม้ใช้ท่อคอร์กเป็น ‘บ้านพกพา’ เคาะลงตู้ใหม่ได้",
        "หลังย้าย: ปิดฝาให้เงียบ 24–48 ชม. เติมน้ำไว้ พร้อมแต่ยังไม่ให้อาหาร 2–3 วัน",
        "การทำความสะอาด: เก็บเศษ/ซากทุกครั้ง ล้างถ้วยน้ำสัปดาห์ละ 1–2 ครั้ง เปลี่ยนวัสดุทั้งตู้เมื่อมีเชื้อรา/กลิ่นอับ/ไรระบาดเท่านั้น",
        "เก็บของเดิม: ย้ายใย/โพรงที่เขาชอบบางส่วนไปตู้ใหม่ ลดความเครียด",
        "ความปลอดภัย: ไม่จับด้วยมือ เตรียมกล่องครอบเผื่อวิ่ง ตรวจช่องหนีและฝาแน่นก่อนจบงาน"
      ],
      en: [
        "When to rehouse: the spider looks cramped or keeps touching the lid terrestrials—the gap from soil to lid is tall enough to make a fall risky arboreals—often reach the lid or lack a vertical cork to perch or there isn’t comfortable space for a hide and a water dish.",
        "Prep first: fully set up the new enclosure—substrate, hide, water; secure lid and test latches.",
        "Tools: clear catch cup + stiff card + soft brush + a large backup tub (in case of a bolt).",
        "Timing: dusk/quiet hours; reduce light/vibration; remove any feeders from the old tank.",
        "Method: lower the cup from front/top, slide the card underneath, move the cupped spider into the new tank and let it walk out.",
        "Tips: work low over a soft area; for arboreals use a cork tube as a portable hide.",
        "Aftercare: keep dark/quiet for 24–48h; water available; no feeding for 2–3 days.",
        "Cleaning: spot-clean leftovers; wash the water dish weekly; full teardown only for mold/odor/mites.",
        "Keep familiar items: transfer a piece of web/burrow to reduce stress.",
        "Safety: no hand handling; have a bigger bin ready; double-check escape gaps and the lid."
      ]
    }
  },
  {
    id: "gear",
    title: { th: "อุปกรณ์สำคัญ", en: "Essential Tools" },
    summary: {
      th: "มีเครื่องมือให้ครบ งานเลี้ยงปลอดภัย ง่าย และสะอาด",
      en: "Right tools make keeping safer, easier, and cleaner."
    },
    cover: "/home/gear.jpg",
    details: {
      th: [
        "ฟอเซป/แหนบยาว 20–30 ซม. (ปลายแบนหรือปลายโค้ง): คีบเหยื่อ/เก็บซาก โดยให้มืออยู่นอกตู้",
        "แปรงขนนุ่ม (#2–4): เขี่ยนำทางเวลาย้าย ห้ามจิ้มแรง และไม่ใช้แปรงแข็ง",
        "ถ้วยครอบ (catch cup) + การ์ดแข็ง/ฝาพลาสติก: ใช้ครอบย้าย/กันหลุด ควรมีรูระบายอากาศ",
        "ขวดบีบน้ำ (น้ำกลั่น/RO): หยดเติมถ้วยน้ำหรือเพิ่มความชื้นเฉพาะจุด ไม่เทราดทั้งตู้",
        "ฟอกกี้หัวพ่นละเอียด: พรมน้ำเบา ๆ (โดยเฉพาะสายต้นไม้/วัยเล็ก) หลบตัวสัตว์และอย่าให้แฉะ",
        "ถ้วยน้ำขอบเตี้ย: เซรามิก/แก้วเล็ก ทำความสะอาดและเปลี่ยนน้ำสม่ำเสมอ",
        "คีม/แหนบเล็กหรือปิ๊บหยิบขยะ + กระดาษทิชชู่: เก็บเศษอาหาร/ใยเก่า รักษาความสะอาด",
        "เทอร์โมมิเตอร์ดิจิทัล: เช็คช่วงความชื้น/อุณหภูมิให้ตรงสายพันธุ์",
        "ไฟฉาย/ไฟแดง: ส่องดูตอนกลางคืนโดยรบกวนน้อย",
        "ชุดพื้นฐานความปลอดภัย: เทปกาว (แปะดึงขนป้องกันตัวออกจากผิว), น้ำเกลือล้างตา, ถุงมือไนไตร",
        "ทิปส์: อย่าคีบตัวแมงมุมโดยตรง—ใช้ถ้วย/แปรงนำทาง • ล้างอุปกรณ์หลังใช้ • ขวดน้ำห้ามใส่น้ำหอม/น้ำยาฆ่าเชื้อ"
      ],
      en: [
        "Long tweezers 20–30 cm (flat or curved tip): for offering feeders and removing leftovers while keeping hands outside.",
        "Soft paintbrush (#2–4): gentle nudging when moving; never poke or use stiff brushes.",
        "Catch cup + stiff card/lid: for transfers and escapes; punch small air holes in the lid.",
        "Squeeze bottle (distilled/RO water): top up the water dish or spot-moisten—do not pour over the whole enclosure.",
        "Fine-mist sprayer: light misting (esp. arboreals/slings); avoid soaking the spider or substrate.",
        "Low-rim water dish: ceramic/glass; clean and refresh water regularly.",
        "Small trash tweezers + paper towels: for spot-cleaning old prey/webbing.",
        "thermometer: monitor humidity/temperature within species range.",
        "Flashlight/red light: nighttime checks with minimal disturbance.",
        "Basic safety kit: tape (to lift urticating hairs from skin), sterile saline for eye rinse, nitrile gloves.",
        "Tips: never grab the tarantula with tools—guide with a cup/brush • clean tools after use • no fragrances/disinfectants in water."
      ]
    }
  }
];

function ModalCover({ src, alt, focus = "center", tall = false, expandable = true }) {
  const [expanded, setExpanded] = React.useState(false);

  const pos =
    focus === "top" ? "object-[50%_25%]" :
    focus === "bottom" ? "object-[50%_75%]" :
    focus === "left" ? "object-left" :
    focus === "right" ? "object-right" :
    "object-center";

  const baseH = tall
    ? "h-[clamp(280px,55vh,600px)] md:h-[clamp(340px,60vh,680px)]"
    : "h-[clamp(240px,48vh,480px)] md:h-[clamp(280px,52vh,560px)]";
  const hClass = expanded ? "h-[clamp(340px,68vh,820px)]" : baseH;

  return (
    <div className="relative bg-zinc-100">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block w-full ${hClass} object-cover ${pos}`}
      />
      {expandable && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="absolute right-3 bottom-3 rounded-lg px-2 py-1 text-[11px] bg-black/55 text-white hover:bg-black/70"
        >
          {expanded ? "ย่อรูป" : "ขยายรูป"}
        </button>
      )}
    </div>
  );
}

// ------------------------
// Care Guide
// ------------------------
function CareGuide({ t, lang }) {
  const [openItem, setOpenItem] = useState(null);
  const key = lang === "th" ? "th" : "en";

  return (
    <>
      {/* กริดการ์ด */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARE_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setOpenItem(sec)}
            className="group text-left overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-md transition focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={sec.cover}
                alt={sec.title[key]}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 p-3 text-white text-xs">
                กดเพื่ออ่านรายละเอียด
              </div>
            </div>

            <div className="p-4">
              <div className="font-semibold mb-1">{sec.title[key]}</div>
              <p className="text-sm text-zinc-600 line-clamp-2">{sec.summary[key]}</p>
            </div>
          </button>
        ))}
      </div>

      {/* โมดัลรายละเอียด */}
      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* พื้นหลังปิดโมดัล */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpenItem(null)} />

            {/* เปลี่ยน items-center -> items-start และทำให้คอนเทนต์สกรอลได้ */}
            <motion.div
              className="absolute inset-0 p-4 md:p-8 flex items-start justify-center"
              initial={{ y: 20, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-zinc-200 shadow-xl">
                {/* <<< ชั้นสกรอลภายใน >>> */}
                <div className="max-h-[92vh] overflow-y-auto rounded-3xl">
                  <button
                    onClick={() => setOpenItem(null)}
                    className="absolute right-3 top-3 z-10 p-2 rounded-xl bg-white/85 border border-zinc-200 hover:bg-zinc-100"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* รูป cover (เวอร์ชันเต็ม+ขยายได้) */}
                  <ModalCover
                    src={openItem.cover}
                    alt={openItem.title[key]}
                    focus="top"   // ปรับเป็น top/bottom/left/right/center ได้
                    tall          // ให้สูงขึ้นเล็กน้อย
                  />

                  {/* เนื้อหาเดิม */}
                  <div className="p-5 md:p-6">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      {openItem.title[key]}
                    </h3>
                    <p className="text-zinc-700 mb-4">{openItem.summary[key]}</p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-800">
                      {openItem.details[key].map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                    <div className="mt-6">
                      <button
                        onClick={() => setOpenItem(null)}
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-300"
                      >
                        {lang === "th" ? "ปิด" : "Close"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ------------------------
// Knowledge (i18n)
// ------------------------
const resolveKnowledgeImg = (item) =>
  (KNOWLEDGE_IMAGES && item?.id && KNOWLEDGE_IMAGES[item.id]) || item?.img || null;

function Knowledge({ t }) {
  // โชว์เฉพาะความรู้ทั่วไป (ไม่เอา item ที่ไว้ใช้กับ Troubleshoot)
  const items = (t.knowledge || [])
    .filter(it => it?.type !== "troubleshoot")
    .map((it, i) => ({
      id: it.id || `k-${i}`,
      img: resolveKnowledgeImg(it),
      fit: it.fit || "contain", // อินโฟกราฟิกส่วนใหญ่ให้ contain ตอนขยาย
      ...it,
    }));

  const [open, setOpen] = React.useState(null);
  const collapsedMaxH = "max-h-40"; // ~6–7 บรรทัดกับ text-sm + leading-relaxed

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((it, idx) => {
        const expanded = open === idx;
        const fitClassExpanded = it.fit === "cover" ? "object-cover" : "object-contain";

        return (
          <motion.div
            key={it.id}
            layout
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cx(
              "rounded-2xl border border-zinc-200 bg-white overflow-hidden",
              expanded && "md:col-span-2"
            )}
          >
            {/* รูปภาพ */}
            <button
              onClick={() => setOpen(expanded ? null : idx)}
              className="block w-full text-left"
            >
              <div
                className={
                  expanded
                    ? "w-full bg-zinc-50 flex items-center justify-center p-2"
                    : "aspect-[16/9] w-full overflow-hidden bg-zinc-100"
                }
              >
                {it.img ? (
                  <img
                    src={it.img}
                    alt={it.q}
                    className={
                      expanded
                        ? `max-h-[70vh] w-auto ${fitClassExpanded}`
                        : "w-full h-full object-cover"
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                    (no image)
                  </div>
                )}
              </div>
            </button>

            {/* เนื้อหา */}
            <div className="p-4">
              <div className="font-semibold mb-1">{it.q}</div>

              {/* โหมดสั้น/ยาว */}
              <div className="relative">
                <div
                  className={cx(
                    "text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed",
                    !expanded && `${collapsedMaxH} overflow-hidden pr-1`
                  )}
                >
                  {it.a}
                </div>
                {!expanded && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>

              {/* ปุ่มเปิด/ย่อ */}
              <div className="mt-2">
                <button
                  onClick={() => setOpen(expanded ? null : idx)}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  {expanded
                    ? (t.language === "English" ? "ย่อกลับ" : "Collapse")
                    : (t.language === "English" ? "อ่านต่อ" : "Read more")}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


// ------------------------
// AI Consultation (Gemini-connected)
// ------------------------
// ------------------------
// AI Consultation (Gemini-connected, fixed 400)
// ------------------------
function AIConsult({ t }) {
  const STORAGE_KEY = "tc_ai_messages_v1";
  const [messages, setMessages] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr)) return arr;
    } catch {}
    return [{ role: "system", text: t.aiHint }];
  });
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-200)));
    } catch {}
  }, [messages]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const formatHint =
      "คุยแต่เกี่ยวกับเรื่องทารันทูล่า ตอบสั้นๆไม่ยาวเน้นให้จบบทสนทนาไว";
    const finalPrompt = `${formatHint}\n\n${prompt}`;

    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "ยังไม่พบ VITE_GEMINI_API_KEY ใน Environment" },
      ]);
      setLoading(false);
      return;
    }

    // ✅ ใช้โมเดลล่าสุด และเพิ่ม role:"user"
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
      apiKey;

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: finalPrompt }],
            },
          ],
        }),
      });

      const data = await r.json();
      console.log("Gemini raw:", data);

      // ถ้ามี error จาก API ให้โชว์ข้อความชัด ๆ
      if (data?.error?.message) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `Error: ${data.error.message}` },
        ]);
      } else {
        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((p) => p?.text || "")
            .join("\n")
            .trim() || "(no reply)";
        setMessages((m) => [...m, { role: "assistant", text }]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "(error) " + (e?.message || String(e)) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center gap-2">
        <Bot className="w-4 h-4" />
        <div className="font-semibold">{t.nav.ai}</div>
        <button
          onClick={() => setMessages([{ role: "system", text: t.aiHint }])}
          className="ml-auto text-xs px-2 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-100"
        >
          {t.language === "English" ? "ล้างแชท" : "Clear"}
        </button>
      </div>

      <div className="h-[380px] p-4 overflow-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cx(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-800"
            )}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-zinc-500">กำลังพิมพ์…</div>}
      </div>

      <div className="p-3 border-t border-zinc-200 flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 resize-none"
          placeholder={t.startChat}
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ------------------------
// i18n helpers (display only)
// ------------------------
function localizeWorld(world, lang, t) {
  if (lang === "th") return world === "New" ? t.newWorld : t.oldWorld;
  // en
  return world === "New" ? "New World" : "Old World";
}

function localizeHabitat(habitat, lang, t) {
  const key = String(habitat || "").trim().toLowerCase();
  if (lang === "th") {
    if (key === "arboreal") return "สายต้นไม้";
    if (key === "terrestrial") return "สายดิน";
    if (key === "fossorial") return "สายขุด";
  }
  // en (อิงข้อความจาก LANG.en)
  if (key === "arboreal") return t.arboreal;
  if (key === "terrestrial") return t.terrestrial;
  if (key === "fossorial") return t.fossorial;
  // ไม่รู้จัก คืนค่าดิบ
  return habitat ?? "";
}

function localizeDifficulty(diff, lang, t) {
  if (lang !== "th") return diff || "";
  if (diff === "Beginner") return t.beginner;
  if (diff === "Intermediate") return t.intermediate;
  if (diff === "Advanced") return t.advanced;
  return diff || "";
}



function SpeciesSpotlight({ t, lang, beginnerMode = false, go, setFilters }) {
  const [s, setS] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  // เลือก species ให้เหมาะ (ถ้า beginnerMode จะงด Advanced/Old)
  const pool = React.useMemo(() => {
    let list = SPECIES;
    if (beginnerMode) list = list.filter(x => x.difficulty !== "Advanced" && x.world !== "Old");
    return list;
  }, [beginnerMode]);

  const pick = React.useCallback(() => {
    if (!pool.length) return null;
    const rec = pool.filter(x => x.recommended);
    if (rec.length && Math.random() < 0.6) return rec[Math.floor(Math.random() * rec.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [pool]);

  React.useEffect(() => { setS(pick()); }, [pick]);

  const reroll = () => setS(pick());
  const openSpeciesPage = () => {
    if (!s) return;
    if (setFilters) setFilters(prev => ({ ...prev, q: s.commonName })); // ค้นหาตรงชื่อ
    if (go) go("species");
  };

  if (!s) return null;

  return (
    <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Species Spotlight</div>
        <button
          onClick={reroll}
          className="text-xs px-2 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3"/>{lang==='th' ? 'สุ่มใหม่' : 'Shuffle'}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-emerald-100 bg-white">
        <SpeciesImage s={s} />
        <div className="p-3">
          <div className="font-semibold leading-tight">{s.commonName}</div>
          <div className="text-[11px] text-zinc-500 italic">{s.scientificName}</div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{s.world === "New" ? t.newWorld : t.oldWorld}</Badge>
            <Badge>{localizeHabitat(s.habitat, lang, t)}</Badge>
            <Badge>{s.difficulty}</Badge>
            {s.recommended && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-3 h-3"/>{t.recommend}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-3">
            <InfoRow label={t.humidity} value={s.humidity} />
            <InfoRow label={t.temperature} value={s.temperature} />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
            >
              {lang==='th' ? 'ดูรายละเอียด' : 'Details'}
            </button>
            <button
              onClick={openSpeciesPage}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 text-sm hover:bg-emerald-100"
            >
              {lang==='th' ? 'เปิดในหน้าสายพันธุ์' : 'Open species page'}
            </button>
          </div>
        </div>
      </div>

      {/* ใช้โมดัลเดิมของหน้า species ได้เลย */}
      <AnimatePresence>
        {open && <SpeciesModal s={s} t={t} lang={lang} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

