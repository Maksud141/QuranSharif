/* =========================================================
   QURAN SHARIF — DAILY CONTENT
   =========================================================
   📖 আজকের আয়াত
   📜 আজকের হাদিস
   🤲 আজকের দোয়া

   নিয়ম:
   - ২৪ ঘণ্টা একই Content থাকবে
   - নতুন ২৪ ঘণ্টায় নতুন Random Content
   - Offline-এ LocalStorage থেকে আগের Content পাওয়া যাবে

   HADITH JSON SUPPORT:
   ar          = Arabic
   bn          = Bengali
   hadith_id   = Hadith ID
   narrator    = Narrator
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const DAILY_CONTENT_STORAGE_KEY =
    "quranSharif_dailyContent";

const DAILY_CONTENT_VERSION = 2;


/* =========================================================
   QURAN
========================================================= */

const DAILY_QURAN_BASE_PATH =
    "data/quran/";


/* =========================================================
   HADITH
========================================================= */

const DAILY_HADITH_PATHS = {

    bukhari:
        "data/hadith/bukhari/",

    muslim:
        "data/hadith/muslim/",

    tirmidhi:
        "data/hadith/tirmidhi/"

};


/* =========================================================
   HADITH BOOK NAMES
========================================================= */

const DAILY_HADITH_BOOK_NAMES = {

    bukhari:
        "সহীহ বুখারী",

    muslim:
        "সহীহ মুসলিম",

    tirmidhi:
        "জামে আত-তিরমিযী"

};


/* =========================================================
   STATE
========================================================= */

let dailyContentLoading = false;

let dailyContentData = null;


/* =========================================================
   HELPER
========================================================= */

function dailyRandomIndex(length) {

    if (!length || length <= 0) {
        return 0;
    }

    return Math.floor(
        Math.random() * length
    );

}


/* =========================================================
   TODAY KEY
   =========================================================
   একই দিনের জন্য একই Content রাখার জন্য
========================================================= */

function getDailyDateKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   LOAD SAVED DAILY CONTENT
========================================================= */

function getSavedDailyContent() {

    try {

        const saved =
            localStorage.getItem(
                DAILY_CONTENT_STORAGE_KEY
            );

        if (!saved) {
            return null;
        }

        const data =
            JSON.parse(saved);

        if (!data) {
            return null;
        }

        /*
           Version check
        */

        if (
            data.version !==
            DAILY_CONTENT_VERSION
        ) {
            return null;
        }

        /*
           Date check
        */

        if (
            data.dateKey !==
            getDailyDateKey()
        ) {
            return null;
        }

        /*
           Required content check
        */

        if (
            !data.ayah ||
            !data.hadith ||
            !data.dua
        ) {
            return null;
        }

        return data;

    } catch (error) {

        console.error(
            "Daily content read error:",
            error
        );

        return null;

    }

}


/* =========================================================
   SAVE DAILY CONTENT
========================================================= */

function saveDailyContent(data) {

    try {

        localStorage.setItem(
            DAILY_CONTENT_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Daily content save error:",
            error
        );

        return false;

    }

}


/* =========================================================
   FETCH JSON
========================================================= */

async function dailyFetchJSON(url) {

    const response =
        await fetch(url, {
            cache: "no-cache"
        });

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}: ${url}`
        );

    }

    return await response.json();

}


/* =========================================================
   QURAN SURAH FILE
========================================================= */

async function loadDailyQuranSurah(
    surahNumber
) {

    const fileName =
        String(
            surahNumber
        ).padStart(3, "0");

    const url =
        `${DAILY_QURAN_BASE_PATH}${fileName}.json`;

    return await dailyFetchJSON(url);

}


/* =========================================================
   EXTRACT ARRAY
   বিভিন্ন JSON structure support করার জন্য
========================================================= */

function extractArray(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }


    if (
        data &&
        Array.isArray(data.ayahs)
    ) {
        return data.ayahs;
    }


    if (
        data &&
        Array.isArray(data.verses)
    ) {
        return data.verses;
    }


    if (
        data &&
        Array.isArray(data.items)
    ) {
        return data.items;
    }


    return [];

}


/* =========================================================
   QURAN FIELD HELPER
========================================================= */

function getFirstValue(
    object,
    keys
) {

    if (!object) {
        return "";
    }


    for (
        const key of keys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            String(object[key]).trim() !== ""
        ) {

            return String(
                object[key]
            ).trim();

        }

    }


    return "";

}


/* =========================================================
   FIND QURAN AYAH
========================================================= */

function normalizeDailyAyah(
    item,
    surahNumber
) {

    if (!item) {
        return null;
    }


    const ayahNumber =
        Number(
            getFirstValue(
                item,
                [
                    "ayah",
                    "ayahNumber",
                    "numberInSurah",
                    "verse",
                    "id"
                ]
            )
        );


    const arabic =
        getFirstValue(
            item,
            [
                "arabic",
                "text",
                "textArabic",
                "uthmani",
                "arabicText"
            ]
        );


    const bengali =
        getFirstValue(
            item,
            [
                "bengali",
                "bangla",
                "translation",
                "textBangla",
                "translationBn",
                "bn"
            ]
        );


    if (!arabic && !bengali) {
        return null;
    }


    return {

        surah:
            Number(surahNumber),

        ayah:
            ayahNumber || 1,

        arabic:
            arabic ||
            "",

        bengali:
            bengali ||
            ""

    };

}


/* =========================================================
   LOAD RANDOM QURAN AYAH
========================================================= */

async function getRandomDailyAyah() {

    /*
       সর্বোচ্চ ১০টি random চেষ্টা।
       কোনো JSON structure আলাদা হলে
       পরের surah চেষ্টা করবে।
    */

    for (
        let attempt = 0;
        attempt < 10;
        attempt++
    ) {

        const surahNumber =
            1 +
            dailyRandomIndex(114);


        try {

            const data =
                await loadDailyQuranSurah(
                    surahNumber
                );


            const ayahs =
                extractArray(data);


            if (!ayahs.length) {
                continue;
            }


            /*
               প্রথমে random ayah
            */

            const randomIndex =
                dailyRandomIndex(
                    ayahs.length
                );


            const ayah =
                normalizeDailyAyah(
                    ayahs[randomIndex],
                    surahNumber
                );


            if (ayah) {

                return ayah;

            }

        } catch (error) {

            console.warn(
                "Quran load failed:",
                surahNumber,
                error
            );

        }

    }


    /*
       সব fail হলে fallback
    */

    return {

        surah: 94,

        ayah: 6,

        arabic:
            "إِنَّ مَعَ الْعُسْرِ يُسْرًا",

        bengali:
            "নিশ্চয়ই কষ্টের সাথে স্বস্তি রয়েছে।"

    };

}


/* =========================================================
   SURAH NAME
========================================================= */

const DAILY_SURAH_NAMES = [

    "আল-ফাতিহা",
    "আল-বাকারা",
    "আলে ইমরান",
    "আন-নিসা",
    "আল-মায়িদা",
    "আল-আনআম",
    "আল-আরাফ",
    "আল-আনফাল",
    "আত-তাওবা",
    "ইউনুস",
    "হুদ",
    "ইউসুফ",
    "আর-রাদ",
    "ইবরাহিম",
    "আল-হিজর",
    "আন-নাহল",
    "আল-ইসরা",
    "আল-কাহফ",
    "মারইয়াম",
    "ত্ব-হা",
    "আল-আম্বিয়া",
    "আল-হাজ্জ",
    "আল-মুমিনুন",
    "আন-নূর",
    "আল-ফুরকান",
    "আশ-শুআরা",
    "আন-নামল",
    "আল-কাসাস",
    "আল-আনকাবুত",
    "আর-রূম",
    "লুকমান",
    "আস-সাজদাহ",
    "আল-আহযাব",
    "সাবা",
    "ফাতির",
    "ইয়াসিন",
    "আস-সাফফাত",
    "সাদ",
    "আয-যুমার",
    "গাফির",
    "ফুসসিলাত",
    "আশ-শূরা",
    "আয-যুখরুফ",
    "আদ-দুখান",
    "আল-জাসিয়াহ",
    "আল-আহকাফ",
    "মুহাম্মাদ",
    "আল-ফাতহ",
    "আল-হুজুরাত",
    "কাফ",
    "আয-যারিয়াত",
    "আত-তূর",
    "আন-নাজম",
    "আল-কামার",
    "আর-রহমান",
    "আল-ওয়াকিয়া",
    "আল-হাদিদ",
    "আল-মুজাদিলাহ",
    "আল-হাশর",
    "আল-মুমতাহিনা",
    "আস-সাফ",
    "আল-জুমুআ",
    "আল-মুনাফিকুন",
    "আত-তাগাবুন",
    "আত-তালাক",
    "আত-তাহরিম",
    "আল-মুলক",
    "আল-কলম",
    "আল-হাক্কাহ",
    "আল-মাআরিজ",
    "নূহ",
    "আল-জিন",
    "আল-মুজ্জাম্মিল",
    "আল-মুদ্দাসসির",
    "আল-কিয়ামাহ",
    "আল-ইনসান",
    "আল-মুরসালাত",
    "আন-নাবা",
    "আন-নাজিয়াত",
    "আবাসা",
    "আত-তাকভীর",
    "আল-ইনফিতার",
    "আল-মুতাফফিফিন",
    "আল-ইনশিকাক",
    "আল-বুরূজ",
    "আত-তারিক",
    "আল-আলা",
    "আল-গাশিয়াহ",
    "আল-ফজর",
    "আল-বালাদ",
    "আশ-শামস",
    "আল-লাইল",
    "আদ-দুহা",
    "আশ-শারহ",
    "আত-তিন",
    "আল-আলাক",
    "আল-কদর",
    "আল-বাইয়্যিনাহ",
    "আয-যিলযাল",
    "আল-আদিয়াত",
    "আল-কারিয়াহ",
    "আত-তাকাসুর",
    "আল-আসর",
    "আল-হুমাযাহ",
    "আল-ফীল",
    "কুরাইশ",
    "আল-মাউন",
    "আল-কাওসার",
    "আল-কাফিরুন",
    "আন-নাসর",
    "আল-মাসাদ",
    "আল-ইখলাস",
    "আল-ফালাক",
    "আন-নাস"

];


/* =========================================================
   QURAN REFERENCE
========================================================= */

function getDailyQuranReference(
    ayah
) {

    const surahNumber =
        Number(ayah.surah);

    const ayahNumber =
        Number(ayah.ayah);

    const surahName =
        DAILY_SURAH_NAMES[
            surahNumber - 1
        ] ||
        `সূরা ${surahNumber}`;

    return `— সূরা ${surahName} (${surahNumber}:${ayahNumber})`;

}


/* =========================================================
   HADITH OBJECT CHECK
   =========================================================
   IMPORTANT:

   আপনার আসল Hadith JSON:

   {
       "hadith_id": 176,
       "narrator": "...",
       "bn": "...",
       "ar": "...",
       "grade_id": 2,
       "grade": "সহিহ হাদিস"
   }

   তাই ar + bn অবশ্যই এখানে support করতে হবে।
========================================================= */

function isHadithLikeObject(
    item
) {

    if (
        !item ||
        typeof item !== "object"
    ) {
        return false;
    }


    return Boolean(

        /* =========================
           Arabic
        ========================= */

        item.ar ||
        item.arabic ||
        item.arab ||
        item.arabicText ||
        item.hadithArabic ||


        /* =========================
           Bengali
        ========================= */

        item.bn ||
        item.bengali ||
        item.bangla ||
        item.translation ||
        item.translationBn ||
        item.hadith ||
        item.text ||
        item.hadithText ||


        /* =========================
           Hadith ID
        ========================= */

        item.hadith_id ||
        item.hadith_number ||
        item.hadithNumber

    );

}


/* =========================================================
   NORMALIZE HADITH
========================================================= */

function normalizeDailyHadith(
    item,
    bookName
) {

    if (
        !isHadithLikeObject(item)
    ) {
        return null;
    }


    /*
       Arabic

       আপনার JSON:
       ar
    */

    const arabic =
        getFirstValue(
            item,
            [

                "ar",

                "arabic",

                "arab",

                "arabicText",

                "hadithArabic"

            ]
        );


    /*
       Bengali

       আপনার JSON:
       bn
    */

    const bengali =
        getFirstValue(
            item,
            [

                "bn",

                "bengali",

                "bangla",

                "translation",

                "translationBn",

                "hadith",

                "text",

                "hadithText"

            ]
        );


    /*
       Hadith Number

       আপনার JSON:
       hadith_id
    */

    const hadithNumber =
        getFirstValue(
            item,
            [

                "hadith_id",

                "hadith_number",

                "hadithNumber",

                "number",

                "id",

                "hadith_no"

            ]
        );


    /*
       Narrator
    */

    const narrator =
        getFirstValue(
            item,
            [

                "narrator",

                "rawi",

                "raawi"

            ]
        );


    /*
       Grade
    */

    const grade =
        getFirstValue(
            item,
            [

                "grade",

                "status",

                "authenticity"

            ]
        );


    /*
       Chapter number

       আপনার কিছু JSON-এ:

       "chapter": {
           "chapter_number": "1"
       }
    */

    let chapterNumber = "";


    if (
        item.chapter &&
        typeof item.chapter === "object"
    ) {

        chapterNumber =
            getFirstValue(
                item.chapter,
                [

                    "chapter_number",

                    "number",

                    "id"

                ]
            );

    }


    if (!chapterNumber) {

        chapterNumber =
            getFirstValue(
                item,
                [

                    "chapter_number",

                    "chapterNumber",

                    "chapter_no"

                ]
            );

    }


    /*
       কিছুই না থাকলে বাতিল
    */

    if (
        !arabic &&
        !bengali
    ) {

        return null;

    }


    return {

        book:
            bookName || "",

        number:
            hadithNumber || "",

        narrator:
            narrator || "",

        grade:
            grade || "",

        chapter:
            chapterNumber || "",

        arabic:
            arabic || "",

        bengali:
            bengali || ""

    };

}


/* =========================================================
   RECURSIVE HADITH EXTRACTION
========================================================= */

function collectHadithObjects(
    data,
    result = []
) {

    if (!data) {
        return result;
    }


    /*
       Array
    */

    if (
        Array.isArray(data)
    ) {

        data.forEach(
            item => {

                if (
                    isHadithLikeObject(
                        item
                    )
                ) {

                    result.push(
                        item
                    );

                } else {

                    collectHadithObjects(
                        item,
                        result
                    );

                }

            }
        );


        return result;

    }


    /*
       Object
    */

    if (
        typeof data === "object"
    ) {

        /*
           নিজেই Hadith object হলে
        */

        if (
            isHadithLikeObject(data)
        ) {

            result.push(
                data
            );

        }


        /*
           ভিতরের object/array
           recursively search
        */

        Object.keys(data)
            .forEach(
                key => {

                    const value =
                        data[key];


                    if (
                        !value ||
                        typeof value !== "object"
                    ) {
                        return;
                    }


                    /*
                       metadata বাদ
                    */

                    if (
                        key === "meta" ||
                        key === "metadata"
                    ) {

                        return;

                    }


                    collectHadithObjects(
                        value,
                        result
                    );

                }
            );

    }


    return result;

}


/* =========================================================
   REMOVE DUPLICATE HADITH
========================================================= */

function removeDuplicateDailyHadith(
    items
) {

    const seen =
        new Set();

    const result = [];


    for (
        const item of items
    ) {

        const key = [

            item.book || "",

            item.number || "",

            item.arabic || "",

            item.bengali || ""

        ].join("|");


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(key);

        result.push(
            item
        );

    }


    return result;

}


/* =========================================================
   FIND HADITH FILE
========================================================= */

async function tryDailyHadithFile(
    bookKey,
    fileName
) {

    const basePath =
        DAILY_HADITH_PATHS[
            bookKey
        ];


    if (!basePath) {
        return [];
    }


    /*
       প্রথমে root file
       তারপর Chapter file
    */

    const possiblePaths = [

        `${basePath}${fileName}`,

        `${basePath}${fileName}.json`,

        `${basePath}Chapter/${fileName}`,

        `${basePath}Chapter/${fileName}.json`

    ];


    for (
        const path of possiblePaths
    ) {

        try {

            const data =
                await dailyFetchJSON(
                    path
                );


            const items =
                collectHadithObjects(
                    data
                );


            if (
                items.length
            ) {

                return items;

            }

        } catch (error) {

            /*
               File না থাকলে
               পরের path চেষ্টা করবে
            */

        }

    }


    return [];

}


/* =========================================================
   LOAD HADITH FROM CHAPTER FILES
========================================================= */

async function loadDailyHadithFromChapters(
    bookKey,
    bookName
) {

    const allItems = [];


    /*
       আপনার Hadith reader-এর
       Chapter structure অনুযায়ী।

       প্রথম ৫০টি Chapter চেষ্টা করা হচ্ছে।

       File না থাকলে silently skip করবে।
    */

    for (
        let chapterNumber = 1;
        chapterNumber <= 50;
        chapterNumber++
    ) {

        const fileName =
            `${chapterNumber}.json`;


        try {

            const data =
                await dailyFetchJSON(

                    `${DAILY_HADITH_PATHS[bookKey]}` +
                    `Chapter/${fileName}`

                );


            const items =
                collectHadithObjects(
                    data
                );


            for (
                const item of items
            ) {

                const normalized =
                    normalizeDailyHadith(
                        item,
                        bookName
                    );


                if (
                    normalized
                ) {

                    allItems.push(
                        normalized
                    );

                }

            }

        } catch (error) {

            /*
               Chapter না থাকলে
               error দেখানোর প্রয়োজন নেই।
            */

        }

    }


    return removeDuplicateDailyHadith(
        allItems
    );

}


/* =========================================================
   LOAD HADITH FROM COMMON FILES
========================================================= */

async function loadDailyHadithFromCommonFiles(
    bookKey,
    bookName
) {

    const fileNames = [

        "1.json",

        "2.json",

        "3.json",

        "01.json",

        "001.json",

        "hadith.json",

        "data.json"

    ];


    const allItems = [];


    for (
        const fileName of fileNames
    ) {

        const items =
            await tryDailyHadithFile(
                bookKey,
                fileName
            );


        for (
            const item of items
        ) {

            const normalized =
                normalizeDailyHadith(
                    item,
                    bookName
                );


            if (
                normalized
            ) {

                allItems.push(
                    normalized
                );

            }

        }

    }


    return removeDuplicateDailyHadith(
        allItems
    );

}


/* =========================================================
   GET RANDOM DAILY HADITH
========================================================= */

async function getRandomDailyHadith() {

    const books = [

        {
            key:
                "bukhari",

            name:
                DAILY_HADITH_BOOK_NAMES.bukhari

        },

        {
            key:
                "muslim",

            name:
                DAILY_HADITH_BOOK_NAMES.muslim

        },

        {
            key:
                "tirmidhi",

            name:
                DAILY_HADITH_BOOK_NAMES.tirmidhi

        }

    ];


    /*
       Book order random
    */

    const shuffledBooks =
        [...books].sort(
            () =>
                Math.random() - 0.5
        );


    /*
       ================================================
       প্রথমে Chapter structure
       ================================================
    */

    for (
        const book of shuffledBooks
    ) {

        try {

            const chapterItems =
                await loadDailyHadithFromChapters(
                    book.key,
                    book.name
                );


            if (
                chapterItems.length
            ) {

                const selected =
                    chapterItems[
                        dailyRandomIndex(
                            chapterItems.length
                        )
                    ];


                console.log(
                    "📜 Daily Hadith loaded from Chapter:",
                    selected
                );


                return selected;

            }

        } catch (error) {

            console.warn(
                "Chapter Hadith load failed:",
                book.key,
                error
            );

        }

    }


    /*
       ================================================
       Chapter না পেলে common files
       ================================================
    */

    for (
        const book of shuffledBooks
    ) {

        try {

            const commonItems =
                await loadDailyHadithFromCommonFiles(
                    book.key,
                    book.name
                );


            if (
                commonItems.length
            ) {

                const selected =
                    commonItems[
                        dailyRandomIndex(
                            commonItems.length
                        )
                    ];


                console.log(
                    "📜 Daily Hadith loaded:",
                    selected
                );


                return selected;

            }

        } catch (error) {

            console.warn(
                "Common Hadith load failed:",
                book.key,
                error
            );

        }

    }


    /*
       ================================================
       FINAL FALLBACK
       ================================================
    */

    return {

        book:
            "সহীহ বুখারী",

        number:
            "",

        narrator:
            "",

        grade:
            "",

        chapter:
            "",

        arabic:
            "",

        bengali:
            "নিশ্চয়ই কাজসমূহ নিয়তের উপর নির্ভরশীল।"

    };

}


/* =========================================================
   DUA
========================================================= */

async function getRandomDailyDua() {

    /*
       আপনার বর্তমান Dua system-এর
       cached list ব্যবহার করার চেষ্টা।
    */

    try {

        if (
            typeof getDuaCache ===
            "function"
        ) {

            const cached =
                await getDuaCache();


            if (
                Array.isArray(cached) &&
                cached.length
            ) {

                const item =
                    cached[
                        dailyRandomIndex(
                            cached.length
                        )
                    ];


                return normalizeDailyDua(
                    item
                );

            }

        }

    } catch (error) {

        console.warn(
            "Dua cache read failed:",
            error
        );

    }


    /*
       IndexedDB helper থাকলে
       ব্যবহার করার জায়গা।
    */

    try {

        if (
            typeof duaDBGet ===
            "function"
        ) {

            /*
               আপনার dua.js-এর
               existing DB system-এর সাথে
               conflict না করার জন্য
               এখানে সরাসরি key assume করা হচ্ছে না।
            */

        }

    } catch (error) {

        console.warn(
            "Dua IndexedDB read failed:",
            error
        );

    }


    /*
       API থেকে random dua
    */

    try {

        const url =
            "https://dua-api.hisnul.workers.dev/api/duas/random";


        const response =
            await fetch(url);


        if (
            response.ok
        ) {

            const result =
                await response.json();


            const item =
                result.data ||
                result.dua ||
                result;


            const dua =
                normalizeDailyDua(
                    item
                );


            if (
                dua
            ) {

                return dua;

            }

        }

    } catch (error) {

        console.warn(
            "Random Dua API failed:",
            error
        );

    }


    /*
       Fallback
    */

    return {

        id:
            null,

        title:
            "দোয়া",

        arabic:
            "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",

        bengali:
            "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দান করুন এবং আখিরাতেও কল্যাণ দান করুন।",

        reference:
            ""

    };

}


/* =========================================================
   NORMALIZE DUA
========================================================= */

function normalizeDailyDua(
    item
) {

    if (!item) {
        return null;
    }


    /*
       API Dua Detail
    */

    if (
        Array.isArray(
            item.segments
        ) &&
        item.segments.length
    ) {

        const segment =
            item.segments[0];


        return {

            id:
                item.dua_global_id ||
                item.id ||
                null,

            title:
                item.duaname ||
                "দোয়া",

            arabic:
                segment.arabic ||
                segment.arabic_diacless ||
                "",

            bengali:
                segment.translations ||
                "",

            reference:
                ""

        };

    }


    return {

        id:
            item.dua_global_id ||
            item.id ||
            null,

        title:
            item.duaname ||
            item.title ||
            item.name ||
            "দোয়া",

        arabic:
            item.arabic ||
            item.arabicText ||
            "",

        bengali:
            item.translations ||
            item.translation ||
            item.bengali ||
            item.bangla ||
            "",

        reference:
            ""

    };

}


/* =========================================================
   RENDER AYAH
========================================================= */

function renderDailyAyah(
    ayah
) {

    const arabic =
        document.getElementById(
            "dailyAyahArabic"
        );


    const bengali =
        document.getElementById(
            "dailyAyahBengali"
        );


    const reference =
        document.getElementById(
            "dailyAyahReference"
        );


    if (arabic) {

        arabic.textContent =
            ayah.arabic ||
            "—";

    }


    if (bengali) {

        bengali.textContent =
            ayah.bengali ||
            "অনুবাদ পাওয়া যায়নি।";

    }


    if (reference) {

        reference.textContent =
            getDailyQuranReference(
                ayah
            );

    }

}


/* =========================================================
   RENDER HADITH
========================================================= */

function renderDailyHadith(
    hadith
) {

    const arabic =
        document.getElementById(
            "dailyHadithArabic"
        );


    const bengali =
        document.getElementById(
            "dailyHadithBengali"
        );


    const reference =
        document.getElementById(
            "dailyHadithReference"
        );


    /*
       ================================================
       Arabic
       ================================================
    */

    if (arabic) {

        if (
            hadith &&
            hadith.arabic &&
            String(
                hadith.arabic
            ).trim()
        ) {

            arabic.textContent =
                hadith.arabic;

            arabic.style.display =
                "block";

            arabic.dir =
                "rtl";

            arabic.lang =
                "ar";

        } else {

            arabic.textContent =
                "";

            arabic.style.display =
                "none";

        }

    }


    /*
       ================================================
       Bengali
       ================================================
    */

    if (bengali) {

        bengali.textContent =
            (
                hadith &&
                hadith.bengali
            ) ||
            "হাদিসের বাংলা অনুবাদ পাওয়া যায়নি।";

    }


    /*
       ================================================
       Reference
       ================================================
    */

    if (reference) {

        const parts = [];


        if (
            hadith &&
            hadith.book
        ) {

            parts.push(
                hadith.book
            );

        }


        if (
            hadith &&
            hadith.number
        ) {

            parts.push(
                `হাদিস ${hadith.number}`
            );

        }


        reference.textContent =
            parts.length
                ? `— ${parts.join(" • ")}`
                : "";

    }

}


/* =========================================================
   RENDER DUA
========================================================= */

function renderDailyDua(
    dua
) {

    const arabic =
        document.getElementById(
            "dailyDuaArabic"
        );


    const bengali =
        document.getElementById(
            "dailyDuaBengali"
        );


    const reference =
        document.getElementById(
            "dailyDuaReference"
        );


    if (arabic) {

        arabic.textContent =
            dua.arabic ||
            "—";

    }


    if (bengali) {

        bengali.textContent =
            dua.bengali ||
            "দোয়ার বাংলা অর্থ পাওয়া যায়নি।";

    }


    if (reference) {

        reference.textContent =
            "";

    }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderDailyContent(
    data
) {

    if (!data) {
        return;
    }


    if (
        data.ayah
    ) {

        renderDailyAyah(
            data.ayah
        );

    }


    if (
        data.hadith
    ) {

        renderDailyHadith(
            data.hadith
        );

    }


    if (
        data.dua
    ) {

        renderDailyDua(
            data.dua
        );

    }

}


/* =========================================================
   GENERATE NEW DAILY CONTENT
========================================================= */

async function generateDailyContent() {

    if (
        dailyContentLoading
    ) {

        return;

    }


    dailyContentLoading =
        true;


    try {

        console.log(
            "📖 Daily content তৈরি হচ্ছে..."
        );


        /*
           তিনটি আলাদা Random content
        */

        const ayah =
            await getRandomDailyAyah();


        const hadith =
            await getRandomDailyHadith();


        const dua =
            await getRandomDailyDua();


        const data = {

            version:
                DAILY_CONTENT_VERSION,

            dateKey:
                getDailyDateKey(),

            createdAt:
                Date.now(),

            ayah:
                ayah,

            hadith:
                hadith,

            dua:
                dua

        };


        /*
           Save
        */

        saveDailyContent(
            data
        );


        dailyContentData =
            data;


        /*
           Render
        */

        renderDailyContent(
            data
        );


        console.log(
            "✅ Daily content তৈরি হয়েছে:",
            data
        );


        return data;

    } catch (error) {

        console.error(
            "❌ Daily content error:",
            error
        );

    } finally {

        dailyContentLoading =
            false;

    }

}


/* =========================================================
   LOAD DAILY CONTENT
========================================================= */

async function loadDailyContent() {

    /*
       আগে LocalStorage
    */

    const saved =
        getSavedDailyContent();


    if (saved) {

        dailyContentData =
            saved;


        renderDailyContent(
            saved
        );


        console.log(
            "✅ আজকের Daily Content cache থেকে লোড হয়েছে"
        );


        return saved;

    }


    /*
       নতুন Content
    */

    return await generateDailyContent();

}


/* =========================================================
   FORCE NEW CONTENT
   DEBUG / TEST-এর জন্য
========================================================= */

function resetDailyContent() {

    try {

        localStorage.removeItem(
            DAILY_CONTENT_STORAGE_KEY
        );

    } catch (error) {

        console.error(
            error
        );

    }


    dailyContentData =
        null;


    loadDailyContent();

}


/* =========================================================
   NEXT DAY CHECK
========================================================= */

function checkDailyContentDate() {

    if (
        !dailyContentData
    ) {

        return;

    }


    const currentDate =
        getDailyDateKey();


    if (
        dailyContentData.dateKey !==
        currentDate
    ) {

        console.log(
            "🔄 নতুন দিন — নতুন Daily Content"
        );


        loadDailyContent();

    }

}


/* =========================================================
   MIDNIGHT CHECK
========================================================= */

setInterval(
    checkDailyContentDate,
    60 * 1000
);


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadDailyContent();

    }
);


/* =========================================================
   INITIAL LOAD
   যদি DOMContentLoaded ইতিমধ্যে হয়ে যায়
========================================================= */

if (
    document.readyState ===
    "interactive" ||
    document.readyState ===
    "complete"
) {

    loadDailyContent();

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.loadDailyContent =
    loadDailyContent;

window.resetDailyContent =
    resetDailyContent;

window.getSavedDailyContent =
    getSavedDailyContent;

window.generateDailyContent =
    generateDailyContent;


/* =========================================================
   END
========================================================= */