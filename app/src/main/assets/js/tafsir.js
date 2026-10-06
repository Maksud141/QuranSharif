/* =====================================================
   QURAN SHARIF
   TAFSIR PAGE SYSTEM
   =====================================================

   Supported Tafsir:

   1. তাফসীরুল কুরআন
      data/tafsir/abu-bakr-zakaria/001.json
      ...
      114.json

   2. তাফসীরে ইবনে কাসীর
      data/tafsir/ibn_kathir/001.json
      ...
      114.json

   3. তাফসীর ফাতহুল মাজীদ
      data/fathul_majid/001.json
      ...
      114.json

   4. তাফসীর আহসানুল বয়ান
      data/ahsanul_bayaan/001.json
      ...
      114.json

   Supported JSON structures:

   {
       "1": {
           "text": "..."
       }
   }

   অথবা:

   {
       "1:1": {
           "text": "..."
       }
   }

===================================================== */


/* =====================================================
   TAFSIR SOURCES
===================================================== */

const TAFSIR_SOURCES = {

    "abu-bakr-zakaria": {

        name:
            "তাফসীরুল কুরআন",

        folder:
            "data/tafsir/abu-bakr-zakaria"

    },


    "ibn-kathir": {

        name:
            "তাফসীরে ইবনে কাসীর",

        folder:
            "data/tafsir/ibn_kathir"

    },


    "fathul_majid": {

        name:
            "তাফসীর ফাতহুল মাজীদ",

        folder:
            "data/tafsir/fathul_majid"

    },


    "ahsanul_bayaan": {

        name:
            "তাফসীর আহসানুল বয়ান",

        folder:
            "data/tafsir/ahsanul_bayaan"

    }

};


/* =====================================================
   CACHE
===================================================== */

const tafsirCache = {};


/* =====================================================
   QURAN CACHE
===================================================== */

const tafsirQuranCache = {};


/* =====================================================
   CURRENT STATE
===================================================== */

let currentTafsirSurah = 1;

let currentTafsirAyah = 1;

let currentTafsirSource =
    "abu-bakr-zakaria";


/* =====================================================
   SURAH NAMES
===================================================== */

const tafsirSurahNames = [

    "আল-ফাতিহা",
    "আল-বাকারা",
    "আলে-ইমরান",
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
    "ইয়াসীন",
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
    "আল-ওয়াকিয়াহ",
    "আল-হাদীদ",
    "আল-মুজাদালাহ",
    "আল-হাশর",
    "আল-মুমতাহিনাহ",
    "আস-সাফ",
    "আল-জুমুআহ",
    "আল-মুনাফিকুন",
    "আত-তাগাবুন",
    "আত-তালাক",
    "আত-তাহরীম",
    "আল-মুলক",
    "আল-কলম",
    "আল-হাক্কাহ",
    "আল-মাআরিজ",
    "নূহ",
    "আল-জিন",
    "আল-মুযযাম্মিল",
    "আল-মুদ্দাসসির",
    "আল-কিয়ামাহ",
    "আল-ইনসান",
    "আল-মুরসালাত",
    "আন-নাবা",
    "আন-নাযিআত",
    "আবাসা",
    "আত-তাকভীর",
    "আল-ইনফিতার",
    "আল-মুতাফফিফীন",
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
    "আশ-শরহ",
    "আত-তীন",
    "আল-আলাক",
    "আল-কদর",
    "আল-বাইয়্যিনাহ",
    "আয-যিলযাল",
    "আল-আদিয়াত",
    "আল-কারিআহ",
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


/* =====================================================
   TOTAL AYAH COUNT
===================================================== */

const tafsirAyahCounts = [

    7,
    286,
    200,
    176,
    120,
    165,
    206,
    75,
    129,
    109,
    123,
    111,
    43,
    52,
    99,
    128,
    111,
    110,
    98,
    135,
    112,
    78,
    118,
    64,
    77,
    227,
    93,
    88,
    69,
    60,
    34,
    30,
    73,
    54,
    45,
    83,
    182,
    88,
    75,
    85,
    54,
    53,
    89,
    59,
    37,
    35,
    38,
    29,
    18,
    45,
    60,
    49,
    62,
    55,
    78,
    96,
    29,
    22,
    24,
    13,
    14,
    11,
    11,
    18,
    12,
    12,
    30,
    52,
    52,
    44,
    28,
    28,
    20,
    56,
    40,
    31,
    50,
    40,
    46,
    42,
    29,
    19,
    36,
    25,
    22,
    17,
    19,
    26,
    30,
    20,
    15,
    21,
    11,
    8,
    8,
    19,
    5,
    8,
    8,
    11,
    11,
    8,
    3,
    9,
    5,
    4,
    7,
    3,
    6,
    3,
    5,
    4,
    5,
    6

];


/* =====================================================
   BANGLA NUMBER
===================================================== */

function toBanglaNumber(number) {

    const banglaDigits =
        "০১২৩৪৫৬৭৮৯";

    return String(number).replace(
        /\d/g,
        function(digit) {

            return banglaDigits[
                Number(digit)
            ];

        }
    );

}


/* =====================================================
   NORMALIZE SOURCE
===================================================== */

function normalizeTafsirSource(
    source
) {

    if (
        source === "ibn_kathir"
    ) {

        return "ibn-kathir";

    }


    return source;

}


/* =====================================================
   GET CURRENT SOURCE
===================================================== */

function getCurrentTafsirSource() {

    let source =
        normalizeTafsirSource(
            currentTafsirSource
        );


    if (
        !TAFSIR_SOURCES[source]
    ) {

        source =
            "abu-bakr-zakaria";

    }


    return source;

}


/* =====================================================
   GET SOURCE INFO
===================================================== */

function getTafsirSourceInfo() {

    const source =
        getCurrentTafsirSource();


    return TAFSIR_SOURCES[
        source
    ];

}


/* =====================================================
   GET FILE NAME
===================================================== */

function getTafsirFileName(
    surahNumber
) {

    return String(
        surahNumber
    ).padStart(
        3,
        "0"
    ) + ".json";

}


/* =====================================================
   GET CACHE KEY
===================================================== */

function getTafsirCacheKey(
    source,
    surahNumber
) {

    return (
        source +
        "_" +
        surahNumber
    );

}


/* =====================================================
   LOAD TAFSIR SURAH
===================================================== */

async function loadTafsirSurah(
    surahNumber,
    source
) {

    const surah =
        Number(surahNumber);


    let selectedSource =
        normalizeTafsirSource(
            source ||
            getCurrentTafsirSource()
        );


    if (
        !TAFSIR_SOURCES[
            selectedSource
        ]
    ) {

        selectedSource =
            "abu-bakr-zakaria";

    }


    if (
        !surah ||
        surah < 1 ||
        surah > 114
    ) {

        throw new Error(
            "ভুল সূরা নম্বর"
        );

    }


    const cacheKey =
        getTafsirCacheKey(
            selectedSource,
            surah
        );


    if (
        Object.prototype.hasOwnProperty.call(
            tafsirCache,
            cacheKey
        )
    ) {

        return tafsirCache[
            cacheKey
        ];

    }


    const sourceInfo =
        TAFSIR_SOURCES[
            selectedSource
        ];


    const fileName =
        getTafsirFileName(
            surah
        );


    const url =
        sourceInfo.folder +
        "/" +
        fileName;


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            sourceInfo.name +
            " ফাইল পাওয়া যায়নি: " +
            url
        );

    }


    const data =
        await response.json();


    tafsirCache[
        cacheKey
    ] = data;


    return data;

}


/* =====================================================
   FIND TEXT FROM OBJECT
===================================================== */

function getTafsirTextFromItem(
    item
) {

    if (
        item === null ||
        item === undefined
    ) {

        return "";

    }


    if (
        typeof item === "string"
    ) {

        return item;

    }


    if (
        typeof item !== "object"
    ) {

        return "";

    }


    return (
        item.text ||
        item.tafsir ||
        item.tafsirText ||
        item.content ||
        item.description ||
        item.explanation ||
        item.html ||
        ""
    );

}


/* =====================================================
   FIND TAFSIR AYAH
===================================================== */

function findTafsirAyah(
    tafsirData,
    surahNumber,
    ayahNumber,
    source
) {

    if (
        !tafsirData
    ) {

        return null;

    }


    const surah =
        Number(surahNumber);


    const ayah =
        Number(ayahNumber);


    const ayahKey =
        String(ayah);


    const fullKey =
        surah +
        ":" +
        ayah;


    /*
     * =========================================
     * ARRAY STRUCTURE
     * =========================================
     */

    if (
        Array.isArray(
            tafsirData
        )
    ) {

        const found =
            tafsirData.find(
                function(item) {

                    if (!item) {

                        return false;

                    }


                    const itemAyah =
                        Number(
                            item.ayah ||
                            item.numberInSurah ||
                            item.verse ||
                            item.ayahNumber ||
                            item.number
                        );


                    const itemKey =
                        String(
                            item.key ||
                            item.id ||
                            ""
                        );


                    return (
                        itemAyah === ayah ||
                        itemKey === fullKey ||
                        itemKey === ayahKey
                    );

                }
            );


        return found ||
            null;

    }


    /*
     * =========================================
     * DIRECT KEY: 1
     * =========================================
     */

    if (
        Object.prototype.hasOwnProperty.call(
            tafsirData,
            ayahKey
        )
    ) {

        return tafsirData[
            ayahKey
        ];

    }


    /*
     * =========================================
     * DIRECT KEY: 1:1
     * =========================================
     */

    if (
        Object.prototype.hasOwnProperty.call(
            tafsirData,
            fullKey
        )
    ) {

        return tafsirData[
            fullKey
        ];

    }


    /*
     * =========================================
     * data OBJECT
     * =========================================
     */

    if (
        tafsirData.data
    ) {

        const result =
            findTafsirAyah(
                tafsirData.data,
                surah,
                ayah,
                source
            );


        if (result) {

            return result;

        }

    }


    /*
     * =========================================
     * ayahs ARRAY
     * =========================================
     */

    if (
        Array.isArray(
            tafsirData.ayahs
        )
    ) {

        const result =
            findTafsirAyah(
                tafsirData.ayahs,
                surah,
                ayah,
                source
            );


        if (result) {

            return result;

        }

    }


    /*
     * =========================================
     * verses ARRAY
     * =========================================
     */

    if (
        Array.isArray(
            tafsirData.verses
        )
    ) {

        const result =
            findTafsirAyah(
                tafsirData.verses,
                surah,
                ayah,
                source
            );


        if (result) {

            return result;

        }

    }


    /*
     * =========================================
     * items ARRAY
     * =========================================
     */

    if (
        Array.isArray(
            tafsirData.items
        )
    ) {

        const result =
            findTafsirAyah(
                tafsirData.items,
                surah,
                ayah,
                source
            );


        if (result) {

            return result;

        }

    }


    return null;

}


/* =====================================================
   LOAD QURAN AYAH DATA
===================================================== */

async function loadTafsirAyahQuranData(
    surahNumber,
    ayahNumber
) {

    const surah =
        Number(surahNumber);


    const ayah =
        Number(ayahNumber);


    if (
        tafsirQuranCache[
            surah
        ]
    ) {

        return findQuranAyah(
            tafsirQuranCache[
                surah
            ],
            ayah
        );

    }


    const fileName =
        String(
            surah
        ).padStart(
            3,
            "0"
        ) +
        ".json";


    const response =
        await fetch(
            "data/quran/" +
            fileName
        );


    if (!response.ok) {

        throw new Error(
            "কুরআন ফাইল পাওয়া যায়নি: " +
            fileName
        );

    }


    const data =
        await response.json();


    tafsirQuranCache[
        surah
    ] = data;


    return findQuranAyah(
        data,
        ayah
    );

}


/* =====================================================
   FIND QURAN AYAH
===================================================== */

function findQuranAyah(
    data,
    ayahNumber
) {

    const ayah =
        Number(ayahNumber);


    /*
     * Array
     */

    if (
        Array.isArray(data)
    ) {

        return (
            data.find(
                function(item) {

                    return Number(
                        item.ayah ||
                        item.numberInSurah ||
                        item.verse ||
                        item.number
                    ) === ayah;

                }
            ) ||
            null
        );

    }


    /*
     * data.ayahs
     */

    if (
        data &&
        Array.isArray(
            data.ayahs
        )
    ) {

        return (
            data.ayahs.find(
                function(item) {

                    return Number(
                        item.ayah ||
                        item.numberInSurah ||
                        item.verse ||
                        item.number
                    ) === ayah;

                }
            ) ||
            null
        );

    }


    /*
     * data.data.ayahs
     */

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.ayahs
        )
    ) {

        return (
            data.data.ayahs.find(
                function(item) {

                    return Number(
                        item.ayah ||
                        item.numberInSurah ||
                        item.verse ||
                        item.number
                    ) === ayah;

                }
            ) ||
            null
        );

    }


    /*
     * Object key:
     * "1"
     * "2"
     * "3"
     */

    if (
        data &&
        data[
            String(ayah)
        ]
    ) {

        return data[
            String(ayah)
        ];

    }


    return null;

}


/* =====================================================
   GET ARABIC
===================================================== */

function getArabicFromAyah(
    ayahData
) {

    if (
        !ayahData
    ) {

        return "";

    }


    return (
        ayahData.arabic ||
        ayahData.arabicText ||
        ayahData.textArabic ||
        ayahData.uthmani ||
        ayahData.text ||
        ayahData.ayah ||
        ""
    );

}


/* =====================================================
   GET BENGALI TRANSLATION
===================================================== */

function getBengaliFromAyah(
    ayahData
) {

    if (
        !ayahData
    ) {

        return "";

    }


    return (
        ayahData.bengali ||
        ayahData.bengaliText ||
        ayahData.translation ||
        ayahData.translation_bn ||
        ayahData.bangla ||
        ayahData.banglaText ||
        ayahData.trans ||
        ayahData.meaning ||
        ""
    );

}


/* =====================================================
   OPEN TAFSIR
===================================================== */

async function openTafsir(
    surahNumber,
    ayahNumber
) {

    const surah =
        Number(surahNumber);


    const ayah =
        Number(ayahNumber);


    if (
        !surah ||
        !ayah
    ) {

        return;

    }


    currentTafsirSurah =
        surah;


    currentTafsirAyah =
        ayah;


    /*
     * Quran থেকে Tafsir খুললে
     * default source হবে
     * তাফসীরুল কুরআন।
     */

    currentTafsirSource =
        "abu-bakr-zakaria";


    /*
     * পুরোনো popup থাকলে বন্ধ
     */

    if (
        typeof closeTafsir ===
        "function"
    ) {

        try {

            closeTafsir();

        } catch (error) {

            console.log(
                "পুরোনো Tafsir popup বন্ধ করা যায়নি"
            );

        }

    }


    /*
     * Tafsir Page
     */

    if (
        typeof showPage ===
        "function"
    ) {

        showPage(
            "tafsirPage"
        );

    }


    await renderTafsirPage();

}


/* =====================================================
   RENDER TAFSIR PAGE
===================================================== */

async function renderTafsirPage() {

    updateTafsirHeader();

    buildTafsirAyahNavigation();

    updateTafsirSourceTabs();

    showTafsirPageLoading();


    try {

        const selectedSource =
            getCurrentTafsirSource();


        /*
         * Quran + selected Tafsir
         * একসাথে load
         */

        const results =
            await Promise.all([

                loadTafsirSurah(
                    currentTafsirSurah,
                    selectedSource
                ),

                loadTafsirAyahQuranData(
                    currentTafsirSurah,
                    currentTafsirAyah
                )

            ]);


        const tafsirData =
            results[0];


        const ayahData =
            results[1];


        /*
         * Quran card
         */

        updateTafsirAyahCard(
            ayahData
        );


        /*
         * সঠিক আয়াতের Tafsir
         */

        const ayahTafsir =
            findTafsirAyah(
                tafsirData,
                currentTafsirSurah,
                currentTafsirAyah,
                selectedSource
            );


        /*
         * Tafsir text বের করা
         */

        const tafsirText =
            getTafsirTextFromItem(
                ayahTafsir
            );


        /*
         * Tafsir পাওয়া যায়নি
         */

        if (
            !tafsirText
        ) {

            showTafsirPageError(
                "এই আয়াতের তাফসির পাওয়া যায়নি।"
            );

            return;

        }


        /*
         * Tafsir content
         */

        showTafsirPageContent(
            tafsirText
        );


    } catch (error) {

        console.error(
            "Tafsir page loading error:",
            error
        );


        showTafsirPageError(
            "তাফসির লোড করা যায়নি।\n\n" +
            "কারণ: " +
            (
                error.message ||
                error
            )
        );

    }

}


/* =====================================================
   UPDATE HEADER
===================================================== */

function updateTafsirHeader() {

    const title =
        document.getElementById(
            "tafsirSurahTitle"
        );


    if (!title) {

        return;

    }


    const name =
        tafsirSurahNames[
            currentTafsirSurah - 1
        ] ||
        "সূরা " +
        currentTafsirSurah;


    title.textContent =
        name;

}


/* =====================================================
   BUILD AYAH NAVIGATION
===================================================== */

function buildTafsirAyahNavigation() {

    const container =
        document.getElementById(
            "tafsirAyahScroll"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const totalAyahs =
        tafsirAyahCounts[
            currentTafsirSurah - 1
        ] ||
        0;


    const start =
        Math.max(
            1,
            currentTafsirAyah - 3
        );


    const end =
        Math.min(
            totalAyahs,
            currentTafsirAyah + 3
        );


    /*
     * Previous
     */

    const previousButton =
        document.createElement(
            "button"
        );


    previousButton.type =
        "button";


    previousButton.className =
        "tafsir-ayah-nav-arrow";


    previousButton.textContent =
        "←";


    previousButton.disabled =
        currentTafsirAyah <= 1;


    previousButton.addEventListener(
        "click",
        function() {

            changeTafsirAyah(
                currentTafsirAyah - 1
            );

        }
    );


    container.appendChild(
        previousButton
    );


    /*
     * Ayah buttons
     */

    for (
        let ayah = start;
        ayah <= end;
        ayah++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "tafsir-ayah-number";


        if (
            ayah ===
            currentTafsirAyah
        ) {

            button.classList.add(
                "active"
            );

        }


        button.dataset.ayah =
            String(ayah);


        button.textContent =
            "আয়াত " +
            toBanglaNumber(
                ayah
            );


        button.addEventListener(
            "click",
            function() {

                changeTafsirAyah(
                    ayah
                );

            }
        );


        container.appendChild(
            button
        );

    }


    /*
     * Next
     */

    const nextButton =
        document.createElement(
            "button"
        );


    nextButton.type =
        "button";


    nextButton.className =
        "tafsir-ayah-nav-arrow";


    nextButton.textContent =
        "→";


    nextButton.disabled =
        currentTafsirAyah >=
        totalAyahs;


    nextButton.addEventListener(
        "click",
        function() {

            changeTafsirAyah(
                currentTafsirAyah + 1
            );

        }
    );


    container.appendChild(
        nextButton
    );


    /*
     * Current ayah center
     */

    setTimeout(
        function() {

            const active =
                container.querySelector(
                    ".tafsir-ayah-number.active"
                );


            if (active) {

                active.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "nearest",

                    inline:
                        "center"

                });

            }

        },
        50
    );

}


/* =====================================================
   CHANGE AYAH
===================================================== */

async function changeTafsirAyah(
    ayahNumber
) {

    const totalAyahs =
        tafsirAyahCounts[
            currentTafsirSurah - 1
        ] ||
        0;


    const ayah =
        Number(ayahNumber);


    if (
        ayah < 1 ||
        ayah > totalAyahs
    ) {

        return;

    }


    currentTafsirAyah =
        ayah;


    await renderTafsirPage();

}


/* =====================================================
   CHANGE SURAH
===================================================== */

function changeTafsirSurah(
    surahNumber
) {

    const surah =
        Number(surahNumber);


    if (
        surah < 1 ||
        surah > 114
    ) {

        return;

    }


    currentTafsirSurah =
        surah;


    currentTafsirAyah =
        1;


    renderTafsirPage();

}


/* =====================================================
   UPDATE TAFSIR SOURCE TABS
===================================================== */

function updateTafsirSourceTabs() {

    const tabs =
        document.querySelectorAll(
            ".tafsir-source-tab"
        );


    const selectedSource =
        getCurrentTafsirSource();


    tabs.forEach(
        function(tab) {

            let source =
                normalizeTafsirSource(
                    tab.dataset.tafsir
                );


            tab.classList.toggle(
                "active",
                source ===
                selectedSource
            );


            /*
             * কোনো source unavailable
             * দেখানো হবে না।
             */

            tab.classList.remove(
                "tafsir-source-unavailable"
            );


            tab.removeAttribute(
                "title"
            );

        }
    );

}


/* =====================================================
   SOURCE TAB CLICK
===================================================== */

function setupTafsirSourceTabs() {

    const tabs =
        document.querySelectorAll(
            ".tafsir-source-tab"
        );


    tabs.forEach(
        function(tab) {

            if (
                tab.dataset.tafsirReady ===
                "true"
            ) {

                return;

            }


            tab.dataset.tafsirReady =
                "true";


            tab.addEventListener(
                "click",
                async function(event) {

                    event.preventDefault();

                    event.stopPropagation();


                    let source =
                        normalizeTafsirSource(
                            tab.dataset.tafsir
                        );


                    /*
                     * Invalid source হলে
                     * কিছু করা হবে না।
                     */

                    if (
                        !TAFSIR_SOURCES[
                            source
                        ]
                    ) {

                        return;

                    }


                    /*
                     * Selected source
                     */

                    currentTafsirSource =
                        source;


                    updateTafsirSourceTabs();


                    /*
                     * নতুন source-এর
                     * content load হবে।
                     */

                    await renderTafsirPage();

                }
            );

        }
    );

}


/* =====================================================
   UPDATE AYAH CARD
===================================================== */

function updateTafsirAyahCard(
    ayahData
) {

    const title =
        document.getElementById(
            "tafsirAyahTitle"
        );


    const arabic =
        document.getElementById(
            "tafsirArabic"
        );


    const bengali =
        document.getElementById(
            "tafsirBengali"
        );


    const surahName =
        tafsirSurahNames[
            currentTafsirSurah - 1
        ] ||
        "সূরা " +
        currentTafsirSurah;


    if (title) {

        title.textContent =
            surahName +
            " " +
            toBanglaNumber(
                currentTafsirSurah
            ) +
            ":" +
            toBanglaNumber(
                currentTafsirAyah
            );

    }


    if (arabic) {

        arabic.textContent =
            getArabicFromAyah(
                ayahData
            );

    }


    if (bengali) {

        const translation =
            getBengaliFromAyah(
                ayahData
            );


        bengali.textContent =
            translation ||
            "বাংলা অনুবাদ পাওয়া যায়নি।";

    }

}


/* =====================================================
   SHOW LOADING
===================================================== */

function showTafsirPageLoading() {

    const content =
        document.getElementById(
            "tafsirPageContent"
        );


    const selectedName =
        document.getElementById(
            "tafsirSelectedName"
        );


    const sourceInfo =
        getTafsirSourceInfo();


    if (selectedName) {

        selectedName.textContent =
            sourceInfo.name;

    }


    if (content) {

        content.innerHTML = `

            <div class="tafsir-loading">

                তাফসির লোড হচ্ছে...

            </div>

        `;

    }

}


/* =====================================================
   SHOW TAFSIR CONTENT
===================================================== */

function showTafsirPageContent(
    html
) {

    const content =
        document.getElementById(
            "tafsirPageContent"
        );


    if (!content) {

        return;

    }


    /*
     * Tafsir JSON-এর text-এর ভিতরে
     * HTML থাকলে সরাসরি render হবে।
     */

    content.innerHTML =
        html;

}


/* =====================================================
   SHOW ERROR
===================================================== */

function showTafsirPageError(
    message
) {

    const content =
        document.getElementById(
            "tafsirPageContent"
        );


    if (!content) {

        return;

    }


    content.innerHTML = `

        <div class="tafsir-error">

            <div class="tafsir-error-icon">
                ⚠️
            </div>

            <div class="tafsir-error-text">

                ${escapeTafsirText(
                    message
                )}

            </div>

        </div>

    `;

}


/* =====================================================
   ESCAPE TEXT
===================================================== */

function escapeTafsirText(
    text
) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        )

        .replace(
            /\n/g,
            "<br>"
        );

}


/* =====================================================
   HEADER NAVIGATION
===================================================== */

function setupTafsirNavigation() {

    const backButton =
        document.getElementById(
            "tafsirBackBtn"
        );


    const nextButton =
        document.getElementById(
            "tafsirNextBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function() {

                changeTafsirSurah(
                    currentTafsirSurah - 1
                );

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function() {

                changeTafsirSurah(
                    currentTafsirSurah + 1
                );

            }
        );

    }

}


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupTafsirNavigation();

        setupTafsirSourceTabs();

    }
);