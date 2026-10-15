/* =========================================================
   QURAN SHARIF — DUA MODULE
   API + IndexedDB + LocalStorage Offline Cache
   Category / List / Reader / Search / Bookmark / Download
   Updated: Toast + Custom Dialog + Bookmark Separation
========================================================= */

(() => {
    "use strict";

    /* ===================== CONFIG ===================== */

    const DUA_API_BASE = "https://dua-api.hisnul.workers.dev";
    const DUA_DB_NAME = "QuranSharifDuaDB";
    const DUA_DB_VERSION = 1;

    const DUA_LS_PREFIX = "quranSharif_dua_";
    const DUA_LAST_READ_KEY = "quranSharif_lastDua";
    const DUA_BOOKMARK_PREFIX = "quranSharif_dua_bookmark_";

    const DUA_STORES = [
        "categories", "lists", "details", "search", "meta"
    ];

    /* ===================== STATE ===================== */

    let duaCategories = [];
    let currentDuaCategory = null;
    let currentDuaList = [];
    let currentDua = null;

    let duaDB = null;
    let duaDBPromise = null;
    let duaLoadingCategories = false;
    let duaDownloadingAll = false;
    let duaCategoryRequestId = 0;
    let duaReaderRequestId = 0;
    let duaSearchRequestId = 0;

    /* ===================== DOM HELPERS ===================== */

    function duaElement(id) {
        return document.getElementById(id);
    }

    function duaSetText(id, value) {
        const element = duaElement(id);
        if (element) element.textContent = value == null ? "" : String(value);
    }

    function duaEscapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function duaSleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isDuaOffline() {
        return navigator.onLine === false;
    }

    function normalizeDuaId(id) {
        if (id === undefined || id === null) return null;
        const value = String(id).trim();
        return value || null;
    }

    /* ===================== TOAST NOTIFICATION ===================== */

    function showDuaToast(message, type = "success", duration = 3000) {
        let toast = duaElement("duaToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "duaToast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");

            toast.style.cssText = `
                position:fixed;
                left:16px;
                right:16px;
                bottom:84px;
                z-index:100010;
                max-width:520px;
                margin:0 auto;
                padding:13px 16px;
                border-radius:14px;
                background:#173d30;
                color:#fff;
                font-size:14px;
                line-height:1.6;
                text-align:center;
                box-shadow:0 6px 24px rgba(0,0,0,.25);
                opacity:0;
                transform:translateY(12px);
                transition:opacity .2s ease, transform .2s ease;
                pointer-events:none;
                white-space:pre-line;
            `;

            document.body.appendChild(toast);
        }

        clearTimeout(toast._hideTimer);

        const backgrounds = {
            success: "#17633f",
            error: "#a92c2c",
            info: "#254b68",
            warning: "#795414"
        };

        toast.style.background = backgrounds[type] || backgrounds.success;
        toast.textContent = String(message || "");
        toast.style.display = "block";

        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });

        toast._hideTimer = setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(12px)";

            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.style.display = "none";
                }
            }, 220);
        }, duration);
    }

    /* ===================== CUSTOM SEARCH DIALOG ===================== */

    function openDuaSearch() {
        const old = duaElement("duaSearchOverlay");
        if (old) old.remove();

        const overlay = document.createElement("div");
        overlay.id = "duaSearchOverlay";

        overlay.style.cssText = `
            position:fixed; inset:0; z-index:100020;
            background:rgba(0,0,0,.58);
            display:flex; align-items:center; justify-content:center;
            padding:20px;
        `;

        overlay.innerHTML = `
            <div role="dialog" aria-modal="true"
                 aria-labelledby="duaSearchDialogTitle"
                 style="width:100%;max-width:420px;background:var(--card-bg,#fff);
                 color:var(--text-color,#222);padding:22px;border-radius:18px;
                 box-shadow:0 12px 40px rgba(0,0,0,.25);">
                <h3 id="duaSearchDialogTitle" style="margin:0 0 14px">
                    🤲 দোয়া খুঁজুন
                </h3>
                <input id="duaSearchInput" type="search"
                       placeholder="দোয়ার নাম বা শব্দ লিখুন"
                       autocomplete="off"
                       style="box-sizing:border-box;width:100%;padding:13px;
                       border:1px solid #ccc;border-radius:10px;
                       font-size:16px;margin-bottom:16px;">
                <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button type="button" id="duaSearchCancel"
                            style="padding:10px 16px;border:0;border-radius:9px;
                            background:#ddd;color:#222">বাতিল</button>
                    <button type="button" id="duaSearchSubmit"
                            style="padding:10px 16px;border:0;border-radius:9px;
                            background:#17633f;color:#fff">খুঁজুন</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = duaElement("duaSearchInput");
        const close = () => overlay.remove();

        duaElement("duaSearchCancel").addEventListener("click", close);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });

        function submitSearch() {
            const query = input.value.trim();
            if (!query) {
                showDuaToast("দোয়ার নাম বা শব্দ লিখুন।", "warning");
                input.focus();
                return;
            }
            close();
            searchDuas(query);
        }

        duaElement("duaSearchSubmit").addEventListener("click", submitSearch);

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") submitSearch();
            if (event.key === "Escape") close();
        });

        input.focus();
    }

    /* ===================== LOCAL STORAGE ===================== */

    function duaLocalGet(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.warn("Dua LocalStorage read error:", error);
            return null;
        }
    }

    function duaLocalSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn("Dua LocalStorage save error:", error);
            return false;
        }
    }

    function duaLocalRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn("Dua LocalStorage remove error:", error);
        }
    }

    /* ===================== INDEXEDDB OPEN ===================== */

    function openDuaDB() {
        if (duaDB) return Promise.resolve(duaDB);
        if (duaDBPromise) return duaDBPromise;

        if (!("indexedDB" in window)) return Promise.resolve(null);

        duaDBPromise = new Promise(resolve => {
            let request;

            try {
                request = indexedDB.open(DUA_DB_NAME, DUA_DB_VERSION);
            } catch (error) {
                console.warn("Dua IndexedDB open error:", error);
                duaDBPromise = null;
                resolve(null);
                return;
            }

            request.onupgradeneeded = event => {
                const db = event.target.result;

                DUA_STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: "key" });
                    }
                });
            };

            request.onsuccess = () => {
                duaDB = request.result;

                duaDB.onversionchange = () => {
                    duaDB.close();
                    duaDB = null;
                    duaDBPromise = null;
                };

                resolve(duaDB);
            };

            request.onerror = () => {
                console.warn("Dua IndexedDB unavailable:", request.error);
                duaDBPromise = null;
                resolve(null);
            };

            request.onblocked = () => {
                console.warn("Dua IndexedDB upgrade blocked.");
            };
        });

        return duaDBPromise;
    }

    /* ===================== INDEXEDDB SAVE / READ / CLEAR ===================== */

    async function duaDBPut(storeName, key, data) {
        const db = await openDuaDB();

        if (!db || !DUA_STORES.includes(storeName)) return false;

        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readwrite");

                tx.objectStore(storeName).put({
                    key: String(key),
                    data,
                    savedAt: Date.now()
                });

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            } catch (error) {
                console.warn("Dua DB save error:", error);
                resolve(false);
            }
        });
    }

    async function duaDBGet(storeName, key) {
        const db = await openDuaDB();

        if (!db || !DUA_STORES.includes(storeName)) return null;

        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readonly");
                const request = tx.objectStore(storeName).get(String(key));

                request.onsuccess = () => {
                    resolve(request.result ? request.result.data : null);
                };

                request.onerror = () => resolve(null);
            } catch (error) {
                console.warn("Dua DB read error:", error);
                resolve(null);
            }
        });
    }

    async function duaDBClear(storeName) {
        const db = await openDuaDB();

        if (!db || !DUA_STORES.includes(storeName)) return false;

        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readwrite");
                tx.objectStore(storeName).clear();

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            } catch (error) {
                console.warn("Dua DB clear error:", error);
                resolve(false);
            }
        });
    }

    /* ===================== CACHE SAVE / READ ===================== */

    async function saveDuaCache(storeName, key, data, localKey = null) {
        const saved = await duaDBPut(storeName, key, data);
        const localSaved = localKey ? duaLocalSet(localKey, data) : false;
        return saved || localSaved;
    }

    async function getDuaCache(storeName, key, localKey = null) {
        const dbData = await duaDBGet(storeName, key);

        if (dbData !== null && dbData !== undefined) return dbData;

        if (localKey) {
            const localData = duaLocalGet(localKey);

            if (localData !== null && localData !== undefined) {
                duaDBPut(storeName, key, localData).catch(() => {});
                return localData;
            }
        }

        return null;
    }

    /* ===================== CLEAR CACHE (BOOKMARKS PRESERVED) ===================== */

    async function clearDuaCache() {
        for (const storeName of DUA_STORES) {
            await duaDBClear(storeName);
        }

        try {
            const keys = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (
                    key &&
                    key.startsWith(DUA_LS_PREFIX) &&
                    !key.startsWith(DUA_BOOKMARK_PREFIX)
                ) {
                    keys.push(key);
                }
            }

            keys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn("Dua cache clear error:", error);
        }

        duaCategories = [];
        currentDuaList = [];
        currentDua = null;
        currentDuaCategory = null;

        updateDuaBookmarkButton();
        renderDuaBookmarks();

        showDuaToast(
            "দোয়ার ক্যাশ পরিষ্কার করা হয়েছে। বুকমার্ক সংরক্ষিত আছে।",
            "success",
            4000
        );
    }

    /* ===================== API ===================== */

    async function fetchDuaAPI(endpoint) {
        const controller =
            typeof AbortController !== "undefined"
                ? new AbortController()
                : null;

        let timeoutId = null;

        try {
            const options = {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store"
            };

            if (controller) {
                options.signal = controller.signal;
                timeoutId = setTimeout(() => controller.abort(), 20000);
            }

            const response = await fetch(DUA_API_BASE + endpoint, options);

            if (!response.ok) throw new Error("HTTP " + response.status);

            const result = await response.json();

            if (result && result.success === false) {
                throw new Error(result.message || "API request failed");
            }

            return result;
        } finally {
            if (timeoutId !== null) clearTimeout(timeoutId);
        }
    }

    /* ===================== OFFLINE NOTICE ===================== */

    function showDuaOfflineNotice() {
        let notice = duaElement("duaOfflineNotice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "duaOfflineNotice";
            notice.textContent =
                "📴 অফলাইন মোড — সংরক্ষিত দোয়া দেখানো হচ্ছে";

            notice.style.cssText = `
                position:fixed;left:12px;right:12px;bottom:76px;
                z-index:9999;padding:10px 14px;border-radius:12px;
                background:#333;color:#fff;text-align:center;
                font-size:13px;box-shadow:0 4px 15px rgba(0,0,0,.2);
            `;

            document.body.appendChild(notice);
        }

        notice.style.display = "block";
    }

    function hideDuaOfflineNotice() {
        const notice = duaElement("duaOfflineNotice");
        if (notice) notice.style.display = "none";
    }

    window.addEventListener("offline", showDuaOfflineNotice);
    window.addEventListener("online", hideDuaOfflineNotice);

    /* ===================== PAGE SWITCH ===================== */

    function showPageSafe(pageId) {
        if (typeof window.showPage === "function") {
            window.showPage(pageId);
        } else {
            document.querySelectorAll(".page").forEach(page => {
                page.classList.remove("active");
            });

            const page = duaElement(pageId);
            if (page) page.classList.add("active");
        }

        if (pageId === "bookmarkPage") renderDuaBookmarks();
    }

    /* ===================== CACHE KEYS ===================== */

    const DUA_CATEGORY_DB_KEY = "all_categories";
    const DUA_CATEGORY_LOCAL_KEY = DUA_LS_PREFIX + "categories";

    function getDuaListDBKey(categoryId) {
        return "category_" + String(categoryId);
    }

    function getDuaListLocalKey(categoryId) {
        return DUA_LS_PREFIX + "category_" + String(categoryId);
    }

    function getDuaDetailDBKey(duaId) {
        return "dua_" + String(duaId);
    }

    function getDuaDetailLocalKey(duaId) {
        return DUA_LS_PREFIX + "detail_" + String(duaId);
    }

    function getDuaSearchLocalKey(query) {
        return DUA_LS_PREFIX + "search_" + String(query).toLowerCase();
    }

    /* ===================== ERROR DISPLAY ===================== */

    function renderDuaError(container, message, retry) {
        if (!container) return;

        container.innerHTML = `
            <div class="dua-error">
                <div class="dua-error-icon">⚠️</div>
                <p>${duaEscapeHTML(message)}</p>
                <button type="button" class="dua-retry-btn">
                    আবার চেষ্টা করুন
                </button>
            </div>
        `;

        const button = container.querySelector(".dua-retry-btn");

        if (button) {
            button.addEventListener("click", () => {
                if (typeof retry === "function") retry();
                else loadDuaCategories(true);
            });
        }
    }

    /* ===================== LOAD CATEGORIES ===================== */

    async function loadDuaCategories(forceRefresh = false) {
        const container = duaElement("duaCategoryList");
        if (duaLoadingCategories) return;

        duaLoadingCategories = true;

        try {
            if (!forceRefresh) {
                const cached = await getDuaCache(
                    "categories",
                    DUA_CATEGORY_DB_KEY,
                    DUA_CATEGORY_LOCAL_KEY
                );

                if (Array.isArray(cached) && cached.length) {
                    duaCategories = cached;
                    renderDuaCategories();
                }
            }

            if (isDuaOffline()) {
                if (!duaCategories.length) {
                    renderDuaError(
                        container,
                        "ইন্টারনেট নেই এবং কোনো সংরক্ষিত ক্যাটাগরি পাওয়া যায়নি।"
                    );
                }

                showDuaOfflineNotice();
                return;
            }

            const result = await fetchDuaAPI("/api/categories");

            if (!result || !Array.isArray(result.data)) {
                throw new Error("ক্যাটাগরি ডেটা সঠিক নয়।");
            }

            duaCategories = result.data;

            await saveDuaCache(
                "categories",
                DUA_CATEGORY_DB_KEY,
                duaCategories,
                DUA_CATEGORY_LOCAL_KEY
            );

            renderDuaCategories();
            hideDuaOfflineNotice();
        } catch (error) {
            console.error("Dua categories error:", error);

            if (!duaCategories.length) {
                renderDuaError(
                    container,
                    "দোয়ার ক্যাটাগরি লোড করা যায়নি।",
                    () => loadDuaCategories(true)
                );
            }
        } finally {
            duaLoadingCategories = false;
        }
    }

    /* ===================== RENDER CATEGORIES ===================== */

    function renderDuaCategories() {
        const container = duaElement("duaCategoryList");
        if (!container) return;

        if (!duaCategories.length) {
            container.innerHTML = `
                <div class="dua-empty">
                    <div class="dua-empty-icon">🤲</div>
                    <p>কোনো দোয়ার বিষয় পাওয়া যায়নি।</p>
                </div>
            `;
            return;
        }

        container.innerHTML = duaCategories.map((category, index) => {
            const count = category.dua_count ?? category.count ?? 0;

            return `
                <button class="dua-category-card"
                        data-category-id="${duaEscapeHTML(category.id)}"
                        type="button">
                    <div class="dua-category-number">${index + 1}</div>
                    <div class="dua-category-info">
                        <h3>${duaEscapeHTML(category.name || "দোয়া")}</h3>
                        <p>${duaEscapeHTML(count)}টি দোয়া</p>
                    </div>
                    <div class="dua-category-arrow">›</div>
                </button>
            `;
        }).join("");

        container.querySelectorAll(".dua-category-card").forEach(button => {
            button.addEventListener("click", () => {
                openDuaCategory(button.dataset.categoryId);
            });
        });
    }

    /* ===================== OPEN CATEGORY ===================== */

    async function openDuaCategory(categoryId) {
        const category = duaCategories.find(item =>
            String(item.id) === String(categoryId)
        );

        currentDuaCategory = category || {
            id: categoryId,
            name: "দোয়া"
        };

        duaSetText("duaListTitle", currentDuaCategory.name || "দোয়া");
        duaSetText("duaListSubtitle", "দোয়ার তালিকা");

        showPageSafe("duaListPage");
        await loadDuasByCategory(categoryId);
    }

    /* ===================== LOAD DUA LIST ===================== */

    async function loadDuasByCategory(categoryId, forceRefresh = false) {
        const requestId = ++duaCategoryRequestId;
        const container = duaElement("duaList");

        currentDuaList = [];

        if (!forceRefresh) {
            const cached = await getDuaCache(
                "lists",
                getDuaListDBKey(categoryId),
                getDuaListLocalKey(categoryId)
            );

            if (requestId !== duaCategoryRequestId) return;

            if (Array.isArray(cached)) {
                currentDuaList = cached;
                renderDuaList();
            }
        }

        if (isDuaOffline()) {
            if (!currentDuaList.length) {
                renderDuaError(
                    container,
                    "ইন্টারনেট নেই এবং এই বিষয়ের দোয়া সংরক্ষিত হয়নি।"
                );
            }

            showDuaOfflineNotice();
            return;
        }

        try {
            const result = await fetchDuaAPI(
                `/api/categories/${encodeURIComponent(categoryId)}/duas?page=1&limit=100`
            );

            if (requestId !== duaCategoryRequestId) return;

            if (!result || !Array.isArray(result.data)) {
                throw new Error("দোয়ার তালিকা সঠিক নয়।");
            }

            currentDuaList = result.data;

            await saveDuaCache(
                "lists",
                getDuaListDBKey(categoryId),
                currentDuaList,
                getDuaListLocalKey(categoryId)
            );

            renderDuaList();
            hideDuaOfflineNotice();
        } catch (error) {
            console.error("Dua list error:", error);

            if (!currentDuaList.length) {
                renderDuaError(
                    container,
                    "এই বিষয়ের দোয়া লোড করা যায়নি।",
                    () => loadDuasByCategory(categoryId, true)
                );
            }
        }
    }

    /* ===================== RENDER DUA LIST ===================== */

    function renderDuaList() {
        const container = duaElement("duaList");
        if (!container) return;

        if (!currentDuaList.length) {
            container.innerHTML = `
                <div class="dua-empty">
                    <div class="dua-empty-icon">🤲</div>
                    <p>এই বিষয়ের কোনো দোয়া পাওয়া যায়নি।</p>
                </div>
            `;
            return;
        }

        container.innerHTML = currentDuaList.map((dua, index) => {
            const id = dua.dua_global_id ?? dua.id;
            const title = dua.duaname || dua.name || "দোয়া";
            const subtitle = dua.chapname || "";

            return `
                <button class="dua-list-card"
                        data-dua-id="${duaEscapeHTML(id)}"
                        type="button">
                    <div class="dua-list-number">${index + 1}</div>
                    <div class="dua-list-info">
                        <h3>${duaEscapeHTML(title)}</h3>
                        ${subtitle ? `<p>${duaEscapeHTML(subtitle)}</p>` : ""}
                    </div>
                    <div class="dua-list-arrow">›</div>
                </button>
            `;
        }).join("");

        container.querySelectorAll(".dua-list-card").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.duaId;
                if (!id) return;

                if (String(id).startsWith("category-")) {
                    openDuaCategory(String(id).slice(9));
                    return;
                }

                openDuaReader(id);
            });
        });
    }

    /* ===================== OPEN READER ===================== */

    async function openDuaReader(duaGlobalId) {
        const normalizedId = normalizeDuaId(duaGlobalId);

        if (!normalizedId) {
            showDuaToast("এই দোয়ার ID পাওয়া যায়নি।", "error");
            return;
        }

        const requestId = ++duaReaderRequestId;

        showPageSafe("duaReaderPage");

        const container = duaElement("duaReaderContent");

        if (container) {
            container.innerHTML = `
                <div class="dua-loading">
                    <div class="dua-spinner"></div>
                    <p>দোয়া লোড হচ্ছে...</p>
                </div>
            `;
        }

        duaLocalSet(DUA_LAST_READ_KEY, normalizedId);

        let cached = await getDuaCache(
            "details",
            getDuaDetailDBKey(normalizedId),
            getDuaDetailLocalKey(normalizedId)
        );

        if (requestId !== duaReaderRequestId) return;

        if (cached && typeof cached === "object") {
            currentDua = {
                ...cached,
                dua_global_id:
                    cached.dua_global_id ?? cached.id ?? normalizedId
            };
            renderDuaReader();
        }

        if (isDuaOffline()) {
            if (!cached) {
                renderDuaError(
                    container,
                    "ইন্টারনেট নেই এবং এই দোয়াটি সংরক্ষিত হয়নি।"
                );
            }

            showDuaOfflineNotice();
            return;
        }

        try {
            const result = await fetchDuaAPI(
                `/api/duas/${encodeURIComponent(normalizedId)}`
            );

            if (requestId !== duaReaderRequestId) return;

            if (!result || !result.data) {
                throw new Error("দোয়ার বিস্তারিত পাওয়া যায়নি।");
            }

            currentDua = {
                ...result.data,
                dua_global_id:
                    result.data.dua_global_id ??
                    result.data.id ??
                    normalizedId
            };

            await saveDuaCache(
                "details",
                getDuaDetailDBKey(normalizedId),
                currentDua,
                getDuaDetailLocalKey(normalizedId)
            );

            renderDuaReader();
            hideDuaOfflineNotice();
        } catch (error) {
            console.error("Dua reader error:", error);

            if (!cached) {
                renderDuaError(
                    container,
                    "দোয়াটি লোড করা যায়নি।",
                    () => openDuaReader(normalizedId)
                );
            } else {
                showDuaOfflineNotice();
            }
        }
    }

    /* ===================== RENDER READER ===================== */

    function renderDuaReader() {
        const container = duaElement("duaReaderContent");
        if (!container || !currentDua) return;

        duaSetText(
            "duaReaderTitle",
            currentDua.duaname || currentDua.name || "দোয়া"
        );

        duaSetText("duaReaderSubtitle", currentDua.chapname || "");
        updateDuaBookmarkButton();

        const segments = Array.isArray(currentDua.segments)
            ? currentDua.segments
            : [];

        let html = `
            <div class="dua-reader-heading">
                <h2>${duaEscapeHTML(
                    currentDua.duaname || currentDua.name || "দোয়া"
                )}</h2>
                ${currentDua.chapname
                    ? `<p>${duaEscapeHTML(currentDua.chapname)}</p>`
                    : ""}
            </div>
        `;

        if (!segments.length) {
            html += `
                <div class="dua-empty">
                    <div class="dua-empty-icon">🤲</div>
                    <p>এই দোয়ার বিস্তারিত তথ্য পাওয়া যায়নি।</p>
                </div>
            `;

            container.innerHTML = html;
            return;
        }

        html += segments.map(renderDuaSegment).join("");
        container.innerHTML = html;

        container.querySelectorAll(".dua-word-toggle").forEach(button => {
            button.addEventListener("click", () => {
                toggleDuaWords(button.dataset.segmentId);
            });
        });
    }

    /* ===================== RENDER SEGMENT ===================== */

    function renderDuaSegment(segment, index) {
        const segmentId = String(
            segment.dua_segment_id ?? segment.id ?? index
        );

        const arabic = segment.arabic || segment.arabic_diacless || "";
        const words = Array.isArray(segment.words) ? segment.words : [];

        let html = `
            <div class="dua-segment-card">
                <div class="dua-segment-number">${index + 1}</div>
        `;

        if (segment.top) {
            html += `<div class="dua-top-text">${duaEscapeHTML(segment.top)}</div>`;
        }

        if (arabic) {
            html += `<div class="dua-arabic" dir="rtl">${duaEscapeHTML(arabic)}</div>`;
        }

        if (segment.transliteration) {
            html += `
                <div class="dua-transliteration">
                    <strong>উচ্চারণ:</strong>
                    <div>${duaEscapeHTML(segment.transliteration)}</div>
                </div>
            `;
        }

        if (segment.translations) {
            const translations = Array.isArray(segment.translations)
                ? segment.translations.map(item => {
                    if (typeof item === "string") return item;
                    return item.text || item.translation || item.bn || "";
                }).filter(Boolean).join("\n")
                : segment.translations;

            html += `
                <div class="dua-translation">
                    <span class="dua-label">বাংলা অর্থ</span>
                    <div>${duaEscapeHTML(translations)}</div>
                </div>
            `;
        }

        if (words.length) {
            html += `
                <button type="button"
                        class="dua-word-toggle"
                        data-segment-id="${duaEscapeHTML(segmentId)}">
                    📖 শব্দে শব্দে অর্থ দেখুন
                </button>

                <div id="duaWords-${duaEscapeHTML(segmentId)}"
                     class="dua-words-panel" style="display:none">
                    <div class="dua-words-grid">
                        ${words.map(word => `
                            <div class="dua-word-item">
                                <span class="dua-word-arabic" dir="rtl">
                                    ${duaEscapeHTML(word.arabic || word.ar || "")}
                                </span>
                                <span class="dua-word-bn">
                                    ${duaEscapeHTML(
                                        word.bn || word.translation || word.meaning || ""
                                    )}
                                </span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        if (segment.bottom) {
            html += `<div class="dua-bottom-text">${duaEscapeHTML(segment.bottom)}</div>`;
        }

        return html + "</div>";
    }

    /* ===================== WORD-BY-WORD TOGGLE ===================== */

    function toggleDuaWords(segmentId) {
        const panel = duaElement("duaWords-" + segmentId);
        if (!panel) return;

        panel.style.display =
            panel.style.display === "none" ? "block" : "none";
    }

    /* ===================== SEARCH ===================== */

    async function searchDuas(query) {
        query = String(query || "").trim();
        if (!query) return;

        const requestId = ++duaSearchRequestId;

        showPageSafe("duaListPage");
        duaSetText("duaListTitle", "দোয়া অনুসন্ধান");
        duaSetText("duaListSubtitle", "“" + query + "”");

        const container = duaElement("duaList");

        if (container) {
            container.innerHTML = `
                <div class="dua-loading"><p>দোয়া খোঁজা হচ্ছে...</p></div>
            `;
        }

        const cacheKey = "search_" + query.toLowerCase();
        const localKey = getDuaSearchLocalKey(query);

        const cached = await getDuaCache("search", cacheKey, localKey);

        if (requestId !== duaSearchRequestId) return;

        if (Array.isArray(cached)) {
            currentDuaList = cached;
            renderDuaList();
        }

        if (isDuaOffline()) {
            if (!Array.isArray(cached)) {
                currentDuaList = await searchDuaOffline(query);
                if (requestId === duaSearchRequestId) renderDuaList();
            }

            showDuaOfflineNotice();
            return;
        }

        try {
            const result = await fetchDuaAPI(
                `/api/search?q=${encodeURIComponent(query)}&page=1&limit=100`
            );

            if (requestId !== duaSearchRequestId) return;

            currentDuaList = Array.isArray(result.data) ? result.data : [];

            await saveDuaCache(
                "search",
                cacheKey,
                currentDuaList,
                localKey
            );

            renderDuaList();
            hideDuaOfflineNotice();
        } catch (error) {
            console.error("Dua search error:", error);

            if (!Array.isArray(cached)) {
                currentDuaList = await searchDuaOffline(query);
                if (requestId === duaSearchRequestId) renderDuaList();
            }
        }
    }

    /* ===================== OFFLINE SEARCH ===================== */

    async function searchDuaOffline(query) {
        const q = String(query || "").toLowerCase().trim();
        if (!q) return [];

        const results = [];
        const seen = new Set();

        function addResult(dua) {
            const id = String(dua.dua_global_id ?? dua.id ?? "");
            if (!id || seen.has(id)) return;

            seen.add(id);
            results.push(dua);
        }

        const categories = duaCategories.length
            ? duaCategories
            : (await getDuaCache(
                "categories",
                DUA_CATEGORY_DB_KEY,
                DUA_CATEGORY_LOCAL_KEY
            )) || [];

        for (const category of categories) {
            if (String(category.name || "").toLowerCase().includes(q)) {
                addResult({
                    dua_global_id: "category-" + category.id,
                    duaname: category.name,
                    chapname:
                        String(category.dua_count || category.count || 0) +
                        "টি দোয়া"
                });
            }

            const list = await getDuaCache(
                "lists",
                getDuaListDBKey(category.id),
                getDuaListLocalKey(category.id)
            );

            if (!Array.isArray(list)) continue;

            for (const dua of list) {
                const searchable = [
                    dua.duaname,
                    dua.chapname,
                    Array.isArray(dua.tags) ? dua.tags.join(" ") : dua.tags,
                    JSON.stringify(dua.translations || "")
                ].join(" ").toLowerCase();

                if (searchable.includes(q)) addResult(dua);
            }
        }

        return results;
    }

    /* ===================== BOOKMARK — GET ===================== */

    function getDuaBookmarks() {
        const bookmarks = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (!key || !key.startsWith(DUA_BOOKMARK_PREFIX)) continue;

                const dua = duaLocalGet(key);
                if (!dua || typeof dua !== "object") continue;

                const id = key.slice(DUA_BOOKMARK_PREFIX.length);

                bookmarks.push({
                    key,
                    id,
                    dua: {
                        ...dua,
                        dua_global_id: dua.dua_global_id ?? dua.id ?? id
                    }
                });
            }
        } catch (error) {
            console.warn("Dua bookmark read error:", error);
        }

        return bookmarks;
    }

    /* ===================== BOOKMARK — BUTTON ===================== */

    function updateDuaBookmarkButton() {
        const button = duaElement("duaBookmarkBtn");
        if (!button) return;

        const id = currentDua
            ? normalizeDuaId(currentDua.dua_global_id ?? currentDua.id)
            : null;

        if (!id) {
            button.textContent = "🔖 বুকমার্ক";
            button.setAttribute("aria-pressed", "false");
            return;
        }

        const saved = !!duaLocalGet(DUA_BOOKMARK_PREFIX + id);

        button.textContent = saved ? "🔖 সংরক্ষিত" : "🔖 বুকমার্ক";
        button.setAttribute("aria-pressed", saved ? "true" : "false");
    }

    /* ===================== BOOKMARK — RENDER =====================
       আলাদা #duaBookmarkSection ব্যবহার করবে।
       Quran-এর #bookmarkList overwrite করবে না।
    =============================================================== */

    function renderDuaBookmarks() {
        const bookmarkPage = duaElement("bookmarkPage");

        if (!bookmarkPage) {
            console.warn("Dua bookmarks: #bookmarkPage পাওয়া যায়নি।");
            return;
        }

        let container = duaElement("duaBookmarkSection");

        if (!container || !bookmarkPage.contains(container)) {
            container = document.createElement("section");
            container.id = "duaBookmarkSection";
            container.className = "dua-bookmark-list";

            const quranBookmarkList = duaElement("bookmarkList");

            if (quranBookmarkList && bookmarkPage.contains(quranBookmarkList)) {
                quranBookmarkList.insertAdjacentElement("afterend", container);
            } else {
                bookmarkPage.appendChild(container);
            }
        }

        const bookmarks = getDuaBookmarks();

        if (!bookmarks.length) {
            container.innerHTML = `
                <div class="dua-bookmark-empty">
                    <div class="bookmark-empty-icon">🤲</div>
                    <div class="bookmark-empty-title">কোনো দোয়া বুকমার্ক নেই</div>
                    <div class="bookmark-empty-text">
                        প্রথমে একটি দোয়া খুলে 🔖 বুকমার্ক বাটনে চাপ দিন।
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="dua-bookmark-heading">
                <h3>🤲 দোয়ার বুকমার্ক</h3>
                <span>${bookmarks.length}টি</span>
            </div>

            <div class="dua-bookmark-items">
                ${bookmarks.map((item, index) => `
                    <div class="dua-bookmark-item">
                        <button type="button"
                                class="dua-bookmark-open"
                                data-dua-bookmark-id="${duaEscapeHTML(item.id)}">
                            <span class="dua-bookmark-number">${index + 1}</span>
                            <span class="dua-bookmark-info">
                                <strong>${duaEscapeHTML(
                                    item.dua.duaname || item.dua.name || "দোয়া"
                                )}</strong>
                                <small>${duaEscapeHTML(item.dua.chapname || "")}</small>
                            </span>
                            <span class="dua-bookmark-arrow">›</span>
                        </button>

                        <button type="button"
                                class="dua-bookmark-remove"
                                data-remove-dua-bookmark="${duaEscapeHTML(item.id)}"
                                aria-label="বুকমার্ক সরান"
                                title="বুকমার্ক সরান">🗑️</button>
                    </div>
                `).join("")}
            </div>
        `;

        container.querySelectorAll(".dua-bookmark-open").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.duaBookmarkId;
                if (id) openDuaReader(id);
            });
        });

        container.querySelectorAll(".dua-bookmark-remove").forEach(button => {
            button.addEventListener("click", () => {
                const id = normalizeDuaId(button.dataset.removeDuaBookmark);
                if (id) showDuaRemoveConfirmation(id);
            });
        });
    }

    /* ===================== BOOKMARK — TOGGLE ===================== */

    function toggleDuaBookmark() {
        if (!currentDua) {
            showDuaToast("আগে একটি দোয়া খুলুন।", "warning");
            return;
        }

        const id = normalizeDuaId(
            currentDua.dua_global_id ?? currentDua.id
        );

        if (!id) {
            showDuaToast("এই দোয়ার ID পাওয়া যায়নি।", "error");
            return;
        }

        const key = DUA_BOOKMARK_PREFIX + id;
        const existing = duaLocalGet(key);

        if (existing) {
            duaLocalRemove(key);
            updateDuaBookmarkButton();
            renderDuaBookmarks();
            showDuaToast("বুকমার্ক সরানো হয়েছে।", "info");
            return;
        }

        const duaToSave = {
            ...currentDua,
            dua_global_id: id
        };

        if (!duaLocalSet(key, duaToSave)) {
            showDuaToast(
                "বুকমার্ক সংরক্ষণ করা যায়নি। ফোনের স্টোরেজ পরীক্ষা করুন।",
                "error",
                4500
            );
            return;
        }

        updateDuaBookmarkButton();
        renderDuaBookmarks();
        showDuaToast("দোয়া বুকমার্ক করা হয়েছে।", "success");
    }

    /* ===================== CUSTOM REMOVE CONFIRMATION ===================== */

    function showDuaRemoveConfirmation(id) {
        id = normalizeDuaId(id);
        if (!id) return;

        const oldDialog = duaElement("duaRemoveConfirmOverlay");
        if (oldDialog) oldDialog.remove();

        const overlay = document.createElement("div");
        overlay.id = "duaRemoveConfirmOverlay";
        overlay.className = "dua-confirm-overlay";

        overlay.style.cssText = `
            position:fixed;inset:0;z-index:100030;
            display:flex;align-items:center;justify-content:center;
            padding:20px;background:rgba(0,0,0,.58);
        `;

        overlay.innerHTML = `
            <div class="dua-confirm-box" role="dialog" aria-modal="true"
                 aria-labelledby="duaConfirmTitle"
                 style="width:100%;max-width:380px;box-sizing:border-box;
                 background:var(--card-bg,#fff);color:var(--text-color,#222);
                 padding:24px;border-radius:18px;text-align:center;
                 box-shadow:0 12px 40px rgba(0,0,0,.25)">
                <div class="dua-confirm-icon" style="font-size:34px">🤲</div>
                <h3 id="duaConfirmTitle">বুকমার্ক সরাবেন?</h3>
                <p>এই দোয়াটি বুকমার্ক তালিকা থেকে সরিয়ে দেওয়া হবে।</p>
                <div class="dua-confirm-actions"
                     style="display:flex;gap:10px;justify-content:center;margin-top:20px">
                    <button type="button" class="dua-confirm-cancel"
                            id="duaConfirmCancel"
                            style="padding:11px 18px;border:0;border-radius:10px;
                            background:#ddd;color:#222">বাতিল</button>
                    <button type="button" class="dua-confirm-remove"
                            id="duaConfirmRemove"
                            style="padding:11px 18px;border:0;border-radius:10px;
                            background:#b3261e;color:#fff">সরিয়ে দিন</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        function closeDialog() {
            overlay.remove();
        }

        duaElement("duaConfirmCancel").addEventListener("click", closeDialog);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeDialog();
        });

        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") closeDialog();
        });

        duaElement("duaConfirmRemove").addEventListener("click", () => {
            duaLocalRemove(DUA_BOOKMARK_PREFIX + id);
            closeDialog();
            renderDuaBookmarks();
            updateDuaBookmarkButton();
            showDuaToast("বুকমার্ক থেকে দোয়াটি সরানো হয়েছে।", "success");
        });

        duaElement("duaConfirmCancel").focus();
    }

    /* ===================== DOWNLOAD PROGRESS ===================== */

    function updateDuaDownloadProgress(current, total, message) {
        const progress = duaElement("duaDownloadProgress");
        const fill = duaElement("duaDownloadProgressFill");
        const text = duaElement("duaDownloadProgressText");
        const percent = duaElement("duaDownloadPercent");

        if (progress) progress.style.display = "block";

        const value = total > 0
            ? Math.min(100, Math.round(current / total * 100))
            : 0;

        if (fill) fill.style.width = value + "%";
        if (percent) percent.textContent = value + "%";
        if (text) text.textContent = message || "ডাউনলোড হচ্ছে...";
    }

    /* ===================== DOWNLOAD ALL FOR OFFLINE ===================== */

    async function downloadAllDuasOffline() {
        if (duaDownloadingAll) return;

        if (isDuaOffline()) {
            showDuaToast(
                "সব দোয়া অফলাইনে সংরক্ষণ করতে ইন্টারনেট চালু করুন।",
                "warning",
                4000
            );
            return;
        }

        const button = duaElement("duaDownloadAllBtn");
        const status = duaElement("duaDownloadStatus");

        duaDownloadingAll = true;

        if (button) {
            button.disabled = true;
            button.textContent = "সংরক্ষণ হচ্ছে...";
        }

        if (status) status.textContent = "দোয়ার তালিকা সংগ্রহ করা হচ্ছে...";

        let savedDuas = 0;
        let failedDuas = 0;
        let totalDuas = 0;
        let categories = [];

        try {
            updateDuaDownloadProgress(0, 1, "দোয়ার ক্যাটাগরি সংগ্রহ করা হচ্ছে...");

            const categoryResult = await fetchDuaAPI("/api/categories");

            if (!categoryResult || !Array.isArray(categoryResult.data)) {
                throw new Error("দোয়ার ক্যাটাগরি পাওয়া যায়নি।");
            }

            categories = categoryResult.data;
            duaCategories = categories;

            await saveDuaCache(
                "categories",
                DUA_CATEGORY_DB_KEY,
                categories,
                DUA_CATEGORY_LOCAL_KEY
            );

            const allDuas = new Map();

            // STEP 1: প্রতিটি ক্যাটাগরির সব পৃষ্ঠা থেকে দোয়া সংগ্রহ।
            for (let i = 0; i < categories.length; i++) {
                if (isDuaOffline()) {
                    throw new Error("ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে।");
                }

                const category = categories[i];

                updateDuaDownloadProgress(
                    i,
                    categories.length,
                    `${i + 1}/${categories.length} — ${category.name || "দোয়া"}`
                );

                let page = 1;
                const categoryItems = [];

                while (true) {
                    if (isDuaOffline()) {
                        throw new Error("ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে।");
                    }

                    const result = await fetchDuaAPI(
                        `/api/categories/${encodeURIComponent(category.id)}/duas?page=${page}&limit=100`
                    );

                    const items = Array.isArray(result.data) ? result.data : [];
                    categoryItems.push(...items);

                    if (items.length < 100) break;

                    page++;

                    if (page > 1000) {
                        throw new Error("অস্বাভাবিক pagination পাওয়া গেছে।");
                    }
                }

                await saveDuaCache(
                    "lists",
                    getDuaListDBKey(category.id),
                    categoryItems,
                    getDuaListLocalKey(category.id)
                );

                categoryItems.forEach(dua => {
                    const id = dua.dua_global_id ?? dua.id;

                    if (id !== undefined && id !== null) {
                        allDuas.set(String(id), {
                            ...dua,
                            dua_global_id: String(id)
                        });
                    }
                });
            }

            const uniqueDuas = Array.from(allDuas.values());
            totalDuas = uniqueDuas.length;

            if (!totalDuas) {
                throw new Error("কোনো দোয়ার তালিকা পাওয়া যায়নি।");
            }

            // STEP 2: প্রতিটি দোয়ার বিস্তারিত ক্যাশ করা।
            for (let i = 0; i < uniqueDuas.length; i++) {
                if (isDuaOffline()) {
                    throw new Error("ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে।");
                }

                const dua = uniqueDuas[i];
                const duaId = normalizeDuaId(dua.dua_global_id);

                if (!duaId) {
                    failedDuas++;
                    continue;
                }

                updateDuaDownloadProgress(
                    i,
                    totalDuas,
                    `দোয়া ${i + 1}/${totalDuas} সংরক্ষণ হচ্ছে...`
                );

                try {
                    const result = await fetchDuaAPI(
                        `/api/duas/${encodeURIComponent(duaId)}`
                    );

                    if (!result || !result.data) {
                        throw new Error("দোয়ার বিস্তারিত পাওয়া যায়নি।");
                    }

                    const detail = {
                        ...result.data,
                        dua_global_id:
                            result.data.dua_global_id ??
                            result.data.id ??
                            duaId
                    };

                    const saved = await saveDuaCache(
                        "details",
                        getDuaDetailDBKey(duaId),
                        detail,
                        getDuaDetailLocalKey(duaId)
                    );

                    if (saved) savedDuas++;
                    else failedDuas++;
                } catch (error) {
                    failedDuas++;
                    console.warn("Dua detail download failed:", duaId, error);
                }

                if (status) {
                    status.textContent =
                        `${savedDuas}টি সংরক্ষিত, ${failedDuas}টি ব্যর্থ`;
                }

                await duaSleep(60);
            }

            const complete = failedDuas === 0;

            await duaDBPut("meta", "download_all", {
                completed: complete,
                totalCategories: categories.length,
                totalDuas: savedDuas,
                failedDuas,
                savedAt: Date.now()
            });

            updateDuaDownloadProgress(
                totalDuas,
                totalDuas,
                complete
                    ? "সব দোয়া অফলাইনের জন্য সংরক্ষিত হয়েছে।"
                    : "ডাউনলোড শেষ; কিছু দোয়া সংরক্ষণ করা যায়নি।"
            );

            if (status) {
                status.textContent =
                    `${savedDuas}টি সংরক্ষিত, ${failedDuas}টি ব্যর্থ`;
            }

            if (button) {
                button.disabled = false;
                button.textContent = complete ? "✓ সংরক্ষিত" : "আবার চেষ্টা করুন";
            }

            showDuaToast(
                `দোয়া ডাউনলোড শেষ হয়েছে।\nক্যাটাগরি: ${categories.length}\nসংরক্ষিত: ${savedDuas}\nব্যর্থ: ${failedDuas}`,
                failedDuas ? "warning" : "success",
                6000
            );
        } catch (error) {
            console.error("Download all Dua error:", error);

            if (status) {
                status.textContent =
                    "ডাউনলোড সম্পূর্ণ হয়নি: " +
                    (error.message || "অজানা সমস্যা");
            }

            if (button) {
                button.disabled = false;
                button.textContent = "আবার সংরক্ষণ";
            }

            updateDuaDownloadProgress(
                savedDuas,
                Math.max(totalDuas, 1),
                "ডাউনলোড থেমে গেছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
            );

            showDuaToast(
                "দোয়া অফলাইনে সংরক্ষণ করা যায়নি।\n" +
                (error.message || "অজানা সমস্যা"),
                "error",
                5000
            );
        } finally {
            duaDownloadingAll = false;
        }
    }

    /* ===================== DOWNLOAD STATUS ===================== */

    async function updateDuaDownloadStatus() {
        const button = duaElement("duaDownloadAllBtn");
        const status = duaElement("duaDownloadStatus");
        const meta = await duaDBGet("meta", "download_all");

        if (!meta) return;

        if (status) {
            status.textContent =
                `${meta.totalDuas || 0}টি সংরক্ষিত, ` +
                `${meta.failedDuas || 0}টি ব্যর্থ`;
        }

        if (button && meta.completed) {
            button.textContent = "✓ সংরক্ষিত";
        }
    }

    /* ===================== BUTTON BINDING ===================== */

    function bindDuaButton(id, handler) {
        const button = duaElement(id);

        if (!button || button.dataset.duaBound === "1") return;

        button.dataset.duaBound = "1";
        button.addEventListener("click", handler);
    }

    function setupDuaButtons() {
        bindDuaButton("duaPageBack", () => showPageSafe("homePage"));

        bindDuaButton("duaListBack", () => {
            showPageSafe("duaPage");
            renderDuaCategories();
        });

        bindDuaButton("duaReaderBack", () => {
            showPageSafe("duaListPage");
            renderDuaList();
        });

        bindDuaButton("duaSearchBtn", openDuaSearch);
        bindDuaButton("duaListSearchBtn", openDuaSearch);
        bindDuaButton("duaBookmarkBtn", toggleDuaBookmark);
        bindDuaButton("duaDownloadAllBtn", downloadAllDuasOffline);
    }

    /* ===================== INIT ===================== */

    async function initDuaModule() {
        await openDuaDB();

        const cached = await getDuaCache(
            "categories",
            DUA_CATEGORY_DB_KEY,
            DUA_CATEGORY_LOCAL_KEY
        );

        if (Array.isArray(cached)) duaCategories = cached;

        setupDuaButtons();

        if (isDuaOffline()) showDuaOfflineNotice();

        await updateDuaDownloadStatus();

        const bookmarkPage = duaElement("bookmarkPage");

        if (bookmarkPage && bookmarkPage.classList.contains("active")) {
            renderDuaBookmarks();
        }

        console.log("Quran Sharif Dua module ready.");
        console.log("Dua cache: IndexedDB + LocalStorage");
    }

    /* ===================== GLOBAL EXPORTS ===================== */

    window.loadDuaCategories = loadDuaCategories;
    window.renderDuaCategories = renderDuaCategories;
    window.openDuaCategory = openDuaCategory;
    window.loadDuasByCategory = loadDuasByCategory;
    window.renderDuaList = renderDuaList;
    window.openDuaReader = openDuaReader;
    window.renderDuaReader = renderDuaReader;
    window.searchDuas = searchDuas;
    window.openDuaSearch = openDuaSearch;
    window.toggleDuaWords = toggleDuaWords;
    window.clearDuaCache = clearDuaCache;
    window.downloadAllDuasOffline = downloadAllDuasOffline;
    window.getDuaCache = getDuaCache;
    window.saveDuaCache = saveDuaCache;
    window.searchDuaOffline = searchDuaOffline;

    window.getDuaBookmarks = getDuaBookmarks;
    window.renderDuaBookmarks = renderDuaBookmarks;
    window.toggleDuaBookmark = toggleDuaBookmark;
    window.updateDuaBookmarkButton = updateDuaBookmarkButton;
    window.showDuaRemoveConfirmation = showDuaRemoveConfirmation;
    window.showDuaToast = showDuaToast;

    /* ===================== STARTUP ===================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initDuaModule,
            { once: true }
        );
    } else {
        initDuaModule();
    }
})();