/* =========================================================
   QURAN SHARIF — DUA MODULE
   API + IndexedDB Offline Cache
   ========================================================= */

const DUA_API_BASE = "https://dua-api.hisnul.workers.dev";

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let duaCategories = [];
let currentDuaCategory = null;
let currentDuaList = [];
let currentDua = null;

let duaLoading = false;


/* =========================================================
   DOM
   ========================================================= */

const duaPage = document.getElementById("duaPage");
const duaListPage = document.getElementById("duaListPage");
const duaReaderPage = document.getElementById("duaReaderPage");

const duaCategoryList = document.getElementById("duaCategoryList");
const duaList = document.getElementById("duaList");
const duaReaderContent = document.getElementById("duaReaderContent");

const duaListTitle = document.getElementById("duaListTitle");
const duaListSubtitle = document.getElementById("duaListSubtitle");

const duaReaderTitle = document.getElementById("duaReaderTitle");
const duaReaderSubtitle = document.getElementById("duaReaderSubtitle");


/* =========================================================
   LOCAL STORAGE KEYS
   ========================================================= */

const DUA_LS_PREFIX = "quranSharif_dua_";

const DUA_LAST_READ_KEY =
    "quranSharif_lastDua";


/* =========================================================
   INDEXED DB
   ========================================================= */

const DUA_DB_NAME = "QuranSharifDuaDB";
const DUA_DB_VERSION = 1;

let duaDB = null;


/* =========================================================
   OPEN DATABASE
   ========================================================= */

function openDuaDB() {

    return new Promise((resolve) => {

        if (duaDB) {
            resolve(duaDB);
            return;
        }

        if (!("indexedDB" in window)) {
            resolve(null);
            return;
        }

        const request = indexedDB.open(
            DUA_DB_NAME,
            DUA_DB_VERSION
        );

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("categories")) {

                db.createObjectStore(
                    "categories",
                    { keyPath: "key" }
                );
            }

            if (!db.objectStoreNames.contains("lists")) {

                db.createObjectStore(
                    "lists",
                    { keyPath: "key" }
                );
            }

            if (!db.objectStoreNames.contains("details")) {

                db.createObjectStore(
                    "details",
                    { keyPath: "key" }
                );
            }

            if (!db.objectStoreNames.contains("search")) {

                db.createObjectStore(
                    "search",
                    { keyPath: "key" }
                );
            }

            if (!db.objectStoreNames.contains("meta")) {

                db.createObjectStore(
                    "meta",
                    { keyPath: "key" }
                );
            }
        };

        request.onsuccess = function () {

            duaDB = request.result;

            duaDB.onversionchange = function () {
                duaDB.close();
                duaDB = null;
            };

            resolve(duaDB);
        };

        request.onerror = function () {

            console.warn(
                "Dua IndexedDB unavailable:",
                request.error
            );

            resolve(null);
        };
    });
}


/* =========================================================
   INDEXED DB SAVE
   ========================================================= */

async function duaDBPut(
    storeName,
    key,
    data
) {

    const db = await openDuaDB();

    if (!db) return false;

    return new Promise((resolve) => {

        try {

            const tx = db.transaction(
                storeName,
                "readwrite"
            );

            const store = tx.objectStore(
                storeName
            );

            store.put({
                key: key,
                data: data,
                savedAt: Date.now()
            });

            tx.oncomplete = function () {
                resolve(true);
            };

            tx.onerror = function () {
                resolve(false);
            };

        } catch (error) {

            console.warn(
                "Dua DB save error:",
                error
            );

            resolve(false);
        }
    });
}


/* =========================================================
   INDEXED DB GET
   ========================================================= */

async function duaDBGet(
    storeName,
    key
) {

    const db = await openDuaDB();

    if (!db) return null;

    return new Promise((resolve) => {

        try {

            const tx = db.transaction(
                storeName,
                "readonly"
            );

            const store = tx.objectStore(
                storeName
            );

            const request = store.get(key);

            request.onsuccess = function () {

                const result = request.result;

                if (!result) {
                    resolve(null);
                    return;
                }

                resolve(result.data);
            };

            request.onerror = function () {
                resolve(null);
            };

        } catch (error) {

            console.warn(
                "Dua DB read error:",
                error
            );

            resolve(null);
        }
    });
}


/* =========================================================
   INDEXED DB DELETE
   ========================================================= */

async function duaDBDelete(
    storeName,
    key
) {

    const db = await openDuaDB();

    if (!db) return;

    try {

        const tx = db.transaction(
            storeName,
            "readwrite"
        );

        tx.objectStore(storeName).delete(key);

    } catch (error) {

        console.warn(
            "Dua DB delete error:",
            error
        );
    }
}


/* =========================================================
   LOCAL STORAGE SAFE FUNCTIONS
   ========================================================= */

function duaLocalGet(key) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) return null;

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "Dua localStorage read error:",
            error
        );

        return null;
    }
}


function duaLocalSet(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.warn(
            "Dua localStorage save error:",
            error
        );

        return false;
    }
}


/* =========================================================
   CACHE SAVE
   IndexedDB primary
   localStorage fallback
   ========================================================= */

async function saveDuaCache(
    store,
    key,
    data,
    localKey = null
) {

    let saved = false;

    try {

        saved = await duaDBPut(
            store,
            key,
            data
        );

    } catch (error) {

        console.warn(
            "IndexedDB cache error:",
            error
        );
    }

    /*
       localStorage-এও রাখছি fallback হিসেবে।
       ছোট data হলে কাজ করবে।
    */

    if (localKey) {

        duaLocalSet(
            localKey,
            data
        );
    }

    return saved;
}


/* =========================================================
   CACHE READ
   ========================================================= */

async function getDuaCache(
    store,
    key,
    localKey = null
) {

    /* প্রথমে IndexedDB */

    try {

        const data =
            await duaDBGet(
                store,
                key
            );

        if (data) {

            return data;
        }

    } catch (error) {

        console.warn(
            "IndexedDB cache read error:",
            error
        );
    }


    /* তারপর localStorage */

    if (localKey) {

        const localData =
            duaLocalGet(localKey);

        if (localData) {

            /*
               localStorage data পাওয়া গেলে
               IndexedDB-তেও migrate করছি।
            */

            duaDBPut(
                store,
                key,
                localData
            ).catch(() => {});

            return localData;
        }
    }

    return null;
}


/* =========================================================
   CACHE CLEAR
   ========================================================= */

async function clearDuaCache() {

    const db = await openDuaDB();

    if (db) {

        const stores = [
            "categories",
            "lists",
            "details",
            "search",
            "meta"
        ];

        for (const storeName of stores) {

            try {

                const tx =
                    db.transaction(
                        storeName,
                        "readwrite"
                    );

                tx.objectStore(
                    storeName
                ).clear();

            } catch (error) {

                console.warn(
                    "Clear cache error:",
                    error
                );
            }
        }
    }


    /*
       পুরোনো localStorage cache-ও পরিষ্কার
    */

    try {

        const keys = [];

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (
                key &&
                key.startsWith(DUA_LS_PREFIX)
            ) {

                keys.push(key);
            }
        }

        keys.forEach((key) => {
            localStorage.removeItem(key);
        });

    } catch (error) {

        console.warn(
            "Local dua cache clear error:",
            error
        );
    }
}


/* =========================================================
   API
   ========================================================= */

async function fetchDuaAPI(endpoint) {

    const url =
        DUA_API_BASE + endpoint;

    const response =
        await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            cache: "no-store"
        });

    if (!response.ok) {

        throw new Error(
            "API Error: HTTP " +
            response.status
        );
    }

    const result =
        await response.json();

    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.message ||
            "API request failed"
        );
    }

    return result;
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeDuaHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   OFFLINE STATUS
   ========================================================= */

function isDuaOffline() {

    return navigator.onLine === false;
}


function showDuaOfflineNotice() {

    let notice =
        document.getElementById(
            "duaOfflineNotice"
        );

    if (!notice) {

        notice =
            document.createElement("div");

        notice.id =
            "duaOfflineNotice";

        notice.innerHTML =
            "📴 অফলাইন মোড — সংরক্ষিত দোয়া দেখানো হচ্ছে";

        notice.style.cssText = `
            position:fixed;
            left:12px;
            right:12px;
            bottom:76px;
            z-index:9999;
            padding:10px 14px;
            border-radius:12px;
            background:#333;
            color:#fff;
            text-align:center;
            font-size:13px;
            box-shadow:0 4px 15px rgba(0,0,0,.2);
        `;

        document.body.appendChild(notice);
    }

    notice.style.display = "block";
}


function hideDuaOfflineNotice() {

    const notice =
        document.getElementById(
            "duaOfflineNotice"
        );

    if (notice) {

        notice.style.display = "none";
    }
}


/* =========================================================
   ONLINE / OFFLINE EVENTS
   ========================================================= */

window.addEventListener(
    "offline",
    function () {

        showDuaOfflineNotice();

        console.log(
            "Dua module: OFFLINE"
        );
    }
);


window.addEventListener(
    "online",
    function () {

        hideDuaOfflineNotice();

        console.log(
            "Dua module: ONLINE"
        );

        /*
           Online হলে পরেরবার page খুললে
           background refresh হবে।
        */
    }
);


/* =========================================================
   PAGE SWITCH
   ========================================================= */

function showPageSafe(pageId) {

    if (
        typeof window.showPage ===
        "function"
    ) {

        window.showPage(pageId);

        return;
    }


    document
        .querySelectorAll(".page")
        .forEach((page) => {

            page.classList.remove("active");
        });


    const page =
        document.getElementById(pageId);

    if (page) {

        page.classList.add("active");
    }
}


/* =========================================================
   CATEGORY CACHE KEY
   ========================================================= */

const DUA_CATEGORY_DB_KEY =
    "all_categories";

const DUA_CATEGORY_LOCAL_KEY =
    DUA_LS_PREFIX + "categories";


/* =========================================================
   LOAD CATEGORIES
   ========================================================= */

async function loadDuaCategories(
    forceRefresh = false
) {

    if (duaLoading) return;

    duaLoading = true;


    /*
       Offline হলে forceRefresh বাদ
    */

    if (
        isDuaOffline() &&
        forceRefresh
    ) {

        forceRefresh = false;
    }


    try {

        /*
           1. Cache থেকে আগে দেখাই
        */

        if (!forceRefresh) {

            const cached =
                await getDuaCache(
                    "categories",
                    DUA_CATEGORY_DB_KEY,
                    DUA_CATEGORY_LOCAL_KEY
                );

            if (
                cached &&
                Array.isArray(cached)
            ) {

                duaCategories =
                    cached;

                renderDuaCategories();

                console.log(
                    "Dua categories loaded from cache"
                );
            }
        }


        /*
           Offline হলে এখানেই শেষ
        */

        if (isDuaOffline()) {

            if (
                !duaCategories ||
                duaCategories.length === 0
            ) {

                renderDuaError(
                    duaCategoryList,
                    "ইন্টারনেট সংযোগ নেই এবং কোনো সংরক্ষিত দোয়া পাওয়া যায়নি।"
                );
            }

            showDuaOfflineNotice();

            return;
        }


        /*
           Cache থাকলেও background refresh
        */

        const result =
            await fetchDuaAPI(
                "/api/categories"
            );


        if (
            result &&
            Array.isArray(result.data)
        ) {

            duaCategories =
                result.data;

            await saveDuaCache(
                "categories",
                DUA_CATEGORY_DB_KEY,
                duaCategories,
                DUA_CATEGORY_LOCAL_KEY
            );

            renderDuaCategories();

            hideDuaOfflineNotice();
        }

    } catch (error) {

        console.error(
            "Dua categories error:",
            error
        );


        /*
           Cache already shown থাকলে
           সেটাই রাখতে হবে।
        */

        if (
            !duaCategories ||
            duaCategories.length === 0
        ) {

            renderDuaError(
                duaCategoryList,
                "দোয়ার ক্যাটাগরি লোড করা যায়নি।"
            );
        }

    } finally {

        duaLoading = false;
    }
}


/* =========================================================
   RENDER CATEGORIES
   ========================================================= */

function renderDuaCategories() {

    if (!duaCategoryList) return;


    if (
        !duaCategories ||
        duaCategories.length === 0
    ) {

        duaCategoryList.innerHTML = `
            <div class="dua-empty">
                <div class="dua-empty-icon">🤲</div>
                <p>কোনো দোয়ার বিষয় পাওয়া যায়নি।</p>
            </div>
        `;

        return;
    }


    duaCategoryList.innerHTML =
        duaCategories
            .map((category, index) => {

                const count =
                    category.dua_count ??
                    category.count ??
                    0;

                return `
                    <button
                        class="dua-category-card"
                        data-category-id="${escapeDuaHTML(category.id)}"
                        type="button"
                    >

                        <div class="dua-category-number">
                            ${index + 1}
                        </div>

                        <div class="dua-category-info">

                            <h3>
                                ${escapeDuaHTML(category.name)}
                            </h3>

                            <p>
                                ${count}টি দোয়া
                            </p>

                        </div>

                        <div class="dua-category-arrow">
                            ›
                        </div>

                    </button>
                `;
            })
            .join("");


    duaCategoryList
        .querySelectorAll(
            ".dua-category-card"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                function () {

                    const categoryId =
                        Number(
                            this.dataset.categoryId
                        );

                    openDuaCategory(
                        categoryId
                    );
                }
            );
        });
}


/* =========================================================
   OPEN CATEGORY
   ========================================================= */

async function openDuaCategory(
    categoryId
) {

    const category =
        duaCategories.find(
            (item) =>
                Number(item.id) ===
                Number(categoryId)
        );


    currentDuaCategory =
        category || {
            id: categoryId,
            name: "দোয়া"
        };


    if (duaListTitle) {

        duaListTitle.textContent =
            currentDuaCategory.name ||
            "দোয়া";
    }


    if (duaListSubtitle) {

        duaListSubtitle.textContent =
            "দোয়ার তালিকা";
    }


    showPageSafe(
        "duaListPage"
    );


    await loadDuasByCategory(
        categoryId
    );
}


/* =========================================================
   CATEGORY LIST CACHE
   ========================================================= */

function getDuaListDBKey(categoryId) {

    return "category_" +
        String(categoryId);
}


function getDuaListLocalKey(categoryId) {

    return (
        DUA_LS_PREFIX +
        "category_" +
        String(categoryId)
    );
}


/* =========================================================
   LOAD DUA LIST
   ========================================================= */

async function loadDuasByCategory(
    categoryId,
    forceRefresh = false
) {

    if (!duaList) return;


    currentDuaList = [];


    /*
       Cache first
    */

    if (!forceRefresh) {

        const cached =
            await getDuaCache(
                "lists",
                getDuaListDBKey(categoryId),
                getDuaListLocalKey(categoryId)
            );

        if (
            cached &&
            Array.isArray(cached)
        ) {

            currentDuaList =
                cached;

            renderDuaList();

            console.log(
                "Dua list loaded from cache:",
                categoryId
            );
        }
    }


    /*
       Offline হলে API call নয়
    */

    if (isDuaOffline()) {

        if (
            currentDuaList.length === 0
        ) {

            renderDuaError(
                duaList,
                "ইন্টারনেট সংযোগ নেই এবং এই বিষয়ের দোয়া এখনো সংরক্ষিত হয়নি।"
            );
        }

        showDuaOfflineNotice();

        return;
    }


    try {

        const result =
            await fetchDuaAPI(
                `/api/categories/${encodeURIComponent(categoryId)}/duas?page=1&limit=100`
            );


        if (
            result &&
            Array.isArray(result.data)
        ) {

            currentDuaList =
                result.data;

            await saveDuaCache(
                "lists",
                getDuaListDBKey(categoryId),
                currentDuaList,
                getDuaListLocalKey(categoryId)
            );

            renderDuaList();

            hideDuaOfflineNotice();
        }

    } catch (error) {

        console.error(
            "Dua list error:",
            error
        );


        if (
            currentDuaList.length === 0
        ) {

            renderDuaError(
                duaList,
                "এই বিষয়ের দোয়া লোড করা যায়নি।"
            );
        }
    }
}


/* =========================================================
   RENDER DUA LIST
   ========================================================= */

function renderDuaList() {

    if (!duaList) return;


    if (
        !currentDuaList ||
        currentDuaList.length === 0
    ) {

        duaList.innerHTML = `
            <div class="dua-empty">
                <div class="dua-empty-icon">🤲</div>
                <p>এই বিষয়ের কোনো দোয়া পাওয়া যায়নি।</p>
            </div>
        `;

        return;
    }


    duaList.innerHTML =
        currentDuaList
            .map((dua, index) => {

                const title =
                    dua.duaname ||
                    "দোয়া";

                const subtitle =
                    dua.chapname ||
                    "";


                return `
                    <button
                        class="dua-list-card"
                        data-dua-id="${escapeDuaHTML(dua.dua_global_id)}"
                        type="button"
                    >

                        <div class="dua-list-number">
                            ${index + 1}
                        </div>

                        <div class="dua-list-info">

                            <h3>
                                ${escapeDuaHTML(title)}
                            </h3>

                            ${
                                subtitle
                                    ? `
                                    <p>
                                        ${escapeDuaHTML(subtitle)}
                                    </p>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="dua-list-arrow">
                            ›
                        </div>

                    </button>
                `;
            })
            .join("");


    duaList
        .querySelectorAll(
            ".dua-list-card"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                function () {

                    const duaId =
                        Number(
                            this.dataset.duaId
                        );

                    openDuaReader(
                        duaId
                    );
                }
            );
        });
}


/* =========================================================
   DETAIL CACHE KEY
   ========================================================= */

function getDuaDetailDBKey(
    duaGlobalId
) {

    return "dua_" +
        String(duaGlobalId);
}


function getDuaDetailLocalKey(
    duaGlobalId
) {

    return (
        DUA_LS_PREFIX +
        "detail_" +
        String(duaGlobalId)
    );
}


/* =========================================================
   OPEN DUA READER
   ========================================================= */

async function openDuaReader(
    duaGlobalId
) {

    showPageSafe(
        "duaReaderPage"
    );


    if (duaReaderContent) {

        duaReaderContent.innerHTML = `
            <div class="dua-loading">
                <div class="dua-spinner"></div>
                <p>দোয়া লোড হচ্ছে...</p>
            </div>
        `;
    }


    /*
       Last read
    */

    duaLocalSet(
        DUA_LAST_READ_KEY,
        Number(duaGlobalId)
    );


    /*
       Cache first
    */

    let cached =
        await getDuaCache(
            "details",
            getDuaDetailDBKey(
                duaGlobalId
            ),
            getDuaDetailLocalKey(
                duaGlobalId
            )
        );


    if (cached) {

        currentDua =
            cached;

        renderDuaReader();

        console.log(
            "Dua reader loaded from cache:",
            duaGlobalId
        );
    }


    /*
       Offline হলে API call নয়
    */

    if (isDuaOffline()) {

        if (!cached) {

            renderDuaError(
                duaReaderContent,
                "ইন্টারনেট সংযোগ নেই এবং এই দোয়াটি এখনো সংরক্ষিত হয়নি।"
            );
        }

        showDuaOfflineNotice();

        return;
    }


    /*
       Online হলে fresh data আনা হবে
    */

    try {

        const result =
            await fetchDuaAPI(
                `/api/duas/${encodeURIComponent(duaGlobalId)}`
            );


        if (
            result &&
            result.data
        ) {

            currentDua =
                result.data;


            /*
               সম্পূর্ণ Dua detail
               IndexedDB-তে save
            */

            await saveDuaCache(
                "details",
                getDuaDetailDBKey(
                    duaGlobalId
                ),
                currentDua,
                getDuaDetailLocalKey(
                    duaGlobalId
                )
            );


            renderDuaReader();

            hideDuaOfflineNotice();
        }

    } catch (error) {

        console.error(
            "Dua reader error:",
            error
        );


        /*
           Cached data আগে দেখানো থাকলে
           error দিয়ে সেটা replace করব না।
        */

        if (!cached) {

            renderDuaError(
                duaReaderContent,
                "দোয়াটি লোড করা যায়নি।"
            );
        }
    }
}


/* =========================================================
   RENDER READER
   ========================================================= */

function renderDuaReader() {

    if (!duaReaderContent) return;

    if (!currentDua) return;


    if (duaReaderTitle) {

        duaReaderTitle.textContent =
            currentDua.duaname ||
            "দোয়া";
    }


    if (duaReaderSubtitle) {

        duaReaderSubtitle.textContent =
            currentDua.chapname ||
            "";
    }


    const segments =
        Array.isArray(
            currentDua.segments
        )
            ? currentDua.segments
            : [];


    let html = `
        <div class="dua-reader-heading">

            <h2>
                ${escapeDuaHTML(
                    currentDua.duaname ||
                    "দোয়া"
                )}
            </h2>

            ${
                currentDua.chapname
                    ? `
                    <p>
                        ${escapeDuaHTML(
                            currentDua.chapname
                        )}
                    </p>
                    `
                    : ""
            }

        </div>
    `;


    if (segments.length === 0) {

        html += `
            <div class="dua-empty">
                <div class="dua-empty-icon">🤲</div>
                <p>এই দোয়াটির বিস্তারিত তথ্য পাওয়া যায়নি।</p>
            </div>
        `;

        duaReaderContent.innerHTML =
            html;

        return;
    }


    html += segments
        .map(
            (segment, index) =>
                renderDuaSegment(
                    segment,
                    index
                )
        )
        .join("");


    duaReaderContent.innerHTML =
        html;


    /*
       Word buttons
    */

    duaReaderContent
        .querySelectorAll(
            ".dua-word-toggle"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                function () {

                    const segmentId =
                        this.dataset.segmentId;

                    toggleDuaWords(
                        segmentId
                    );
                }
            );
        });
}


/* =========================================================
   RENDER SEGMENT
   ========================================================= */

function renderDuaSegment(
    segment,
    index
) {

    const arabic =
        segment.arabic ||
        segment.arabic_diacless ||
        "";


    const words =
        Array.isArray(
            segment.words
        )
            ? segment.words
            : [];


    let html = `
        <div class="dua-segment-card">

            <div class="dua-segment-number">
                ${index + 1}
            </div>
    `;


    if (segment.top) {

        html += `
            <div class="dua-top-text">
                ${escapeDuaHTML(
                    segment.top
                )}
            </div>
        `;
    }


    if (arabic) {

        html += `
            <div class="dua-arabic">
                ${escapeDuaHTML(arabic)}
            </div>
        `;
    }


    if (segment.transliteration) {

        html += `
            <div class="dua-transliteration">

                <strong>
                    উচ্চারণ:
                </strong>

                <div>
                    ${escapeDuaHTML(
                        segment.transliteration
                    )}
                </div>

            </div>
        `;
    }


    if (segment.translations) {

        html += `
            <div class="dua-translation">

                <span class="dua-label">
                    বাংলা অর্থ
                </span>

                <div>
                    ${escapeDuaHTML(
                        segment.translations
                    )}
                </div>

            </div>
        `;
    }


    /*
       Word by word
    */

    if (words.length > 0) {

        const segmentId =
            segment.dua_segment_id;


        html += `
            <button
                type="button"
                class="dua-word-toggle"
                data-segment-id="${escapeDuaHTML(segmentId)}"
            >
                📖 শব্দে শব্দে অর্থ দেখুন
            </button>

            <div
                id="duaWords-${escapeDuaHTML(segmentId)}"
                class="dua-words-panel"
                style="display:none;"
            >

                <div class="dua-words-grid">

                    ${words
                        .map((word) => {

                            return `
                                <div class="dua-word-item">

                                    <span class="dua-word-arabic">
                                        ${escapeDuaHTML(
                                            word.arabic
                                        )}
                                    </span>

                                    <span class="dua-word-bn">
                                        ${escapeDuaHTML(
                                            word.bn
                                        )}
                                    </span>

                                </div>
                            `;
                        })
                        .join("")}

                </div>

            </div>
        `;
    }


    if (segment.bottom) {

        html += `
            <div class="dua-bottom-text">
                ${escapeDuaHTML(
                    segment.bottom
                )}
            </div>
        `;
    }


    /*
       আপনার কথামতো Reference দেখাচ্ছি না।
    */


    html += `
        </div>
    `;


    return html;
}


/* =========================================================
   WORD BY WORD TOGGLE
   ========================================================= */

function toggleDuaWords(
    segmentId
) {

    const panel =
        document.getElementById(
            "duaWords-" +
            segmentId
        );

    if (!panel) return;


    const isHidden =
        panel.style.display ===
        "none";


    panel.style.display =
        isHidden
            ? "block"
            : "none";
}


/* =========================================================
   ERROR
   ========================================================= */

function renderDuaError(
    container,
    message
) {

    if (!container) return;


    container.innerHTML = `
        <div class="dua-error">

            <div class="dua-error-icon">
                ⚠️
            </div>

            <p>
                ${escapeDuaHTML(message)}
            </p>

            <button
                type="button"
                class="dua-retry-btn"
                onclick="location.reload()"
            >
                আবার চেষ্টা করুন
            </button>

        </div>
    `;
}


/* =========================================================
   SEARCH
   ========================================================= */

async function searchDuas(
    query
) {

    query =
        String(query || "")
            .trim();


    if (!query) return;


    showPageSafe(
        "duaListPage"
    );


    if (duaListTitle) {

        duaListTitle.textContent =
            "দোয়া অনুসন্ধান";
    }


    if (duaListSubtitle) {

        duaListSubtitle.textContent =
            `"${query}"`;
    }


    /*
       Offline search
    */

    if (isDuaOffline()) {

        const results =
            await searchDuaOffline(
                query
            );

        currentDuaList =
            results;

        renderDuaList();

        showDuaOfflineNotice();

        return;
    }


    try {

        const result =
            await fetchDuaAPI(
                `/api/search?q=${encodeURIComponent(query)}&page=1&limit=100`
            );


        currentDuaList =
            Array.isArray(result.data)
                ? result.data
                : [];


        /*
           Search result cache
        */

        await saveDuaCache(
            "search",
            "search_" +
                query.toLowerCase(),
            currentDuaList
        );


        renderDuaList();

    } catch (error) {

        console.error(
            "Dua search error:",
            error
        );


        /*
           API fail হলে offline cache
           থেকে search
        */

        const results =
            await searchDuaOffline(
                query
            );


        currentDuaList =
            results;


        renderDuaList();
    }
}


/* =========================================================
   OFFLINE SEARCH
   ========================================================= */

async function searchDuaOffline(
    query
) {

    const q =
        String(query)
            .toLowerCase()
            .trim();


    const results = [];

    const seen = new Set();


    /*
       Categories থেকে search
    */

    if (
        Array.isArray(duaCategories)
    ) {

        duaCategories.forEach(
            (category) => {

                const name =
                    String(
                        category.name || ""
                    ).toLowerCase();

                if (
                    name.includes(q)
                ) {

                    const item = {
                        dua_global_id:
                            "category-" +
                            category.id,

                        duaname:
                            category.name,

                        chapname:
                            `${category.dua_count || 0}টি দোয়া`
                    };

                    const key =
                        item.dua_global_id;

                    if (!seen.has(key)) {

                        seen.add(key);

                        results.push(
                            item
                        );
                    }
                }
            }
        );
    }


    /*
       IndexedDB-এর cached lists
       পড়ার জন্য সব category জানা দরকার।
    */

    if (
        Array.isArray(duaCategories)
    ) {

        for (
            const category
            of duaCategories
        ) {

            const list =
                await getDuaCache(
                    "lists",
                    getDuaListDBKey(
                        category.id
                    ),
                    getDuaListLocalKey(
                        category.id
                    )
                );


            if (
                !Array.isArray(list)
            ) continue;


            list.forEach((dua) => {

                const name =
                    String(
                        dua.duaname || ""
                    ).toLowerCase();

                const chapter =
                    String(
                        dua.chapname || ""
                    ).toLowerCase();

                const tags =
                    String(
                        dua.tags || ""
                    ).toLowerCase();


                if (
                    name.includes(q) ||
                    chapter.includes(q) ||
                    tags.includes(q)
                ) {

                    const key =
                        String(
                            dua.dua_global_id
                        );


                    if (
                        !seen.has(key)
                    ) {

                        seen.add(key);

                        results.push(
                            dua
                        );
                    }
                }
            });
        }
    }


    return results;
}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

function openDuaSearch() {

    const query =
        prompt(
            "দোয়া খুঁজুন:"
        );


    if (
        query &&
        query.trim()
    ) {

        searchDuas(
            query.trim()
        );
    }
}


/* =========================================================
   BACK BUTTONS
   ========================================================= */

const duaPageBack =
    document.getElementById(
        "duaPageBack"
    );

if (duaPageBack) {

    duaPageBack.addEventListener(
        "click",
        function () {

            showPageSafe(
                "homePage"
            );
        }
    );
}


const duaListBack =
    document.getElementById(
        "duaListBack"
    );

if (duaListBack) {

    duaListBack.addEventListener(
        "click",
        function () {

            showPageSafe(
                "duaPage"
            );

            renderDuaCategories();
        }
    );
}


const duaReaderBack =
    document.getElementById(
        "duaReaderBack"
    );

if (duaReaderBack) {

    duaReaderBack.addEventListener(
        "click",
        function () {

            showPageSafe(
                "duaListPage"
            );

            renderDuaList();
        }
    );
}




/* =========================================================
   SEARCH BUTTONS
   ========================================================= */

const duaSearchBtn =
    document.getElementById(
        "duaSearchBtn"
    );

if (duaSearchBtn) {

    duaSearchBtn.addEventListener(
        "click",
        openDuaSearch
    );
}


const duaListSearchBtn =
    document.getElementById(
        "duaListSearchBtn"
    );

if (duaListSearchBtn) {

    duaListSearchBtn.addEventListener(
        "click",
        openDuaSearch
    );
}


/* =========================================================
   DUA BOOKMARK BUTTON
   ========================================================= */

const duaBookmarkBtn =
    document.getElementById(
        "duaBookmarkBtn"
    );


if (duaBookmarkBtn) {

    duaBookmarkBtn.addEventListener(
        "click",
        function () {

            if (!currentDua) return;


            const id =
                currentDua.dua_global_id;


            const key =
                "quranSharif_dua_bookmark_" +
                id;


            const existing =
                duaLocalGet(key);


            if (existing) {

                localStorage.removeItem(
                    key
                );

                duaBookmarkBtn.textContent =
                    "🔖";

            } else {

                duaLocalSet(
                    key,
                    currentDua
                );

                duaBookmarkBtn.textContent =
                    "🔖";
            }
        }
    );
}


/* =========================================================
   PRELOAD CACHE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
           DB খুলে রাখি
        */

        await openDuaDB();


        /*
           Cached categories দ্রুত
           memory-তে আনি
        */

        const cached =
            await getDuaCache(
                "categories",
                DUA_CATEGORY_DB_KEY,
                DUA_CATEGORY_LOCAL_KEY
            );


        if (
            Array.isArray(cached)
        ) {

            duaCategories =
                cached;
        }


        /*
           Offline হলে notice
        */

        if (isDuaOffline()) {

            showDuaOfflineNotice();
        }


        console.log(
            "Quran Sharif Dua module ready."
        );

        console.log(
            "Dua offline cache:",
            "IndexedDB + localStorage"
        );
    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.loadDuaCategories =
    loadDuaCategories;

window.openDuaCategory =
    openDuaCategory;

window.openDuaReader =
    openDuaReader;

window.searchDuas =
    searchDuas;

window.toggleDuaWords =
    toggleDuaWords;

window.clearDuaCache =
    clearDuaCache;
    /* =========================================================
   DUA — DOWNLOAD ALL FOR OFFLINE
   ========================================================= */

let duaDownloadingAll = false;


/* ---------------------------------------------------------
   UPDATE DOWNLOAD UI
   --------------------------------------------------------- */

function updateDuaDownloadProgress(
    current,
    total,
    message
) {

    const progress =
        document.getElementById(
            "duaDownloadProgress"
        );

    const fill =
        document.getElementById(
            "duaDownloadProgressFill"
        );

    const text =
        document.getElementById(
            "duaDownloadProgressText"
        );

    const percent =
        document.getElementById(
            "duaDownloadPercent"
        );


    if (!progress) return;


    progress.style.display = "block";


    const value =
        total > 0
            ? Math.min(
                100,
                Math.round(
                    (current / total) * 100
                )
            )
            : 0;


    if (fill) {

        fill.style.width =
            value + "%";
    }


    if (percent) {

        percent.textContent =
            value + "%";
    }


    if (text) {

        text.textContent =
            message || "ডাউনলোড হচ্ছে...";
    }
}


/* ---------------------------------------------------------
   DOWNLOAD ALL
   --------------------------------------------------------- */

async function downloadAllDuasOffline() {

    if (duaDownloadingAll) {
        return;
    }


    /* Internet check */

    if (navigator.onLine === false) {

        alert(
            "সব দোয়া Offline-এ সংরক্ষণ করতে প্রথমে Internet চালু করুন।"
        );

        return;
    }


    const button =
        document.getElementById(
            "duaDownloadAllBtn"
        );

    const status =
        document.getElementById(
            "duaDownloadStatus"
        );


    duaDownloadingAll = true;


    if (button) {

        button.disabled = true;

        button.textContent =
            "সংরক্ষণ হচ্ছে...";
    }


    if (status) {

        status.textContent =
            "সব দোয়া প্রস্তুত করা হচ্ছে...";
    }


    try {

        /*
           -------------------------------------------------
           STEP 1
           Categories
           -------------------------------------------------
        */

        updateDuaDownloadProgress(
            0,
            1,
            "দোয়ার বিষয়গুলো সংগ্রহ করা হচ্ছে..."
        );


        const categoryResult =
            await fetchDuaAPI(
                "/api/categories"
            );


        if (
            !categoryResult ||
            !Array.isArray(
                categoryResult.data
            )
        ) {

            throw new Error(
                "দোয়ার Category পাওয়া যায়নি।"
            );
        }


        const categories =
            categoryResult.data;


        /*
           Category cache
        */

        duaCategories =
            categories;


        await saveDuaCache(
            "categories",
            "all_categories",
            categories,
            "quranSharif_dua_categories"
        );


        console.log(
            "Dua categories saved:",
            categories.length
        );


        /*
           -------------------------------------------------
           STEP 2
           সব Category-এর Dua List সংগ্রহ
           -------------------------------------------------
        */

        let allDuaItems = [];


        for (
            let i = 0;
            i < categories.length;
            i++
        ) {

            const category =
                categories[i];


            const categoryName =
                category.name ||
                "দোয়া";


            updateDuaDownloadProgress(
                i,
                categories.length,
                `${i + 1}/${categories.length} — ${categoryName}`
            );


            /*
               Pagination
               limit maximum 100
            */

            let page = 1;

            let categoryItems = [];


            while (true) {

                if (
                    navigator.onLine === false
                ) {

                    throw new Error(
                        "Internet সংযোগ বিচ্ছিন্ন হয়েছে।"
                    );
                }


                const result =
                    await fetchDuaAPI(
                        `/api/categories/${encodeURIComponent(category.id)}/duas?page=${page}&limit=100`
                    );


                const items =
                    Array.isArray(
                        result.data
                    )
                        ? result.data
                        : [];


                categoryItems.push(
                    ...items
                );


                /*
                   Cache করার আগে list complete করছি।
                */

                if (
                    items.length < 100
                ) {

                    break;
                }


                page++;
            }


            /*
               Category list cache
            */

            await saveDuaCache(
                "lists",
                getDuaListDBKey(
                    category.id
                ),
                categoryItems,
                getDuaListLocalKey(
                    category.id
                )
            );


            allDuaItems.push(
                ...categoryItems
            );


            console.log(
                "Category saved:",
                categoryName,
                categoryItems.length
            );
        }


        /*
           Duplicate Dua remove
        */

        const uniqueDuas =
            Array.from(
                new Map(
                    allDuaItems.map(
                        (dua) => [
                            String(
                                dua.dua_global_id
                            ),
                            dua
                        ]
                    )
                ).values()
            );


        /*
           -------------------------------------------------
           STEP 3
           প্রতিটি Dua-এর সম্পূর্ণ Detail
           -------------------------------------------------
        */

        const totalDuas =
            uniqueDuas.length;


        let savedDuas = 0;


        for (
            let i = 0;
            i < totalDuas;
            i++
        ) {

            if (
                navigator.onLine === false
            ) {

                throw new Error(
                    "Internet সংযোগ বিচ্ছিন্ন হয়েছে।"
                );
            }


            const dua =
                uniqueDuas[i];


            const duaId =
                dua.dua_global_id;


            updateDuaDownloadProgress(
                i,
                totalDuas,
                `দোয়া ${i + 1}/${totalDuas} সংরক্ষণ হচ্ছে...`
            );


            try {

                /*
                   API থেকে সম্পূর্ণ Dua
                */

                const result =
                    await fetchDuaAPI(
                        `/api/duas/${encodeURIComponent(duaId)}`
                    );


                if (
                    result &&
                    result.data
                ) {

                    await saveDuaCache(
                        "details",
                        getDuaDetailDBKey(
                            duaId
                        ),
                        result.data,
                        getDuaDetailLocalKey(
                            duaId
                        )
                    );


                    savedDuas++;
                }


            } catch (error) {

                /*
                   একটি Dua fail করলেও
                   পুরো Download বন্ধ হবে না।
                */

                console.warn(
                    "Dua detail failed:",
                    duaId,
                    error
                );
            }


            /*
               Browser/API-এর ওপর অতিরিক্ত চাপ
               না দেওয়ার জন্য সামান্য বিরতি।
            */

            if (
                i < totalDuas - 1
            ) {

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            40
                        )
                );
            }
        }


        /*
           -------------------------------------------------
           COMPLETE
           -------------------------------------------------
        */

        updateDuaDownloadProgress(
            totalDuas,
            totalDuas,
            "সব দোয়া Offline-এর জন্য প্রস্তুত।"
        );


        if (status) {

            status.textContent =
                `${savedDuas}টি দোয়া Offline-এ সংরক্ষিত হয়েছে`;
        }


        if (button) {

            button.textContent =
                "✓ সংরক্ষিত";

            button.disabled =
                false;
        }


        /*
           Metadata
        */

        await duaDBPut(
            "meta",
            "download_all",
            {
                completed: true,
                totalCategories:
                    categories.length,
                totalDuas:
                    savedDuas,
                savedAt:
                    Date.now()
            }
        );


        console.log(
            "================================"
        );

        console.log(
            "ALL DUA OFFLINE DOWNLOAD COMPLETE"
        );

        console.log(
            "Categories:",
            categories.length
        );

        console.log(
            "Duas:",
            savedDuas
        );

        console.log(
            "================================"
        );


        alert(
            `সম্পন্ন হয়েছে!\n\n${savedDuas}টি দোয়া Offline-এ সংরক্ষণ করা হয়েছে।`
        );


    } catch (error) {

        console.error(
            "Download all Dua error:",
            error
        );


        if (status) {

            status.textContent =
                "ডাউনলোড সম্পূর্ণ হয়নি";
        }


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "আবার সংরক্ষণ";
        }


        alert(
            "দোয়া Offline-এ সংরক্ষণ করা যায়নি।\n\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    } finally {

        duaDownloadingAll =
            false;
    }
}


/* =========================================================
   DOWNLOAD BUTTON EVENT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const button =
            document.getElementById(
                "duaDownloadAllBtn"
            );


        if (!button) {

            console.warn(
                "duaDownloadAllBtn not found"
            );

            return;
        }


        button.addEventListener(
            "click",
            downloadAllDuasOffline
        );


        /*
           আগে Download করা থাকলে
           button-এর status দেখানো
        */

        duaDBGet(
            "meta",
            "download_all"
        ).then((meta) => {

            if (
                !meta ||
                !meta.completed
            ) {

                return;
            }


            const status =
                document.getElementById(
                    "duaDownloadStatus"
                );


            if (status) {

                status.textContent =
                    `${meta.totalDuas || 0}টি দোয়া Offline-এ সংরক্ষিত`;
            }


            button.textContent =
                "✓ সংরক্ষিত";
        });
    }
);


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.downloadAllDuasOffline =
    downloadAllDuasOffline;