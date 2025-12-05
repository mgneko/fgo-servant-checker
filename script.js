const app = (function() {
    
    // ==========================================
    // 1. 資料庫與設定 (Database & Config)
    // ==========================================
    const servents = {
        'saber': [2, 8, 68, 76, 90, 91, 153, 160, 213, 234, 270, 278, 299, 302, 317, 337, 343, 384, 402, 432, 445, 456],
        'archer': [12, 60, 77, 84, 129, 142, 156, 212, 216, 272, 276, 350, 375, 383, 394, 427, 450],
        'lancer': [70, 85, 88, 119, 128, 143, 196, 232, 280, 300, 312, 329, 368, 381, 433, 442, 457],
        'rider': [65, 99, 108, 118, 144, 179, 205, 206, 241, 253, 274, 277, 296, 331, 342, 349, 397, 406, 452],
        'caster': [37, 62, 113, 127, 136, 150, 169, 175, 201, 215, 237, 284, 307, 327, 385, 415, 435],
        'assassin': [75, 86, 112, 139, 154, 189, 199, 235, 239, 314, 365, 371, 380, 453],
        'berserker': [51, 52, 97, 98, 114, 155, 161, 226, 247, 261, 306, 309, 355, 362, 386, 429, 440],
        'ruler': [59, 93, 173, 229, 265, 292, 305, 346, 357, 374, 390, 400, 438],
        'avenger': [96, 106, 250, 268, 303, 321, 370, 403, 407, 409],
        'alterego': [163, 167, 209, 224, 238, 297, 336, 339, 369, 376, 416, 426],
        'foreigner': [195, 198, 275, 281, 289, 295, 324, 334, 373, 393, 413],
        'mooncancer': [220, 244, 285, 351, 418, 421, 448],
        'pretender': [316, 353, 431, 437, 441, 459],
        'beast': [377, 417],
        'unbeast':[444],
        'shielder': []
    };

    // 台版開放進度 (對應 Array Index)
    const twReleaseLimit = {
        'saber': 19, 'archer': 15, 'lancer': 14, 'rider': 18, 'caster': 15, 'assassin': 13, 'berserker': 15,
        'ruler': 12, 'avenger': 8, 'alterego': 10, 'foreigner': 10, 'mooncancer': 4, 'pretender': 2,
        'beast': 1, 'unbeast': 0, 'shielder': 0
    };

    // 職階顏色定義
    const classColors = {
        saber: '1a237e', archer: 'b71c1c', lancer: '1b5e20', rider: 'f57f17', 
        caster: '4a148c', assassin: '212121', berserker: '880e4f', 
        ruler: 'fdd835', avenger: '3e2723', alterego: '8e24aa', 
        foreigner: '263238', mooncancer: 'd81b60', pretender: '01579b',
        beast: '8e0000', unbeast: '37474f', shielder: '7e57c2'
    };

    // ★ 活動/福袋設定 (Campaigns)
    const campaigns = {
        'default': {
            name: '一般檢視 (依職階)',
            type: 'class'
        },
        // 範例：您可以根據遊戲公告新增 (ID 需對應 servents 中的 ID)
        'gssr_example': {
            name: '【範例】職階分組福袋',
            type: 'custom',
            groups: {
                '三騎士 (劍弓槍)': [...servents['saber'], ...servents['archer'], ...servents['lancer']],
                '四騎士 (騎術殺狂)': [...servents['rider'], ...servents['caster'], ...servents['assassin'], ...servents['berserker']],
                'EX 職階': [...servents['ruler'], ...servents['avenger'], ...servents['alterego'], ...servents['foreigner'], ...servents['mooncancer'], ...servents['pretender']]
            }
        }
    };

    // 預設職階順序
    const defaultClassOrder = [
        'saber', 'archer', 'lancer', 'rider', 'caster', 'assassin', 'berserker', 
        'ruler', 'avenger', 'alterego', 'foreigner', 'mooncancer', 'pretender',
        'beast', 'unbeast', 'shielder'
    ];

    // 圖示產生邏輯
    const classIcons = {};
    defaultClassOrder.forEach(cls => {
        const letter = cls.charAt(0).toUpperCase();
        classIcons[cls] = `images/class/${cls}.png`;
    });

    // ==========================================
    // 2. 應用程式狀態 (State Management)
    // ==========================================
    let servantsData = []; // 扁平化資料索引
    let userState = { owned: {}, marks: {} };
    let currentMode = 'edit_np'; 
    let currentServer = 'JP';
    let currentCampaign = 'default';

    const STORAGE_KEY = 'fgo_checker_data_v1';

    // 讀取存檔
    function loadData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.owned) userState.owned = parsed.owned;
                if (parsed.marks) userState.marks = parsed.marks;
                if (parsed.server) {
                    currentServer = parsed.server;
                    // 延遲更新 UI
                    setTimeout(() => updateServerUI(), 0);
                }
            } catch (e) {
                console.error('讀取存檔失敗', e);
            }
        }
    }

    // 儲存存檔
    function saveData() {
        const dataToSave = {
            owned: userState.owned,
            marks: userState.marks,
            server: currentServer
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function updateServerUI() {
        const btnTW = document.getElementById('btn-server-tw');
        const btnJP = document.getElementById('btn-server-jp');
        if (btnTW && btnJP) {
            btnTW.classList.remove('active');
            btnJP.classList.remove('active');
            document.getElementById(currentServer === 'TW' ? 'btn-server-tw' : 'btn-server-jp').classList.add('active');
        }
    }

    // 初始化資料與 UI
    function initData() {
        servantsData = [];
        for (const [cls, ids] of Object.entries(servents)) {
            if (Array.isArray(ids)) {
                const limit = twReleaseLimit[cls] || 0;
                ids.forEach((id, index) => {
                    servantsData.push({
                        id: id,
                        name: `No.${id}`, 
                        class: cls,
                        isFuture: index >= limit,
                        img: `images/servents/${id}.png`
                    });
                });
            }
        }
        
        // 初始化活動選單
        initCampaignSelect();
        
        // 讀取存檔
        loadData();
        
        // 強制初次渲染
        render();
    }

    function initCampaignSelect() {
        const select = document.getElementById('campaign-select');
        if (!select) return; // 若 HTML 沒有這個 select 則跳過
        select.innerHTML = '';
        Object.keys(campaigns).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = campaigns[key].name;
            select.appendChild(option);
        });
        select.value = currentCampaign;
    }

    function detectLanguage() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        const lang = navigator.language || navigator.userLanguage;
        if (lang.includes('zh') || lang.includes('ZH')) {
            setServer('TW');
        } else {
            setServer('JP');
        }
    }

    // ==========================================
    // 3. 渲染核心 (Rendering & Stats)
    // ==========================================
    function render() {
        const appEl = document.getElementById('capture-area');
        appEl.innerHTML = ''; 
        
        const campaignConfig = campaigns[currentCampaign] || campaigns['default'];
        const isCustomCampaign = campaignConfig.type === 'custom';

        // 準備要渲染的群組
        let groupsToRender = {};
        let orderToRender = [];

        if (!isCustomCampaign) {
            // 一般模式
            let visibleList = servantsData;
            if (currentServer === 'TW') {
                visibleList = servantsData.filter(s => !s.isFuture);
            }
            groupsToRender = groupBy(visibleList, 'class');
            orderToRender = defaultClassOrder;
        } else {
            // 福袋模式 (依設定檔)
            Object.keys(campaignConfig.groups).forEach(poolName => {
                const ids = campaignConfig.groups[poolName];
                // 從總表反查 ID 取得角色物件，並過濾掉 undefined
                const poolServants = ids.map(id => servantsData.find(s => s.id === id)).filter(s => s);
                
                // 若需在福袋中也隱藏未實裝角色，請打開下方註解
                /*
                if (currentServer === 'TW') {
                    poolServants = poolServants.filter(s => !s.isFuture);
                }
                */

                if (poolServants.length > 0) {
                    groupsToRender[poolName] = poolServants;
                    orderToRender.push(poolName);
                }
            });
        }

        // 開始繪製區塊
        orderToRender.forEach(groupKey => {
            const list = groupsToRender[groupKey];
            if (!list || list.length === 0) return;

            const section = document.createElement('section');
            section.className = 'class-section';
            
            // 標題 HTML
            let headerHtml = '';
            if (!isCustomCampaign) {
                const iconUrl = classIcons[groupKey] || classIcons['saber'];
                headerHtml = `<div class="class-header"><img src="${iconUrl}" class="class-icon-img" alt="${groupKey}"></div>`;
            } else {
                headerHtml = `<div class="class-header"><h3 style="color:#ffd700; margin:0; font-size:1.1rem; border-left:4px solid #e94560; padding-left:10px;">${groupKey}</h3></div>`;
            }

            // ★ 機率期望值儀表板 (Dashboard)
            const total = list.length;
            const newCount = list.filter(s => !userState.owned[s.id]).length;
            const newRate = total > 0 ? ((newCount / total) * 100).toFixed(1) : 0;
            
            const wantedCount = list.filter(s => userState.marks[s.id] === 'wanted').length;
            const wantedRate = total > 0 ? ((wantedCount / total) * 100).toFixed(1) : 0;

            const np5Count = list.filter(s => userState.owned[s.id] >= 5).length;
            const np5Rate = total > 0 ? ((np5Count / total) * 100).toFixed(1) : 0;

            const statsHtml = `
                <div class="pool-stats">
                    <div class="stat-item type-new">
                        <span class="stat-label">New (未召喚)</span>
                        <span class="stat-value">${newRate}%</span>
                        <span class="stat-count">${newCount}/${total}</span>
                    </div>
                    <div class="stat-item type-wanted">
                        <span class="stat-label">Jackpot (想要)</span>
                        <span class="stat-value">${wantedRate}%</span>
                        <span class="stat-count">${wantedCount}/${total}</span>
                    </div>
                    <div class="stat-item type-np5">
                        <span class="stat-label">Bomb (已滿寶)</span>
                        <span class="stat-value">${np5Rate}%</span>
                        <span class="stat-count">${np5Count}/${total}</span>
                    </div>
                </div>
            `;

            section.innerHTML = `
                ${headerHtml}
                ${statsHtml}
                <div class="servant-grid"></div>
            `;
            
            appEl.appendChild(section);
            const grid = section.querySelector('.servant-grid');
            
            list.forEach(servant => grid.appendChild(createCard(servant)));
        });
        
        updateStats();
    }

    function createCard(servant) {
        const div = document.createElement('div');
        const np = userState.owned[servant.id] || 0;
        const mark = userState.marks[servant.id] || null;
        div.className = `servant-card ${np > 0 ? 'owned' : 'not-owned'}`;
        let html = `<img src="${servant.img}" alt="${servant.name}" crossorigin="anonymous">`;
        html += `<div class="overlay-dim"></div>`;
        html += `<div class="overlay-blocked" style="display: ${mark === 'blocked' ? 'block' : 'none'}"></div>`;
        if (np > 0) html += `<div class="np-level">寶${np}</div>`;
        if (mark === 'wanted') html += `<div class="mark-icon mark-wanted">❤</div>`;
        if (mark === 'blocked') html += `<div class="mark-icon mark-blocked">✖</div>`;
        div.innerHTML = html;
        div.onclick = (e) => { e.preventDefault(); handleInteraction(servant.id, 'left'); };
        div.oncontextmenu = (e) => { e.preventDefault(); handleInteraction(servant.id, 'right'); return false; };
        return div;
    }

    function handleInteraction(id, clickType) {
        if (currentMode === 'edit_np') {
            let currentNp = userState.owned[id] || 0;
            if (clickType === 'left') currentNp = (currentNp + 1) > 5 ? 0 : currentNp + 1;
            else if (clickType === 'right') currentNp = (currentNp - 1) < 0 ? 5 : currentNp - 1;
            if (currentNp === 0) delete userState.owned[id]; else userState.owned[id] = currentNp;
        } else if (currentMode === 'edit_mark') {
            const currentMark = userState.marks[id];
            if (!currentMark) userState.marks[id] = 'wanted';
            else if (currentMark === 'wanted') userState.marks[id] = 'blocked';
            else delete userState.marks[id];
        }
        saveData(); // 操作即存檔
        render();
    }

    // ==========================================
    // 4. 控制與功能 (Controls & Utils)
    // ==========================================
    function setMode(mode) {
        currentMode = mode;
        document.getElementById('btn-np').classList.remove('active');
        document.getElementById('btn-mark').classList.remove('active');
        document.getElementById(mode === 'edit_np' ? 'btn-np' : 'btn-mark').classList.add('active');
    }

    function setServer(server) {
        currentServer = server;
        saveData();
        updateServerUI();
        render();
    }

    function switchCampaign(val) {
        currentCampaign = val;
        render();
    }

    function updateStats() {
        // 計算全域持有統計 (不管目前顯示什麼活動，全域統計通常針對整個 Box)
        // 這裡我們統計「目前可視範圍內」的總合，這樣在福袋模式下可以看到該次福袋的總期望值
        // 如果要統計全迦勒底，則遍歷 servantsData
        
        let visibleList = [];
        const appEl = document.getElementById('capture-area');
        // 簡單方式：根據 servantsData 統計 (但需過濾台日)
        
        let ownedCount = 0; 
        let totalNp = 0;
        let totalCount = 0;

        servantsData.forEach(s => {
            const isVisible = (currentServer === 'JP') || (currentServer === 'TW' && !s.isFuture);
            if (isVisible) {
                totalCount++;
                if (userState.owned[s.id] > 0) {
                    ownedCount++;
                    totalNp += userState.owned[s.id];
                }
            }
        });

        const rate = totalCount === 0 ? 0 : ((ownedCount / totalCount) * 100).toFixed(1);
        document.getElementById('stat-count').innerText = ownedCount;
        document.getElementById('stat-rate').innerText = `${rate}%`;
        document.getElementById('stat-np').innerText = totalNp;
    }

    // ==========================================
    // 5. 截圖功能 (Screenshot - v6.2 Optimized)
    // ==========================================
    function generateImage() {
        const original = document.getElementById("capture-area");
        const footer = document.querySelector("footer");
        const currentScrollY = window.scrollY;
        
        const btn = document.getElementById('btn-screenshot');
        const originalBtnText = btn ? btn.innerText : "截圖";
        if(btn) { btn.innerText = "處理中..."; btn.disabled = true; }

        // 1. 建立沙盒
        const sandbox = document.createElement("div");
        Object.assign(sandbox.style, {
            position: "absolute", top: "0", left: "0", width: "1280px",
            backgroundColor: "#1a1a2e", zIndex: "-9999", margin: "0", padding: "0", overflow: "visible"
        });

        // 2. 複製內容
        sandbox.appendChild(original.cloneNode(true));

        // 強制 CSS
        const styleReset = document.createElement("style");
        styleReset.innerHTML = `
            .servant-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important; gap: 8px !important; }
            .np-level { font-size: 1rem !important; } 
            /* 修正截圖中的統計字體 */
            .pool-stats { background: #222 !important; border: 1px solid #444 !important; }
        `;
        sandbox.appendChild(styleReset);

        // 3. 複製頁尾
        const footerClone = footer.cloneNode(true);
        Object.assign(footerClone.style, {
            position: "static", width: "100%", transform: "none", backgroundColor: "#16213e",
            borderTop: "1px solid #444", padding: "20px 0", textAlign: "center", marginTop: "20px"
        });
        sandbox.appendChild(footerClone);

        document.documentElement.appendChild(sandbox);

        setTimeout(() => {
            const fullHeight = sandbox.scrollHeight + 50;
            window.scrollTo(0, 0);

            html2canvas(sandbox, {
                scale: 1.0, // 平衡畫質與效能
                useCORS: true,
                backgroundColor: "#1a1a2e",
                width: 1280, height: fullHeight, 
                windowWidth: 1280, windowHeight: fullHeight,
                x: 0, y: 0, scrollX: 0, scrollY: 0
            }).then(canvas => {
                document.documentElement.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                if(btn) { btn.innerText = originalBtnText; btn.disabled = false; }

                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const newWindow = window.open('about:blank', '_blank');
                    
                    if (newWindow) {
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Snapshot</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body { margin:0; background:#111; text-align:center; padding:20px; padding-bottom:80px; }
                                    img { width:100%; max-width:1280px; height:auto; display:inline-block; box-shadow:0 0 10px #000; }
                                    .dl-container { margin-top:25px; margin-bottom:50px; }
                                    .dl-btn { display:inline-block; padding:12px 25px; background:#e94560; color:white; text-decoration:none; border-radius:5px; font-family:sans-serif; font-weight:bold; font-size:16px; cursor:pointer; }
                                </style>
                            </head>
                            <body>
                                <img src="${url}" alt="FGO Checklist">
                                <div class="dl-container"><a href="${url}" download="fgo_checklist.jpg" class="dl-btn">下載圖片</a></div>
                            </body>
                            </html>
                        `);
                        newWindow.document.close();
                    }
                }, 'image/jpeg', 0.85);

            }).catch(err => {
                console.error(err);
                if(sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                if(btn) { btn.innerText = originalBtnText; btn.disabled = false; }
                alert("截圖失敗");
            });
        }, 400);
    }

    // ==========================================
    // 6. I/O (Export/Import/Clear)
    // ==========================================
    function exportSave() {
        const blob = new Blob([JSON.stringify(userState, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fgo_data_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importSave(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.wanted || json.blocked) {
                    userState = { owned: json.owned || {}, marks: {} };
                    if(json.wanted) json.wanted.forEach(id => userState.marks[id] = 'wanted');
                    if(json.blocked) json.blocked.forEach(id => userState.marks[id] = 'blocked');
                } else {
                    userState = json;
                }
                if (!userState.owned) userState.owned = {};
                if (!userState.marks) userState.marks = {};
                saveData();
                render();
            } catch(err) { alert('讀取失敗'); }
            input.value = '';
        };
        reader.readAsText(file);
    }

    function clearAll() {
        if(confirm('確定要清空？')) { 
            userState = { owned: {}, marks: {} }; 
            saveData();
            render(); 
        }
    }

    function groupBy(xs, key) {
        return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {});
    }

    // 啟動
    initData();
    detectLanguage();

    return {
        setMode, setServer, switchCampaign, generateImage, exportSave, importSave, clearAll
    };

})();
