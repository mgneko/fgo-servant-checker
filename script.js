const app = (function() {
    
    // --- 1. 資料庫設定 ---
    const servents = {'saber': [2, 8, 68, 76, 90, 91, 153, 160, 213, 234, 270, 278, 299, 302, 317, 337, 343, 384, 402, 432, 445, 456],
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
	'shielder': []};

    // ★ 修改處：定義台版開放數量 (對應您的陣列)
    // [劍, 弓, 槍, 騎, 術, 殺, 狂, 裁, 仇, 丑, 外, 月, 偽, 獸, 非獸, 盾]
    // [19, 15, 14, 18, 15, 13, 15, 12, 8, 10, 10, 4, 2, 1, 0, 0]
    const twReleaseLimit = {
        'saber': 19,
        'archer': 15,
        'lancer': 14,
        'rider': 18,
        'caster': 15,
        'assassin': 13,
        'berserker': 15,
        'ruler': 12,
        'avenger': 8,
        'alterego': 10,
        'foreigner': 10,
        'mooncancer': 4,
        'pretender': 2,
        'beast': 1,
        'unbeast': 0,
        'shielder': 0
    };

    const classOrder = [
        'saber', 'archer', 'lancer', 'rider', 'caster', 'assassin', 'berserker', 
        'ruler', 'avenger', 'alterego', 'foreigner', 'mooncancer', 'pretender',
        'beast', 'unbeast', 'shielder'
    ];

    const classColors = {
        saber: '1a237e', archer: 'b71c1c', lancer: '1b5e20', rider: 'f57f17', 
        caster: '4a148c', assassin: '212121', berserker: '880e4f', 
        ruler: 'fdd835', avenger: '3e2723', alterego: '8e24aa', 
        foreigner: '263238', mooncancer: 'd81b60', pretender: '01579b',
        beast: '8e0000',
        unbeast: '37474f',
        shielder: '7e57c2'
    };

    const classIcons = {};
    classOrder.forEach(cls => {
        const letter = cls.charAt(0).toUpperCase();
        classIcons[cls] = `images/class/${cls}.png`;
    });

    // --- 2. 應用程式狀態 ---
    let servantsData = [];
    let userState = { owned: {}, marks: {} };
    let currentMode = 'edit_np'; 
    let currentServer = 'JP';

    function initData() {
        servantsData = [];
        for (const [cls, ids] of Object.entries(servents)) {
            if (Array.isArray(ids)) {
                // ★ 修改處：使用 index 來判斷是否超過台版開放數量
                const limit = twReleaseLimit[cls] || 0;
                
                ids.forEach((id, index) => {
                    // 如果 index 大於或等於 limit，表示該角色是「未來角色」
                    // 例如 limit 是 19，則 index 0~18 (共19位) 為 false，index 19 開始為 true
                    const isFutureServant = index >= limit;

                    servantsData.push({
                        id: id,
                        name: `No.${id}`, 
                        class: cls,
                        isFuture: isFutureServant, // 使用新的判斷邏輯
                        img: `images/servents/${id}.png`
                    });
                });
            }
        }
    }

    function detectLanguage() {
        const lang = navigator.language || navigator.userLanguage;
        if (lang.includes('zh') || lang.includes('ZH')) {
            setServer('TW');
        } else {
            setServer('JP');
        }
    }

    // --- 3. 渲染邏輯 ---
    function render() {
        const appEl = document.getElementById('capture-area');
        appEl.innerHTML = ''; 
        
        let visibleServants = servantsData;
        if (currentServer === 'TW') {
            visibleServants = servantsData.filter(s => !s.isFuture);
        }

        const grouped = groupBy(visibleServants, 'class');

        classOrder.forEach(className => {
            if(!grouped[className] || grouped[className].length === 0) return;
            
            const section = document.createElement('section');
            section.className = 'class-section';
            
            const iconUrl = classIcons[className] || classIcons['saber'];
            
            section.innerHTML = `
                <div class="class-header">
                    <img src="${iconUrl}" class="class-icon-img" alt="${className}">
                </div>
                <div class="servant-grid" id="grid-${className}"></div>
            `;
            appEl.appendChild(section);
            const grid = section.querySelector(`#grid-${className}`);

            grouped[className].forEach(servant => {
                grid.appendChild(createCard(servant));
            });
        });
        
        updateStats(visibleServants.length);
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

            if (currentNp === 0) delete userState.owned[id];
            else userState.owned[id] = currentNp;

        } else if (currentMode === 'edit_mark') {
            const currentMark = userState.marks[id];
            if (!currentMark) userState.marks[id] = 'wanted';
            else if (currentMark === 'wanted') userState.marks[id] = 'blocked';
            else delete userState.marks[id];
        }
        render();
    }

    // --- 4. 功能函式 ---

    function setMode(mode) {
        currentMode = mode;
        document.getElementById('btn-np').classList.remove('active');
        document.getElementById('btn-mark').classList.remove('active');
        document.getElementById(mode === 'edit_np' ? 'btn-np' : 'btn-mark').classList.add('active');
    }

    function setServer(server) {
        currentServer = server;
        document.getElementById('btn-server-tw').classList.remove('active');
        document.getElementById('btn-server-jp').classList.remove('active');
        document.getElementById(server === 'TW' ? 'btn-server-tw' : 'btn-server-jp').classList.add('active');
        render();
    }

    function updateStats(totalVisible) {
        let ownedCount = 0;
        let totalNp = 0;
        
        servantsData.forEach(s => {
            const isVisible = (currentServer === 'JP') || (currentServer === 'TW' && !s.isFuture);
            if (isVisible && userState.owned[s.id] > 0) {
                ownedCount++;
                totalNp += userState.owned[s.id];
            }
        });

        const rate = totalVisible === 0 ? 0 : ((ownedCount / totalVisible) * 100).toFixed(1);
        document.getElementById('stat-count').innerText = ownedCount;
        document.getElementById('stat-rate').innerText = `${rate}%`;
        document.getElementById('stat-np').innerText = totalNp;
    }

// ========= 截圖邏輯 V6.0 (修復模糊、縮放與存檔問題) =========
    function generateImage() {
        const original = document.getElementById("capture-area");
        const footer = document.querySelector("footer");
        const currentScrollY = window.scrollY;
        
        // 顯示讀取中提示 (選用)
        const originalBtnText = event.target.innerText;
        event.target.innerText = "截圖生成中...";

        // 1. 建立沙盒 (強制 1280px)
        const sandbox = document.createElement("div");
        Object.assign(sandbox.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "1280px", // 鎖定寬度
            backgroundColor: "#1a1a2e",
            zIndex: "-9999",
            margin: "0",
            padding: "0",
            overflow: "visible"
        });

        // 2. 複製內容
        const contentClone = original.cloneNode(true);
        sandbox.appendChild(contentClone);

        // 強制 Grid 樣式 (確保手機上排版正確)
        const styleReset = document.createElement("style");
        styleReset.innerHTML = `
            .servant-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
                gap: 8px !important;
            }
            /* 稍微加大字體以防縮圖模糊 */
            .np-level { font-size: 1rem !important; } 
        `;
        sandbox.appendChild(styleReset);

        // 3. 複製頁尾
        const footerClone = footer.cloneNode(true);
        Object.assign(footerClone.style, {
            position: "static",
            width: "100%",
            transform: "none",
            backgroundColor: "#16213e",
            borderTop: "1px solid #444",
            padding: "20px 0",
            textAlign: "center",
            marginTop: "20px"
        });
        sandbox.appendChild(footerClone);

        document.documentElement.appendChild(sandbox);

        // 4. 等待排版並截圖
        setTimeout(() => {
            // ★ 修正1: 動態測量精確高度，不再使用 20000px
            const fullHeight = sandbox.scrollHeight;
            
            window.scrollTo(0, 0);

            html2canvas(sandbox, {
                scale: 2, // ★ 修正2: 提高解析度 (2倍)，解決模糊問題
                useCORS: true,
                backgroundColor: "#1a1a2e",
                width: 1280,
                height: fullHeight, 
                windowWidth: 1280,
                windowHeight: fullHeight, // 使用內容的真實高度
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0
            }).then(canvas => {
                // 清理 DOM
                document.documentElement.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                event.target.innerText = originalBtnText; // 還原按鈕文字

                // ★ 修正3: 改用 Blob URL 取代 Base64，解決無法長按存檔的問題
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const newWindow = window.open('about:blank', '_blank');
                    
                    if (newWindow) {
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>FGO Snapshot</title>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                        body { 
                                            margin: 0; 
                                            background: #111; 
                                            display: flex; 
                                            flex-direction: column; 
                                            align-items: center; 
                                            min-height: 100vh;
                                        }
                                        img { 
                                            width: 100%;       /* 圖片自動適應螢幕寬度 */
                                            max-width: 1280px; /* 電腦版不超過原圖大小 */
                                            height: auto; 
                                            display: block;
                                            box-shadow: 0 0 10px #000;
                                        }
                                        .tip { 
                                            color: #aaa; 
                                            margin: 20px; 
                                            font-family: sans-serif; 
                                            font-size: 16px; 
                                            text-align: center;
                                            padding-bottom: 30px;
                                        }
                                        .dl-btn {
                                            margin-top: 20px;
                                            padding: 10px 20px;
                                            background: #e94560;
                                            color: white;
                                            text-decoration: none;
                                            border-radius: 5px;
                                            font-family: sans-serif;
                                            font-weight: bold;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <img src="${url}" alt="FGO Checklist">
                                    <a href="${url}" download="fgo_checklist.png" class="dl-btn">下載圖片</a>
                                    <div class="tip">若無法下載，請長按圖片選擇「加入照片」</div>
                                </body>
                            </html>
                        `);
                        newWindow.document.close();
                    } else {
                        alert("請允許彈出視窗以查看截圖");
                    }
                }, 'image/png');

            }).catch(err => {
                console.error(err);
                if(sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                event.target.innerText = originalBtnText;
                alert("截圖失敗");
            });
        }, 400);
    }
    // ===============================================

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
                render();
            } catch(err) { alert('讀取失敗'); }
            input.value = '';
        };
        reader.readAsText(file);
    }

    function clearAll() {
        if(confirm('確定要清空？')) { userState = { owned: {}, marks: {} }; render(); }
    }

    function groupBy(xs, key) {
        return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {});
    }

    initData();
    detectLanguage();

    return {
        setMode, setServer, generateImage, exportSave, importSave, clearAll
    };


})();
