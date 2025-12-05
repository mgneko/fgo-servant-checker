const app = (function() {
    
    // --- 1. 資料庫設定 ---
    const servents = {
        'saber': [3, 4, 5, 6, 10, 101, 121, 123, 138, 165, 176, 187, 221, 223, 227, 245, 264, 290, 293, 298, 301, 310, 344, 354, 363, 379, 405, 434],
        'archer': [11, 14, 69, 122, 131, 137, 157, 180, 184, 197, 200, 207, 248, 262, 269, 271, 286, 311, 318, 325, 391, 399],
        'lancer': [18, 78, 87, 102, 134, 140, 141, 146, 181, 183, 193, 214, 217, 228, 252, 266, 279, 283, 288, 313, 347, 419, 428, 439, 449, 455],
        'rider': [29, 30, 66, 73, 94, 115, 132, 182, 211, 263, 291, 315, 322, 326, 332, 366, 387, 401, 446],
        'caster': [61, 67, 74, 100, 103, 111, 120, 130, 145, 192, 194, 208, 225, 236, 319, 330, 340, 358, 404],
        'assassin': [41, 46, 92, 109, 133, 159, 170, 177, 185, 188, 218, 230, 243, 267, 304, 359, 360, 361, 378, 408],
        'berserker': [47, 48, 58, 82, 89, 116, 162, 171, 178, 202, 219, 282, 287, 323, 345, 382, 398, 414, 447],
        'ruler': [135, 233, 242, 320, 364],
        'avenger': [147, 158, 328, 356, 388, 420, 454, 458],
        'alterego': [164, 190, 191, 338, 451],
        'foreigner': [222, 308, 389, 423],
        'mooncancer': [166, 422, 424, 425],
        'pretender': [335, 367, 372, 392, 410, 430],
        'beast': [],
        'unbeast': [],
        'shielder': []
    };

    // 台版開放數量限制
    const twReleaseLimit = {
        'saber': 19, 'archer': 15, 'lancer': 14, 'rider': 18, 'caster': 15, 'assassin': 13, 'berserker': 15,
        'ruler': 12, 'avenger': 8, 'alterego': 10, 'foreigner': 10, 'mooncancer': 4, 'pretender': 2,
        'beast': 1, 'unbeast': 0, 'shielder': 0
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
        beast: '8e0000', unbeast: '37474f', shielder: '7e57c2'
    };

    const classIcons = {};
    classOrder.forEach(cls => {
        const letter = cls.charAt(0).toUpperCase();
        classIcons[cls] = `https://placehold.co/50x50/transparent/white?text=${letter}&font=roboto`;
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
                const limit = twReleaseLimit[cls] || 0;
                ids.forEach((id, index) => {
                    servantsData.push({
                        id: id,
                        name: `No.${id}`, 
                        class: cls,
                        isFuture: index >= limit,
                        img: `https://placehold.co/150x150/${classColors[cls] || '333'}/FFF?text=${id}&font=roboto`
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
                <div class="class-header"><img src="${iconUrl}" class="class-icon-img" alt="${className}"></div>
                <div class="servant-grid" id="grid-${className}"></div>
            `;
            appEl.appendChild(section);
            const grid = section.querySelector(`#grid-${className}`);
            grouped[className].forEach(servant => grid.appendChild(createCard(servant)));
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
            if (currentNp === 0) delete userState.owned[id]; else userState.owned[id] = currentNp;
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
        let ownedCount = 0; let totalNp = 0;
        servantsData.forEach(s => {
            const isVisible = (currentServer === 'JP') || (currentServer === 'TW' && !s.isFuture);
            if (isVisible && userState.owned[s.id] > 0) { ownedCount++; totalNp += userState.owned[s.id]; }
        });
        const rate = totalVisible === 0 ? 0 : ((ownedCount / totalVisible) * 100).toFixed(1);
        document.getElementById('stat-count').innerText = ownedCount;
        document.getElementById('stat-rate').innerText = `${rate}%`;
        document.getElementById('stat-np').innerText = totalNp;
    }

    // ========= 截圖邏輯 V6.1 (效能優化、尺寸縮小、JPEG壓縮) =========
    function generateImage() {
        const original = document.getElementById("capture-area");
        const footer = document.querySelector("footer");
        const currentScrollY = window.scrollY;
        
        // ★ 修正2: 明確獲取按鈕元素並修改狀態
        const btn = document.getElementById('btn-screenshot');
        const originalBtnText = btn.innerText;
        btn.innerText = "產生截圖中...";
        btn.disabled = true; // 避免重複點擊

        // 1. 建立沙盒 (強制 1280px)
        const sandbox = document.createElement("div");
        Object.assign(sandbox.style, {
            position: "absolute", top: "0", left: "0", width: "1280px",
            backgroundColor: "#1a1a2e", zIndex: "-9999", margin: "0", padding: "0", overflow: "visible"
        });

        // 2. 複製內容
        sandbox.appendChild(original.cloneNode(true));

        // 強制 Grid 樣式
        const styleReset = document.createElement("style");
        styleReset.innerHTML = `
            .servant-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important; gap: 8px !important; }
            .np-level { font-size: 1rem !important; } 
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

        // 4. 等待排版並截圖
        setTimeout(() => {
            const fullHeight = sandbox.scrollHeight;
            window.scrollTo(0, 0);

            html2canvas(sandbox, {
                // ★ 修正1: 將 scale 降低至 0.7 (原尺寸的 70%)
                // 這能顯著減少 PC 卡頓，並達成縮小 30% 的需求
                scale: 0.7, 
                useCORS: true,
                backgroundColor: "#1a1a2e",
                width: 1280, height: fullHeight, 
                windowWidth: 1280, windowHeight: fullHeight,
                x: 0, y: 0, scrollX: 0, scrollY: 0
            }).then(canvas => {
                document.documentElement.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                
                // ★ 修正2: 還原按鈕狀態
                btn.innerText = originalBtnText;
                btn.disabled = false;

                // ★ 修正3: 改用 image/jpeg 並設定品質 0.8，確保檔案 < 2MB
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
                                        body { margin:0; background:#111; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
                                        img { width:100%; max-width:1280px; height:auto; display:block; box-shadow:0 0 10px #000; }
                                        /* ★ 修正4: 移除提示文字樣式 */
                                        .dl-btn { margin-top:20px; padding:10px 20px; background:#e94560; color:white; text-decoration:none; border-radius:5px; font-family:sans-serif; font-weight:bold; }
                                    </style>
                                </head>
                                <body>
                                    <img src="${url}" alt="FGO Checklist">
                                    <a href="${url}" download="fgo_checklist.jpg" class="dl-btn">下載圖片</a>
                                    </body>
                            </html>
                        `);
                        newWindow.document.close();
                    } else {
                        alert("請允許彈出視窗以查看截圖");
                    }
                }, 'image/jpeg', 0.8); // 使用 JPEG, 品質 80%

            }).catch(err => {
                console.error(err);
                if(sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
                window.scrollTo(0, currentScrollY);
                // ★ 修正2: 發生錯誤也要還原按鈕
                btn.innerText = originalBtnText;
                btn.disabled = false;
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
