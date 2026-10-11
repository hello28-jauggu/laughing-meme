// ==UserScript==
// @name         PR custom minitab (mobile)
// @namespace    http://tampermonkey.net/
// @version      clean-optimized
// @description  PR minitab – clean, optimized, noMove fixed, high bot capacity
// @author       pr clan (modified by sukonoe) "skid"
// @match        *://arras.io/
// @match        *://localhost:42789/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arras.io
// @run-at       document-start
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js
// ==/UserScript==

const ENC_OWNER_KEY = "cHItb3duZXIxMjM0";
const ENC_MEMBER_KEY = "cHItbWVtYmVyLTEyMzQ=";

if (window.name === '__pr_is_bot') window.__is_bot = true;

function decodeKey(encoded) {
    try { return atob(encoded); } catch(e) { return null; }
}

const OWNER_KEY = decodeKey(ENC_OWNER_KEY);
const MEMBER_KEY = decodeKey(ENC_MEMBER_KEY);

let authRole = null;

function checkAuth() {
    const stored = localStorage.getItem('arras_auth_role');
    if (stored === 'owner' || stored === 'member') {
        authRole = stored;
        return true;
    }
    return false;
}

function setAuth(role) {
    authRole = role;
    localStorage.setItem('arras_auth_role', role);
}

function clearAuth() {
    authRole = null;
    localStorage.removeItem('arras_auth_role');
}

function showAuthModal() {
    const existing = document.getElementById('authModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'authModal';
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000000',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Ubuntu, sans-serif'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
        background: 'rgba(18, 18, 28, 0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: '32px',
        padding: '32px 40px',
        width: '360px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 45px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)',
        color: '#ffffff',
        transition: 'transform 0.2s ease'
    });

    card.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
        <h2 style="margin: 0 0 8px 0; font-weight: 600; font-size: 24px; letter-spacing: -0.3px;">Authorization Required</h2>
        <p style="margin: 0 0 28px 0; opacity: 0.7; font-size: 14px;">Enter your key to use this script</p>
        <input type="password" id="authKeyInput" placeholder="Key" style="
            width: 100%;
            padding: 14px 16px;
            border-radius: 60px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.4);
            color: white;
            font-size: 15px;
            text-align: center;
            outline: none;
            box-sizing: border-box;
            margin-bottom: 20px;
            transition: 0.2s;
        " autocomplete="off">
        <button id="authSubmitBtn" style="
            background: #3b82f6;
            border: none;
            padding: 12px 20px;
            border-radius: 60px;
            color: white;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            width: 100%;
            transition: 0.2s;
            box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        ">Verify Access</button>
        <p id="authError" style="color: #f87171; font-size: 13px; margin-top: 20px; min-height: 40px; font-weight: 500;"></p>
    `;

    modal.appendChild(card);
    (document.body || document.documentElement).appendChild(modal);

    const input = document.getElementById('authKeyInput');
    const submitBtn = document.getElementById('authSubmitBtn');
    const errorSpan = document.getElementById('authError');

    function verify() {
        const key = input.value.trim();
        if (key === OWNER_KEY) {
            setAuth('owner');
            modal.remove();
            initCheatScript();
        } else if (key === MEMBER_KEY) {
            setAuth('member');
            modal.remove();
            initCheatScript();
        } else {
            errorSpan.innerText = '❌ Invalid key. Access denied.';
            input.value = '';
            input.focus();
            input.style.borderColor = '#f87171';
            setTimeout(() => { input.style.borderColor = 'rgba(255,255,255,0.2)'; }, 1000);
        }
    }

    submitBtn.onclick = verify;
    input.onkeypress = (e) => { if (e.key === 'Enter') verify(); };
    input.focus();
}

function initCheatScript() {
    if (location.hostname == "localhost" && location.port != "42789")
        return;

    let xrayEnabled = false;
    let xrayAlphaVal = 0.5;
    let seeEverythingEnabled = false;
    let bulletHiderEnabled = false;
    // Bullet hider: max radius (in canvas pixels) treated as a "bullet".
    // Arras bullets are typically drawn as arcs with radius < 25 canvas units.
    // Tanks/shapes are drawn much larger. Tune if needed.
    const BULLET_RADIUS_THRESHOLD = 25;

    let killLog = [];
    let lastKillMessage = "";
    const KILL_PREFIX   = "You killed ";
    const ASSIST_PREFIX = "You assisted ";

    const LS_USED_NAMES     = "arras_used_names";
    const LS_AUTO_USERNAME  = "arras_auto_username_enabled";
    let autoUsernameEnabled = false;
    let usernameTheme       = 'legit';
    const usernameThemes = {
        legit: [
            'TestTank2','camrateur','sup4','maybe 1m','raw','fun','4ever#1',
            'Bot all? ☺','For Thē Worthy','palle','TYPESHIT','DEATHMACHINE','k',
            'Mr pato','49th & Main','For Thē Sigmas','Romania','Friends?Lol','REVENGE',
            'Vanity','v1sion','lyra','Boempatat','Andre','Huge','sunex','IM THE KING',
            'Dattel','he he','Gon','Qwerty','Kato','hide more noob','s1gow','Lipovuy',
            'Synaro','RAMPAGE','Xamo','Arena Closer','w','Daylight','bananona',
            'king bob!!!!!!!','as','Sela','porowolf','FRENCH MONSTER','black swan',
            'eee','WARSHIP','earthworm','wat:)','SmiLE','huuh','balls','me',
            'David Buster','Revenge','Bloaty','GHOST','1m','A Mine','Lucas lol',
            'God of WarΩ','Cathy','Fuzz','JJD','_mxs_','POLICE','nesty','aaaa',
            'Eurofighter','DefeatTheEvil','meme','Muzan','JustBuyAHouse','Logan_Fr_',
            'just a new ❂','all eyes on me','EMMANUEL','mrk','Tigran','HHEALLER',
            'Behind U ( 0_0)','No Mercy','Drukez','abbas','R3DBULLMAN1AC','^oo^',
            'The Smiths','rick','Ron','dwpe','iRlyH8ThisGame!','Kojot34','milers',
            'HANNABAL','Happy.','södra','slur','supercazzola','VotreMaman','gerard',
            'Morthais','SejeM☠🔥','Genocider','iAmIsTom','StopFarmingIf45','kurton',
            'ARENA CLOSER 1','Booster','accident','equinox','melisa','hola','caspar',
            'monttu','bigdihrandy','torta pounder','ivoker','savage','Noe','TicTac 42',
            'ModRiax','trucker091','bilmem','KiOKiO','Regy :)'
        ]
    };

    function generateRandomName() {
        const length = Math.floor(Math.random() * 6) + 6;
        let name = '';
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < length; i++) {
            let char = chars[Math.floor(Math.random() * chars.length)];
            if (Math.random() < 0.1) char = char.toUpperCase();
            name += char;
        }
        return name;
    }

    function getRandomUsername() {
        const tag = '[PR]';
        let name;
        let usedNames = [];
        try {
            const stored = localStorage.getItem(LS_USED_NAMES);
            if (stored) usedNames = JSON.parse(stored);
        } catch (e) {}
        if (usernameTheme === 'random') {
            name = generateRandomName();
        } else {
            const names = usernameThemes[usernameTheme] || usernameThemes.legit;
            const available = names.filter(n => !usedNames.includes(n));
            if (available.length === 0) {
                usedNames = [];
                localStorage.setItem(LS_USED_NAMES, JSON.stringify([]));
                name = names[Math.floor(Math.random() * names.length)];
            } else {
                name = available[Math.floor(Math.random() * available.length)];
            }
            usedNames.push(name);
            localStorage.setItem(LS_USED_NAMES, JSON.stringify(usedNames));
        }
        return `${tag} ${name}`;
    }

    let chatMessage1 = "--[|[PR] ON TOP | BEST MB CLAN |]--";
    let chatMessage2 = "--[| JOIN [PR] NOW! |]--";

    let _fpsLimit = 30;
    let _followerFpsEnabled = false;
    let _originalRAF = null, _originalCAF = null, _limiterActive = false;

    function _enableFpsLimiter(targetFps) {
        if (_limiterActive) _disableFpsLimiter();
        _originalRAF = window.requestAnimationFrame;
        _originalCAF = window.cancelAnimationFrame;
        let lastExec = performance.now();
        const interval = 1000 / targetFps;
        window.requestAnimationFrame = function(cb) {
            return _originalRAF(function rafWrapper(ts) {
                const elapsed = ts - lastExec;
                if (elapsed >= interval) {
                    lastExec = ts - (elapsed % interval);
                    cb(ts);
                } else {
                    _originalRAF(rafWrapper);
                }
            });
        };
        window.cancelAnimationFrame = function(id) { return _originalCAF(id); };
        _limiterActive = true;
    }

    function _disableFpsLimiter() {
        if (!_limiterActive) return;
        window.requestAnimationFrame = _originalRAF;
        window.cancelAnimationFrame = _originalCAF;
        _limiterActive = false;
    }

    const LS_FORMATION_CONFIG  = "arras_formation_config";
    const LS_SWARM_REGISTRY    = "arras_swarm_registry";
    const LS_FORCE_RESPAWN_MB  = "arras_force_respawn_trigger";
    let mySessionId = Math.random().toString(36).substr(2, 9);
    let swarmIndex = 0, swarmSize = 1, lastSwarmUpdate = 0;
    let formationConfig = { enabled: false, type: 'line_front', spacing: 60 };
    let _fmCache = null;

    function updateSwarmRegistry() {
        try {
            const now = Date.now();
            let reg = {};
            const raw = localStorage.getItem(LS_SWARM_REGISTRY);
            if (raw) { try { reg = JSON.parse(raw); } catch(e){} }
            for (let id in reg) { if (now - reg[id].ts > 3000) delete reg[id]; }
            reg[mySessionId] = { ts: now, role: 'leader' };
            localStorage.setItem(LS_SWARM_REGISTRY, JSON.stringify(reg));
            const sorted = Object.keys(reg).sort((a,b) => {
                if (reg[a].role === 'leader') return -1;
                if (reg[b].role === 'leader') return 1;
                return a.localeCompare(b);
            });
            swarmSize = sorted.length;
            swarmIndex = sorted.indexOf(mySessionId);
            if (swarmIndex === -1) swarmIndex = 0;
        } catch(e) {}
    }

    function _showNotif(msg, type = 'success') {
        let container = document.getElementById('pr_notif_container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pr_notif_container';
            Object.assign(container.style, {
                position: 'fixed', top: '20px', right: '20px',
                zIndex: '99999999', display: 'flex', flexDirection: 'column',
                gap: '8px', pointerEvents: 'none'
            });
            document.body.appendChild(container);
        }
        const n = document.createElement('div');
        Object.assign(n.style, {
            background: 'rgba(18,18,28,0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderLeft: `3px solid ${type === 'success' ? '#34c759' : '#ff3b30'}`,
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#fff',
            fontFamily: "'Inter','Segoe UI',system-ui",
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transition: 'opacity 0.3s',
            opacity: '1',
            pointerEvents: 'auto'
        });
        n.textContent = msg;
        container.appendChild(n);
        setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 2000);
    }

    let _liveStatus = 'Ready';
    let _livePos = '(0, 0)';
    let _liveDist = '---';

    const LS_RESPAWN_BUILD = "arras_respawn_build_pr";
    let _selectedRespawnBuild = 'none';
    const _respawnBuilds = {
        gale:   { upgrades: ['KeyH','KeyY','KeyK','KeyI'], stats: ['Digit2','Digit2','Digit2','Digit2','Digit3','Digit3','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7'] },
        limpet: { upgrades: ['KeyX','Space'], stats: ['Digit2','Digit2','Digit2','Digit2','Digit3','Digit3','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7'] }
    };

    function _executeBuild(buildName) {
        const bd = _respawnBuilds[buildName];
        if (!bd) return;
        const sequence = [...bd.upgrades, ...bd.stats];
        let delay = 300;
        sequence.forEach(key => {
            setTimeout(() => {
                events.press(key);
            }, delay);
            delay += 80;
        });
        _showNotif(`Build: ${buildName}`, 'success');
    }

    // ============================================================
    // MACROS (ported from Follow Bots Ultimate V4)
    // ============================================================
    const MACROS = {
        "Octo": {
            strings: ["hykiec;hykjec;uiuke;khkhe;hyec;hiiy;hykyec;hyhyec"],
            skills: ["[0/0/3/9/9/9/9/3/0/0]"]
        },
        "refuge": {
            strings: ["[ecquuq]"],
            skills: ["[3/3/2/9/7/9/9]"]
        },
        "penta": {
    strings: ["yuye"],
    skills: ["[0/4/2/7/7/9/7/6/0/0]"]
},
        "Healers(seige)": {
            strings: ["phe"],
            skills: ["[3/4/2/7/7/9/9/3/0/0]"]
        },
        "ATMG ahh skid": {
            strings: ["iuue;hyyec;hii"],
            skills: ["[0/4/2/7/7/9/7/6/0/0]"]
        },
        "slammer": {
            strings: ["tky"],
            skills: ["12/12/12/0/6"]
            },
        "One way": {
            strings: ["khkhe;khkye;ihyye;yuyje"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Octo + One way": {
            strings: ["khkhe;khkye;ihyye;yuyje;hykiec;hykjec;uiuke;hykue;hiiy;hykyec;hyhyec"],
            skills: ["[0/0/4/9/9/9/9/2/0/0]"]
        },
        "Boosters": {
            strings: ["huyye;huyue;huyie;huyhe;huyje;huyke;huuye;huuue;huuie;huuhe;huuje;huuke;huiye;huiue;huiie;huihe;huije;huike;huhye;huhue;huhie;huhhe;huhje;huhke;hujye;hujue;hujie;hujhe;hujje;hujke;hukye;hukue;hukie;hukhe;hukje;hukke"],
            skills: ["[9/9/0/0/0/0/0/9/6/9]"]
        },
        "Tri-Angle": {
            strings: ["huye;huhe;huie;huje;huke;huue"],
            skills: ["[0/4/2/7/7/9/7/6/0/0]"]
        },
        "Launcher": {
            strings: ["khkhe;khkye;khue"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Norm anni": {
            strings: ["kye;kyue;kyyve"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Invis ram": {
            strings: ["uyiy;...hy"],
            skills: ["[9/9/0/0/0/0/9/9/0/9]"]
        },
        "Mingler": {
            strings: ["hykjec"],
            skills: ["[2/2/3/9/9/9/8/0/0/0]"]
        },
        "Whirlwind": {
            strings: ["hjihec"],
            skills: ["[3/3/0/9/9/9/9/0/0/0]"]
        },
        "Gale": {
            strings: ["hykiec"],
            skills: ["[0/4/2/9/9/9/9/0/0/0]"]
        },
        "Octo Tank": {
            strings: ["hyyec"],
            skills: ["[3/3/0/9/9/9/9/0/0/0]"]
        },
        "Random": {
            strings: function () {
                const chars = "yuihjk,.-";
                let s = "";
                for (let i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
                return [s];
            },
            skills: function () {
                const vals = [];
                for (let i = 0; i < 10; i++) {
                    if (i === 7) vals.push(12);
                    else vals.push(Math.floor(Math.random() * 10));
                }
                return ["[" + vals.join("/") + "]"];
            }
        }
    };

    let _lastMacroName = localStorage.getItem("pr_lastMacroName") || "One way";

    const _SKILL_SLOT_KEYS = ["1","2","3","4","5","6","7","8","9","0"];

    function _expandSkillSteps(skills) {
        const presses = [];
        for (const step of skills) {
            if (typeof step !== "string") continue;
            const match = step.match(/\[([0-9/]+)\]/);
            if (!match) continue;
            const values = match[1].split("/").map(Number);
            for (let i = 0; i < values.length && i < _SKILL_SLOT_KEYS.length; i++) {
                const val = values[i];
                if (val === 0) continue;
                const key = "Digit" + _SKILL_SLOT_KEYS[i];
                if (val === 9) { presses.push({ mHeld: true, key }); }
                else { for (let j = 0; j < val; j++) presses.push({ mHeld: false, key }); }
            }
        }
        return presses;
    }

    function _charToKeyEventInit(char) {
        const SPECIAL = {
            ',': { code: 'Comma', key: ',' },
            '.': { code: 'Period', key: '.' },
            '-': { code: 'Minus', key: '-' },
            '(': { code: 'Digit9', key: '(', shiftKey: true },
            ')': { code: 'Digit0', key: ')', shiftKey: true },
        };
        if (SPECIAL[char]) return SPECIAL[char];
        if (char >= '0' && char <= '9') return { code: 'Digit' + char, key: char };
        return { code: 'Key' + char.toUpperCase(), key: char.toLowerCase() };
    }

    function _macroKeyEvent(info, press) {
        window.dispatchEvent(new KeyboardEvent(press ? "keydown" : "keyup", {
            code: info.code, key: info.key, shiftKey: !!info.shiftKey, bubbles: true, cancelable: true
        }));
    }

    let _isUpgrading = false;
    let _macroAbortToken = { cancelled: false };
    async function performMacroUpgrade(macroName) {
        // Cancel any running macro and start fresh
        _macroAbortToken.cancelled = true;
        _macroAbortToken = { cancelled: false };
        const myToken = _macroAbortToken;
        _isUpgrading = false;
        _isUpgrading = true;
        const mName = macroName || _lastMacroName || "One way";
        const macroTemplate = MACROS[mName] || MACROS["One way"];
        const macro = {
            strings: (typeof macroTemplate.strings === "function") ? macroTemplate.strings() : macroTemplate.strings,
            skills:  (typeof macroTemplate.skills  === "function") ? macroTemplate.skills()  : macroTemplate.skills
        };
        _showNotif(`Macro: ${mName}`, 'success');
        try {
            for (const entry of macro.strings) {
                if (myToken.cancelled) return;
                const variants = entry.split(";");
                const chosen = variants[Math.floor(Math.random() * variants.length)];
                for (const char of chosen) {
                    if (myToken.cancelled) return;
                    const info = _charToKeyEventInit(char);
                    _macroKeyEvent(info, true);  await sleep(0.015);
                    _macroKeyEvent(info, false); await sleep(0.010 + Math.random() * 0.020);
                }
                await sleep(0.050);
            }
            if (myToken.cancelled) return;
            await sleep(0.200);
            const presses = _expandSkillSteps(macro.skills);
            let i = 0;
            while (i < presses.length) {
                if (myToken.cancelled) return;
                if (presses[i].mHeld) {
                    _macroKeyEvent({ code: "KeyM", key: "m" }, true); await sleep(0.030);
                    while (i < presses.length && presses[i].mHeld) {
                        if (myToken.cancelled) { _macroKeyEvent({ code: "KeyM", key: "m" }, false); return; }
                        _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, true);  await sleep(0.030);
                        _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, false); await sleep(0.050);
                        i++;
                    }
                    _macroKeyEvent({ code: "KeyM", key: "m" }, false); await sleep(0.060);
                } else {
                    _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, true);  await sleep(0.030);
                    _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, false); await sleep(0.060);
                    i++;
                }
            }
        } catch(e) { console.error("Macro error:", e); }
        finally { if (!myToken.cancelled) { _isUpgrading = false; console.log("Macro finished."); } }
    }

    const LS_FOLLOW_DIST_PR = "arras_follow_dist_pr";
    let _followDistance = 0;

    const LS_PRECISE_AIM_PR = "arras_precise_aim_pr";
    let _preciseAim = true;
    try { const s = localStorage.getItem(LS_PRECISE_AIM_PR); if (s !== null) _preciseAim = JSON.parse(s); } catch(e){}

    let _ingame = false;
    const _OrigWS = window.WebSocket;
    class _PRWebSocket extends _OrigWS {
        constructor(...args) {
            super(...args);
            this.addEventListener("message", () => {
                if (_ingame) return;
                const kd = new KeyboardEvent('keydown', { key:'l', code:'KeyL', bubbles:true, cancelable:true });
                const ku = new KeyboardEvent('keyup',   { key:'l', code:'KeyL', bubbles:true, cancelable:true });
                document.dispatchEvent(kd);
                setTimeout(() => document.dispatchEvent(ku), 50);
                _ingame = true;
            }, { once: true });
        }
    }
    if (!window.__is_bot) window.WebSocket = _PRWebSocket;

    try {
        const su = localStorage.getItem(LS_AUTO_USERNAME);
        if (su !== null) autoUsernameEnabled = JSON.parse(su);
        const st = localStorage.getItem('arras_username_theme');
        if (st) usernameTheme = st;
        const sc1 = localStorage.getItem('arras_chat_msg_1');
        if (sc1) chatMessage1 = sc1;
        const sc2 = localStorage.getItem('arras_chat_msg_2');
        if (sc2) chatMessage2 = sc2;
        const sfd = localStorage.getItem(LS_FOLLOW_DIST_PR);
        if (sfd !== null) _followDistance = parseInt(sfd);
        const sfm = localStorage.getItem(LS_FORMATION_CONFIG);
        if (sfm) formationConfig = JSON.parse(sfm);
        const srb = localStorage.getItem(LS_RESPAWN_BUILD);
        if (srb) _selectedRespawnBuild = srb;
    } catch(e) {}

    setInterval(() => { updateSwarmRegistry(); }, 1000);

    const _origAEL = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
        if (['touchstart','touchmove','touchend'].includes(type) && !handler.__prScript) {
            const wrapped = function(e) {
                if (e.__prHandled) return;
                return handler.apply(this, arguments);
            };
            wrapped.__prScript = true;
            return _origAEL.call(this, type, wrapped, options);
        }
        return _origAEL.apply(this, arguments);
    };

    Node.prototype.nappend = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
        if (["pw-spawn-ad", "pw-respawn-ad"].includes(node.id)) return;
        this.nappend(node);
    };

    const utils = {
        getDir(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
        getDist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); },
        randint(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
        choice(arr) { return arr[this.randint(0, arr.length - 1)]; },
        removeBrackets(string) {
            if (string.startsWith("[")) string = string.slice(1);
            if (string.endsWith("]")) string = string.slice(0, -1);
            return string;
        }
    };

    const tankFOV = {
        "Base": 1, "Sniper": 1.200606585788562, "Director": 1.1000866551126518,
        "Smasher": 1.050693240901213, "Mega Smasher": 1.1000866551126518,
        "Dual": 1.200606585788562, "Musket": 1.2010398613518198,
        "Nailgun": 1.1009532062391683, "Gunner Trapper": 1.2512998266897748,
        "Overgunner": 1.1009532062391683, "Assassin": 1.3513864818024266,
        "Ranger": 1.501733102253033, "Falcon": 1.2014731369150782,
        "Stalker": 1.3513864818024266, "Auto-Assassin": 1.3513864818024266,
        "Single": 1.0004332755632583, "Deadeye": 1.3513864818024266,
        "Hunter": 1.3006932409012133, "Predator": 1.3006932409012133,
        "X-Hunter": 1.3006932409012133, "Poacher": 1.3006932409012133,
        "Ordnance": 1.3006932409012133, "Nimrod": 1.3513864818024266,
        "Minigun": 1.200606585788562, "Streamliner": 1.3006932409012133,
        "Crop Duster": 1.200606585788562, "Barricade": 1.200606585788562,
        "Vulture": 1.200606585788562, "Rifle": 1.200606585788562,
        "Crossbow": 1.200606585788562, "Armsman": 1.200606585788562,
        "Revolver": 1.200606585788562, "Marksman": 1.200606585788562,
        "Fork": 1.200606585788562, "Bushwhacker": 1.200606585788562,
        "Field Gun": 1.1507798960138649, "Banshee": 1.1000866551126518,
        "Overseer": 1.1000866551126518, "Overlord": 1.1000866551126518,
        "Auto-Overseer": 1.1000866551126518, "Overdrive": 1.1000866551126518,
        "Commander": 1.1507798960138649, "Cruiser": 1.2014731369150782,
        "Carrier": 1.2014731369150782, "Battleship": 1.2512998266897748,
        "Fortress": 1.2014731369150782, "Auto-Cruiser": 1.2014731369150782,
        "Underseer": 1.0710571923743502, "Necromancer": 1.0710571923743502,
        "Maleficitor": 1.0710571923743502, "Infestor": 1.0710571923743502,
        "Spawner": 1.1000866551126518, "Factory": 1.1000866551126518,
        "Auto-Spawner": 1.1000866551126518, "Manager": 1.1000866551126518,
        "Big Cheese": 1.1000866551126518, "Builder": 1.1503466204506068,
        "Constructor": 1.1503466204506068, "Auto-Builder": 1.1503466204506068,
        "Engineer": 1.1503466204506068, "Assembler": 1.1503466204506068,
        "Boomer": 1.1503466204506068, "Architect": 1.1503466204506068,
        "Launcher": 1.1507798960138649, "Skimmer": 1.1507798960138649,
        "Twister": 1.1507798960138649, "Swarmer": 1.1507798960138649,
        "Sidewinder": 1.3006932409012133, "Shotgun": 1.1503466204506068,
        "Railgun": 1.2010398613518198, "Finger": 1.2010398613518198
    };

    const getEl = id => document.getElementById(id);
    let globalGameScale = 1;
    let globalFov = 46;

    // ─── Bullet Hider: skip arc() calls for small circles (bullets) ───
    const _origArc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function(x, y, r, startAngle, endAngle, anticlockwise) {
        if (bulletHiderEnabled && r > 0 && r < BULLET_RADIUS_THRESHOLD / (globalGameScale || 1)) return;
        return _origArc.apply(this, arguments);
    };
    // ──────────────────────────────────────────────────────────────────

    const _origSetTransform = CanvasRenderingContext2D.prototype.setTransform;
    CanvasRenderingContext2D.prototype.setTransform = function(a,b,c,d,e,f) {
        const absA = Math.abs(a);
        // Old gate was > 1.5 — scale shrinks as tank grows, so fov froze.
        // Now tracks the full valid range so mouse-follow stays accurate at any size.
        if (absA > 0.01 && absA < 50) {
            globalGameScale = absA;
            if (this.canvas) {
                const fov = this.canvas.width / globalGameScale;
                if (fov > 10 && fov < 2000) globalFov = fov;
            }
        }
        return _origSetTransform.apply(this, arguments);
    };

    const keys = {};
    const mouse = { x: 0, y: 0, dir: 0, lock: false, lockX: 0, lockY: 0, down: false, buttons: {} };
    const center = {
        get x() { return innerWidth / 2 },
        get y() { return innerHeight / 2 }
    };
    const events = {
        mouseDown(button, x, y) {},
        mouseUp(button, x, y) {},
        click(but, x, y) { this.mouseDown(but, x, y); this.mouseUp(but, x, y); },
        moveTo(x, y) {},
        moveToDir(dir) {
            this.moveTo(center.x + Math.cos(dir) * 100, center.y + Math.sin(dir) * 100);
        },
        _keyEvent(code, pressed) {
            const eventType = pressed ? 'keydown' : 'keyup';
            const _codeToKey = {
                'Space':       ' ',
                'Enter':       'Enter',
                'Escape':      'Escape',
                'Backspace':   'Backspace',
                'Tab':         'Tab',
                'Backquote':   '`',
                'Minus':       '-',
                'Equal':       '=',
                'BracketLeft': '[',
                'BracketRight':']',
                'Semicolon':   ';',
                'Quote':       "'",
                'Comma':       ',',
                'Period':      '.',
                'Slash':       '/',
                'ArrowUp':     'ArrowUp',
                'ArrowDown':   'ArrowDown',
                'ArrowLeft':   'ArrowLeft',
                'ArrowRight':  'ArrowRight',
            };
            let key;
            if (_codeToKey[code]) {
                key = _codeToKey[code];
            } else if (/^Key([A-Z])$/.test(code)) {
                key = RegExp.$1.toLowerCase();
            } else if (/^Digit(\d)$/.test(code)) {
                key = RegExp.$1;
            } else {
                key = code;
            }
            const event = new KeyboardEvent(eventType, {
                key, code, bubbles: true, cancelable: true, composed: true, itsMe: true
            });
            try { dispatchEvent(event); } catch (e) {}
        },
        keyDown(code) {
            this._keyEvent(code, true);
            if (!window.__is_bot && replicatableKeys.includes(code) && getEl("botsReplKeys")?.checked) {
                currentKeyStates[code] = true;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        },
        keyUp(code) {
            this._keyEvent(code, false);
            if (!window.__is_bot && replicatableKeys.includes(code) && getEl("botsReplKeys")?.checked) {
                if (_pulseHolds[code]) return;
                currentKeyStates[code] = false;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        },
        press(key, func, ms) {
            this.keyDown(key);
            func && func();
            if (ms) {
                setTimeout(() => this.keyUp(key), ms);
            } else {
                const pulseMs = key === 'KeyE' ? 30 : 80;
                if (!window.__is_bot && replicatableKeys.includes(key) && getEl("botsReplKeys")?.checked) {
                    if (_pulseHolds[key]) clearTimeout(_pulseHolds[key]);
                    _pulseHolds[key] = setTimeout(() => {
                        delete _pulseHolds[key];
                        currentKeyStates[key] = false;
                        localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
                    }, pulseMs);
                }
                this.keyUp(key);
            }
        }
    };

    const PI2 = Math.PI * 2;
    const player = {};
    player.fov = 1;
    const sinsay = {};
    let chatting;
    let ping = 20;
    const stealedClans = [];
    let isConnecting;
    let bots = [];

    const LS_KEYS      = "pr_key_replication";
    const LS_MOUSE_AIM = "arras_multibox_aim_parent";
    let _lastAimMx = -1, _lastAimMy = -1, _lastAimClick = -1;
    const replicatableKeys = [
        'Backquote',
        'Digit1','Digit2','Digit3','Digit4','Digit5',
        'Digit6','Digit7','Digit8','Digit9','Digit0',
        'Minus','Equal','Backspace',
        'Tab',
        'KeyQ','KeyE','KeyR','KeyT',
        'KeyY','KeyU','KeyI','KeyO','KeyP',
        'BracketLeft','BracketRight',
        'KeyF','KeyG',
        'KeyH','KeyJ','KeyK','KeyL',
        'Semicolon','Quote','Enter',
        'KeyZ','KeyX','KeyC','KeyV','KeyB',
        'KeyN','KeyM','Comma','Period','Slash',
        'Space','Escape',
    ];
    let currentKeyStates = {};
    let lastReceivedKeyStates = {};
    const _pulseHolds = {};
    replicatableKeys.forEach(k => { currentKeyStates[k] = false; lastReceivedKeyStates[k] = false; });

    let botsMsg = () => {};
    let canvas, ctx;
    let stackCycle = false;
    let stackRunning = false;
    let hasAutoUpgraded = false;
    let hasUpgraded = false;
    let spawned = false;
    let firstSpawn = true;
    let nrCycle = 0;
    const nrTanks = { launchers: "yuih", builders: "yihj" };
    let tankSelect, botTankSelect, botMoving, fedingCheckbox, botMouseFollow;
    let currentFedPath = [];

    const nWinListener = window.addEventListener;
    window.addEventListener = function (...args) {
        let eventType = args[0];
        if (eventType === "keydown" || eventType === "keyup") {
            let callback = args[1];
            args[1] = function (...args) {
                let newEvent = args[0].isTrusted ? args[0] : {
                    isTrusted: true,
                    key: args[0].key,
                    code: args[0].code,
                    preventDefault: function () {},
                };
                return callback.apply(this, [newEvent]);
            };
        }
        return nWinListener.apply(this, args);
    };

    function triggerStack(tankValue) {
        const tv = tankValue || tankSelect?.value;
        if (!tv) return;
        const stackin = window.__is_bot ? { checked: window.channel?.stackin } : getEl("stackin");
        if (!stackin || !stackin.checked) return;
        if (stackRunning) return;
        if (tv == "nuke") return;

        stackRunning = true;
        mouse.lockX = mouse.x;
        mouse.lockY = mouse.y;

        (async () => {
            if      (tv == "septaM")    await stacks.septa(0.077);
            else if (tv == "septaMa")   await stacks.septa(0.0485);
            else if (tv == "spread")    { mouse.lock = true; await stacks.rotating(0.105, 0.03, 0.12, 12, true); }
            else if (tv == "penta")     { mouse.lock = true; await stacks.rotating(0.0948, 0.026, 0.12, 6, true); }
            else if (tv == "octo")      await stacks.fullrotating(0.025, 0);
            else if (tv == "orbit")     await stacks.fullrotating(0.064, 0);
            else if (tv == "cyclone")   await stacks.cyclone(0.05);
            else if (tv == "tornado")   await stacks.cyclone(0.068);
            else if (tv == "whirlwind") await stacks.cyclone(0.13);
            else if (tv == "guntrap" || tv == "trapguard") {
                while (true) {
                    mouse.lock = true;
                    events.moveToDir(mouse.dir + Math.PI);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.12);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.38);
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                }
            } else if (tv == "conq") {
                while (true) {
                    mouse.lockX = mouse.x;
                    mouse.lockY = mouse.y;
                    mouse.lock = true;
                    events.moveToDir(mouse.dir + Math.PI);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.12);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.9);
                    if (!mouse.down && !mouse.buttons[0]) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.1);
                }
            } else if (tv == "blockade") {
                await stacks.subverter([0.125, 0.1]);
            } else if (tv == "toppler") {
                await stacks.subverter(...(window.o || [[0.381, 0.1]]));
            } else if (tv == "fighter") {
                setTimeout(() => events.mouseDown(0), 0.1);
                while (true) {
                    stackCycle = !stackCycle;
                    mouse.lock = true;
                    let delta = Math.PI / 2;
                    if (stackCycle) delta = -delta;
                    events.moveToDir(mouse.dir + delta);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.179);
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0); events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                }
            } else if (tv == "dreadV2") {
                await stacks.flank(window.o || 0.8);
            }
            mouse.lock = false;
            stackRunning = false;
        })();
    }

    HTMLDivElement.prototype.nListener = HTMLDivElement.prototype.addEventListener;
    HTMLDivElement.prototype.addEventListener = function (event, callback, ...opt) {
        if (event == "mousedown") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) { e.clientX = mouse.lockX; e.clientY = mouse.lockY; }
                ncb(e);
                if (!e.itsMe && tankSelect?.value == "nuke" && (e.button == 0 || mouse.buttons[0]))
                    events.moveToDir(mouse.dir + Math.PI);
            };

            events.mouseDown = (button, x, y) => {
                if (!x) x = mouse.x;
                if (!y) y = mouse.y;
                if (bots.length) botsMsg({ type: "mousedown", button, x, y });
                callback({ isTrusted: true, clientX: x, clientY: y, button, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mousedown", function (e) {
                mouse.down = true;
                mouse.buttons[e.button] = true;
                mouse.dir = utils.getDir(center.x, center.y, mouse.x, mouse.y);
                if (e.button == 0) triggerStack();

                if (bots.length) {
                    botsMsg({ type: "mousedown", button: e.button,
                        x: mouse.lock ? mouse.lockX : e.clientX,
                        y: mouse.lock ? mouse.lockY : e.clientY });
                }

                if (getEl("testinn")?.checked && e.button == 0) {
                    const time = Date.now();
                    if (window._t.length) window._t.at(-1)[1] = (time - window._t2) / 1000;
                    window._t2 = time;
                    getEl('debugg').innerHTML = JSON.stringify(window._t);
                }
            });

        } else if (event == "mouseup") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) { e.clientX = mouse.lockX; e.clientY = mouse.lockY; }
                ncb(e);
            };

            events.mouseUp = (button, x, y) => {
                if (!x) x = mouse.x;
                if (!y) y = mouse.y;
                if (bots.length) botsMsg({ type: "mouseup", button, x, y });
                callback({ isTrusted: true, clientX: x, clientY: y, button, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mouseup", function (e) {
                mouse.down = false;
                mouse.buttons[e.button] = false;
                stackRunning = false;
                if (bots.length) {
                    botsMsg({ type: "mouseup", button: e.button,
                        x: mouse.lock ? mouse.lockX : e.clientX,
                        y: mouse.lock ? mouse.lockY : e.clientY });
                }
                if (getEl("testinn")?.checked && e.button == 0) {
                    const time = Date.now();
                    window._t.push([(time - window._t2) / 1000]);
                    window._t2 = time;
                    getEl('debugg').innerHTML = JSON.stringify(window._t);
                }
            });

        } else if (event == "mousemove") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) return;
                if (!e.itsMe && tankSelect?.value == "nuke" && mouse.buttons[0])
                    events.moveToDir(mouse.dir + Math.PI);
                else
                    ncb(e);
            };

            events.moveTo = (x, y) => {
                mouse.lockX = x;
                mouse.lockY = y;
                if (bots.length) botsMsg({ type: "mousemove", x, y, innerWidth, innerHeight });
                callback({ isTrusted: true, clientX: x, clientY: y, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mousemove", function (e) {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                mouse.dir = utils.getDir(center.x, center.y, mouse.x, mouse.y);
                if (bots.length && !mouse.lock && getEl("cursorMirror")?.checked) {
                    botsMsg({ type: "cursormirror", nx: mouse.x / innerWidth, ny: mouse.y / innerHeight });
                }
            });
        }

        this.nListener(event, callback, ...opt);
    };

    class Stacks {
        static build  = "0/3/5/8/8/8/7/3";
        static build2 = "0/3/5/8/8/9/6/3";
        static build3 = "0/3/2/8/8/9/9/3";

        async rotating(anglePlus, delay, endDelay = 0.1, num = 12, useCycle) {
            while (true) {
                if (useCycle) stackCycle = !stackCycle;
                let angle = 0;
                for (let i = 0; i <= num; i++) {
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                    events.moveToDir((PI2 - angle * (useCycle && stackCycle ? 1 : -1)) + mouse.dir);
                    angle += anglePlus;
                    if (i == 0) events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(delay);
                }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(endDelay);
            }
        }

        async septa(delay, endDelay = 0.04) {
            mouse.lockX = mouse.x;
            mouse.lockY = mouse.y;
            const barrels = 7;
            const baseAngle = PI2 / barrels;
            while (true) {
                mouse.lock = true;
                const lockDir = mouse.dir;
                const lockX = mouse.lockX;
                const lockY = mouse.lockY;
                let angle = 0;
                for (let i = 0; i <= barrels; i++) {
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, lockX, lockY); return; }
                    events.moveToDir((PI2 - angle) + lockDir);
                    if (i === 0) events.mouseDown(0, lockX, lockY);
                    angle += baseAngle * 2;
                    await sleep(delay);
                }
                events.mouseUp(0, lockX, lockY);
                mouse.lock = false;
                await sleep(endDelay);
                mouse.lockX = mouse.x;
                mouse.lockY = mouse.y;
            }
        }

        async fullrotating(delay, endDelay = 0.1) { await this.rotating(PI2 / 50, delay, endDelay, 50); }

        async cyclone(delay) {
            while (true) {
                for (let angle of [0, 2, 1, 3]) {
                    angle = (PI2 / 12) * angle;
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                    events.moveToDir((PI2 - angle) + mouse.dir);
                    if (angle == 0) events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(delay);
                }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(0.1);
            }
        }

        async subverter(...timings) {
            mouse.lock = false;
            events.mouseUp(0);
            events.keyDown("Space");
            for (const timing of timings) {
                await sleep(timing[0]);
                events.keyUp("Space");
                await sleep(timing[1]);
                events.keyDown("Space");
            }
            while (mouse.buttons[0]) await sleep(0.04);
            events.keyUp("Space");
        }

        async flank(delay) {
            while (true) {
                mouse.lock = true;
                events.moveToDir(mouse.dir + Math.PI);
                events.mouseDown(0, mouse.lockX, mouse.lockY);
                await sleep(0.12);
                events.moveToDir(mouse.dir);
                mouse.lock = false;
                await sleep(delay);
                if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(0.08);
            }
        }
    }

    class Mapping {
        constructor() { this.lastWall = 0; }
        upgradeTank() { command("Digit1"); }
        placeWall(x, y, type) {
            x += center.x; y += center.y;
            events.moveTo(x, y);
            command("KeyX");
            events.press("Backquote", () => {
                events.press("KeyZ", () => {
                    events.moveTo(
                        x + Math.cos((Math.PI / 12) * type) * 20,
                        y + Math.sin((Math.PI / 12) * type) * 20
                    );
                });
            });
        }
    }

    const stacks  = new Stacks();
    const mapping = new Mapping();

    const tanks = {
        cocktail: { name: "autococktail",         path: "ehupk",  build:"0/4/3/8/8/9/7/4" },
        launchers: { name: "Launcher...",         path: "khkhe;khkye;khue",                  build:"0/0/9/9/9/9/9/0/0/0" },
        spread:    { name: "Spreadshot",          path: "yuuk",  desc: "Right click.",                                    build: Stacks.build  },
        penta:     { name: "Penta Shot",           path: "yuy",   desc: "Right click.",                                    build: Stacks.build  },
        guntrap:   { name: "Gunner Trapper",       path: "hhu",   desc: "Use 9 reload",                                    build: Stacks.build3 },
        trapguard: { name: "Trap Guard",           path: "hh",    desc: "Use 9 reload. Useful for Bomber branch",          build: Stacks.build3 },
        conq:      { name: "Conqueror",            path: "kyy",   desc: "Works on some Arms Race upgrade.",                build: Stacks.build3 },
        octo:      { name: "Octo Tank",            path: "hyy",   desc: "Right click.",                                    build: Stacks.build  },
        orbit:     { name: "Orbital strike",       path: "hyhi",  desc: "Right click. Cringe.",                            build: Stacks.build  },
        cyclone:   { name: "Cyclone",              path: "hyui",                                                           build: Stacks.build  },
        tornado:   { name: "Tornado",              path: "hyuy",  desc: "cyclone but more stable",                         build: Stacks.build  },
        whirlwind: { name: "Whirlwind",            path: "hyuk",  desc: "Perfect (because slow)",                          build: Stacks.build  },
        septaM:    { name: "Septa-Mech",           path: "hjkh",  desc: "good",                                            build: Stacks.build  },
        septaMa:   { name: "Septa-Machine",        path: "hjiu",  desc: "bad",                                             build: Stacks.build  },
        blockade:  {                               path: "uiji",  desc: "Hold right click. VERY useful in soccer.<br/>Default build is max bullet speed<br/> and 1 bullet health, to knockback ball.", build: "0/9/9/1/0/0/6/9/8" },
        toppler:   { name: "Toppler",              path: "uijh",  desc: "Hold right click.<br/>Right now not works sry",   build: Stacks.build2 },
        anni:      { name: "Annihilator",          path: "ekyue", desc: "Press G to upgrade and shoot<br/>instantly and instantly upgrade to<br/>level 45.", firingWhenUpgrade: true, slowUpgrading: true, build: "0/6/9/9/9/9" },
        fastram:   {                                              desc: "Press G for fast level 45<br/>and fast stats for ramming.<br/>",                     firingWhenUpgrade: true,                  build: "9/9/0/0/0/0/0/9/6/9" },
        finger:    { name: "Finger",               path: "uky",   desc: "Press G to upgrade to finger and shoot.<br/>For nuking in clan wars.", firingWhenUpgrade: true, build: "0/0/9/9/9/9/6" },
        fighter:   { name: "Fighter",              path: "huye",   desc: "Stack for almost any Figher tank branch<br/>in arms race. Right click.<br/>Time killer is cringe.", build: "0/5/0/7/7/9/7/7" },
        nuke:      { name: "Nuker",                path: "huh",   desc: "Right click to reverse.<br/>Not only for nuker.", build: "0/5/0/7/7/9/7/7" },
        auto4:     { name: "Auto-4/6",             path: "hiiy",  desc: "(not stack)",                                     build: Stacks.build  },
        auto4feed: { name: "Auto-4 (feed build)",  path: "hii",                                                            build: "0/0/0/0/0/0/0/9" },
        ultraspawn:{ name: "Ultra Spawner",        path: "jhiy",                                                           build: "0/3/6/8/8/9/5/3" },
        brig:      { name: "Brig",                 path: "yjjj",                                                           build: "0/3/3/9/9/9/9"   },
        overczar:  { name: "Overczar",             path: "jyyy",                                                           build: "0/3/7/8/8/9/4/3" },
        pursuer:   { name: "Pursuer (feed build)", path: "uyiy",                                                           build: "0/0/0/0/0/0/0/9" },
        phys:      { name: "Physician (N+M)",      path: "nm",                                                             build: "9/9/0/0/0/0/6/12/0/9" },
        dreadV2:   { desc: "Stack for destroyer (peacekeeper) dreadnought with 7 reload.", path: "", build: "" },
        fireworks: { name: "Fireworks", path: "khky", build: "0/3/4/8/8/9/9/3" }
    };
    for (const tank in tanks) {
        if (Object.hasOwn(tanks, tank)) tanks[tank].id = tank;
    }

    async function sleep(time) {
        if (!time) return;
        await new Promise(r => setTimeout(r, time * 1000));
    }

    async function upgradeTank(path, slow) {
        if (!path) return;
        for (const key of path.toUpperCase()) {
            events.press("Key" + key);
            await sleep(slow ? 0.09 : 0.05);
        }
    }

    function upgradeStats(tank) {
        let build = tank.build;
        if (typeof tank == "string") build = tank;
        else if (!tank.build) return;
        let i = 0;
        for (const stat of build.split("/")) {
            i++;
            if (i == 10) i = 0;
            if (stat == "0") continue;
            for (let i2 = 0; i2 < Number(stat); i2++) events.press("Digit" + i);
        }
    }

    async function command(...ks) {
        events.keyDown("Backquote");
        for (const k of ks) {
            events.press(k);
            await sleep(0.02);
        }
        events.keyUp("Backquote");
    }

    function chat(msg) {
        events.press("Enter");
        const interval = setInterval(() => {
            const input = document.querySelector("body > input[type=text]");
            if (!input) return;
            clearInterval(interval);
            input.value = msg;
            events.press("Enter");
        }, 40);
    }

    function stopMoving() {
        for (const key of "WASD") events.keyUp("Key" + key);
    }

    function dirPathfind(angle) {
        if      (angle >= -Math.PI/8  && angle < Math.PI/8)    events.keyDown("KeyD");
        else if (angle >= Math.PI/8   && angle < 3*Math.PI/8)  { events.keyDown("KeyS"); events.keyDown("KeyD"); }
        else if (angle >= 3*Math.PI/8 && angle < 5*Math.PI/8)  events.keyDown("KeyS");
        else if (angle >= 5*Math.PI/8 && angle < 7*Math.PI/8)  { events.keyDown("KeyS"); events.keyDown("KeyA"); }
        else if (angle >= 7*Math.PI/8 || angle < -7*Math.PI/8) events.keyDown("KeyA");
        else if (angle >= -7*Math.PI/8 && angle < -5*Math.PI/8){ events.keyDown("KeyW"); events.keyDown("KeyA"); }
        else if (angle >= -5*Math.PI/8 && angle < -3*Math.PI/8) events.keyDown("KeyW");
        else { events.keyDown("KeyW"); events.keyDown("KeyD"); }
    }

    let _lastPathAngle = null;
    function pathfind(x, y, minDist = 1) {
        if (!spawned || (window.__is_bot && (!hasUpgraded || !channel.moving))) return;
        const angle = utils.getDir(player.x, player.y, x, y);
        const dist  = utils.getDist(player.x, player.y, x, y);
        if (dist <= minDist) { stopMoving(); _lastPathAngle = null; return; }
        if (_lastPathAngle === null || Math.abs(angle - _lastPathAngle) > 0.15) {
            stopMoving();
            dirPathfind(angle);
            _lastPathAngle = angle;
        }
    }

    let _onSpawnFired = false;
    function onSpawn() {
        if (_onSpawnFired) return;
        _onSpawnFired = true;
        if (window.__is_bot) {
            stopMoving();
            spawned = true;
            hasUpgraded = false;
            const upgradeDelay = 1200 + Math.random() * 600;
            const upgradeFailsafe = setTimeout(() => { hasUpgraded = true; }, 3500);
            setTimeout(() => {
                let t = window.channel.tank;
                const eDelay = 800 + (window.__bot_idx || 0) * 400;
                const pressE = () => {
                    if (!window.channel?.autofireE) return;
                    events._keyEvent('KeyE', true);
                    setTimeout(() => events._keyEvent('KeyE', false), 30);
                };
                if (t == "none") {
                    hasUpgraded = true;
                    clearTimeout(upgradeFailsafe);
                    setTimeout(pressE, eDelay);
                    const pendingMacro = window.channel?.pendingMacro || localStorage.getItem("pr_lastMacroName");
                    if (pendingMacro && MACROS[pendingMacro]) {
                        setTimeout(() => performMacroUpgrade(pendingMacro), 500);
                    }
                } else {
                    if (t == "wiping")       t = { path: "hu" + utils.choice("yhjk"), build: "0/4/2/7/7/9/7/6" };
                    else if (t == "wipingAR")  t = { path: utils.choice(["huyj","hukk","hukh","huju","hujy","huhy","uikj","uikk","kkh","kkk"]), build: "0/4/2/7/7/9/7/6" };
                    else if (t == "necro")     t = { path: "ji" + utils.choice(["yy","yk","yi","ki","hy","hj","hi","iy","iu"]), build: "0/5/3/7/7/9/7/4" };
                    else if (t == "crash")     t = { path: "ce" + utils.choice(["hyuk","yjyk","hjiu","hyuh"]), build: "0/0/0/9/9/9/9/6" };
                    else if (t == "feding")    t = { path: "hu" + utils.choice("yuik"), build: "0/0/0/0/0/0/9/9" };
                    else if (t == "fedingAR")  t = { path: "huu" + utils.choice("yuik"), build: "0/0/0/0/0/0/9/9" };
                    upgradeTank(t.path).then(() => upgradeStats(t)).then(() => {
                        hasUpgraded = true;
                        clearTimeout(upgradeFailsafe);
                        setTimeout(pressE, eDelay);
                    });
                }
            }, upgradeDelay);
        } else {
            console.log(firstSpawn ? "Spawned" : "Respawned");
            const autoStats = getEl("autoStats");
            const tank = tanks[tankSelect?.value];
            if (tank && autoStats?.checked && !hasAutoUpgraded) {
                hasAutoUpgraded = true;
                setTimeout(() => {
                    if (tank.firingWhenUpgrade) {
                        for (let i = 0; i <= 45; i++) events.keyDown("KeyN");
                        events.keyUp("KeyN");
                        upgradeStats(tank);
                        upgradeTank(tank.path, tank.slowUpgrading);
                        events.press("Space", null, 400);
                    } else {
                        upgradeStats(tank);
                        upgradeTank(tank.path);
                    }
                }, 500);
            }
        }

        if (fedingCheckbox?.checked) {
            currentFedPath = [...window.fedPath];
            for (let i = 0; i < 4; i++) events.press("Key" + utils.choice("YUIHJK"));
            events.press("KeyM", () => events.press("Digit8"));
            for (let i = 0; i < 35; i++) events.press("Digit" + utils.randint(3, 7));
            events.press("KeyR");
            spawned = true;
        } else {
            spawned = true;
        }

        firstSpawn = false;
    }

    CanvasRenderingContext2D.prototype.nFT = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
        if (text == null) return this.nFT(text, x, y);
        text = String(text);
        if (text.includes("Coordinates: (")) {
            const match = text.match(/Coordinates: \(([^)]+)\)/);
            if(match) {
                const parts = match[1].split(", ");
                if (!spawned) onSpawn();
                player.oldX = player.x;
                player.oldY = player.y;
                player.x  = parseFloat(parts[0]);
                player.y  = parseFloat(parts[1]);
                player.xv = player.x - player.oldX;
                player.yv = player.y - player.oldY;
            }

        } else if (text.startsWith("Level ")) {
            const parts = text.split(" ");
            if (parts.length >= 3) {
                const tankName = parts.slice(2).join(" ");
                player.class = tankName;
                player.fov   = tankFOV[tankName] || tankFOV["Base"];
            }

        } else if (text.includes("You have spawned! Welcome to the game.")) {
            onSpawn();

        } else if (text.includes("Survived for ")) {
            if (!window.__is_bot) console.log("Died");
            spawned = false;
            firstSpawn = false;
            hasAutoUpgraded = false;
            hasUpgraded = false;
            _onSpawnFired = false;
            if (window.__is_bot || getEl("autoRespawn")?.checked || fedingCheckbox?.checked) {
                const interval = setInterval(() => {
                    if (spawned) { clearInterval(interval); return; }
                    events.press("Enter");
                    events.press("Escape");
                    stopMoving();
                    events.mouseUp(0);
                }, 300);
            }

        } else if (text.startsWith(KILL_PREFIX)) {
            const killMsg = text.trim();
            if (killMsg !== lastKillMessage) {
                lastKillMessage = killMsg;
                const username = killMsg.replace(KILL_PREFIX, '');
                killLog.push({ username, time: new Date().toLocaleTimeString(), timestamp: Date.now(), type: 'kill' });
                _updateKillLog();
            }
        } else if (text.startsWith(ASSIST_PREFIX)) {
            const aMsg = text.trim();
            if (aMsg !== lastKillMessage) {
                lastKillMessage = aMsg;
                const username = aMsg.replace(ASSIST_PREFIX, '');
                killLog.push({ username, time: new Date().toLocaleTimeString(), timestamp: Date.now(), type: 'assist' });
                _updateKillLog();
            }
        } else if (text.includes(" ms  ")) {
            const match = text.match(/([0-9]+)\.[0-9]+ ms/);
            if (match) ping = Number(match[1]);

        } else if (text == "Connecting...") {
            isConnecting = true;
        }

        if (!window.__is_bot) {
            const match = text.match(/(\[[^\[\]]+\])/g);
            if (match) {
                let stolen;
                for (const tag of match) {
                    if (!stealedClans.includes(tag) && !/\[\w\]/.test(tag)) {
                        stealedClans.push(tag);
                        stolen = true;
                    }
                }
                if (stolen) { const el = getEl("stealedClans"); if (el) el.innerText = stealedClans.join(" "); }
            }
        }
        this.nFT(text, x, y);
    };

    const nFill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function () {
        if (xrayEnabled) this.globalAlpha = xrayAlphaVal;
        nFill.call(this);
    };

    const nGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
        const context = nGetContext.apply(this, args);
        if (!canvas && context && typeof context.arc === 'function') {
            canvas = this;
            ctx = context;
            const nArc = ctx.arc.bind(ctx);
            ctx.arc = function (x, y, radius, startAngle, endAngle, counterclockwise) {
                return nArc(x, y, radius, startAngle, endAngle, counterclockwise);
            };
        }
        return context;
    };

    const WASM_iS = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async function (wasm, imports) {
        for (let i = 0; i < imports[0].length; i++) {
            if (imports[0][i].toString() === "()=>crypto.getRandomValues(new Uint32Array(1))[0]") {
                imports[0][i] = () => [0];
            } else if (imports[0][i].toString().includes("].globalAlpha=") && !window.__is_bot) {
                imports[0][i] = (idx, val) => {
                    ctx.globalAlpha = seeEverythingEnabled ? 1 : val;
                };
            }
        }
        const instance = await WASM_iS.call(this, wasm, imports);
        let memory_export;
        for (let i in instance.instance.exports) {
            if (instance.instance.exports[i] instanceof WebAssembly.Memory) { memory_export = i; break; }
        }
        Object.defineProperty(window, "HEAPU32", {
            get() { return new Uint32Array(instance.instance.exports[memory_export].buffer); }
        });
        window.xd = () => mem;
        return instance;
    };

    addEventListener("keydown", function (e) {
        if (!(e instanceof KeyboardEvent) && !e.itsMe) return;

        if (!window.__is_bot) {
            if (e.key == "Tab") {
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display == "flex" ? "none" : "flex";
            } else if (e.key == "Enter") {
                const interval = setInterval(() => {
                    const input = document.querySelector("body > input[type=text]");
                    if (!input) return;
                    clearInterval(interval);
                    input.addEventListener("keydown", () => {
                        if (input.value.toLowerCase().includes("ez") && getEl("allowEZ")?.checked)
                            input.value = input.value
                                .replace("ez","еz").replace("Ez","Еz")
                                .replace("eZ","еZ").replace("EZ","ЕZ");
                    });
                }, 40);
            }

            const tank = tanks[tankSelect?.value];
            if (tank && !chatting && !keys["`"]) {
                if (e.key == "x") {
                    const el = getEl("stackin");
                    if (el) el.checked = !el.checked;
                } else if (e.key == "z") {
                    mouse.lock = !mouse.lock;
                } else if (e.key == (tank.firingWhenUpgrade ? "g" : ",")) {
                    if (tank.firingWhenUpgrade) {
                        for (let i = 0; i <= 45; i++) events.keyDown("KeyN");
                        events.keyUp("KeyN");
                        upgradeStats(tank);
                        upgradeTank(tank.path, tank.slowUpgrading);
                        events.press("Space", null, 400);
                    } else {
                        if (getEl("autoStats")?.checked) upgradeStats(tank);
                        upgradeTank(tank.path);
                    }
                }

                if (getEl("sandboxTools")?.checked) {
                    if (e.key == "1") command("KeyC", "KeyH");
                    else if (e.key == "5" && keys[4] && window._ea_army)
                        for (let i = 0; i < 50; i++) command("KeyC", "KeyH");
                    else if (e.key == "8" && keys[6]) command("KeyW", "KeyK");
                }
            }

            if (getEl("botsReplKeys")?.checked && !chatting && (e.isTrusted || e.itsMe)) {
                if (replicatableKeys.includes(e.code)) {
                    currentKeyStates[e.code] = true;
                    localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
                }
                botsMsg({ type: "keydown", code: e.code });
            }
        }

        keys[e.key] = true;
    });

    addEventListener("keyup", function (e) {
        if (getEl("botsReplKeys")?.checked && !chatting && (e.isTrusted || e.itsMe)) {
            botsMsg({ type: "keyup", code: e.code });
            if (replicatableKeys.includes(e.code)) {
                currentKeyStates[e.code] = false;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        }
        keys[e.key] = false;
    });

    function _updateKillLog() {
        const container = document.getElementById('pr_kill_log');
        const countEl   = document.getElementById('pr_kill_count');
        if (!container) return;
        if (killLog.length === 0) {
            container.innerHTML = '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:12px">No kills recorded yet</div>';
            if (countEl) countEl.textContent = '0';
        } else {
            container.innerHTML = killLog.slice().reverse().map(e =>
                `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-family:monospace;font-size:12px;display:flex;justify-content:space-between">
                    <span style="color:${e.type==='assist'?'#ff9500':'#4ade80'}">${e.type==='assist'?'🤝':'💀'} ${e.username}</span>
                    <span style="opacity:0.5">${e.time}</span>
                </div>`
            ).join('');
            if (countEl) countEl.textContent = killLog.length.toString();
        }
    }

    function _updateStatusPanel() {
        const roleEl  = document.getElementById('pr_stat_role');
        const posEl   = document.getElementById('pr_stat_pos');
        const fovEl2  = document.getElementById('pr_stat_fov');
        const swarmEl = document.getElementById('pr_stat_swarm');
        const statusEl = document.getElementById('pr_stat_status');
        if (roleEl)   roleEl.textContent  = bots.length ? `Leader (${bots.length} bots)` : 'Solo';
        if (posEl && player.x)  posEl.textContent = `(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`;
        if (fovEl2)   fovEl2.textContent  = globalFov ? globalFov.toFixed(1) : '--';
        if (swarmEl)  swarmEl.textContent = `${swarmSize} tabs`;
        if (statusEl) statusEl.textContent = spawned ? 'Alive' : 'Dead/Lobby';
    }

    setInterval(_updateStatusPanel, 1000);

    (function sbxThings() {
        chatting = Boolean(document.querySelector("body > input[type=text]"));

        if (getEl("sbxHeal")?.checked && mouse.down) {
            command("KeyH");
        } else if (!chatting && !keys["`"] && getEl("sandboxTools")?.checked) {
            if (keys["2"]) command("KeyX");
        }

        const nrTank = getEl("noReloadSelect")?.value;
        if (mouse.down && nrTank && nrTank != "disabled") {
            switch (nrTank) {
                case "engineer":  command("KeyQ"); upgradeTank("kui"); break;
                case "surgeon":   command("KeyQ", "Digit2"); events.press("KeyI"); break;
                case "launchers":
                    command("KeyQ");
                    upgradeTank("kh" + nrTanks.launchers[nrCycle]);
                    if (++nrCycle >= nrTanks.launchers.length) nrCycle = 0;
                    break;
                case "builders":
                    command("KeyQ");
                    upgradeTank("ku" + nrTanks.builders[nrCycle]);
                    if (++nrCycle >= nrTanks.builders.length) nrCycle = 0;
                    break;
            }
        }
        setTimeout(sbxThings, 40);
    })();

    setInterval(() => {
        const fovEl = getEl("fovDisplay");
        if (fovEl) fovEl.textContent = globalFov ? globalFov.toFixed(1) : "--";
    }, 500);

    setInterval(() => {
        if (window.__is_bot && player.x) {
            if (sinsay._gotoTarget) {
                const t = sinsay._gotoTarget;
                const dist = utils.getDist(player.x, player.y, t.x, t.y);
                if (dist < 2) { stopMoving(); }
                else pathfind(t.x, t.y, 2);
            } else if (window.channel && window.channel.followMe && sinsay.x !== undefined) {
                pathfind(sinsay.x, sinsay.y, sinsay.minDist !== undefined ? sinsay.minDist : 0.3);
            } else if (window.channel && window.channel.mouseFollow && sinsay.worldX !== undefined) {
                pathfind(sinsay.worldX, sinsay.worldY);
            } else if (sinsay.x) {
                pathfind(sinsay.x, sinsay.y, sinsay.minDist !== undefined ? sinsay.minDist : 3);
            }
        } else if (bots.length) {
            let targetX = player.x + (player.xv || 0) * 20;
            let targetY = player.y + (player.yv || 0) * 20;

            if (botMouseFollow && botMouseFollow.checked && !mouse.lock) {
                targetX = (mouse.x - center.x) / center.x * globalFov + (player.x || 0);
                targetY = (mouse.y - center.y) / center.y * globalFov * (innerHeight / innerWidth) + (player.y || 0);
            }

            if (formationConfig.enabled && bots.length) {
    const n   = bots.length;
    const sp  = formationConfig.spacing || 60;
    const typ = formationConfig.type;
    const dir = Math.atan2(player.yv || 0, player.xv || 0);

    // Invalidate cache more aggressively for dynamic formations
    const dirChanged = Math.abs(dir - (_fmCache?.dir || 0)) > 0.12;
    if (!_fmCache || _fmCache.n !== n || _fmCache.sp !== sp || _fmCache.typ !== typ || dirChanged) {
        const perp = dir + Math.PI / 2;
        const mid  = (n - 1) / 2;

        _fmCache = {
            n, sp, typ, dir,
            offsets: Array.from({ length: n }, (_, i) => {
                const slot = i - mid;

                switch (typ) {
                    // V-shape behind player (default "behind")
                    case 'behind': {
                        const depth = Math.abs(slot) * sp * 0.5 + sp;
                        return {
                            dx: -Math.cos(dir) * depth + Math.cos(perp) * slot * (sp * 0.7),
                            dy: -Math.sin(dir) * depth + Math.sin(perp) * slot * (sp * 0.7),
                            minD: 2
                        };
                    }
                    // V-shape in front of player
                    case 'front': {
                        const depth = Math.abs(slot) * sp * 0.5 + sp;
                        return {
                            dx: Math.cos(dir) * depth + Math.cos(perp) * slot * (sp * 0.7),
                            dy: Math.sin(dir) * depth + Math.sin(perp) * slot * (sp * 0.7),
                            minD: 2
                        };
                    }
                    case 'line':
                        return {
                            dx: Math.cos(perp) * slot * sp,
                            dy: Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'line_front':
                        return {
                            dx: Math.cos(dir) * sp + Math.cos(perp) * slot * sp,
                            dy: Math.sin(dir) * sp + Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'line_behind':
                        return {
                            dx: -Math.cos(dir) * sp + Math.cos(perp) * slot * sp,
                            dy: -Math.sin(dir) * sp + Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'tight':
                        return { dx: 0, dy: 0, minD: 0 };
                    case 'circle': {
                        const a = (Math.PI * 2 / n) * i;
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'arc_front': {
                        const spread = Math.PI * 0.66; // 120° arc
                        const a = dir + (n === 1 ? 0 : -spread/2 + spread * (i / (n - 1)));
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'arc_behind': {
                        const spread = Math.PI * 0.66;
                        const a = dir + Math.PI + (n === 1 ? 0 : -spread/2 + spread * (i / (n - 1)));
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'diamond': {
                        // Diamond around player (front/back/left/right + extras spiral out)
                        const a = (Math.PI / 2) * i + dir;
                        const ring = Math.floor(i / 4) + 1;
                        return {
                            dx: Math.cos(a) * sp * ring,
                            dy: Math.sin(a) * sp * ring,
                            minD: 2
                        };
                    }
                    case 'wedge': {
                        // Arrow pointing forward
                        const row = i;
                        const rowOffset = row % 2 === 0 ? row / 2 : -(row + 1) / 2;
                        return {
                            dx: Math.cos(dir) * sp * (row + 1) + Math.cos(perp) * rowOffset * sp * 0.5,
                            dy: Math.sin(dir) * sp * (row + 1) + Math.sin(perp) * rowOffset * sp * 0.5,
                            minD: 2
                        };
                    }
                    case 'double_line': {
                        // Two parallel lines behind, alternating sides
                        const half = Math.floor(n / 2);
                        const isFront = i < half;
                        const lineSlot = isFront ? i - (half - 1) / 2 : (i - half) - (n - half - 1) / 2;
                        const lineDepth = isFront ? sp * 0.5 : -sp * 0.5;
                        return {
                            dx: Math.cos(dir) * lineDepth + Math.cos(perp) * lineSlot * sp,
                            dy: Math.sin(dir) * lineDepth + Math.sin(perp) * lineSlot * sp,
                            minD: 2
                        };
                    }
                    case 'grid': {
                        // Square grid behind player
                        const cols = Math.ceil(Math.sqrt(n));
                        const row = Math.floor(i / cols);
                        const col = i % cols;
                        const colOffset = col - (cols - 1) / 2;
                        return {
                            dx: -Math.cos(dir) * (row + 1) * sp + Math.cos(perp) * colOffset * sp,
                            dy: -Math.sin(dir) * (row + 1) * sp + Math.sin(perp) * colOffset * sp,
                            minD: 2
                        };
                    }
                    case 'spiral': {
                        const a = i * 0.7 + dir;
                        const r = sp * (1 + i * 0.3);
                        return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, minD: 2 };
                    }
                    case 'random_scatter': {
                        // Deterministic pseudo-random based on index
                        const seed1 = Math.sin(i * 12.9898) * 43758.5453;
                        const seed2 = Math.sin(i * 78.233) * 43758.5453;
                        const rx = (seed1 - Math.floor(seed1)) * 2 - 1;
                        const ry = (seed2 - Math.floor(seed2)) * 2 - 1;
                        return { dx: rx * sp * 2, dy: ry * sp * 2, minD: 2 };
                    }
                    default:
                        return null;
                }
            })
        };
    }

    bots.forEach((bot, i) => {
        const o = _fmCache.offsets[i];
        const fx = o ? player.x + o.dx : targetX;
        const fy = o ? player.y + o.dy : targetY;
        const minD = o ? o.minD : (_followDistance > 0 ? _followDistance : undefined);
        try { bot.contentWindow.channel.message({ type: "position", x: fx, y: fy, minDist: minD }); } catch(e) {}
    });
} else {
    botsMsg({ type: "position", x: targetX, y: targetY, minDist: _followDistance > 0 ? _followDistance : undefined });
}

            if (!window.__is_bot && player.x && getEl("mouseAimMode")?.checked) {
                const ax = player.x + (mouse.x - center.x) / center.x * globalFov;
                const ay = player.y + (mouse.y - center.y) / center.y * (globalFov * (innerHeight / innerWidth));
                botsMsg({ type: 'aimUpdate', aimX: ax, aimY: ay });
            }
        }

        if (fedingCheckbox?.checked && currentFedPath.length) {
            let loc = currentFedPath[0];
            if (utils.getDist(player.x, player.y, loc.x, loc.y) < 2.5) {
                currentFedPath.shift();
                loc = currentFedPath[0];
            }
            if (loc) pathfind(loc.x, loc.y);
        }
    }, 150);


    function relayJoystickToBots(angle, active) {
        if (bots.length) botsMsg({ type: 'joystick', angle, active });
    }

    function initUI() {
        tankSelect     = getEl("tankSelect");
        botTankSelect  = getEl("botTankSelect");
        botMoving      = getEl("botsMoving");
        fedingCheckbox = getEl("doFed");

        if (!window.__is_bot) {
            const menu = document.createElement("div");
            menu.id = "scriptMenu";

            Object.assign(menu.style, {
                position: "fixed",
                top: "20px",
                left: "20px",
                width: "520px",
                maxHeight: "calc(100% - 40px)",
                background: "rgba(12, 12, 20, 0.85)",
                backdropFilter: "blur(16px)",
                color: "#f0f0f0",
                fontFamily: "'Inter', 'Segoe UI', Ubuntu, system-ui",
                fontSize: "13px",
                borderRadius: "20px",
                padding: "16px",
                display: "none",
                gap: "12px",
                flexDirection: "row",
                userSelect: "none",
                boxShadow: "0 25px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.2s ease",
                zIndex: "999999"
            });

            const menuNames = ["main","bots","sbx","fed","visual","macros","other","status","killlog","username","chatmsg","perf","test","tutor","keys","extbots"];
            let kbOverlay = null;
            let cursor = null;

            window.changeMenu = function (name) {
                menuNames.forEach(n => {
                    const el = document.getElementById("menu-" + n);
                    if (el) el.style.display = (el.id === "menu-" + name) ? "" : "none";
                });
                if (kbOverlay) kbOverlay.style.display = (name === "keys") ? "flex" : "none";
                stored.tab = name;
                saveJSON();
            };

            menu.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

                #scriptMenu * { box-sizing: border-box; margin: 0; padding: 0; }

                #scriptMenu {
                    font-family: 'Rajdhani', sans-serif !important;
                    background: linear-gradient(160deg, #0a0c10 0%, #0d1117 60%, #080b0f 100%) !important;
                    border: 1px solid rgba(56,189,248,0.15) !important;
                    border-radius: 4px !important;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(56,189,248,0.04) !important;
                }

                /* Corner accents */
                #scriptMenu::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 18px; height: 18px;
                    border-top: 2px solid #38bdf8;
                    border-left: 2px solid #38bdf8;
                    border-radius: 4px 0 0 0;
                    pointer-events: none;
                    z-index: 10;
                }
                #scriptMenu::after {
                    content: '';
                    position: absolute;
                    bottom: 0; right: 0;
                    width: 18px; height: 18px;
                    border-bottom: 2px solid rgba(56,189,248,0.4);
                    border-right: 2px solid rgba(56,189,248,0.4);
                    border-radius: 0 0 4px 0;
                    pointer-events: none;
                    z-index: 10;
                }

                .slider-btn {
                    width: 22px; height: 22px;
                    border-radius: 3px;
                    background: rgba(56,189,248,0.1);
                    border: 1px solid rgba(56,189,248,0.3);
                    color: #38bdf8;
                    font-size: 13px; font-weight: 700;
                    cursor: pointer; padding: 0;
                    line-height: 1; vertical-align: middle;
                    transition: 0.15s; margin: 0 2px;
                    font-family: 'Share Tech Mono', monospace;
                }
                .slider-btn:hover { background: rgba(56,189,248,0.25); transform: scale(1.08); }
                .slider-btn:active { transform: scale(0.94); }

                .tabButton {
                    cursor: pointer;
                    background: transparent;
                    font-size: 10px;
                    width: 82px;
                    height: 28px;
                    border-radius: 3px;
                    color: rgba(148,163,184,0.9);
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: 0.18s;
                    font-weight: 600;
                    font-family: 'Rajdhani', sans-serif;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    position: relative;
                }
                .tabButton:hover {
                    background: rgba(56,189,248,0.08);
                    border-color: rgba(56,189,248,0.35);
                    color: #e2e8f0;
                    box-shadow: inset 0 0 12px rgba(56,189,248,0.05);
                }
                .tabButton.active-tab {
                    background: rgba(56,189,248,0.12);
                    border-color: rgba(56,189,248,0.5);
                    color: #38bdf8;
                    box-shadow: 0 0 10px rgba(56,189,248,0.1), inset 0 0 8px rgba(56,189,248,0.06);
                }

                .v-separator {
                    width: 1px;
                    background: linear-gradient(to bottom, transparent, rgba(56,189,248,0.2) 30%, rgba(56,189,248,0.2) 70%, transparent);
                    flex-shrink: 0;
                }
                .h-separator {
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(56,189,248,0.2) 30%, rgba(56,189,248,0.2) 70%, transparent);
                    margin: 6px 0;
                }

                #tabButtons {
                    display: flex; flex-direction: column; gap: 3px;
                    flex-shrink: 0;
                    overflow-y: auto;
                    max-height: calc(100% - 32px);
                    scrollbar-width: none;
                    padding: 2px;
                }
                #tabButtons::-webkit-scrollbar { display: none; }

                #menus {
                    flex: 1; overflow-y: auto;
                    padding-left: 10px;
                    font-size: 13px;
                    max-height: 60vh;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(56,189,248,0.2) transparent;
                    color: #cbd5e1;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 500;
                }
                #menus::-webkit-scrollbar { width: 3px; }
                #menus::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.25); border-radius: 2px; }

                #scrollBtns { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; justify-content: center; }
                #scrollBtns button {
                    width: 24px; height: 36px;
                    border-radius: 3px;
                    background: rgba(56,189,248,0.05);
                    border: 1px solid rgba(56,189,248,0.15);
                    color: #38bdf8; font-size: 14px;
                    cursor: pointer; transition: 0.18s;
                }
                #scrollBtns button:active { background: rgba(56,189,248,0.2); }

                #menus p { margin: 5px 0; line-height: 1.5; }

                #menus label { color: #94a3b8; font-size: 12px; letter-spacing: 0.3px; }

                #menus select, #menus input[type="text"], #menus input[type="password"], #menus input[type="number"], #menus textarea {
                    background: rgba(2,6,14,0.8);
                    border: 1px solid rgba(56,189,248,0.18);
                    border-radius: 3px;
                    padding: 5px 10px;
                    color: #e2e8f0;
                    font-size: 12px;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 500;
                    outline: none;
                    transition: border-color 0.2s;
                }
                #menus select:focus, #menus input:focus, #menus textarea:focus {
                    border-color: rgba(56,189,248,0.5);
                    box-shadow: 0 0 0 2px rgba(56,189,248,0.06);
                }

                #menus input[type="checkbox"] {
                    accent-color: #38bdf8;
                    width: 13px; height: 13px;
                    cursor: pointer;
                    vertical-align: middle;
                }

                #menus button {
                    cursor: pointer; transition: 0.18s;
                    background: rgba(56,189,248,0.08);
                    border: 1px solid rgba(56,189,248,0.25);
                    border-radius: 3px;
                    padding: 5px 10px;
                    color: #94a3b8;
                    font-size: 11px;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 600;
                    letter-spacing: 0.4px;
                    text-transform: uppercase;
                }
                #menus button:hover {
                    background: rgba(56,189,248,0.18);
                    border-color: #38bdf8;
                    color: #e2e8f0;
                    box-shadow: 0 0 10px rgba(56,189,248,0.12);
                }
                #menus button:active { transform: scale(0.97); }

                /* Kill/danger buttons */
                #menus button[style*="139,0,0"], #menus button[style*="dc2626"], #extKill1, #extKill2, #extKill3, #extKill4, #extKill5, #extKill6, #extKillAll, #dcBots {
                    background: rgba(220,38,38,0.1) !important;
                    border-color: rgba(220,38,38,0.3) !important;
                    color: #f87171 !important;
                }
                #menus button[style*="139,0,0"]:hover, #extKill1:hover, #extKill2:hover, #extKill3:hover, #extKill4:hover, #extKill5:hover, #extKill6:hover, #extKillAll:hover, #dcBots:hover {
                    background: rgba(220,38,38,0.25) !important;
                    border-color: #ef4444 !important;
                }

                /* Blue action buttons */
                #botFireToggle, #createBot, #spawnMultiple, #extReconnectAll, #reconnectBots {
                    background: rgba(56,189,248,0.12) !important;
                    border-color: rgba(56,189,248,0.35) !important;
                    color: #38bdf8 !important;
                }

                #dragHandle {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 14px;
                    cursor: move;
                    border-radius: 4px 4px 0 0;
                    background: linear-gradient(to right, rgba(56,189,248,0.08), transparent 40%, transparent 60%, rgba(56,189,248,0.08));
                    display: flex; align-items: center; justify-content: center;
                }
                #dragHandle::after {
                    content: '⠿';
                    color: rgba(56,189,248,0.3);
                    font-size: 10px;
                    letter-spacing: 3px;
                }

                #authBadge {
                    position: absolute;
                    bottom: 6px; right: 10px;
                    font-size: 9px;
                    color: rgba(56,189,248,0.4);
                    background: rgba(0,0,0,0.5);
                    padding: 2px 6px;
                    border-radius: 2px;
                    border: 1px solid rgba(56,189,248,0.1);
                    font-family: 'Share Tech Mono', monospace;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                /* Status indicators */
                #extStatus0, #extStatus1, #extStatus2, #extStatus3, #extStatus4, #extStatus5 {
                    font-family: 'Share Tech Mono', monospace;
                    font-size: 10px;
                }

                /* Section headers */
                #menus b, #menus h4 {
                    color: #38bdf8;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    font-size: 11px;
                }

                /* Ext bots server rows */
                .ext-server-row {
                    display: flex;
                    gap: 3px;
                    align-items: center;
                    background: rgba(56,189,248,0.03);
                    border: 1px solid rgba(56,189,248,0.08);
                    border-radius: 3px;
                    padding: 4px 6px;
                    margin: 3px 0;
                }

                /* Bot count badge */
                #extBotCount {
                    font-family: 'Share Tech Mono', monospace;
                    color: #38bdf8;
                    font-weight: bold;
                }

                /* Log area */
                #extLogArea {
                    font-family: 'Share Tech Mono', monospace;
                    font-size: 10px;
                    color: rgba(56,189,248,0.5);
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(56,189,248,0.1);
                    border-radius: 3px;
                    padding: 4px 6px;
                    max-height: 55px;
                    overflow-y: auto;
                }

                /* Kill log entries */
                #menu-killlog div { border-bottom: 1px solid rgba(56,189,248,0.08) !important; }

                /* FOV display */
                #fovDisplay, #pr_stat_role, #pr_stat_pos, #pr_stat_fov, #pr_stat_swarm, #pr_stat_status {
                    color: #38bdf8;
                    font-family: 'Share Tech Mono', monospace;
                    font-size: 11px;
                }

                /* Tank search */
                #extTankSearch {
                    background: rgba(2,6,14,0.9) !important;
                    border: 1px solid rgba(56,189,248,0.2) !important;
                    border-radius: 3px !important;
                    color: #e2e8f0 !important;
                }
            </style>
            <style>
                #joystick, .joystick, #apm-joystick, .apm-joystick,
                [id*="joystick"], [class*="joystick"],
                [id*="Joystick"], [class*="Joystick"],
                canvas ~ div[style*="border-radius: 50%"],
                canvas ~ div[style*="border-radius:50%"] {
                    display: none !important;
                }
            </style>
            <div id="dragHandle"></div>
            <div id="tabButtons">
                <button onclick="changeMenu('main')"   class="tabButton">⚙️ Main</button>
                <button onclick="changeMenu('bots')"   class="tabButton">🤖 Botting</button>
                <button onclick="changeMenu('sbx')"    class="tabButton">🎮 Sandbox</button>
                <button onclick="changeMenu('fed')"    class="tabButton">🍖 Feeding</button>
                <button onclick="changeMenu('visual')" class="tabButton">👁️ Visuals</button>
                <button onclick="changeMenu('macros')" class="tabButton">🎯 Macros</button>
                <button onclick="changeMenu('other')"  class="tabButton">🔧 Other</button>
                <button onclick="changeMenu('status')" class="tabButton">📊 Status</button>
                <button onclick="changeMenu('killlog')" class="tabButton">💀 Kill Log</button>
                <button onclick="changeMenu('username')" class="tabButton">👤 Username</button>
                <button onclick="changeMenu('chatmsg')" class="tabButton">💬 Chat</button>
                <button onclick="changeMenu('perf')"   class="tabButton">🏎️ Perf</button>
                <div class="h-separator"></div>
                <button onclick="changeMenu('tutor')"  class="tabButton">📘 Help</button>
                <button onclick="changeMenu('keys')"   class="tabButton">⌨️ Keys</button>
                <button onclick="changeMenu('extbots')" class="tabButton">🚀 Ext Bots</button>
            </div>
            <div class="v-separator"></div>
            <div id="menus">
                <div id="menu-main" style="display:none">
                    <p>Tank:
                        <select id="tankSelect">
                            <option value="spread">Spreadshot</option>
                            <option value="penta">Penta Shot</option>
                            <option value="guntrap">Gunner Trapper</option>
                            <option value="trapguard">Trap Guard</option>
                            <option value="conq">Conqueror</option>
                            <option value="octo">Octo Tank</option>
                            <option value="orbit">Orbital strike</option>
                            <option value="cyclone">Cyclone *</option>
                            <option value="tornado">Tornado</option>
                            <option value="whirlwind">Whirlwind *</option>
                            <option value="septaM">Septa-Mech *</option>
                            <option value="septaMa">Septa-Machine *</option>
                            <option value="blockade">Blockade</option>
                            <option value="anni">Annihilator</option>
                            <option value="fastram">Fast ramming</option>
                            <option value="finger">Finger</option>
                            <option value="fighter">Any Fighter</option>
                            <option value="nuke">Nuker</option>
                            <option value="auto4">Auto-4/6</option>
                            <option value="dreadV2">Peacekeeper</option>
                        </select>
                    </p>
                    <b id="tankDesc"></b>
                    <p>🔁 Stacking <input id="stackin" type=checkbox></p>
                    <p>🎯 Aimlock (P) <input id="aimlockToggle" type=checkbox></p>
                    <p>🔄 Auto respawn <input id="autoRespawn" type=checkbox></p>
                    <p>📈 Auto stats (, key) <input id="autoStats" type=checkbox></p>
                    <p>💬 Allow type "ez" <input id="allowEZ" type=checkbox></p>
                    <p id="soccerbotWrapper" hidden>⚽ Soccer bot <input id="soccerbot" type=checkbox></p>
                    <p id="timekillerWrapper" hidden>⏱️ Time killer <input id="timekiller" type=checkbox></p>
                </div>
                <div id="menu-bots" style="display:none">
                    <p>⌨️ Copy keys <input id="botsReplKeys" type=checkbox></p>
                    <p>🔥 Bot autofire (E) <input id="botAutofireE" type=checkbox></p>
                    <p>🚶 Moving <input id="botsMoving" type=checkbox checked></p>
                    <p>🎨 Disable render <input id="disRender" type=checkbox></p>
                    <p>🖱️ Mirror cursor <input id="cursorMirror" type=checkbox></p>
                    <p>🎯 Mouse aim mode <input id="mouseAimMode" type=checkbox></p>
                    <p>🐭 Mouse follow mode <input id="mouseFollowMode" type=checkbox></p>
                    <p>🔗 Server link:<br>
                        <input id="botServerLink" placeholder="paste arras.io link here" style="width:100%;margin-top:4px;">
                        <span id="botServerLinkStatus" style="font-size:11px;opacity:0.6;"></span>
                    </p>
                    <p><button id="createBot">➕ Create bot</button></p>
                    <p>
                        Number: <input type="number" id="spawnCount" value="10" min="1" max="50" style="width:60px;">
                        <button id="spawnMultiple">🐣 Spawn Multiple</button>
                    </p>
                    <p><button id="reconnectBots">🔌 Reconnect bots</button></p>
                    <p><button id="reloadBots">🔄 Reload bots</button></p>
                    <p><button id="dcBots">❌ Disconnect bots</button></p>
                    <p><button id="botFireToggle" style="background:rgba(59,130,246,0.7)">🔫 Bot fire: ON</button></p>
                    <select id="botTankSelect"></select>
                    <p>🏷️ Clan tag <input id="botClan" style="width:100px;">
                        <select id="botClanPreset" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 6px;color:white;font-size:11px;margin-top:4px;">
                            <option value="">— Presets —</option>
                            <option value="〖℘ꭈׁ✧〗">~AS Long: 〖℘ꭈׁ✧〗</option>
                            <option value="〖✧〗">~AS Short: 〖✧〗</option>
                            <option value="[℘ꭈׁ✧]">~AS CW: [℘ꭈׁ✧]</option>
                            <option value="[ᵀᵀ]">~AS Tag: [ᵀᵀ]</option>
                            <option value="PR">PR</option>
                            <option value="﹝ηยʅl̷﹞">NL Long: ﹝ηยʅl̷﹞</option>
                            <option value="《𝒩ℒ》">NL Short: 《𝒩ℒ》</option>
                            <option value="[ηuʅl̷]">NL CW: [ηuʅl̷]</option>
                        </select>
                    </p>
                    <p>👻 Unnamed bots <input id="botUnnamed" type=checkbox></p>
                    <p>📍 Go to coords:<br>
                        <span style="font-size:11px;">X: <input id="botGotoX" type="number" value="0" style="width:70px;"> Y: <input id="botGotoY" type="number" value="0" style="width:70px;"></span><br>
                        <label style="font-size:11px;"><input id="botGotoFire" type="checkbox" checked> 🔫 Fire while aiming at target</label><br>
                        <button id="botGotoBtn" style="margin-top:4px;">🚀 Send bots</button>
                        <button id="botGotoStop" style="margin-top:4px;">⛔ Stop</button>
                    </p>
                    <p>🔫 Auto RMB (bots) <input id="autoRMB" type=checkbox></p>
                    <p>💬 Chat spam <input id="botChatSpam" type=checkbox>
                    <input id="botChatMsg" placeholder="message..." style="width:100%;margin-top:4px;">
                    </p>
                </div>
                <div id="menu-extbots" style="display:none">
                    <p style="margin:0 0 8px;font-weight:bold;font-size:13px;">🚀 External Bot Servers</p>

                    <div style="display:flex;gap:6px;margin-bottom:10px;font-size:12px;">
                        <span>S1: <span id="extStatus0">❌</span></span>
                        <span>S2: <span id="extStatus1">❌</span></span>
                        <span>S3: <span id="extStatus2">❌</span></span>
                        <span>S4: <span id="extStatus3">❌</span></span>
                        <span>S5: <span id="extStatus4">❌</span></span>
                        <span>S6: <span id="extStatus5">❌</span></span>
                        <button id="extReconnectAll" style="margin-left:auto;font-size:11px;padding:2px 8px;">🔄 All</button>
                    </div>

                    <p>🔗 Server Hash:<br>
                        <input id="extServerHash" placeholder="e.g. ca3008" style="width:100%;margin-top:4px;">
                    </p>
                    <p>🏷️ Bot Name:<br>
                        <input id="extBotName" placeholder="PR Bot" value="PR Bot" style="width:100%;margin-top:4px;background:rgba(2,6,14,0.8);border:1px solid rgba(56,189,248,0.18);border-radius:3px;padding:5px 10px;color:#e2e8f0;font-size:12px;">
                    </p>
                    <p>💬 Chat:<br>
                        <input id="extChatMsg" placeholder="message..." style="width:100%;margin-top:4px;background:rgba(2,6,14,0.8);border:1px solid rgba(56,189,248,0.18);border-radius:3px;padding:5px 10px;color:#e2e8f0;font-size:12px;">
                    </p>
                    <p style="display:flex;gap:4px;">
                        <button id="extChatSend">📢 Send</button>
                        <button id="extChatSpam">🔁 Spam</button>
                        <button id="extChatStop">🛑 Stop Spam</button>
                    </p>
                    <p style="display:flex;gap:4px;align-items:center;">
                        <input id="extCustomCount" type="number" value="50" min="1" max="500" style="width:60px;padding:5px 8px;border-radius:3px;border:1px solid rgba(56,189,248,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:12px;">
                        <button id="extSpawnCustom">🚀 Spawn</button>
                    </p>
                    <p style="display:flex;gap:15px;flex-wrap:wrap;font-size:13px;">
                        <label><input id="extMbs" type="checkbox" checked> 🎯 Follow Mouse Aim</label>
                        <label><input id="extFeeding" type="checkbox"> 🍖 Feeding Mode</label>
                        <label><input id="extNoMove" type="checkbox"> 🧱 No Move</label>
                        <label><input id="extNoAim" type="checkbox"> 🚫 No Aim</label>
                        <label><input id="extAutoRespawn" type="checkbox" checked> 🔄 Auto Respawn</label>
                    </p>
                    <p style="display:flex;gap:15px;flex-wrap:wrap;font-size:13px;">
                        <label><input id="extAutofire" type="checkbox"> 🔫 Auto Fire</label>
                        <label><input id="extHoldRmb" type="checkbox"> 🖱️ Hold RMB</label>
                        <label><input id="extSpin" type="checkbox"> 🌀 Spin</label>
                    </p>
                    <p>🎮 Tank:<br>
                        <input id="extTankSearch" placeholder="🔎 Search tanks..." style="width:100%;margin-top:4px;margin-bottom:4px;padding:6px;border-radius:5px;border:1px solid #444;background:#111;color:white;font-size:13px;box-sizing:border-box;">
                        <select id="extTankSelect" style="width:100%;margin-top:4px;">
                            <option value="all">★ ALL TANKS (rotate)</option>
                            <option value="dps">DPS</option>
                            <option value="dps_ar">DPS (Arms race)</option>
                            <option value="triangle">Tri-Angle</option>
                            <option value="triangle_ar">Tri-Angle (Arms race)</option>
                            <option value="launchers">Launchers</option>
                            <option value="launchers_ar">Launchers (Arms race)</option>
                            <option value="annies">Annihilators (Arms race)</option>
                            <option value="drones">Drones</option>
                            <option value="necro">Underseer / Necro (AR)</option>
                            <option value="carriers">Carriers (Arms race)</option>
                            <option value="auto3">Auto-3</option>
                            <option value="auto3_ar">Auto-3 (Arms race)</option>
                            <option value="smashers">Smashers</option>
                            <option value="spikes_ar">Spikes (Arms race)</option>
                            <option value="crash">Crash (Arms race)</option>
                            <option value="trappers">Trappers</option>
                            <option value="builders">Builders</option>
                            <option disabled>── Individual tanks ──</option>
                            <option value="anni">anni</option>
                            <option value="architect">architect</option>
                            <option value="assassin">assassin</option>
                            <option value="assembler">assembler</option>
                            <option value="auto3">auto3</option>
                            <option value="auto4">auto4</option>
                            <option value="auto5">auto5</option>
                            <option value="auto6">auto6</option>
                            <option value="auto7">auto7</option>
                            <option value="autoanni">autoanni</option>
                            <option value="autoauto4">autoauto4</option>
                            <option value="autobattleship">autobattleship</option>
                            <option value="autobomber">autobomber</option>
                            <option value="autocruiserdrive">autocruiserdrive</option>
                            <option value="autoeagle">autoeagle</option>
                            <option value="autofighter">autofighter</option>
                            <option value="autogunner">autogunner</option>
                            <option value="automingler">automingler</option>
                            <option value="autonecro">autonecro</option>
                            <option value="autooperator">autooperator</option>
                            <option value="autooverdrive">autooverdrive</option>
                            <option value="autooverlord">autooverlord</option>
                            <option value="autopentaseer">autopentaseer</option>
                            <option value="autoprod">autoprod</option>
                            <option value="autoshasher">autoshasher</option>
                            <option value="autotriangle">autotriangle</option>
                            <option value="banshee">banshee</option>
                            <option value="basher">basher</option>
                            <option value="basic">basic</option>
                            <option value="batter4">batter4</option>
                            <option value="battlerdrive">battlerdrive</option>
                            <option value="bismarck">bismarck</option>
                            <option value="bomber">bomber</option>
                            <option value="booster">booster</option>
                            <option value="browser">browser</option>
                            <option value="buchwhacker">buchwhacker</option>
                            <option value="bulwark">bulwark</option>
                            <option value="chemist">chemist</option>
                            <option value="claymore">claymore</option>
                            <option value="coli">coli</option>
                            <option value="compound">compound</option>
                            <option value="conqueror">conqueror</option>
                            <option value="crack">crack</option>
                            <option value="cruiser">cruiser</option>
                            <option value="cyclone">cyclone</option>
                            <option value="destroyer">destroyer</option>
                            <option value="director">director</option>
                            <option value="directordrive">directordrive</option>
                            <option value="dirigible">dirigible</option>
                            <option value="diviner">diviner</option>
                            <option value="doubleequalizer">doubleequalizer</option>
                            <option value="doublespread">doublespread</option>
                            <option value="doubletwin">doubletwin</option>
                            <option value="eagle">eagle</option>
                            <option value="electrocutor">electrocutor</option>
                            <option value="engineer">engineer</option>
                            <option value="eradicator">eradicator</option>
                            <option value="factory">factory</option>
                            <option value="falcon">falcon</option>
                            <option value="fieldgun">fieldgun</option>
                            <option value="fighter">fighter</option>
                            <option value="firework">firework</option>
                            <option value="flankguard">flankguard</option>
                            <option value="fortress">fortress</option>
                            <option value="foundry">foundry</option>
                            <option value="gale">gale</option>
                            <option value="griffin">griffin</option>
                            <option value="gunner">gunner</option>
                            <option value="gunnertrapper">gunnertrapper</option>
                            <option value="gyro">gyro</option>
                            <option value="headman">headman</option>
                            <option value="healer">healer</option>
                            <option value="helix_ar">helix_ar</option>
                            <option value="hexatank">hexatank</option>
                            <option value="hexatrapper">hexatrapper</option>
                            <option value="hognose">hognose</option>
                            <option value="honcho">honcho</option>
                            <option value="hurler3">hurler3</option>
                            <option value="hypercluster">hypercluster</option>
                            <option value="hyperskimmer">hyperskimmer</option>
                            <option value="hyperswarmer">hyperswarmer</option>
                            <option value="hypertwister">hypertwister</option>
                            <option value="jerker">jerker</option>
                            <option value="kicker">kicker</option>
                            <option value="landmine">landmine</option>
                            <option value="launcher">launcher</option>
                            <option value="lever">lever</option>
                            <option value="levi">levi</option>
                            <option value="limpet">limpet</option>
                            <option value="lorry">lorry</option>
                            <option value="machinegun">machinegun</option>
                            <option value="machinegunner">machinegunner</option>
                            <option value="manager">manager</option>
                            <option value="manufacture">manufacture</option>
                            <option value="mega3">mega3</option>
                            <option value="mega5">mega5</option>
                            <option value="megaautooverseer">megaautooverseer</option>
                            <option value="megaautotriangle">megaautotriangle</option>
                            <option value="megaautounderdrive">megaautounderdrive</option>
                            <option value="megasmasher">megasmasher</option>
                            <option value="megaspawner">megaspawner</option>
                            <option value="megaspike">megaspike</option>
                            <option value="mingler">mingler</option>
                            <option value="molotov">molotov</option>
                            <option value="nailgun">nailgun</option>
                            <option value="necrodrive">necrodrive</option>
                            <option value="neutron">neutron</option>
                            <option value="nona">nona</option>
                            <option value="obliterator">obliterator</option>
                            <option value="octo">octo</option>
                            <option value="octotank">octotank</option>
                            <option value="overcheese">overcheese</option>
                            <option value="overczar">overczar</option>
                            <option value="overseer">overseer</option>
                            <option value="overstorm">overstorm</option>
                            <option value="palisade">palisade</option>
                            <option value="parapet">parapet</option>
                            <option value="penta">penta</option>
                            <option value="pentadrive">pentadrive</option>
                            <option value="pentamancer">pentamancer</option>
                            <option value="phoenix">phoenix</option>
                            <option value="physician">physician</option>
                            <option value="pincer">pincer</option>
                            <option value="pounder">pounder</option>
                            <option value="predator">predator</option>
                            <option value="prick">prick</option>
                            <option value="proddrive">proddrive</option>
                            <option value="pursuer">pursuer</option>
                            <option value="quadruplex">quadruplex</option>
                            <option value="ream">ream</option>
                            <option value="redistributor">redistributor</option>
                            <option value="rigger">rigger</option>
                            <option value="rocket">rocket</option>
                            <option value="rocketeer">rocketeer</option>
                            <option value="roller">roller</option>
                            <option value="septamachine">septamachine</option>
                            <option value="septamech">septamech</option>
                            <option value="septatrap">septatrap</option>
                            <option value="septatrapper">septatrapper</option>
                            <option value="shaver">shaver</option>
                            <option value="shopper">shopper</option>
                            <option value="shotgun">shotgun</option>
                            <option value="sidewinder">sidewinder</option>
                            <option value="skidder">skidder</option>
                            <option value="skimmer">skimmer</option>
                            <option value="slammer">slammer</option>
                            <option value="sniper">sniper</option>
                            <option value="spawner">spawner</option>
                            <option value="spear">spear</option>
                            <option value="spike">spike</option>
                            <option value="spinner">spinner</option>
                            <option value="sprayer">sprayer</option>
                            <option value="spread">spread</option>
                            <option value="stalker">stalker</option>
                            <option value="stomper">stomper</option>
                            <option value="strider">strider</option>
                            <option value="surfer">surfer</option>
                            <option value="surferdrive">surferdrive</option>
                            <option value="swarmer">swarmer</option>
                            <option value="tempest">tempest</option>
                            <option value="thorn">thorn</option>
                            <option value="topbanana">topbanana</option>
                            <option value="toppler">toppler</option>
                            <option value="trapguard">trapguard</option>
                            <option value="triangle">triangle</option>
                            <option value="tripleautooverseer">tripleautooverseer</option>
                            <option value="tripleautotriangle">tripleautotriangle</option>
                            <option value="tripleautounderdrive">tripleautounderdrive</option>
                            <option value="tripleshot">tripleshot</option>
                            <option value="triplet">triplet</option>
                            <option value="tripletwin">tripletwin</option>
                            <option value="triplex">triplex</option>
                            <option value="tritrapper">tritrapper</option>
                            <option value="twin">twin</option>
                            <option value="twister">twister</option>
                            <option value="tyrant">tyrant</option>
                            <option value="ultraspawner">ultraspawner</option>
                            <option value="underseer">underseer</option>
                            <option value="vulture">vulture</option>
                            <option value="warlock">warlock</option>
                            <option value="warship">warship</option>
                            <option value="whirlwind">whirlwind</option>
                            <option value="wiper">wiper</option>
                        </select>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">All Servers:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawnAll1">➕ 1</button>
                        <button id="extSpawnAll5">➕➕ 5</button>
                        <button id="extSpawnAll10">➕➕➕ 10</button>
                        <button id="extKillAll" style="background:rgba(139,0,0,0.5);">💀 All</button>
                    </p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawnAll20" style="background:rgba(59,130,246,0.3);border:1px solid rgba(59,130,246,0.6);">⚡ 20 (120)</button>
                        <button id="extSpawnAll30" style="background:rgba(59,130,246,0.3);border:1px solid rgba(59,130,246,0.6);">⚡ 30 (180)</button>
                        <button id="extSpawnAll35" style="background:rgba(59,130,246,0.3);border:1px solid rgba(59,130,246,0.6);">⚡ 35 (210)</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 1:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s1">➕ 1</button>
                        <button id="extSpawn5s1">➕➕ 5</button>
                        <button id="extSpawn10s1">➕➕➕ 10</button>
                        <button id="extKill1" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 2:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s2">➕ 1</button>
                        <button id="extSpawn5s2">➕➕ 5</button>
                        <button id="extSpawn10s2">➕➕➕ 10</button>
                        <button id="extKill2" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 3:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s3">➕ 1</button>
                        <button id="extSpawn5s3">➕➕ 5</button>
                        <button id="extSpawn10s3">➕➕➕ 10</button>
                        <button id="extKill3" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 4:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s4">➕ 1</button>
                        <button id="extSpawn5s4">➕➕ 5</button>
                        <button id="extSpawn10s4">➕➕➕ 10</button>
                        <button id="extKill4" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 5:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s5">➕ 1</button>
                        <button id="extSpawn5s5">➕➕ 5</button>
                        <button id="extSpawn10s5">➕➕➕ 10</button>
                        <button id="extKill5" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p style="font-size:12px;font-weight:bold;">Server 6:</p>
                    <p style="display:flex;gap:4px;">
                        <button id="extSpawn1s6">➕ 1</button>
                        <button id="extSpawn5s6">➕➕ 5</button>
                        <button id="extSpawn10s6">➕➕➕ 10</button>
                        <button id="extKill6" style="background:rgba(139,0,0,0.5);">💀</button>
                    </p>

                    <p>📡 Total Active: <span id="extBotCount" style="font-weight:bold;color:#60a5fa;">0</span></p>
                    <p style="font-size:11px;color:#aaa;max-height:60px;overflow-y:auto;" id="extLogArea">Ready.</p>

                    <div class="h-separator"></div>

                    <p style="margin:6px 0 4px;font-weight:bold;font-size:12px;">🎯 Aim Smoothing</p>
                    <p style="display:flex;align-items:center;gap:8px;font-size:12px;">
                        <input type="range" id="extSensitivity" min="1" max="100" step="1" value="20" style="flex:1;">
                        <span id="extSensitivityValue" style="min-width:28px;text-align:right;color:#60a5fa;font-weight:bold;">20</span>
                    </p>

                    <p style="margin:6px 0 4px;font-weight:bold;font-size:12px;">📍 Manual Coords Mode</p>
                    <p style="font-size:13px;">
                        <label><input id="extManualMode" type="checkbox"> Enable Manual Coordinates</label>
                    </p>
                    <div id="extManualCoordsSection" style="display:none;">
                        <p style="display:flex;gap:8px;font-size:12px;align-items:center;">
                            X: <input id="extManualX" type="number" value="0" style="width:80px;padding:3px 6px;border-radius:5px;border:1px solid #444;background:#111;color:white;">
                            Y: <input id="extManualY" type="number" value="0" style="width:80px;padding:3px 6px;border-radius:5px;border:1px solid #444;background:#111;color:white;">
                        </p>
                    </div>

                    <div class="h-separator"></div>

                    <p style="margin:6px 0 4px;font-weight:bold;font-size:12px;">🏹 Formation</p>
                    <p style="font-size:13px;">
                        <label><input id="extFormationEnabled" type="checkbox"> Enable Formation</label>
                    </p>
                    <div id="extFormationSection" style="display:none;">
                        <p style="margin:4px 0 3px;font-size:12px;color:#aaa;">Type</p>
                        <p>
                            <select id="extFormationType" style="width:100%;padding:5px 8px;border-radius:6px;border:1px solid #444;background:#111;color:white;font-size:12px;">
                                <option value="line_front">Line (Front)</option>
                                <option value="line_behind">Line (Behind)</option>
                                <option value="line_top">Line (Top)</option>
                                <option value="line_bottom">Line (Bottom)</option>
                                <option value="circle">Circle (Surround)</option>
                            </select>
                        </p>
                        <p style="margin:4px 0 3px;font-size:12px;color:#aaa;">Spacing</p>
                        <p style="display:flex;align-items:center;gap:8px;font-size:12px;">
                            <input type="range" id="extFormationSpacing" min="0" max="400" step="10" value="60" style="flex:1;">
                            <span id="extFormationSpacingVal" style="min-width:28px;text-align:right;color:#60a5fa;font-weight:bold;">60</span>
                        </p>
                    </div>

                </div>
                <div id="menu-sbx" style="display:none">
                    <p>🛠️ Sandbox tools <input id="sandboxTools" type=checkbox></p>
                    <p>⚡ No reload:
                        <select id="noReloadSelect">
                            <option value="disabled">Disabled</option>
                            <option value="engineer">Engineer</option>
                            <option value="surgeon">Surgeon</option>
                            <option value="launchers">Launchers</option>
                            <option value="builders">Builders</option>
                        </select>
                    </p>
                    <p><button id="setSpawn">📍 Set spawnpoint</button></p>
                    <p>💚 healing \`+H <input id="sbxHeal" type=checkbox></p>
                    <br/>
                    <b>Keys (sandbox tools):</b><br/>
                    1 - spawn Unknown Entity<br/>
                    2 - fast walls<br/>
                    6+8 - clear everything<br/>
                    hold mouse for no reload
                </div>
                <div id="menu-fed" style="display:none">
                    feed-bot lol<br/>
                    goes across custom path, autorespawns.<br/>
                    press L first so script knows ur location.
                    <p>Enabled <input id="doFed" type=checkbox></p>
                    <p><button id="addFedLocation">➕ Add location here</button></p>
                    <p><button id="resetFedPath">🔄 Reset path</button></p>
                </div>
                <div id="menu-visual" style="display:none">
                    Change rendering to Canvas2D first.
                    <p>X-Ray <input id="xray" type=checkbox></p>
                    <input type="range" id="xrayAlpha" min="0" max="1" step="0.05" value="0.5"><br/>
                    <p>Remove transparency <input id="seeEverything" type=checkbox></p>
                    <div class="h-separator"></div>
                    <p>🚫 Hide Bullets <input id="bulletHider" type=checkbox></p>
                    <p style="opacity:0.6;font-size:11px;">Hides all bullet/projectile renders. Tanks + shapes still visible. Helps fps when spamming bots.</p>
                </div>
                <div id="menu-other" style="display:none">
                    <button id="pibuild">🔢 Do PI build</button>
                    <button id="resetAuthBtn" style="background:#dc2626;">🔑 Reset Authorization</button>
                    <p>🔭 Detected FOV: <span id="fovDisplay" style="font-weight:bold;color:#60a5fa;">--</span></p>
                    <h4 style="margin:6px 0 3px">🏷️ Leaked clan tags</h4>
                    <textarea id="stealedClans" style="width:100%;height:60px;">Nothing for now</textarea>
                    <div class="h-separator"></div>
                    <h4 style="margin:6px 0 3px">🎇 Extras</h4>
                    <p>Tank:
                        <select id="extraTankSelect">
                            <option value="fireworks">Fireworks (khky)</option>
                            <option value="ultraspawn">Ultra Spawner</option>
                            <option value="brig">Brig</option>
                            <option value="overczar">Overczar</option>
                            <option value="pursuer">Pursuer</option>
                            <option value="auto4feed">Auto-4 (feed)</option>
                            <option value="phys">Physician</option>
                        </select>
                    </p>
                    <p><button id="extraUpgradeBtn">⬆️ Upgrade</button></p>
                </div>
                <div id="menu-keys" style="display:none">
                    <p style="opacity:0.7;font-size:12px;margin:0 0 8px;">Full keyboard shown at bottom of screen. Supports multi-touch.</p>
                    <p style="opacity:0.6;font-size:11px;">Useful keys in arras:<br/>
                    <b>&#96;</b> = command mode &nbsp; <b>L</b> = coords<br/>
                    <b>E</b> = suicide &nbsp; <b>N</b> = lvl up<br/>
                    <b>1-9</b> = stats &nbsp; <b>H-M</b> = tank upgrades</p>
                </div>
                <div id="menu-status" style="display:none">
                    <b>📊 Live Status</b>
                    <p>Role: <span id="pr_stat_role">Solo</span></p>
                    <p>Position: <span id="pr_stat_pos">(0, 0)</span></p>
                    <p>FOV: <span id="pr_stat_fov">--</span></p>
                    <p>Swarm: <span id="pr_stat_swarm">1 tabs</span></p>
                    <p>Status: <span id="pr_stat_status">Lobby</span></p>
                    <div class="h-separator"></div>
                    <b>🔄 Force Respawn All Bots</b>
                    <p>Build:
                        <select id="pr_respawn_build_sel" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
                            <option value="none">None (Basic)</option>
                            <option value="gale">Gale (H-Y-K-I)</option>
                            <option value="limpet">Limpet (X-Space)</option>
                        </select>
                        <button id="pr_force_respawn_btn">🔄 Respawn All</button>
                    </p>
                    <div class="h-separator"></div>
                  <div class="h-separator"></div>
<b>🏹 Formation</b>
<p>Enable <input id="pr_formation_enabled" type=checkbox></p>
<p>Type:
    <select id="pr_formation_type" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
        <option value="behind">Behind (V-Shape)</option>
        <option value="front">Front (V-Shape)</option>
        <option value="line">Line (Both Sides)</option>
        <option value="line_front">Line (Front)</option>
        <option value="line_behind">Line (Behind)</option>
        <option value="tight">Tight (Stack)</option>
        <option value="circle">Circle (Surround)</option>
        <option value="arc_front">Arc (Front)</option>
        <option value="arc_behind">Arc (Behind)</option>
        <option value="diamond">Diamond</option>
        <option value="wedge">Wedge (Arrow)</option>
        <option value="double_line">Double Line</option>
        <option value="grid">Grid (Box)</option>
        <option value="spiral">Spiral</option>
        <option value="random_scatter">Scatter</option>
    </select>
</p>
<p>Spacing:
    <button class="slider-btn" data-target="pr_formation_spacing" data-delta="-10">−</button>
    <input type="range" id="pr_formation_spacing" min="0" max="400" value="60" style="width:120px;vertical-align:middle;">
    <button class="slider-btn" data-target="pr_formation_spacing" data-delta="10">+</button>
    <span id="pr_formation_spacing_val">60</span>
</p>
<p>Follow distance:
    <button class="slider-btn" data-target="pr_follow_dist" data-delta="-5">−</button>
    <input type="range" id="pr_follow_dist" min="0" max="300" value="0" style="width:120px;vertical-align:middle;">
    <button class="slider-btn" data-target="pr_follow_dist" data-delta="5">+</button>
    <span id="pr_follow_dist_val">0</span>
</p>
                </div>
                <div id="menu-killlog" style="display:none">
                    <b>💀 Kill Log</b> — <span id="pr_kill_count">0</span> kills
                    <p><button id="pr_clear_kills">🗑️ Clear</button></p>
                    <div id="pr_kill_log" style="max-height:200px;overflow-y:auto;padding:4px 0;"></div>
                </div>
                <div id="menu-username" style="display:none">
                    <b>👤 Auto Username</b>
                    <p>Enable <input id="pr_auto_username" type=checkbox></p>
                    <p>Theme:
                        <select id="pr_username_theme" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
                            <option value="legit">Legit Names</option>
                            <option value="random">Random Letters</option>
                        </select>
                    </p>
                    <p><button id="pr_set_username_now">🎲 Set Random Name Now</button></p>
                    <p>🎯 Precise Aim <input id="pr_precise_aim" type=checkbox></p>
                </div>
                <div id="menu-chatmsg" style="display:none">
                    <b>💬 Chat Messages</b>
                    <p>Message 1:<br><input id="pr_chat_msg1" style="width:100%;margin-top:4px;" placeholder="Chat message 1..."></p>
                    <p>Message 2:<br><input id="pr_chat_msg2" style="width:100%;margin-top:4px;" placeholder="Chat message 2..."></p>
                    <p><button id="pr_send_chat_now">📢 Send Now (P key)</button></p>
                </div>
                <div id="menu-perf" style="display:none">
                    <b>🏎️ Performance</b>
                    <p>FPS Limiter (follower mobile) <input id="pr_fps_enabled" type=checkbox></p>
                    <p>FPS limit: <input type="range" id="pr_fps_limit" min="1" max="120" value="30" style="width:120px;"> <span id="pr_fps_val">30</span></p>
                    <p style="opacity:0.6;font-size:11px;">Limits requestAnimationFrame rate. Lower = less CPU. Useful when using mobile tabs as followers.</p>
                </div>
                <div id="menu-macros" style="display:none">
                    <b>🎯 Bot Macros</b>
                    <p style="opacity:0.6;font-size:11px;margin:4px 0 8px;">Runs tank upgrade path + stat build on bots via localStorage botCommand.</p>
                    <div id="pr_macro_grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;"></div>
                    <p style="font-size:11px;color:#aaa;">Last used: <span id="pr_last_macro_label" style="color:#60a5fa;">One way</span></p>
                </div>
                <div id="menu-tutor" style="display:none">
                    <b>📖 Stacking</b><br/>
                    Choose tank, enable Stacking (X to toggle), shoot.<br/>
                    Tanks with * have anti-stack outside Arms Race.<br/><br/>
                    <b>🤖 Botting</b><br/>
                    Botting tab → Create → press L in bot window.<br/>
                    Mouse aim mode: bots aim at same world point.<br/><br/>
                    <b>🔧 Other</b><br/>
                    <kbd>,</kbd> or <kbd>G</kbd> to upgrade tank.<br/>
                    PI build → enable secret options in arras settings.
                </div>
            </div>
            <div id="authBadge">🔐 ${authRole === 'owner' ? 'Owner' : 'PR Member'}</div>`;

            document.body.appendChild(menu);

            // Populate macro grid
            const _macroGrid = document.getElementById("pr_macro_grid");
            const _macroLastLabel = document.getElementById("pr_last_macro_label");
            if (_macroGrid) {
                Object.keys(MACROS).forEach(mName => {
                    const btn = document.createElement("button");
                    btn.textContent = mName;
                    Object.assign(btn.style, {
                        padding: "7px 4px", fontSize: "11px", fontWeight: "600",
                        background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.5)",
                        borderRadius: "10px", color: "white", cursor: "pointer", transition: "0.2s"
                    });
                    btn.addEventListener("mouseenter", () => btn.style.background = "rgba(59,130,246,0.6)");
                    btn.addEventListener("mouseleave", () => btn.style.background = "rgba(59,130,246,0.25)");
                    btn.addEventListener("click", () => {
                        _lastMacroName = mName;
                        localStorage.setItem("pr_lastMacroName", mName);
                        if (_macroLastLabel) _macroLastLabel.textContent = mName;
                        // update tank + pendingMacro on all existing bots so respawn uses new macro
                        for (const bot of bots) {
                            try {
                                bot.contentWindow.channel.tank = "none";
                                bot.contentWindow.channel.pendingMacro = mName;
                            } catch(e) {}
                        }
                        // broadcast to iframe bots via channel.message
                        botsMsg({ type: 'upgrade', macro: mName });
                        // also hit localStorage for any separate-tab bots
                        localStorage.setItem("botCommand", JSON.stringify({ type: 'upgrade', macro: mName, timestamp: Date.now(), id: Math.random() }));
                        performMacroUpgrade(mName);
                    });
                    _macroGrid.appendChild(btn);
                });
                if (_macroLastLabel) _macroLastLabel.textContent = _lastMacroName;
            }

            const menuToggleBtn = document.createElement("button");
            menuToggleBtn.innerText = "⚙️";
            Object.assign(menuToggleBtn.style, {
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: "9999999",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(12,12,20,0.9)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white",
                fontSize: "22px",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                pointerEvents: "auto",
                touchAction: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none"
            });
            menuToggleBtn.addEventListener("touchstart", (e) => {
                e.stopPropagation();
                e.preventDefault();
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            }, { passive: false });
            menuToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            });
            document.body.appendChild(menuToggleBtn);

            const JOYSTICK_R = 55;
            const KNOB_R = 25;
            const DEAD_ZONE = 35;
            const JS_SIZE = (JOYSTICK_R + KNOB_R) * 2;

            const wasdPad = document.createElement("div");
            wasdPad.id = "wasdPad";
            Object.assign(wasdPad.style, {
                position: "fixed",
                bottom: "80px",
                left: "120px",
                width: JS_SIZE + "px",
                height: JS_SIZE + "px",
                zIndex: "9999998",
                userSelect: "none",
                touchAction: "none",
                opacity: "0.6"
            });

            const jsBase = document.createElement("div");
            Object.assign(jsBase.style, {
                position: "absolute",
                width: JS_SIZE + "px",
                height: JS_SIZE + "px",
                borderRadius: "50%",
                background: "rgba(12,12,20,0.55)",
                border: "2px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(6px)",
                boxSizing: "border-box"
            });

            const jsKnob = document.createElement("div");
            const kSize = KNOB_R * 2;
            Object.assign(jsKnob.style, {
                position: "absolute",
                width: kSize + "px",
                height: kSize + "px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.75)",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                left: (JS_SIZE / 2 - KNOB_R) + "px",
                top: (JS_SIZE / 2 - KNOB_R) + "px",
                transition: "left 0.05s, top 0.05s",
                boxSizing: "border-box"
            });

            wasdPad.appendChild(jsBase);
            wasdPad.appendChild(jsKnob);
            document.body.appendChild(wasdPad);

            let jsTouchId = null;
            let jsOriginX = 0, jsOriginY = 0;
            let jsActiveKeys = new Set();

            function jsSetKeys(dx, dy) {
                const newKeys = new Set();
                if (dx >  DEAD_ZONE) newKeys.add("KeyD");
                if (dx < -DEAD_ZONE) newKeys.add("KeyA");
                if (dy >  DEAD_ZONE) newKeys.add("KeyS");
                if (dy < -DEAD_ZONE) newKeys.add("KeyW");
                jsActiveKeys.forEach(k => { if (!newKeys.has(k)) { events.keyUp(k); } });
                newKeys.forEach(k => { if (!jsActiveKeys.has(k)) { events.keyDown(k); } });
                jsActiveKeys = newKeys;
            }

            function jsMoveKnob(dx, dy) {
                const dist = Math.hypot(dx, dy);
                const clamped = Math.min(dist, JOYSTICK_R);
                const angle = Math.atan2(dy, dx);
                jsKnob.style.transition = "none";
                jsKnob.style.left = (JS_SIZE / 2 - KNOB_R + Math.cos(angle) * clamped) + "px";
                jsKnob.style.top  = (JS_SIZE / 2 - KNOB_R + Math.sin(angle) * clamped) + "px";
            }

            function jsReset() {
                jsKnob.style.transition = "left 0.1s, top 0.1s";
                jsKnob.style.left = (JS_SIZE / 2 - KNOB_R) + "px";
                jsKnob.style.top  = (JS_SIZE / 2 - KNOB_R) + "px";
                jsActiveKeys.forEach(k => { events.keyUp(k); });
                jsActiveKeys = new Set();
                jsTouchId = null;
            }

            wasdPad.addEventListener("touchstart", (e) => {
                e.preventDefault(); e.stopPropagation();
                if (jsTouchId !== null) return;
                const t = e.changedTouches[0];
                jsTouchId = t.identifier;
                const r = wasdPad.getBoundingClientRect();
                jsOriginX = r.left + JS_SIZE / 2;
                jsOriginY = r.top  + JS_SIZE / 2;
                const dx = t.clientX - jsOriginX;
                const dy = t.clientY - jsOriginY;
                jsMoveKnob(dx, dy);
                jsSetKeys(dx, dy);
            }, { passive: false });

            wasdPad.addEventListener("touchmove", (e) => {
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (t.identifier !== jsTouchId) continue;
                    const dx = t.clientX - jsOriginX;
                    const dy = t.clientY - jsOriginY;
                    jsMoveKnob(dx, dy);
                    jsSetKeys(dx, dy);
                }
            }, { passive: false });

            wasdPad.addEventListener("touchend",    (e) => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === jsTouchId) jsReset(); } }, { passive: false });
            wasdPad.addEventListener("touchcancel", () => jsReset(), { passive: false });

            const _ourElementIds = new Set(['scriptMenu','mouseButtons','wasdPad','menuToggleBtn','kbOverlay']);
            function removeJoysticks() {
                document.querySelectorAll('body > div, body > canvas ~ div').forEach(el => {
                    if (_ourElementIds.has(el.id)) return;
                    if (el === menu || el === wasdPad || el === mouseButtonsDiv || el === menuToggleBtn || el === cursor || el === kbOverlay) return;
                    const s = el.style;
                    const isCircle = s.borderRadius === '50%' || s.borderRadius === '50vh' || (s.width && s.height && s.width === s.height && (s.borderRadius || '').includes('50'));
                    const isOverlay = s.position === 'fixed' || s.position === 'absolute';
                    if (isCircle || (isOverlay && el.tagName === 'DIV' && !el.id.includes('script') && !el.id.includes('auth') && !el.id.includes('drag') && !el.id.includes('bot'))) {
                        const w = parseInt(s.width);
                        if (!isNaN(w) && w > 80) el.style.display = 'none';
                    }
                });
            }
            removeJoysticks();
            new MutationObserver(() => removeJoysticks()).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['style'] });

            const mouseButtonsDiv = document.createElement("div");
            mouseButtonsDiv.id = "mouseButtons";

            const _mbSaved = {};
            let _mbBtnW  = 76;
            let _mbBtnH  = 48;
            let _mbLeft  = 20;
            let _mbBottom = 226;
            try { localStorage.removeItem('pr_mb_pos'); } catch(e) {}

            Object.assign(mouseButtonsDiv.style, {
                position: "fixed",
                bottom: _mbBottom + "px",
                left: _mbLeft + "px",
                zIndex: "9999998",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                userSelect: "none",
                touchAction: "none",
                cursor: "grab",
                opacity: "0.45"
            });

            const _mbInner = document.createElement("div");
            Object.assign(_mbInner.style, { display: "flex", gap: "4px", touchAction: "none" });

            const _mbDragBar = document.createElement("div");
            _mbDragBar.innerText = "⠿ drag";
            Object.assign(_mbDragBar.style, {
                width: "100%",
                height: "20px",
                borderRadius: "8px 8px 0 0",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "20px",
                cursor: "grab",
                userSelect: "none",
                touchAction: "none",
                boxSizing: "border-box"
            });

            const _mbResizeBar = document.createElement("div");
            _mbResizeBar.innerText = "⇔ resize";
            Object.assign(_mbResizeBar.style, {
                width: "100%",
                height: "20px",
                borderRadius: "0 0 8px 8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderTop: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "20px",
                cursor: "ew-resize",
                userSelect: "none",
                touchAction: "none",
                boxSizing: "border-box"
            });

            mouseButtonsDiv.appendChild(_mbDragBar);
            mouseButtonsDiv.appendChild(_mbInner);
            mouseButtonsDiv.appendChild(_mbResizeBar);

            function _mbSavePos() {
                try { localStorage.setItem('pr_mb_pos', JSON.stringify({ x: _mbLeft, y: _mbBottom, w: _mbBtnW, h: _mbBtnH })); } catch(e){}
            }

            function _mbApplySize() {
                _mbInner.querySelectorAll('button').forEach(b => {
                    b.style.width  = _mbBtnW + "px";
                    b.style.height = _mbBtnH + "px";
                    b.style.fontSize = Math.max(11, Math.round(_mbBtnH * 0.27)) + "px";
                });
            }

            let _mbDragging = false, _mbDragStartX, _mbDragStartY, _mbDragStartLeft, _mbDragStartBottom;

            function _mbDragStart(clientX, clientY) {
                _mbDragging = true;
                _mbDragStartX = clientX;
                _mbDragStartY = clientY;
                _mbDragStartLeft   = _mbLeft;
                _mbDragStartBottom = _mbBottom;
                _mbDragBar.style.cursor = "grabbing";
            }
            function _mbDragMove(clientX, clientY) {
                if (!_mbDragging) return;
                const dx = clientX - _mbDragStartX;
                const dy = clientY - _mbDragStartY;
                _mbLeft   = Math.max(0, Math.min(innerWidth  - 160, _mbDragStartLeft   + dx));
                _mbBottom = Math.max(0, Math.min(innerHeight - 120, _mbDragStartBottom - dy));
                mouseButtonsDiv.style.left   = _mbLeft   + "px";
                mouseButtonsDiv.style.bottom = _mbBottom + "px";
            }
            function _mbDragEnd() { _mbDragging = false; _mbDragBar.style.cursor = "grab"; _mbSavePos(); }

            _mbDragBar.addEventListener("mousedown",  (e) => { e.preventDefault(); _mbDragStart(e.clientX, e.clientY); });
            _mbDragBar.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); const t = e.touches[0]; _mbDragStart(t.clientX, t.clientY); }, { passive: false });
            document.addEventListener("mousemove",  (e) => { if (_mbDragging) _mbDragMove(e.clientX, e.clientY); });
            document.addEventListener("touchmove",  (e) => { if (_mbDragging) { const t = e.touches[0]; _mbDragMove(t.clientX, t.clientY); } }, { passive: true });
            document.addEventListener("mouseup",    () => { if (_mbDragging) _mbDragEnd(); });
            document.addEventListener("touchend",   () => { if (_mbDragging) _mbDragEnd(); });

            let _mbResizing = false, _mbResizeStartX, _mbResizeStartW, _mbResizeStartH;

            function _mbResizeStart(clientX) {
                _mbResizing = true;
                _mbResizeStartX = clientX;
                _mbResizeStartW = _mbBtnW;
                _mbResizeStartH = _mbBtnH;
                _mbResizeBar.style.cursor = "ew-resize";
            }
            function _mbResizeMove(clientX) {
                if (!_mbResizing) return;
                const dx = clientX - _mbResizeStartX;
                _mbBtnW = Math.max(48, Math.min(160, _mbResizeStartW + dx));
                _mbBtnH = Math.max(36, Math.min(120, _mbResizeStartH + Math.round(dx * 0.5)));
                _mbApplySize();
            }
            function _mbResizeEnd() { _mbResizing = false; _mbSavePos(); }

            _mbResizeBar.addEventListener("mousedown",  (e) => { e.preventDefault(); _mbResizeStart(e.clientX); });
            _mbResizeBar.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); _mbResizeStart(e.touches[0].clientX); }, { passive: false });
            document.addEventListener("mousemove",  (e) => { if (_mbResizing) _mbResizeMove(e.clientX); });
            document.addEventListener("touchmove",  (e) => { if (_mbResizing) { _mbResizeMove(e.touches[0].clientX); } }, { passive: true });
            document.addEventListener("mouseup",    () => { if (_mbResizing) _mbResizeEnd(); });
            document.addEventListener("touchend",   () => { if (_mbResizing) _mbResizeEnd(); });

            function makeMouseBtn(label, button, color) {
                const btn = document.createElement("button");
                btn.innerText = label;
                Object.assign(btn.style, {
                    width: _mbBtnW + "px",
                    height: _mbBtnH + "px",
                    borderRadius: "12px",
                    background: "rgba(12,12,20,0.85)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "white",
                    fontSize: Math.max(11, Math.round(_mbBtnH * 0.27)) + "px",
                    fontWeight: "700",
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    transition: "background 0.1s",
                    touchAction: "none"
                });
                const pressBtn = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.style.background = color;
                    mouse.down = button === 0 ? true : mouse.down;
                    mouse.buttons[button] = true;
                    events.mouseDown(button, cursorX, cursorY);
                    if (button === 0) triggerStack();
                };
                const releaseBtn = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.style.background = "rgba(12,12,20,0.85)";
                    mouse.down = button === 0 ? false : mouse.down;
                    mouse.buttons[button] = false;
                    stackRunning = false;
                    events.mouseUp(button, cursorX, cursorY);
                };
                btn.addEventListener("mousedown",   pressBtn,   { passive: false });
                btn.addEventListener("touchstart",  pressBtn,   { passive: false });
                btn.addEventListener("mouseup",     releaseBtn, { passive: false });
                btn.addEventListener("touchend",    releaseBtn, { passive: false });
                btn.addEventListener("mouseleave",  releaseBtn, { passive: false });
                btn.addEventListener("touchcancel", releaseBtn, { passive: false });
                _mbInner.appendChild(btn);
            }

            makeMouseBtn("LMB", 0, "rgba(59,130,246,0.8)");
            makeMouseBtn("RMB", 2, "rgba(239,68,68,0.8)");

            const scrollBtn = document.createElement("button");
            scrollBtn.innerText = "↕";
            Object.assign(scrollBtn.style, {
                width: _mbBtnW + "px",
                height: _mbBtnH + "px",
                borderRadius: "12px",
                background: "rgba(12,12,20,0.85)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white",
                fontSize: Math.max(11, Math.round(_mbBtnH * 0.27)) + "px",
                fontWeight: "700",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                touchAction: "none",
                userSelect: "none"
            });
            let _scrollStartY = null;
            let _scrollInterval = null;
            const _fireScroll = (deltaY) => {
                const cx = mouse.x || innerWidth / 2;
                const cy = mouse.y || innerHeight / 2;
                const opts = { clientX: cx, clientY: cy, deltaY, deltaMode: 0, bubbles: true, cancelable: true };
                window.dispatchEvent(new WheelEvent("wheel", opts));
                document.dispatchEvent(new WheelEvent("wheel", opts));
                const canvas = document.querySelector("canvas");
                if (canvas) canvas.dispatchEvent(new WheelEvent("wheel", opts));
            };
            const _scrollStart = (clientY) => {
                _scrollStartY = clientY;
                _scrollInterval = setInterval(() => {}, 9999);
            };
            const _scrollMove = (clientY) => {
                if (_scrollStartY === null) return;
                const dy = clientY - _scrollStartY;
                if (Math.abs(dy) > 5) {
                    _fireScroll(dy * 2);
                    _scrollStartY = clientY;
                }
            };
            const _scrollEnd = () => { _scrollStartY = null; clearInterval(_scrollInterval); };
            scrollBtn.addEventListener("touchstart",  (e) => { e.preventDefault(); e.stopPropagation(); _scrollStart(e.touches[0].clientY); }, { passive: false });
            scrollBtn.addEventListener("touchmove",   (e) => { e.preventDefault(); e.stopPropagation(); _scrollMove(e.touches[0].clientY); }, { passive: false });
            scrollBtn.addEventListener("touchend",    (e) => { e.preventDefault(); _scrollEnd(); }, { passive: false });
            scrollBtn.addEventListener("mousedown",   (e) => { _scrollStart(e.clientY); });
            document.addEventListener("mousemove",   (e) => { if (_scrollStartY !== null) _scrollMove(e.clientY); });
            document.addEventListener("mouseup",     () => _scrollEnd());
            _mbInner.appendChild(scrollBtn);

            document.body.appendChild(mouseButtonsDiv);

            let _autoRmbInterval = null;
            let _autoRmbWatcher = null;
            document.getElementById("autoRMB")?.addEventListener("change", function() {
                if (this.checked) {
                    _autoRmbInterval = setInterval(() => {
                        botsMsg({ type: "mousedown", button: 2, x: mouse.x, y: mouse.y });
                    }, 100);
                    let _wasAlive = false;
                    _autoRmbWatcher = setInterval(() => {
                        const alive = spawned;
                        if (!_wasAlive && alive) botsMsg({ type: "mousedown", button: 2, x: mouse.x, y: mouse.y });
                        _wasAlive = alive;
                    }, 200);
                } else {
                    clearInterval(_autoRmbInterval);
                    clearInterval(_autoRmbWatcher);
                    _autoRmbInterval = null;
                    _autoRmbWatcher = null;
                    botsMsg({ type: "mouseup", button: 2, x: mouse.x, y: mouse.y });
                }
            });

            cursor = document.createElement("div");
            Object.assign(cursor.style, {
                position: "fixed",
                width: "32px",
                height: "32px",
                pointerEvents: "none",
                zIndex: "99999999",
                left: (innerWidth / 2) + "px",
                top: (innerHeight / 2) + "px",
                transform: "translate(-16px, -16px)"
            });
            cursor.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <line x1="16" y1="0" x2="16" y2="32" stroke="black" stroke-width="2.5"/>
                <line x1="0" y1="16" x2="32" y2="16" stroke="black" stroke-width="2.5"/>
                <line x1="16" y1="0" x2="16" y2="32" stroke="white" stroke-width="1"/>
                <line x1="0" y1="16" x2="32" y2="16" stroke="white" stroke-width="1"/>
                <circle cx="16" cy="16" r="3" fill="none" stroke="black" stroke-width="2"/>
                <circle cx="16" cy="16" r="3" fill="none" stroke="white" stroke-width="1"/>
            </svg>`;
            document.body.appendChild(cursor);

            kbOverlay = null;
            let joystickTouchId = null;
            let aimTouchId = null;
            let joystickOrigin = { x: 0, y: 0 };

            let aimLastX = 0, aimLastY = 0;
            let cursorX = innerWidth / 2, cursorY = innerHeight / 2;
            cursor.style.left = cursorX + "px";
            cursor.style.top  = cursorY + "px";

            const MOUSE_SPEED = 1.8;
            function moveCursorBy(dx, dy) {
                cursorX = Math.max(0, Math.min(innerWidth,  cursorX + dx * MOUSE_SPEED));
                cursorY = Math.max(0, Math.min(innerHeight, cursorY + dy * MOUSE_SPEED));
                cursor.style.left = cursorX + "px";
                cursor.style.top  = cursorY + "px";
                mouse.x = cursorX;
                mouse.y = cursorY;
            }

            function isJoystickZone(x, y) {
                return false;
            }

            const _ourTouchStart = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (joystickTouchId === null && isJoystickZone(t.clientX, t.clientY)) {
                        joystickTouchId = t.identifier;
                        joystickOrigin.x = t.clientX;
                        joystickOrigin.y = t.clientY;
                    } else if (aimTouchId === null) {
                        aimTouchId = t.identifier;
                        aimLastX = t.clientX;
                        aimLastY = t.clientY;
                        mouse.x = cursorX; mouse.y = cursorY;
                        mouse.dir = utils.getDir(center.x, center.y, cursorX, cursorY);
                        events.moveTo(cursorX, cursorY);
                    }
                }
            };
            _ourTouchStart.__prScript = true;
            document.addEventListener('touchstart', _ourTouchStart, { passive: false, capture: true });

            const _ourTouchMove = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                for (const t of e.changedTouches) {
                    if (t.identifier === joystickTouchId) {
                        const dx = t.clientX - joystickOrigin.x;
                        const dy = t.clientY - joystickOrigin.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 15) {
                            stopMoving();
                            dirPathfind(Math.atan2(dy, dx));
                            relayJoystickToBots(Math.atan2(dy, dx), true);
                        }
                    } else if (t.identifier === aimTouchId) {
                        const dx = t.clientX - aimLastX;
                        const dy = t.clientY - aimLastY;
                        aimLastX = t.clientX;
                        aimLastY = t.clientY;
                        moveCursorBy(dx, dy);
                        mouse.x = cursorX; mouse.y = cursorY;
                        mouse.dir = utils.getDir(center.x, center.y, cursorX, cursorY);
                        if (!mouse.lock) {
                            events.moveTo(cursorX, cursorY);
                        }
                        if (bots.length) {
                            const wx = player.x ? (cursorX - center.x) / center.x * globalFov + player.x : undefined;
                            const wy = player.y ? (cursorY - center.y) / center.y * (globalFov * (innerHeight / innerWidth)) + player.y : undefined;
                            botsMsg({ type: 'mousemove', x: cursorX, y: cursorY, innerWidth, innerHeight, worldX: wx, worldY: wy });
                        }
                    }
                }
            };
            _ourTouchMove.__prScript = true;
            document.addEventListener('touchmove', _ourTouchMove, { passive: false, capture: true });

            const _ourTouchEnd = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (t.identifier === joystickTouchId) {
                        joystickTouchId = null;
                        stopMoving();
                        relayJoystickToBots(0, false);
                    } else if (t.identifier === aimTouchId) {
                        aimTouchId = null;
                    }
                }
            };
            _ourTouchEnd.__prScript = true;
            document.addEventListener('touchend', _ourTouchEnd, { passive: false, capture: true });

            document.addEventListener('touchcancel', () => {
                joystickTouchId = null; aimTouchId = null;
                mouse.down = false; mouse.buttons[0] = false;
                mouse.lock = false; stackRunning = false;
                stopMoving();
                relayJoystickToBots(0, false);
                events.mouseUp(0, mouse.x, mouse.y);
                if (bots.length) botsMsg({ type: 'mouseup', button: 0, x: mouse.x, y: mouse.y });
            }, { passive: false });

            const botIframes = document.createElement("div");
            Object.assign(botIframes.style, {
                position: "absolute", bottom: "20px", left: "200px", zIndex: "999999"
            });
            document.body.appendChild(botIframes);

            kbOverlay = document.createElement("div");
            kbOverlay.id = "kbOverlay";
            Object.assign(kbOverlay.style, {
                position: "fixed",
                bottom: "0",
                left: "0",
                width: "100%",
                zIndex: "9999995",
                background: "rgba(10,10,18,0.97)",
                backdropFilter: "blur(16px)",
                padding: "6px 3px 10px",
                boxSizing: "border-box",
                userSelect: "none",
                touchAction: "none",
                display: "none",
                flexDirection: "column",
                gap: "3px",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.6)"
            });

            const KB_ROWS = [
                [
                    { l:'`',  c:'Backquote' }, { l:'1', c:'Digit1' }, { l:'2', c:'Digit2' },
                    { l:'3',  c:'Digit3'    }, { l:'4', c:'Digit4' }, { l:'5', c:'Digit5' },
                    { l:'6',  c:'Digit6'    }, { l:'7', c:'Digit7' }, { l:'8', c:'Digit8' },
                    { l:'9',  c:'Digit9'    }, { l:'0', c:'Digit0' }, { l:'⌫', c:'Backspace', w:1.6 }
                ],
                [
                    { l:'Tab', c:'Tab', w:1.6 },
                    { l:'Q', c:'KeyQ' }, { l:'W', c:'KeyW' }, { l:'E', c:'KeyE' },
                    { l:'R', c:'KeyR' }, { l:'T', c:'KeyT' }, { l:'Y', c:'KeyY' },
                    { l:'U', c:'KeyU' }, { l:'I', c:'KeyI' }, { l:'O', c:'KeyO' },
                    { l:'P', c:'KeyP' }, { l:'[', c:'BracketLeft' }, { l:']', c:'BracketRight' }
                ],
                [
                    { l:'A', c:'KeyA' }, { l:'S', c:'KeyS' }, { l:'D', c:'KeyD' },
                    { l:'F', c:'KeyF' }, { l:'G', c:'KeyG' }, { l:'H', c:'KeyH' },
                    { l:'J', c:'KeyJ' }, { l:'K', c:'KeyK' }, { l:'L', c:'KeyL' },
                    { l:';', c:'Semicolon' }, { l:"'", c:'Quote' },
                    { l:'Enter', c:'Enter', w:2.2, hi:'rgba(59,200,120,0.35)' }
                ],
                [
                    { l:'⇧', c:'ShiftLeft',  w:2.2, hi:'rgba(200,150,59,0.35)', tog:true },
                    { l:'Z', c:'KeyZ' }, { l:'X', c:'KeyX' }, { l:'C', c:'KeyC' },
                    { l:'V', c:'KeyV' }, { l:'B', c:'KeyB' }, { l:'N', c:'KeyN' },
                    { l:'M', c:'KeyM' }, { l:',', c:'Comma' }, { l:'.', c:'Period' },
                    { l:'/', c:'Slash' },
                    { l:'⇧', c:'ShiftRight', w:2.2, hi:'rgba(200,150,59,0.35)', tog:true }
                ],
                [
                    { l:'Esc',  c:'Escape',    w:1.5, hi:'rgba(239,68,68,0.35)' },
                    { l:'Ctrl', c:'ControlLeft',w:1.5, hi:'rgba(150,100,200,0.35)', tog:true },
                    { l:'───── Space ─────', c:'Space', w:5 },
                    { l:'←', c:'ArrowLeft'  }, { l:'↑', c:'ArrowUp'   },
                    { l:'↓', c:'ArrowDown'  }, { l:'→', c:'ArrowRight' }
                ]
            ];

            const kbTouchMap = new Map();
            const kbToggled  = new Set();

            function kbBtnAt(x, y) {
                for (const row of kbOverlay.children) {
                    for (const btn of row.children) {
                        if (!btn.__kbDef) continue;
                        const r = btn.getBoundingClientRect();
                        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return btn;
                    }
                }
                return null;
            }

            function kbPress(def, btn) {
                if (def.tog) {
                    if (kbToggled.has(def.c)) {
                        kbToggled.delete(def.c);
                        btn.style.background = "rgba(30,30,46,0.9)";
                        events.keyUp(def.c);
                        if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keyup", code: def.c });
                    } else {
                        kbToggled.add(def.c);
                        btn.style.background = def.hi || "rgba(59,130,246,0.8)";
                        events.keyDown(def.c);
                        if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keydown", code: def.c });
                    }
                    return false;
                }
                btn.style.background = def.hi || "rgba(59,130,246,0.8)";
                events.keyDown(def.c);
                if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keydown", code: def.c });
                return true;
            }

            function kbRelease(def, btn) {
                if (def.tog) return;
                btn.style.background = "rgba(30,30,46,0.9)";
                events.keyUp(def.c);
                if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keyup", code: def.c });
            }

            KB_ROWS.forEach(rowDef => {
                const rowEl = document.createElement("div");
                Object.assign(rowEl.style, {
                    display: "flex",
                    justifyContent: "center",
                    gap: "3px"
                });

                rowDef.forEach(def => {
                    const btn = document.createElement("button");
                    btn.__kbDef = def;
                    btn.textContent = def.l;
                    const baseW = 28;
                    const w = Math.round(baseW * (def.w || 1));
                    Object.assign(btn.style, {
                        width: w + "px",
                        height: "36px",
                        borderRadius: "8px",
                        background: kbToggled.has(def.c) ? (def.hi || "rgba(59,130,246,0.8)") : "rgba(30,30,46,0.9)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: def.w > 1.8 ? "11px" : "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        flexShrink: "0",
                        touchAction: "none",
                        transition: "background 0.08s",
                        padding: "0",
                        fontFamily: "'Inter','Segoe UI',system-ui"
                    });
                    rowEl.appendChild(btn);
                });

                kbOverlay.appendChild(rowEl);
            });

            document.body.appendChild(kbOverlay);

            kbOverlay.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                for (const t of e.changedTouches) {
                    const btn = kbBtnAt(t.clientX, t.clientY);
                    if (!btn) continue;
                    const def = btn.__kbDef;
                    const registered = kbPress(def, btn);
                    if (registered) kbTouchMap.set(t.identifier, { def, btn });
                }
            }, { passive: false });

            kbOverlay.addEventListener("touchmove", (e) => {
                e.preventDefault();
                for (const t of e.changedTouches) {
                    const newBtn = kbBtnAt(t.clientX, t.clientY);
                    const old = kbTouchMap.get(t.identifier);
                    if (old && old.btn === newBtn) continue;
                    if (old) { kbRelease(old.def, old.btn); kbTouchMap.delete(t.identifier); }
                    if (newBtn && !newBtn.__kbDef.tog) {
                        const registered = kbPress(newBtn.__kbDef, newBtn);
                        if (registered) kbTouchMap.set(t.identifier, { def: newBtn.__kbDef, btn: newBtn });
                    }
                }
            }, { passive: false });

            function kbReleaseTouch(touches) {
                for (const t of touches) {
                    const old = kbTouchMap.get(t.identifier);
                    if (!old) continue;
                    kbRelease(old.def, old.btn);
                    kbTouchMap.delete(t.identifier);
                }
            }

            kbOverlay.addEventListener("touchend",    (e) => { e.preventDefault(); kbReleaseTouch(e.changedTouches); }, { passive: false });
            kbOverlay.addEventListener("touchcancel", (e) => { kbReleaseTouch(e.changedTouches); }, { passive: false });

            kbOverlay.addEventListener("mousedown", (e) => {
                const btn = kbBtnAt(e.clientX, e.clientY);
                if (btn) kbPress(btn.__kbDef, btn);
            });
            kbOverlay.addEventListener("mouseup", (e) => {
                kbOverlay.querySelectorAll("button").forEach(btn => {
                    if (btn.__kbDef && !btn.__kbDef.tog && !kbToggled.has(btn.__kbDef.c))
                        kbRelease(btn.__kbDef, btn);
                });
            });


            tankSelect     = getEl("tankSelect");
            botTankSelect  = getEl("botTankSelect");
            botMoving      = getEl("botsMoving");
            botMouseFollow = getEl("mouseFollowMode");
            fedingCheckbox = getEl("doFed");
            let XRayCheckbox   = getEl("xray");
            let seeEverything  = getEl("seeEverything");
            let XRayAlpha      = getEl("xrayAlpha");

            let dragOffX = 0, dragOffY = 0, dragging = false;
            const handle = getEl("dragHandle");
            handle.addEventListener("mousedown", e => {
                dragging = true;
                dragOffX = e.clientX - menu.offsetLeft;
                dragOffY = e.clientY - menu.offsetTop;
                e.preventDefault();
            });
            document.addEventListener("mousemove", e => {
                if (!dragging) return;
                menu.style.left = (e.clientX - dragOffX) + "px";
                menu.style.top  = (e.clientY - dragOffY) + "px";
            });
            document.addEventListener("mouseup", () => { dragging = false; });

            function saveJSON() {
                localStorage.setItem("pr_script_settings", JSON.stringify(stored));
            }

            var stored = localStorage.getItem("pr_script_settings");
            if (typeof stored != "string" || stored[0] != "{") {
                stored = { elements: {}, tab: "main", hideMenu: false };
                saveJSON();
            } else {
                stored = JSON.parse(stored);
            }

            window.changeMenu(stored.tab);

            for (const key in stored.elements) {
                if (!Object.hasOwn(stored.elements, key)) continue;
                const data = stored.elements[key];
                const element = getEl(key);
                if (!element) continue;
                if (data.type == "checkbox") element.checked = data.checked;
                else if (data.type == "select") element.value = data.value;
            }

            xrayEnabled = getEl("xray")?.checked || false;
            xrayAlphaVal = parseFloat(getEl("xrayAlpha")?.value) || 0.5;
            seeEverythingEnabled = getEl("seeEverything")?.checked || false;
            bulletHiderEnabled = getEl("bulletHider")?.checked || false;

            ["autoStats","autoRespawn","botsReplKeys","disRender","allowEZ","seeEverything","mouseFollowMode", "xray", "bulletHider"].forEach(id => {
                const el = getEl(id);
                if (!el) return;
                el.addEventListener("click", () => {
                    stored.elements[id] = { type: "checkbox", checked: el.checked };
                    saveJSON();
                    if (id === "xray") xrayEnabled = el.checked;
                    if (id === "seeEverything") seeEverythingEnabled = el.checked;
                    if (id === "bulletHider") {
                        bulletHiderEnabled = el.checked;
                        _showNotif(`Bullet Hider ${el.checked ? 'ON' : 'OFF'}`, 'success');
                    }
                });
            });

            if (XRayAlpha) {
                XRayAlpha.addEventListener("input", () => {
                    xrayAlphaVal = parseFloat(XRayAlpha.value) || 0.5;
                });
            }

            ["tankSelect","botTankSelect"].forEach(id => {
                const el = getEl(id);
                if (!el) return;
                el.addEventListener("change", () => {
                    if (id == "tankSelect") {
                        const desc = getEl("tankDesc");
                        if (desc) desc.innerHTML = tanks[tankSelect.value]?.desc || "";
                        getEl("soccerbotWrapper").hidden = tankSelect.value != "blockade";
                        if (tankSelect.value != "blockade") getEl("soccerbot").checked = false;
                        getEl("timekillerWrapper").hidden = tankSelect.value != "fighter";
                        if (tankSelect.value != "fighter") getEl("timekiller").checked = false;
                    }
                    stored.elements[id] = { type: "select", value: el.value };
                    saveJSON();
                });
            });

            botTankSelect.innerHTML = `<option value="none">None</option>`;
            for (let tank in tanks) {
                if (!Object.hasOwn(tanks, tank) || ["blockade","fastram","dreadV2"].includes(tank)) continue;
                tank = tanks[tank];
                botTankSelect.innerHTML += `<option value="${tank.id}">${tank.name || tank.id}</option>`;
            }
            botTankSelect.innerHTML += `
                <option disabled></option>
                <option disabled>Branches:</option>
                <option value="wiping">Tri-Angle</option>
                <option value="wipingAR">Tri-Angle (Arms Race)</option>
                <option value="necro">Underseer (Arms Race)</option>
                <option value="crash">Crashing (Arms Race)</option>
                <option value="feding">Feeding</option>
                <option value="fedingAR">Feeding (Arms Race)</option>`;

            const desc = getEl("tankDesc");
            if (desc) desc.innerHTML = tanks[tankSelect.value]?.desc || "";
            getEl("soccerbotWrapper").hidden = tankSelect.value != "blockade";
            getEl("timekillerWrapper").hidden = tankSelect.value != "fighter";

            let botFireDisabled = false;

            setInterval(() => {
                bots = bots.filter(bot => {
                    try { return !!bot.contentWindow.channel; } catch(e) { return false; }
                });
            }, 2000);

            botsMsg = function (msg) {
                if (!bots || !bots.length) return;
                if (botFireDisabled && msg.type === 'mousedown') return;
                for (const bot of bots) {
                    try { bot.contentWindow.channel.message(msg); } catch(e) {}
                }
            };

            getEl("botFireToggle").addEventListener("click", () => {
                botFireDisabled = !botFireDisabled;
                const btn = getEl("botFireToggle");
                if (botFireDisabled) {
                    btn.textContent = "🔫 Bot fire: OFF";
                    btn.style.background = "rgba(239,68,68,0.7)";
                    botsMsg({ type: 'mouseup', button: 0, x: mouse.x, y: mouse.y });
                } else {
                    btn.textContent = "🔫 Bot fire: ON";
                    btn.style.background = "rgba(59,130,246,0.7)";
                }
            });

            getEl("setSpawn").addEventListener("click", () => {
                if (!player.x) { alert("press L to let script know ur coordinates"); return; }
                chat(`$arena spawnpoint ${player.x} ${player.y}`);
            });

            getEl("botServerLink").addEventListener("input", () => {
                const raw = getEl("botServerLink").value.trim();
                const status = getEl("botServerLinkStatus");
                if (!raw) { status.textContent = ""; return; }
                try {
                    const url = new URL(raw);
                    if (url.hostname === "arras.io" || url.hostname === "localhost") {
                        status.textContent = "✅ Valid link";
                        status.style.color = "#4ade80";
                    } else {
                        status.textContent = "⚠️ Not an arras.io link";
                        status.style.color = "#facc15";
                    }
                } catch {
                    status.textContent = "❌ Invalid URL";
                    status.style.color = "#f87171";
                }
            });

            getEl("createBot").addEventListener("click", () => {
                const iframe = document.createElement("iframe");
                const linkInput = getEl("botServerLink").value.trim();
                let botSrc = location.href;
                if (linkInput) {
                    try { botSrc = new URL(linkInput).href; } catch {}
                }
                iframe.name = "__pr_is_bot";
                iframe.src = botSrc;
                iframe.width = 60;
                iframe.height = 40;

                const botWrapper = document.createElement('div');
                Object.assign(botWrapper.style, {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    margin: '2px',
                    textAlign: 'center',
                    position: 'relative'
                });

                const botLabel = document.createElement('div');
                const shortUrl = (() => {
                    try {
                        const u = new URL(botSrc);
                        const hash = u.hash.slice(1, 7) || '';
                        return hash ? u.hostname + ' #' + hash : u.hostname;
                    } catch { return botSrc.slice(0, 12); }
                })();
                botLabel.textContent = shortUrl;
                botLabel.title = botSrc;
                Object.assign(botLabel.style, {
                    fontSize: '8px',
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(0,0,0,0.55)',
                    borderRadius: '3px',
                    padding: '1px 3px',
                    marginBottom: '1px',
                    whiteSpace: 'nowrap'
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '✕';
                Object.assign(deleteBtn.style, {
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '16px',
                    height: '16px',
                    padding: '0',
                    border: 'none',
                    background: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    fontSize: '10px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    fontWeight: 'bold'
                });
                deleteBtn.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    const idx = bots.indexOf(iframe);
                    if (idx > -1) bots.splice(idx, 1);
                    botWrapper.remove();
                });

                botWrapper.appendChild(botLabel);
                botWrapper.appendChild(deleteBtn);
                botWrapper.appendChild(iframe);
                botIframes.appendChild(botWrapper);
                bots.push(iframe);

                const labelInterval = setInterval(() => {
                    try {
                        const liveUrl = iframe.contentWindow.location.href;
                        botLabel.textContent = liveUrl;
                        botLabel.title = liveUrl;
                    } catch {
                        clearInterval(labelInterval);
                        botLabel.textContent = '❌ disconnected';
                    }
                }, 1000);
                const win = iframe.contentWindow;
                win.__is_bot = true;
                win.__bot_idx = bots.length - 1;
                win.channel = { message: () => {} };
                win.channel.clan = utils.removeBrackets(getEl("botClan").value);
                win.channel.unnamed = getEl("botUnnamed")?.checked || false;
                win.channel.disRender = getEl("disRender").checked;
                win.channel.tank = _lastMacroName ? "none" : (tanks[botTankSelect.value] || botTankSelect.value);
                win.channel.moving = botMoving ? botMoving.checked : true;
                win.channel.autofireE = getEl("botAutofireE")?.checked || false;
                win.channel.stackin = getEl("stackin")?.checked || false;
                win.channel.pendingMacro = _lastMacroName || null;
                win.channel.mouseAim = true;
            });

            getEl("spawnMultiple").addEventListener("click", () => {
                const count = parseInt(getEl("spawnCount").value, 10);
                if (isNaN(count) || count < 1) return;
                let n = 0;
                function spawnNext() {
                    if (n >= count) return;
                    getEl("createBot").click();
                    n++;
                    setTimeout(spawnNext, 150);
                }
                spawnNext();
            });

            getEl("reconnectBots").addEventListener("click", () => {
                for (const bot of bots) bot.contentWindow.channel.reconnect();
            });

            getEl("reloadBots").addEventListener("click", () => {
                for (const bot of bots) {
                    const savedClan   = utils.removeBrackets(getEl("botClan").value);
                    const savedTank   = tanks[botTankSelect.value] || botTankSelect.value;
                    const savedRender = getEl("disRender").checked;
                    bot.onload = () => {
                        const win = bot.contentWindow;
                        win.__is_bot = true;
                        win.channel = { message: () => {} };
                        win.channel.clan      = savedClan;
                        win.channel.disRender = savedRender;
                        win.channel.tank      = savedTank;
                        win.channel.moving    = botMoving.checked;
                        win.channel.unnamed   = getEl("botUnnamed")?.checked || false;
                        win.channel.pendingMacro = _lastMacroName || null;
                        bot.onload = null;
                    };
                    try { bot.contentWindow.location.reload(); } catch(e) { bot.src = bot.src; }
                }
            });

            getEl("dcBots").addEventListener("click", () => {
                bots = [];
                while (botIframes.firstChild) botIframes.removeChild(botIframes.firstChild);
            });

            getEl("botClan").addEventListener("input", () => {
                const tag = utils.removeBrackets(getEl("botClan").value.trim());
                for (const bot of bots) bot.contentWindow.channel.clan = tag;
            });
            getEl("botClanPreset").addEventListener("change", () => {
                const val = getEl("botClanPreset").value;
                if (!val) return;
                getEl("botClan").value = val;
                const tag = utils.removeBrackets(val);
                for (const bot of bots) bot.contentWindow.channel.clan = tag;
                getEl("botClanPreset").value = "";
            });
            getEl("botUnnamed").addEventListener("change", () => {
                const val = getEl("botUnnamed").checked;
                for (const bot of bots) bot.contentWindow.channel.unnamed = val;
            });

            getEl("mouseAimMode").addEventListener("change", () => {
                botsMsg({
                    type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false
                });
            });

            getEl("mouseFollowMode").addEventListener("change", () => {
                botsMsg({
                    type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false
                });
            });

            getEl("botTankSelect").addEventListener("change", () => {
                for (const bot of bots)
                    bot.contentWindow.channel.tank = tanks[botTankSelect.value] || botTankSelect.value;
            });

            getEl("botsMoving").addEventListener("change", () => {
                for (const bot of bots) bot.contentWindow.channel.moving = botMoving.checked;
            });

            getEl("botAutofireE").addEventListener("change", () => {
                const val = getEl("botAutofireE").checked;
                for (const bot of bots) bot.contentWindow.channel.autofireE = val;
            });

            // ───── PATCHED: Go to coords now ALSO aims and fires ─────
            getEl("botGotoBtn").addEventListener("click", () => {
                const x = parseFloat(getEl("botGotoX").value);
                const y = parseFloat(getEl("botGotoY").value);
                const fire = getEl("botGotoFire")?.checked ?? true;
                botsMsg({ type: "gotoCoords", x, y, fire });
                botsMsg({ type: "aimUpdate", aimX: x, aimY: y });
                botsMsg({ type: "modeUpdate", mouseAim: true, mouseFollow: false, followMe: false });
                _showNotif(`Bots: goto (${x.toFixed(0)}, ${y.toFixed(0)}) + aim${fire ? " + fire" : ""}`, 'success');
            });

            getEl("botGotoStop").addEventListener("click", () => {
                botsMsg({ type: "gotoCoords", x: null, y: null });
                botsMsg({ type: "mouseup", button: 0, x: 0, y: 0 });
                botsMsg({ type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false });
                _showNotif('Bots: goto stopped', 'success');
            });
            // ──────────────────────────────────────────────────────────

            getEl("stackin").addEventListener("change", () => {
                const val = getEl("stackin").checked;
                for (const bot of bots) bot.contentWindow.channel.stackin = val;
            });

            let _chatSpamTimer = null;
            function _scheduleChatSpam() {
                if (_chatSpamTimer) clearTimeout(_chatSpamTimer);
                if (!getEl("botChatSpam")?.checked || !bots.length) {
                    _chatSpamTimer = setTimeout(_scheduleChatSpam, 1000);
                    return;
                }
                const msg = getEl("botChatMsg")?.value.trim();
                if (msg) {
                    bots.forEach((bot, i) => {
                        setTimeout(() => {
                            try { bot.contentWindow.channel.message({ type: "chat", msg }); } catch(e) {}
                        }, i * 1500);
                    });
                }
                _chatSpamTimer = setTimeout(_scheduleChatSpam, Math.max(3000, bots.length * 1500));
            }
            _scheduleChatSpam();

            fedingCheckbox.addEventListener("change", () => {
                for (const bot of bots) bot.contentWindow.channel.feeed(fedingCheckbox.checked);
            });

            window.fedPath = [];
            getEl("addFedLocation").addEventListener("click", () => {
                const perf = () => {
                    window.fedPath.push({ x: player.x, y: player.y });
                    for (const bot of bots) {
                        try { bot.contentWindow.fedPath?.push({ x: player.x, y: player.y }); } catch(e) {}
                    }
                };
                if (player.x && player.y) perf();
                else { events.press("KeyL"); setTimeout(perf, 100); }
            });

            getEl("resetFedPath").addEventListener("click", () => {
                window.fedPath = [];
                currentFedPath = [];
                for (const bot of bots) bot.contentWindow.channel.feeedRESET();
            });

            getEl("pibuild").addEventListener("click", () => {
                upgradeStats(Math.PI.toString().replace(".","").split("").slice(0,10).join("/"));
            });

            getEl("extraUpgradeBtn").addEventListener("click", () => {
                const tank = tanks[getEl("extraTankSelect").value];
                if (!tank) return;
                upgradeTank(tank.path);
                upgradeStats(tank);
            });

            getEl("resetAuthBtn").addEventListener("click", () => {
                clearAuth();
                alert("Authorization cleared. Please refresh the page to re-enter key.");
                location.reload();
            });

            const _prRespawnSel = getEl("pr_respawn_build_sel");
            const _prRespawnBtn = getEl("pr_force_respawn_btn");
            if (_prRespawnSel) {
                _prRespawnSel.value = _selectedRespawnBuild;
                _prRespawnSel.addEventListener('change', () => {
                    _selectedRespawnBuild = _prRespawnSel.value;
                    localStorage.setItem(LS_RESPAWN_BUILD, _selectedRespawnBuild);
                });
            }
            if (_prRespawnBtn) {
                _prRespawnBtn.addEventListener('click', () => {
                    events.press("Enter");
                    if (_selectedRespawnBuild !== 'none') setTimeout(() => _executeBuild(_selectedRespawnBuild), 600);
                    localStorage.setItem(LS_FORCE_RESPAWN_MB, JSON.stringify({ timestamp: Date.now(), build: _selectedRespawnBuild }));
                    for (const bot of bots) {
                        try {
                            bot.contentWindow.channel.message({ type: 'keydown', code: 'Enter' });
                            setTimeout(() => {
                                try { bot.contentWindow.channel.message({ type: 'keyup', code: 'Enter' }); } catch(e){}
                            }, 80);
                        } catch(e) {}
                    }
                    _showNotif(`Respawn signal sent (${_selectedRespawnBuild})`, 'success');
                });
            }

            const _prFormEn  = getEl("pr_formation_enabled");
            const _prFormType = getEl("pr_formation_type");
            const _prFormSpc  = getEl("pr_formation_spacing");
            const _prFormSpcV = getEl("pr_formation_spacing_val");
            if (_prFormEn) {
                _prFormEn.checked = formationConfig.enabled;
                _prFormEn.addEventListener('change', () => {
                    formationConfig.enabled = _prFormEn.checked;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                    _showNotif(`Formation ${formationConfig.enabled ? 'ON' : 'OFF'}`, 'success');
                });
            }
            if (_prFormType) {
                _prFormType.value = formationConfig.type;
                _prFormType.addEventListener('change', () => {
                    formationConfig.type = _prFormType.value;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                });
            }
            if (_prFormSpc) {
                _prFormSpc.value = formationConfig.spacing;
                if (_prFormSpcV) _prFormSpcV.textContent = formationConfig.spacing;
                _prFormSpc.addEventListener('input', () => {
                    formationConfig.spacing = parseInt(_prFormSpc.value);
                    if (_prFormSpcV) _prFormSpcV.textContent = formationConfig.spacing;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                });
            }
            // Wire up +/- buttons for sliders
document.querySelectorAll('.slider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const delta = parseInt(btn.dataset.delta);
        const slider = document.getElementById(targetId);
        if (!slider) return;
        const newVal = Math.max(
            parseInt(slider.min),
            Math.min(parseInt(slider.max), parseInt(slider.value) + delta)
        );
        slider.value = newVal;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
});
            const _prFollowDist  = getEl("pr_follow_dist");
            const _prFollowDistV = getEl("pr_follow_dist_val");
            if (_prFollowDist) {
                _prFollowDist.value = _followDistance;
                if (_prFollowDistV) _prFollowDistV.textContent = _followDistance;
                _prFollowDist.addEventListener('input', () => {
                    _followDistance = parseInt(_prFollowDist.value);
                    if (_prFollowDistV) _prFollowDistV.textContent = _followDistance;
                    localStorage.setItem(LS_FOLLOW_DIST_PR, _followDistance.toString());
                });
            }

            const _prClearKills = getEl("pr_clear_kills");
            if (_prClearKills) {
                _prClearKills.addEventListener('click', () => { killLog = []; _updateKillLog(); _showNotif('Kill log cleared', 'success'); });
            }
            _updateKillLog();

            const _prAutoUser = getEl("pr_auto_username");
            const _prUserTheme = getEl("pr_username_theme");
            const _prSetUserNow = getEl("pr_set_username_now");
            if (_prAutoUser) {
                _prAutoUser.checked = autoUsernameEnabled;
                _prAutoUser.addEventListener('change', () => {
                    autoUsernameEnabled = _prAutoUser.checked;
                    localStorage.setItem(LS_AUTO_USERNAME, JSON.stringify(autoUsernameEnabled));
                    _showNotif(`Auto Username ${autoUsernameEnabled ? 'ON' : 'OFF'}`, 'success');
                });
            }
            if (_prUserTheme) {
                _prUserTheme.value = usernameTheme;
                _prUserTheme.addEventListener('change', () => {
                    usernameTheme = _prUserTheme.value;
                    localStorage.setItem('arras_username_theme', usernameTheme);
                });
            }
            if (_prSetUserNow) {
                _prSetUserNow.addEventListener('click', () => {
                    const input = document.querySelector("body > input[type=text]");
                    if (input) {
                        const name = getRandomUsername();
                        input.value = name;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        _showNotif(`Username set: ${name}`, 'success');
                    } else {
                        _showNotif('No name input found (spawn screen?)', 'error');
                    }
                });
            }

            const _prPreciseAim = getEl("pr_precise_aim");
            if (_prPreciseAim) {
                _prPreciseAim.checked = _preciseAim;
                _prPreciseAim.addEventListener('change', () => {
                    _preciseAim = _prPreciseAim.checked;
                    localStorage.setItem(LS_PRECISE_AIM_PR, JSON.stringify(_preciseAim));
                    _showNotif(`Precise Aim ${_preciseAim ? 'ON' : 'OFF'}`, 'success');
                });
            }

            const _prChat1 = getEl("pr_chat_msg1");
            const _prChat2 = getEl("pr_chat_msg2");
            const _prSendChat = getEl("pr_send_chat_now");
            if (_prChat1) {
                _prChat1.value = chatMessage1;
                _prChat1.addEventListener('input', () => {
                    chatMessage1 = _prChat1.value;
                    localStorage.setItem('arras_chat_msg_1', chatMessage1);
                });
            }
            if (_prChat2) {
                _prChat2.value = chatMessage2;
                _prChat2.addEventListener('input', () => {
                    chatMessage2 = _prChat2.value;
                    localStorage.setItem('arras_chat_msg_2', chatMessage2);
                });
            }
            if (_prSendChat) {
                _prSendChat.addEventListener('click', () => {
                    chat(chatMessage1);
                    setTimeout(() => chat(chatMessage2), 1500);
                    _showNotif('Chat messages sent!', 'success');
                });
            }

            const _prFpsEn  = getEl("pr_fps_enabled");
            const _prFpsLim = getEl("pr_fps_limit");
            const _prFpsVal = getEl("pr_fps_val");
            if (_prFpsEn) {
                _prFpsEn.checked = _followerFpsEnabled;
                _prFpsEn.addEventListener('change', () => {
                    _followerFpsEnabled = _prFpsEn.checked;
                    if (_followerFpsEnabled) botsMsg({ type: 'enableFps', limit: _fpsLimit });
                    else botsMsg({ type: 'disableFps' });
                    _showNotif(`FPS Limiter ${_followerFpsEnabled ? 'ON ('+_fpsLimit+' FPS)' : 'OFF'}`, 'success');
                });
            }
            if (_prFpsLim) {
                _prFpsLim.value = _fpsLimit;
                if (_prFpsVal) _prFpsVal.textContent = _fpsLimit;
                _prFpsLim.addEventListener('input', () => {
                    _fpsLimit = parseInt(_prFpsLim.value);
                    if (_prFpsVal) _prFpsVal.textContent = _fpsLimit;
                    if (_followerFpsEnabled) botsMsg({ type: 'enableFps', limit: _fpsLimit });
                });
            }

            {
                const savedT = localStorage.getItem('arras_username_theme');
                if (savedT) usernameTheme = savedT;
                const savedAU = localStorage.getItem(LS_AUTO_USERNAME);
                if (savedAU !== null && JSON.parse(savedAU)) {
                    const _auInterval = setInterval(() => {
                        const inp = document.querySelector("body > input[type=text]");
                        if (!inp) return;
                        clearInterval(_auInterval);
                        if (autoUsernameEnabled) {
                            inp.value = getRandomUsername();
                            inp.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, 77);
                }
            }

            var mem;
            getEl("test_wasm")?.addEventListener("click", () => {
                if (!mem) { mem = HEAPU32; return; }
                let out = new Uint32Array();
                for (let i = 0; i < HEAPU32.length; i++) {
                    const elk1 = mem[i], elk2 = HEAPU32[i];
                    if (getEl("wasmcringe")?.checked) { if (elk1 == elk2) out[out.length] = elk1; }
                    else { if (elk1 != elk2) out[out.length] = elk2; }
                }
                mem = out;
            });

            let sbCycle = false;
            setInterval(() => {
                if (getEl("soccerbot")?.checked) {
                    events._keyEvent("KeyW", sbCycle);
                    events._keyEvent("KeyS", !sbCycle);
                    sbCycle = !sbCycle;
                }
            }, 5500);

            setInterval(() => {
                if (getEl("timekiller")?.checked) {
                    stopMoving();
                    dirPathfind(mouse.dir + Math.PI);
                    setTimeout(() => { stopMoving(); dirPathfind(mouse.dir); }, 800);
                }
            }, 2000);
        }

        const nameInterval = setInterval(() => {
            const input = document.querySelector("body > input[type=text]");
            if (!input) return;
            clearInterval(nameInterval);
            player.name = input.value;
            if (window.__is_bot) {
                if (channel.unnamed) {
                    input.value = "";
                } else {
                    const names = ["Aaron","Abigail","Addison","Adeline","Adrian","Aiden","Aaliyah","Alexander","Alice","Allison","Amelia","Andrew","Angel","Anthony","Aria","Asher","Athena","Austin","Aurora","Ava","Avery","Ayden","Benjamin","Bentley","Blake","Brandon","Brayden","Caleb","Camila","Cameron","Caroline","Carter","Charles","Chase","Charlotte","Chloe","Christian","Christopher","Claire","Clara","Cole","Colton","Connor","Cooper","Daisy","Daniel","David","Delilah","Declan","Dylan","Easton","Eden","Eleanor","Elena","Eliana","Elias","Elijah","Ella","Ellie","Emery","Emilia","Emily","Emma","Ethan","Evelyn","Everly","Ezra","Gabriel","Gavin","Genesis","Gianna","Grace","Hailey","Hannah","Harper","Hazel","Henry","Hudson","Hunter","Isaac","Isabella","Isla","Isaiah","Iris","Ivy","Jack","Jace","Jade","James","Jason","Jaxon","Jayden","Jeremiah","John","Jordan","Joseph","Josephine","Josiah","Josie","Joshua","Julian","Landon","Layla","Leah","Leilani","Leo","Liam","Lillian","Lily","Lincoln","Logan","Lucy","Luna","Luke","Madeline","Madison","Maeve","Maria","Mason","Mateo","Matthew","Maya","Michael","Mia","Mila","Millie","Naomi","Nicholas","Nolan","Nora","Nova","Oliver","Olivia","Owen","Paisley","Parker","Penelope","Quinn","Riley","Ruby","Ryan","Sadie","Samantha","Samuel","Sarah","Savannah","Scarlett","Sebastian","Sofia","Sophia","Stella","Theodore","Thomas","Victoria","Violet","Waylon","Willow","William","Wyatt","Xavier","Zoe","Zoey"];
                    let name = names[Math.floor(Math.random() * names.length)];
                    if (channel.clan) name = `[${channel.clan}] ${name}`;
                    input.value = name;
                }
            } else if (autoUsernameEnabled) {
                const name = getRandomUsername();
                input.value = name;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 77);
    }

    if (document.body) {
        initUI();
    } else {
        document.addEventListener("DOMContentLoaded", initUI);
    }

    if (window.__is_bot) {
        if (window.channel.disRender) {
            WebGLRenderingContext.prototype.drawElements = () => {};
            WebGLRenderingContext.prototype.drawArrays   = () => {};
            WebGLRenderingContext.prototype.clear        = () => {};
            WebGLRenderingContext.prototype.viewport     = () => {};
            CanvasRenderingContext2D.prototype.fill       = () => {};
            CanvasRenderingContext2D.prototype.fillRect   = () => {};
            CanvasRenderingContext2D.prototype.stroke     = () => {};
            CanvasRenderingContext2D.prototype.strokeRect = () => {};
            CanvasRenderingContext2D.prototype.roundRect  = () => {};
            CanvasRenderingContext2D.prototype.lineTo     = () => {};
            CanvasRenderingContext2D.prototype.arc        = () => {};
            CanvasRenderingContext2D.prototype.drawImage  = () => {};
            window.requestAnimationFrame = (cb) => setTimeout(cb, 500);
        }

        const _channelFiredKeys = new Set();

        setInterval(() => {
            try {
                const raw = localStorage.getItem(LS_KEYS);
                if (raw) {
                    const { keyStates } = JSON.parse(raw);
                    replicatableKeys.forEach(k => {
                        const target = keyStates[k] === true;
                        if (lastReceivedKeyStates[k] !== target) {
                            lastReceivedKeyStates[k] = target;
                            if (_channelFiredKeys.has(k)) { _channelFiredKeys.delete(k); return; }
                            if (target) events.keyDown(k);
                            else events.keyUp(k);
                        }
                    });
                }
            } catch(e) {}

            try {
                if (window.channel.mouseAim && sinsay.aimX !== undefined && player.x !== undefined) {
                    let screenX = ((sinsay.aimX - player.x) / globalFov * (inner.width / 2)) + (inner.width / 2);
                    let screenY = ((sinsay.aimY - player.y) / (globalFov * (inner.height / inner.width)) * (inner.height / 2)) + (inner.height / 2);
                    screenX = Math.max(10, Math.min(inner.width - 10, screenX));
                    screenY = Math.max(10, Math.min(inner.height - 10, screenY));
                    events.moveTo(screenX, screenY);
                }
            } catch(e) {}
        }, 16);

        const oldSetItem = localStorage.setItem;
        localStorage.setItem = function (key, value) {
            if (key == "arras.io") return;
            oldSetItem.call(this, key, value);
        };

        const inner = { width: innerWidth, height: innerHeight };

        window.channel.feeed      = bool => { if (fedingCheckbox) fedingCheckbox.checked = bool; };
        window.channel.feeedRESET = () => { window.fedPath = []; currentFedPath = []; };

        let _pendingChat = null;
        const _origAppend = Node.prototype.nappend;
        const _hookedAppend = Node.prototype.appendChild;
        Node.prototype.appendChild = function(node) {
            const result = _hookedAppend.call(this, node);
            if (node.tagName === "INPUT" && node.type === "text" && _pendingChat) {
                const msg = _pendingChat;
                _pendingChat = null;
                setTimeout(() => {
                    node.value = msg;
                    node.dispatchEvent(new Event("input", { bubbles: true }));
                    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    node.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    setTimeout(() => { _chatInFlight = false; }, 600);
                }, 20);
            }
            return result;
        };
        window._setPendingChat = (msg) => {
            _pendingChat = msg;
            events.press("Enter");
        };

        let _chatInFlight = false;
        const interval2 = setInterval(() => {
            if (isConnecting) { events.press("KeyL"); clearInterval(interval2); return; }
            if (spawned) { clearInterval(interval2); return; }
            if (_chatInFlight) return;
            events.press("Enter");
        }, 200);

        window.channel.message = function (msg) {
            if (msg.type == "mousedown") {
                events.mouseDown(msg.button, msg.x, msg.y);
            } else if (msg.type == "mouseup") {
                events.mouseUp(msg.button, msg.x, msg.y);
            } else if (msg.type == "modeUpdate") {
                window.channel.mouseAim    = msg.mouseAim;
                window.channel.mouseFollow = msg.mouseFollow;
                window.channel.followMe    = msg.followMe;
            } else if (msg.type == "aimUpdate") {
                sinsay.aimX = msg.aimX;
                sinsay.aimY = msg.aimY;
            } else if (msg.type == "mousemove") {
                if (msg.worldX !== undefined) {
                    sinsay.worldX = msg.worldX;
                    sinsay.worldY = msg.worldY;
                }
            } else if (msg.type == "cursormirror") {
                const cx = msg.nx * innerWidth;
                const cy = msg.ny * innerHeight;
                events.moveTo(cx, cy);
            } else if (msg.type == "keydown" && msg.code != "KeyL") {
                if (typeof _channelFiredKeys !== 'undefined') _channelFiredKeys.add(msg.code);
                events.keyDown(msg.code);
            } else if (msg.type == "keyup" && msg.code != "KeyL") {
                if (typeof _channelFiredKeys !== 'undefined') _channelFiredKeys.add(msg.code);
                events.keyUp(msg.code);
            } else if (msg.type == "position") {
                sinsay.x = msg.x;
                sinsay.y = msg.y;
                if (msg.minDist !== undefined) sinsay.minDist = msg.minDist;
            } else if (msg.type == "chat") {
                if (_chatInFlight) return;
                _chatInFlight = true;
                const inp = document.querySelector("body > input[type=text]");
                if (inp) {
                    inp.value = msg.msg;
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    setTimeout(() => { _chatInFlight = false; }, 600);
                } else {
                    _pendingChat = msg.msg;
                    events.press("Enter");
                }
            } else if (msg.type == "enableFps") {
                _enableFpsLimiter(msg.limit);
            } else if (msg.type == "disableFps") {
                _disableFpsLimiter();
            } else if (msg.type == "upgrade") {
                performMacroUpgrade(msg.macro);
            } else if (msg.type == "gotoCoords") {
                // ───── PATCHED: gotoCoords now also aims + fires ─────
                if (msg.x === null) {
                    sinsay._gotoTarget = null;
                    sinsay.aimX = undefined;
                    sinsay.aimY = undefined;
                    window.channel._gotoFire = false;
                    events.mouseUp(0, innerWidth/2, innerHeight/2);
                } else {
                    sinsay._gotoTarget = { x: msg.x, y: msg.y };
                    sinsay.aimX = msg.x;
                    sinsay.aimY = msg.y;
                    window.channel.mouseAim = true;
                    if (msg.fire) {
                        window.channel._gotoFire = true;
                        setTimeout(() => {
                            if (window.channel._gotoFire) {
                                events.mouseDown(0, innerWidth/2, innerHeight/2);
                            }
                        }, 300);
                    }
                }
                // ─────────────────────────────────────────────────────
            }
        };

        window.channel.reconnect = () => {
            setTimeout(() => events.click(0, 32, 26), 50);
        };

        window.addEventListener("keydown", function (e) {
            if (e.key === "Tab" || e.key === "Escape") {
                const m = document.getElementById("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            }
        }, true);
    }


    // ============= EXT BOTS (Codespace WebSocket) =============
    (function() {
        let extPlayerX = 0, extPlayerY = 0;
        let extMouseX = 0, extMouseY = 0;
        let extMouseDown = false, extRMouseDown = false;
        let extGameFOV = 46;

        const SERVERS = [
{ name: "Server 1", url: "wss://vigilant-fishstick-r7qq67q9667hwqpj-8082.app.github.dev" },
{ name: "Server 2", url: "wss://super-duper-space-acorn-vppqvvpq9v643xqx6-8082.app.github.dev" },
{ name: "Server 3", url: "wss://crispy-engine-r77pqv57g7q9259rx-8082.app.github.dev" },
{ name: "Server 4", url: "wss://didactic-space-funicular-vppq97jpvp7j2ppvv-8082.app.github.dev" },
{ name: "Server 5", url: "wss://cautious-barnacle-966jp5vwrgg5cpw44-8082.app.github.dev" },
{ name: "Server 6", url: "wss://literate-spoon-vppqxr4w975qhx9rp-8082.app.github.dev" },
];

                const extTanks = {
            anni: null,
            architect: null,
            assassin: null,
            assembler: null,
            auto3: null,
            auto4: null,
            auto5: null,
            auto6: null,
            auto7: null,
            autoanni: null,
            autoauto4: null,
            autobattleship: null,
            autobomber: null,
            autocruiserdrive: null,
            autoeagle: null,
            autofighter: null,
            autogunner: null,
            automingler: null,
            autonecro: null,
            autooperator: null,
            autooverdrive: null,
            autooverlord: null,
            autopentaseer: null,
            autoprod: null,
            autoshasher: null,
            autotriangle: null,
            banshee: null,
            basher: null,
            basic: null,
            batter4: null,
            battlerdrive: null,
            bismarck: null,
            bomber: null,
            booster: null,
            browser: null,
            buchwhacker: null,
            bulwark: null,
            chemist: null,
            claymore: null,
            coli: null,
            compound: null,
            conqueror: null,
            crack: null,
            cruiser: null,
            cyclone: null,
            destroyer: null,
            director: null,
            directordrive: null,
            dirigible: null,
            diviner: null,
            doubleequalizer: null,
            doublespread: null,
            doubletwin: null,
            eagle: null,
            electrocutor: null,
            engineer: null,
            eradicator: null,
            factory: null,
            falcon: null,
            fieldgun: null,
            fighter: null,
            firework: null,
            flankguard: null,
            fortress: null,
            foundry: null,
            gale: null,
            griffin: null,
            gunner: null,
            gunnertrapper: null,
            gyro: null,
            headman: null,
            healer: null,
            helix_ar: null,
            hexatank: null,
            hexatrapper: null,
            hognose: null,
            honcho: null,
            hurler3: null,
            hypercluster: null,
            hyperskimmer: null,
            hyperswarmer: null,
            hypertwister: null,
            jerker: null,
            kicker: null,
            landmine: null,
            launcher: null,
            lever: null,
            levi: null,
            limpet: null,
            lorry: null,
            machinegun: null,
            machinegunner: null,
            manager: null,
            manufacture: null,
            mega3: null,
            mega5: null,
            megaautooverseer: null,
            megaautotriangle: null,
            megaautounderdrive: null,
            megasmasher: null,
            megaspawner: null,
            megaspike: null,
            mingler: null,
            molotov: null,
            nailgun: null,
            necrodrive: null,
            neutron: null,
            nona: null,
            obliterator: null,
            octo: null,
            octotank: null,
            overcheese: null,
            overczar: null,
            overseer: null,
            overstorm: null,
            palisade: null,
            parapet: null,
            penta: null,
            pentadrive: null,
            pentamancer: null,
            phoenix: null,
            physician: null,
            pincer: null,
            pounder: null,
            predator: null,
            prick: null,
            proddrive: null,
            pursuer: null,
            quadruplex: null,
            ream: null,
            redistributor: null,
            rigger: null,
            rocket: null,
            rocketeer: null,
            roller: null,
            septamachine: null,
            septamech: null,
            septatrap: null,
            septatrapper: null,
            shaver: null,
            shopper: null,
            shotgun: null,
            sidewinder: null,
            skidder: null,
            skimmer: null,
            slammer: null,
            sniper: null,
            spawner: null,
            spear: null,
            spike: null,
            spinner: null,
            sprayer: null,
            spread: null,
            stalker: null,
            stomper: null,
            strider: null,
            surfer: null,
            surferdrive: null,
            swarmer: null,
            tempest: null,
            thorn: null,
            topbanana: null,
            toppler: null,
            trapguard: null,
            triangle: null,
            tripleautooverseer: null,
            tripleautotriangle: null,
            tripleautounderdrive: null,
            tripleshot: null,
            triplet: null,
            tripletwin: null,
            triplex: null,
            tritrapper: null,
            twin: null,
            twister: null,
            tyrant: null,
            ultraspawner: null,
            underseer: null,
            vulture: null,
            warlock: null,
            warship: null,
            whirlwind: null,
            wiper: null,
            dps: ["penta","spread","octo","autogunner","triplet","predator","triplex","quadruplex","machinegunner","cyclone","nailgun","gunner","sprayer","redistributor","pincer"],
            dps_ar: ["toppler","crack","autooperator","lorry","manufacture","coli","doublespread","rigger","doubleequalizer","batter4","hurler3","autoauto4","auto7","mega5","nona","septamachine","gale","mingler","automingler","cyclone","nailgun","pincer","octo","penta","spread","triplet","quadruplex","triplex","predator","autogunner","machinegunner","whirlwind","tempest","septamech","palisade"],
            triangle: ["fighter","autotriangle","surfer","eagle","bomber","vulture","phoenix"],
            triangle_ar: ["browser","strider","autobomber","tripleautotriangle","surferdrive","electrocutor","kicker","megaautotriangle","roller","autoeagle","autofighter","griffin"],
            launchers: ["skimmer","twister","swarmer","sidewinder","fieldgun"],
            launchers_ar: ["hyperskimmer","skidder","gyro","hypercluster","coli","molotov","hypertwister","ream","hyperswarmer","spinner","helix_ar","neutron","firework","levi"],
            annies: ["obliterator","compound","wiper","stomper","autoanni","shaver","eradicator","anni","destroyer"],
            drones: ["overczar","tyrant","autooverlord","megaautooverseer","tripleautooverseer","autooverdrive","headman","overcheese","overstorm","overseer","director","cruiser","spawner","directordrive","honcho","manager"],
            necro: ["diviner","autonecro","necrodrive","megaautounderdrive","tripleautounderdrive","pentamancer","pentadrive","warlock","autopentaseer","underseer"],
            carriers: ["warship","battlerdrive","bismarck","proddrive","manufacture","dirigible","autobattleship","autoprod","autocruiserdrive"],
            auto3: ["auto5","mega3","auto6","auto4","auto3"],
            auto3_ar: ["auto6","auto7","mega5","batter4","hurler3","autoauto4"],
            smashers: ["megasmasher","spike","autoshasher","landmine"],
            spikes_ar: ["thorn","megaspike","claymore","spear","prick"],
            crash: ["whirlwind","tempest","septamech","doubleequalizer","rigger","lorry","manufacture","doublespread","palisade"],
            trappers: ["fortress","septatrap","tritrapper","hexatrapper","buchwhacker","gunnertrapper","conqueror","bulwark","parapet","trapguard"],
            builders: ["engineer","assembler","architect"],
            ram: ["rocket","booster","fighter","eagle","phoenix","vulture","surfer","stalker"],
            all: ["anni","architect","assassin","assembler","auto3","auto4","auto5","auto6","auto7","autoanni","autoauto4","autobattleship","autobomber","autocruiserdrive","autoeagle","autofighter","autogunner","automingler","autonecro","autooperator","autooverdrive","autooverlord","autopentaseer","autoprod","autoshasher","autotriangle","banshee","basher","basic","batter4","battlerdrive","bismarck","bomber","booster","browser","buchwhacker","bulwark","chemist","claymore","coli","compound","conqueror","crack","cruiser","cyclone","destroyer","director","directordrive","dirigible","diviner","doubleequalizer","doublespread","doubletwin","eagle","electrocutor","engineer","eradicator","factory","falcon","fieldgun","fighter","firework","flankguard","fortress","foundry","gale","griffin","gunner","gunnertrapper","gyro","headman","healer","helix_ar","hexatank","hexatrapper","hognose","honcho","hurler3","hypercluster","hyperskimmer","hyperswarmer","hypertwister","jerker","kicker","landmine","launcher","lever","levi","limpet","lorry","machinegun","machinegunner","manager","manufacture","mega3","mega5","megaautooverseer","megaautotriangle","megaautounderdrive","megasmasher","megaspawner","megaspike","mingler","molotov","nailgun","necrodrive","neutron","nona","obliterator","octo","octotank","overcheese","overczar","overseer","overstorm","palisade","parapet","penta","pentadrive","pentamancer","phoenix","physician","pincer","pounder","predator","prick","proddrive","pursuer","quadruplex","ream","redistributor","rigger","rocket","rocketeer","roller","septamachine","septamech","septatrap","septatrapper","shaver","shopper","shotgun","sidewinder","skidder","skimmer","slammer","sniper","spawner","spear","spike","spinner","sprayer","spread","stalker","stomper","strider","surfer","surferdrive","swarmer","tempest","thorn","topbanana","toppler","trapguard","triangle","tripleautooverseer","tripleautotriangle","tripleautounderdrive","tripleshot","triplet","tripletwin","triplex","tritrapper","twin","twister","tyrant","ultraspawner","underseer","vulture","warlock","warship","whirlwind","wiper"],
        };

        let connections = SERVERS.map(() => ({ ws: null, verified: false, botCount: 0 }));

        function extLog(msg) {
            const el = document.getElementById('extLogArea');
            if (el) el.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}<br>` + el.innerHTML;
        }

        function extPacketTo(conn, ...args) {
            if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(msgpack.encode(args));
            }
        }

        function updateStatusUI() {
            SERVERS.forEach((s, i) => {
                const el = document.getElementById(`extStatus${i}`);
                if (!el) return;
                const c = connections[i];
                if (!c.ws || c.ws.readyState !== WebSocket.OPEN) {
                    c.verified = false;
                    el.textContent = '❌';
                } else {
                    el.textContent = c.verified ? '✅' : '🔄';
                }
            });
            const total = connections.reduce((a, c) => a + c.botCount, 0);
            const el = document.getElementById('extBotCount');
            if (el) el.textContent = total;
        }

        function connectServer(i) {
            const conn = connections[i];
            if (conn.ws) conn.ws.close();
            conn.ws = new WebSocket(SERVERS[i].url);
            conn.ws.binaryType = "arraybuffer";
            conn.ws.onopen = () => { extPacketTo(conn, "M", 72011); };
            conn.ws.onmessage = (m) => {
                const data = msgpack.decode(new Uint8Array(m.data));
                const type = data.shift();
                if (type === "M") {
                    extPacketTo(conn, "C", data[0] ^ 845);
                    conn.verified = true;
                    updateStatusUI();
                    extLog(`✅ ${SERVERS[i].name} connected!`);
                }
            };
            conn.ws.onclose = () => {
                conn.verified = false;
                updateStatusUI();
                setTimeout(() => connectServer(i), 5000);
            };
            conn.ws.onerror = () => { updateStatusUI(); };
        }

        function extSpawn(count, serverIdx) {
            const hash = (document.getElementById('extServerHash')?.value || '').replace('#','') || location.hash.slice(1) || 'ca3008';
            const tankKey = document.getElementById('extTankSelect')?.value || 'basic';
            const _tv = extTanks[tankKey];
            const tankVal = Array.isArray(_tv) ? _tv : [tankKey];
            const botName = document.getElementById('extBotName')?.value?.trim() || "PR Bot";
            if (serverIdx === 'all') {
                connections.forEach((conn, i) => {
                    if (!conn.verified) { extLog(`${SERVERS[i].name} not connected!`); return; }
                    extPacketTo(conn, "Z", tankVal);
                    extPacketTo(conn, "F", hash, count, botName);
                    conn.botCount += count;
                });
                extLog(`✅ Spawned ${count} on all servers`);
            } else {
                const conn = connections[serverIdx];
                if (!conn.verified) { extLog(`${SERVERS[serverIdx].name} not connected!`); return; }
                extPacketTo(conn, "Z", tankVal);
                extPacketTo(conn, "F", hash, count, botName);
                conn.botCount += count;
                extLog(`✅ Spawned ${count} on ${SERVERS[serverIdx].name}`);
            }
            updateStatusUI();
        }

        function extKill(serverIdx) {
            if (serverIdx === 'all') {
                connections.forEach((conn, i) => {
                    if (!conn.verified) return;
                    extPacketTo(conn, "B");
                    conn.botCount = 0;
                });
                extLog("💀 Killed all bots");
            } else {
                const conn = connections[serverIdx];
                if (!conn.verified) return;
                extPacketTo(conn, "B");
                conn.botCount = 0;
                extLog(`💀 Killed ${SERVERS[serverIdx].name}`);
            }
            updateStatusUI();
        }

        let spinAngle = 0;
        let _extFmCache = null;

        // Cached DOM refs + last-sent state (cuts querySelector spam)
        let _extEls = null;
        function _getExtEls() {
            if (_extEls) return _extEls;
            _extEls = {
                autofire: document.getElementById('extAutofire'),
                holdRmb: document.getElementById('extHoldRmb'),
                feeding: document.getElementById('extFeeding'),
                spin: document.getElementById('extSpin'),
                mbs: document.getElementById('extMbs'),
                noMove: document.getElementById('extNoMove'),
                noAim: document.getElementById('extNoAim'),
                manualMode: document.getElementById('extManualMode'),
                manualX: document.getElementById('extManualX'),
                manualY: document.getElementById('extManualY'),
                sensitivity: document.getElementById('extSensitivity'),
            };
            return _extEls;
        }
        let _lastExtPacket = null;

        function extSendPos() {
            if (connections.every(c => !c.verified)) return;
            try {
                const px = (typeof player !== 'undefined' && player.x) ? player.x : extPlayerX;
                const py = (typeof player !== 'undefined' && player.y) ? player.y : extPlayerY;
                const fov = (typeof globalFov !== 'undefined' && globalFov) ? globalFov : extGameFOV;
                const cx = (typeof center !== 'undefined') ? center.x : innerWidth / 2;
                const cy = (typeof center !== 'undefined') ? center.y : innerHeight / 2;
                const mx = (typeof mouse !== 'undefined') ? mouse.x : extMouseX;
                const my = (typeof mouse !== 'undefined') ? mouse.y : extMouseY;

                const els = _getExtEls();
                const autofire = els.autofire?.checked;
                const holdRmb = els.holdRmb?.checked;
                const feedingMode = els.feeding?.checked;
                const spin = els.spin?.checked;
                const mbs = els.mbs?.checked ? 1 : 0;
                const noMove = els.noMove?.checked;
                const noAim = els.noAim?.checked;
                const manualMode = els.manualMode?.checked;
                const manualPx = parseFloat(els.manualX?.value) || 0;
                const manualPy = parseFloat(els.manualY?.value) || 0;
                const sensitivity = parseFloat(els.sensitivity?.value) || 20;

                const lmbBase = (typeof mouse !== 'undefined' && mouse.buttons) ? (mouse.buttons[0] ? 1 : 0) : (extMouseDown ? 1 : 0);
                const rmbBase = (typeof mouse !== 'undefined' && mouse.buttons) ? (mouse.buttons[2] ? 1 : 0) : (extRMouseDown ? 1 : 0);

                // Block lmb while feeding so bots don't shoot you mid-feed
                const lmb = feedingMode ? 0 : (autofire ? 1 : lmbBase);
                const rmb = (holdRmb || feedingMode) ? 1 : rmbBase;
                const feeding = 0; // don't use feed flag, use rMouseDown instead

                // Spin angle update
                if (spin) spinAngle += 0.15;

                // Formation offset calculation (from message script)
                const verifiedConns = connections.filter(c => c.verified);
                const n = verifiedConns.length;
                const fmEnabled = formationConfig.enabled && n > 1 && !manualMode && !noMove;
                let fmOffsets = null;
                if (fmEnabled) {
                    const sp = formationConfig.spacing || 60;
                    const typ = formationConfig.type;
                    const scaledDist = sp / 10;

                    // Aim direction unit vector
                    let aimUx = 1, aimUy = 0;
                    const aimDx = mx - cx, aimDy = my - cy;
                    const aimLen = Math.hypot(aimDx, aimDy);
                    if (aimLen > 0.001) { aimUx = aimDx / aimLen; aimUy = aimDy / aimLen; }

                    const dirChanged = !_extFmCache || Math.abs(aimUx - (_extFmCache.ux||0)) > 0.05 || Math.abs(aimUy - (_extFmCache.uy||0)) > 0.05;
                    if (!_extFmCache || _extFmCache.n !== n || _extFmCache.sp !== sp || _extFmCache.typ !== typ || dirChanged) {
                        _extFmCache = {
                            n, sp, typ, ux: aimUx, uy: aimUy,
                            offsets: Array.from({ length: n }, (_, i) => {
                                const index = i + 1;
                                switch (typ) {
                                    case 'line_front':  return { dx:  aimUx * (scaledDist * index), dy:  aimUy * (scaledDist * index) };
                                    case 'line_behind': return { dx: -aimUx * (scaledDist * index), dy: -aimUy * (scaledDist * index) };
                                    case 'line_top':    return { dx:  aimUy * (scaledDist * index), dy: -aimUx * (scaledDist * index) };
                                    case 'line_bottom': return { dx: -aimUy * (scaledDist * index), dy:  aimUx * (scaledDist * index) };
                                    case 'circle':      { const r = scaledDist + (n * 0.5); const ang = (Math.PI * 2 / n) * index; return { dx: Math.cos(ang) * r, dy: Math.sin(ang) * r }; }
                                    default:            return { dx: 0, dy: 0 };
                                }
                            })
                        };
                    }
                    fmOffsets = _extFmCache.offsets;
                } else {
                    _extFmCache = null;
                }

                verifiedConns.forEach((c, ci) => {
                    setTimeout(() => {
                        let mwx, mwy;
                        if (spin) {
                            const jitter = (Math.random() - 0.5) * 0.1;
                            mwx = Math.cos(spinAngle + jitter) * fov * 0.8;
                            mwy = Math.sin(spinAngle + jitter) * fov * 0.8;
                        } else {
                            const jitterX = (Math.random() - 0.5) * 0.8;
                            const jitterY = (Math.random() - 0.5) * 0.8;
                            const aimScale = sensitivity / 20;
                            mwx = ((mx - cx) / cx * fov + jitterX) * aimScale;
                            mwy = ((my - cy) / cy * fov * (innerHeight / innerWidth) + jitterY) * aimScale;
                        }
                        const offsetX = noMove ? 0 : (Math.random() - 0.5) * 3;
                        const offsetY = noMove ? 0 : (Math.random() - 0.5) * 3;
                        let finalPx, finalPy;
                        if (manualMode) {
                            finalPx = manualPx;
                            finalPy = manualPy;
                        } else if (noMove) {
                            finalPx = px;
                            finalPy = py;
                        } else if (fmEnabled && fmOffsets && fmOffsets[ci]) {
                            finalPx = px + fmOffsets[ci].dx + offsetX;
                            finalPy = py + fmOffsets[ci].dy + offsetY;
                        } else {
                            finalPx = px + offsetX;
                            finalPy = py + offsetY;
                        }
                        const finalMwx = noAim ? 0 : mwx;
                        const finalMwy = noAim ? 0 : mwy;

                        extPacketTo(c, "A",
                            finalPx, finalPy,
                            finalMwx, finalMwy,
                            lmb, rmb,
                            mbs, feeding,
                            0,
                            autofire ? 1 : 0,
                            spin ? 1 : 0,
                            manualMode ? 1 : 0,
                            manualPx, manualPy,
                            noMove ? 1 : 0,
                            noAim ? 1 : 0
                        );
                    }, Math.random() * 40);
                });
            } catch(e) {
                connections.forEach(c => extPacketTo(c, "A", 0, 0, 0, 0, 0, 0, 1, 0, 0));
            }
        }

        function scheduleNextUpdate() {
            const els = _extEls || _getExtEls();
            // Adaptive: No Move = slow; many connections = slightly slower to avoid flood
            const n = connections.filter(c => c.verified).length;
            let base = 200;
            if (els.noMove?.checked) base = 500;
            else if (n >= 4) base = 250;
            else if (n >= 2) base = 220;
            setTimeout(() => {
                extSendPos();
                scheduleNextUpdate();
            }, base + Math.random() * 40);
        }

        // Hook strokeText for coordinates
        const _origST = CanvasRenderingContext2D.prototype.strokeText;
        CanvasRenderingContext2D.prototype.strokeText = function(...args) {
            if (args[0] && args[0].includes("Coordinates: (")) {
                try {
                    const m = args[0].match(/Coordinates: \(([^)]+)\)/);
                    if (m) { const p = m[1].split(", "); extPlayerX = parseFloat(p[0]); extPlayerY = parseFloat(p[1]); }
                } catch(e) {}
            }
            return _origST.apply(this, args);
        };

        document.addEventListener("mousemove", e => { extMouseX = e.clientX; extMouseY = e.clientY; });
        document.addEventListener("mousedown", e => { if (e.button === 0) extMouseDown = true; if (e.button === 2) extRMouseDown = true; });
        document.addEventListener("mouseup", e => { if (e.button === 0) extMouseDown = false; if (e.button === 2) extRMouseDown = false; });

        setInterval(updateStatusUI, 2000);
        scheduleNextUpdate();
        SERVERS.forEach((s, i) => connectServer(i));

        function wireExtBots() {
            document.getElementById('extTankSearch')?.addEventListener('input', () => {
                const q = document.getElementById('extTankSearch').value.toLowerCase();
                const select = document.getElementById('extTankSelect');
                Array.from(select.options).forEach(opt => {
                    opt.style.display = opt.text.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q) ? '' : 'none';
                });
            });
            document.getElementById('extChatSend')?.addEventListener('click', () => {
                const msg = document.getElementById('extChatMsg')?.value?.trim();
                if (!msg) return;
                connections.forEach(c => { if (c.verified) extPacketTo(c, "T", msg, false); });
                extLog(`💬 Sent: ${msg}`);
            });
            document.getElementById('extChatSpam')?.addEventListener('click', () => {
                const msg = document.getElementById('extChatMsg')?.value?.trim();
                if (!msg) return;
                connections.forEach(c => { if (c.verified) extPacketTo(c, "T", msg, true); });
                extLog(`🔁 Spam ON: ${msg}`);
            });
            document.getElementById('extChatStop')?.addEventListener('click', () => {
                connections.forEach(c => { if (c.verified) extPacketTo(c, "T", "", false); });
                extLog('🛑 Spam stopped');
            });
            document.getElementById('extSpawnCustom')?.addEventListener('click', () => {
                const count = parseInt(document.getElementById('extCustomCount')?.value) || 50;
                extSpawn(count, 'all');
            });
            document.getElementById('extReconnectAll')?.addEventListener('click', () => { SERVERS.forEach((s, i) => connectServer(i)); });
            document.getElementById('extSpawnAll1')?.addEventListener('click', () => extSpawn(1, 'all'));
            document.getElementById('extSpawnAll5')?.addEventListener('click', () => extSpawn(5, 'all'));
            document.getElementById('extSpawnAll10')?.addEventListener('click', () => extSpawn(10, 'all'));
            document.getElementById('extSpawnAll20')?.addEventListener('click', () => extSpawn(20, 'all'));
            document.getElementById('extSpawnAll30')?.addEventListener('click', () => extSpawn(30, 'all'));
            document.getElementById('extSpawnAll35')?.addEventListener('click', () => extSpawn(35, 'all'));
            document.getElementById('extKillAll')?.addEventListener('click', () => extKill('all'));
            document.getElementById('extSpawn1s1')?.addEventListener('click', () => extSpawn(1, 0));
            document.getElementById('extSpawn5s1')?.addEventListener('click', () => extSpawn(5, 0));
            document.getElementById('extSpawn10s1')?.addEventListener('click', () => extSpawn(10, 0));
            document.getElementById('extKill1')?.addEventListener('click', () => extKill(0));
            document.getElementById('extSpawn1s2')?.addEventListener('click', () => extSpawn(1, 1));
            document.getElementById('extSpawn5s2')?.addEventListener('click', () => extSpawn(5, 1));
            document.getElementById('extSpawn10s2')?.addEventListener('click', () => extSpawn(10, 1));
            document.getElementById('extKill2')?.addEventListener('click', () => extKill(1));
            document.getElementById('extSpawn1s3')?.addEventListener('click', () => extSpawn(1, 2));
            document.getElementById('extSpawn5s3')?.addEventListener('click', () => extSpawn(5, 2));
            document.getElementById('extSpawn10s3')?.addEventListener('click', () => extSpawn(10, 2));
            document.getElementById('extKill3')?.addEventListener('click', () => extKill(2));
            document.getElementById('extSpawn1s4')?.addEventListener('click', () => extSpawn(1, 3));
            document.getElementById('extSpawn5s4')?.addEventListener('click', () => extSpawn(5, 3));
            document.getElementById('extSpawn10s4')?.addEventListener('click', () => extSpawn(10, 3));
            document.getElementById('extKill4')?.addEventListener('click', () => extKill(3));
            document.getElementById('extSpawn1s5')?.addEventListener('click', () => extSpawn(1, 4));
            document.getElementById('extSpawn5s5')?.addEventListener('click', () => extSpawn(5, 4));
            document.getElementById('extSpawn10s5')?.addEventListener('click', () => extSpawn(10, 4));
            document.getElementById('extKill5')?.addEventListener('click', () => extKill(4));
            document.getElementById('extSpawn1s6')?.addEventListener('click', () => extSpawn(1, 5));
            document.getElementById('extSpawn5s6')?.addEventListener('click', () => extSpawn(5, 5));
            document.getElementById('extSpawn10s6')?.addEventListener('click', () => extSpawn(10, 5));
            document.getElementById('extKill6')?.addEventListener('click', () => extKill(5));
            document.getElementById('extTankSelect')?.addEventListener('change', () => {
                const tankKey = document.getElementById('extTankSelect').value;
                const _tv2 = extTanks[tankKey];
                const tankVal = Array.isArray(_tv2) ? _tv2 : [tankKey];
                connections.forEach(c => { if (c.verified) extPacketTo(c, "Z", tankVal); });
            });

            // Aim smoothing slider
            const extSens = document.getElementById('extSensitivity');
            const extSensVal = document.getElementById('extSensitivityValue');
            if (extSens && extSensVal) {
                extSens.addEventListener('input', () => { extSensVal.textContent = extSens.value; });
            }

            // Manual coords mode toggle
            const extManualMode = document.getElementById('extManualMode');
            const extManualSection = document.getElementById('extManualCoordsSection');
            if (extManualMode && extManualSection) {
                extManualMode.addEventListener('change', () => {
                    extManualSection.style.display = extManualMode.checked ? 'block' : 'none';
                });
            }

            // Formation toggle + sync to formationConfig
            const extFmEnabled = document.getElementById('extFormationEnabled');
            const extFmSection = document.getElementById('extFormationSection');
            const extFmType = document.getElementById('extFormationType');
            const extFmSpacing = document.getElementById('extFormationSpacing');
            const extFmSpacingVal = document.getElementById('extFormationSpacingVal');

            // Init UI from existing formationConfig state
            if (extFmEnabled) extFmEnabled.checked = formationConfig.enabled;
            if (extFmSection) extFmSection.style.display = formationConfig.enabled ? 'block' : 'none';
            if (extFmType) extFmType.value = formationConfig.type;
            if (extFmSpacing) extFmSpacing.value = formationConfig.spacing;
            if (extFmSpacingVal) extFmSpacingVal.textContent = formationConfig.spacing;

            extFmEnabled?.addEventListener('change', () => {
                formationConfig.enabled = extFmEnabled.checked;
                if (extFmSection) extFmSection.style.display = extFmEnabled.checked ? 'block' : 'none';
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });
            extFmType?.addEventListener('change', () => {
                formationConfig.type = extFmType.value;
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });
            extFmSpacing?.addEventListener('input', () => {
                formationConfig.spacing = parseInt(extFmSpacing.value);
                if (extFmSpacingVal) extFmSpacingVal.textContent = extFmSpacing.value;
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });

        }

        setTimeout(wireExtBots, 2000);
    })();

        window._test = events;

    // Receive macro commands broadcast from parent tab
    window.addEventListener('storage', (e) => {
        if (e.key === 'botCommand') {
            try {
                const cmd = JSON.parse(e.newValue);
                if (cmd && cmd.type === 'upgrade' && window.__is_bot) {
                    performMacroUpgrade(cmd.macro);
                }
            } catch(err) {}
        }
    });
}

if (checkAuth()) {
    initCheatScript();
} else {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showAuthModal);
    } else {
        showAuthModal();
    }
}