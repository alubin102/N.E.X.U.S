const SEQUENCES = [
    { label: 'INIT SYSTÈME',         msg: 'Initialisation des protocoles de sécurité...',  duration: 180 },
    { label: 'AUTH NIVEAU 5',         msg: 'Vérification des accréditations opérateur...',  duration: 160 },
    { label: 'ACCÈS BASE DE DONNÉES', msg: 'Connexion aux serveurs NEXUS — chiffrement AES-256...', duration: 200 },
    { label: 'CHARGEMENT AGENTS',     msg: 'Récupération des dossiers classifiés (1 247 entrées)...', duration: 240 },
    { label: 'DÉCHIFFREMENT',         msg: 'Déchiffrement des profils biométriques...', duration: 190 },
    { label: 'SYNCHRONISATION',       msg: 'Synchronisation index opérationnel...', duration: 160 },
    { label: 'CALIBRATION',           msg: 'Calibrage des capteurs — validation intégrité données...', duration: 140 },
    { label: 'SYSTÈME EN LIGNE',      msg: 'NEXUS opérationnel — accès autorisé.', duration: 80 },
];

const CSS = `
#nexus-boot {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: #04090e;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    font-family: 'Space Grotesk', 'Trebuchet MS', monospace;
}

#nexus-boot::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0,0,0,0.12) 3px,
        rgba(0,0,0,0.12) 4px
    );
}

.nb-inner {
    position: relative;
    z-index: 2;
    width: min(520px, 88vw);
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
}

.nb-brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nb-title {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(2.8rem, 7vw, 4rem);
    letter-spacing: 0.32em;
    color: #7ccc5a;
    line-height: 1;
    text-shadow: 0 0 28px rgba(124,204,90,0.45);
}

.nb-subtitle {
    font-size: 0.68rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #4a7a48;
}

.nb-hero-image {
    width: 180px;
    height: 240px;
    margin: 0 auto;
    border: 2px solid rgba(124,204,90,0.4);
    overflow: hidden;
    background: rgba(124,204,90,0.05);
    position: relative;
    box-shadow: 0 0 16px rgba(124,204,90,0.2), inset 0 0 16px rgba(124,204,90,0.1);
}

.nb-hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
}

.nb-bar-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nb-bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.nb-seq-label {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7ccc5a;
    font-weight: 700;
}

.nb-pct {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: #7ccc5a;
}

.nb-bar-wrap {
    width: 100%;
    height: 16px;
    background: rgba(124,204,90,0.07);
    border: 1px solid rgba(124,204,90,0.28);
    overflow: hidden;
    position: relative;
}

.nb-bar-fill {
    height: 100%;
    width: 0%;
    background: repeating-linear-gradient(
        60deg,
        #4a9632 0, #4a9632 9px,
        #3a7828 9px, #3a7828 18px
    );
    transition: width 0.08s linear;
    position: relative;
}

.nb-bar-fill::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 6px; height: 100%;
    background: #9de87a;
    opacity: 0.8;
    box-shadow: 0 0 8px #7ccc5a;
}

.nb-bar-segments {
    position: absolute;
    inset: 0;
    display: flex;
    pointer-events: none;
}

.nb-seg {
    flex: 1;
    border-right: 1px solid rgba(4,9,14,0.5);
}

.nb-log-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.nb-log {
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    color: #4a7a48;
    min-height: 4.5em;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 3px;
}

.nb-log-line {
    display: flex;
    gap: 6px;
    animation: nb-fadein 0.2s ease both;
}

.nb-log-prefix {
    color: rgba(124,204,90,0.4);
    flex-shrink: 0;
}

.nb-log-text {
    color: #5a8a58;
}

.nb-log-line.nb-ok .nb-log-text {
    color: #5adc9e;
}

.nb-cursor {
    display: inline-block;
    width: 7px; height: 0.85em;
    background: #7ccc5a;
    vertical-align: middle;
    margin-left: 2px;
    animation: nb-blink 0.7s step-end infinite;
}

.nb-status-row {
    display: flex;
    gap: 1.6rem;
    border-top: 1px solid rgba(124,204,90,0.15);
    padding-top: 0.9rem;
}

.nb-stat {
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3a6a38;
}

.nb-stat strong {
    color: #7ccc5a;
    font-weight: 700;
    display: block;
    font-size: 0.78rem;
    margin-top: 2px;
}

#nexus-boot.nb-done {
    animation: nb-fadeout 0.6s ease forwards;
}

@keyframes nb-fadein {
    from { opacity: 0; transform: translateX(-4px); }
    to   { opacity: 1; transform: translateX(0); }
}

@keyframes nb-blink {
    50% { opacity: 0; }
}

@keyframes nb-fadeout {
    0%   { opacity: 1; }
    100% { opacity: 0; pointer-events: none; }
}

@media (max-width: 480px) {
    .nb-inner { gap: 1.4rem; }
    .nb-title { font-size: 2.4rem; letter-spacing: 0.22em; }
    .nb-subtitle { letter-spacing: 0.12em; }
    .nb-status-row { gap: 1rem; }
}
`;

function buildLoader() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.id = 'nexus-boot';
    el.innerHTML = `
        <div class="nb-inner">
            <div class="nb-brand">
                <div class="nb-title">N.E.X.U.S.</div>
                <div class="nb-subtitle">Network of Enhanced eXpert Unified Systems</div>
            </div>

            <div class="nb-bar-section">
                <div class="nb-bar-header">
                    <span class="nb-seq-label" id="nb-seq-label">INIT SYSTÈME</span>
                    <span class="nb-pct" id="nb-pct">0%</span>
                </div>
                <div class="nb-bar-wrap">
                    <div class="nb-bar-fill" id="nb-fill"></div>
                    <div class="nb-bar-segments" id="nb-segs"></div>
                </div>
            </div>

            <div class="nb-log-section">
                <div class="nb-log" id="nb-log">
                    <div class="nb-log-line">
                        <span class="nb-log-prefix">&gt;</span>
                        <span class="nb-log-text">En attente de connexion...<span class="nb-cursor"></span></span>
                    </div>
                </div>
            </div>

            <div class="nb-status-row">
                <div class="nb-stat">Protocole<strong id="nb-proto">—</strong></div>
                <div class="nb-stat">Agents indexés<strong id="nb-agents">—</strong></div>
                <div class="nb-stat">Statut<strong id="nb-status">EN ATTENTE</strong></div>
            </div>
        </div>
    `;

    // Build bar segments
    const segsEl = el.querySelector('#nb-segs');
    SEQUENCES.forEach(() => {
        const s = document.createElement('div');
        s.className = 'nb-seg';
        segsEl.appendChild(s);
    });

    document.body.prepend(el);
    return el;
}

function runSequence(el, seqIdx, globalPctStart, resolve) {
    if (seqIdx >= SEQUENCES.length) {
        resolve();
        return;
    }

    const seq = SEQUENCES[seqIdx];
    const globalPctEnd = 100 * (seqIdx + 1) / SEQUENCES.length;
    const increment = (globalPctEnd - globalPctStart) / 10;
    const steps = 8;
    const stepDelay = seq.duration / steps;

    document.getElementById('nb-seq-label').textContent = seq.label;
    document.getElementById('nb-status').textContent = seq.label;

    const logEl = document.getElementById('nb-log');
    const logLine = document.createElement('div');
    logLine.className = 'nb-log-line nb-ok';
    logLine.innerHTML = `<span class="nb-log-prefix">&gt;</span><span class="nb-log-text">${seq.msg}</span>`;
    logEl.appendChild(logLine);

    let step = 0;
    let pct = globalPctStart;
    const t = setInterval(() => {
        step++;
        pct = Math.min(globalPctStart + increment * step, globalPctEnd);
        document.getElementById('nb-fill').style.width = pct + '%';
        document.getElementById('nb-pct').textContent = Math.round(pct) + '%';

        if (step >= steps) {
            clearInterval(t);
            setTimeout(() => {
                runSequence(el, seqIdx + 1, globalPctEnd, resolve);
            }, 80);
        }
    }, stepDelay);
}

export function runLoader() {
    return new Promise(resolve => {
        const el = buildLoader();
        runSequence(el, 0, 0, () => {
            setTimeout(() => {
                el.classList.add('nb-done');
                setTimeout(() => {
                    el.remove();
                    resolve();
                }, 650);
            }, 400);
        });
    });
}

export function showLoader(sequences = SEQUENCES, title = 'N.E.X.U.S.', duration = 0, heroImage = null) {
    return new Promise(resolve => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const el = document.createElement('div');
        el.id = 'nexus-boot';
        el.innerHTML = `
            <div class="nb-inner">
                <div class="nb-brand">
                    <div class="nb-title">${title}</div>
                </div>
                ${heroImage ? `<div class="nb-hero-image"><img src="${heroImage}" alt=""></div>` : ''}
                <div class="nb-bar-section">
                    <div class="nb-bar-header">
                        <span class="nb-seq-label" id="nb-seq-label">Chargement...</span>
                        <span class="nb-pct" id="nb-pct">0%</span>
                    </div>
                    <div class="nb-bar-wrap">
                        <div class="nb-bar-fill" id="nb-fill"></div>
                        <div class="nb-bar-segments" id="nb-segs"></div>
                    </div>
                </div>
            </div>
        `;

        const segsEl = el.querySelector('#nb-segs');
        sequences.forEach(() => {
            const s = document.createElement('div');
            s.className = 'nb-seg';
            segsEl.appendChild(s);
        });

        document.body.prepend(el);

        let seqIdx = 0;
        const nextStep = (seqIdx, globalPctEnd) => {
            if (seqIdx >= sequences.length) {
                setTimeout(() => {
                    el.classList.add('nb-done');
                    setTimeout(() => {
                        el.remove();
                        resolve();
                    }, 650);
                }, 400);
                return;
            }

            const seq = sequences[seqIdx];
            const globalPctStart = 100 * seqIdx / sequences.length;
            const increment = (globalPctEnd - globalPctStart) / 10;
            const steps = 8;
            const stepDelay = seq.duration / steps;

            document.getElementById('nb-seq-label').textContent = seq.label;

            let step = 0;
            let pct = globalPctStart;
            const t = setInterval(() => {
                step++;
                pct = Math.min(globalPctStart + increment * step, globalPctEnd);
                document.getElementById('nb-fill').style.width = pct + '%';
                document.getElementById('nb-pct').textContent = Math.round(pct) + '%';

                if (step >= steps) {
                    clearInterval(t);
                    setTimeout(() => {
                        nextStep(seqIdx + 1, globalPctEnd);
                    }, 80);
                }
            }, stepDelay);
        };

        nextStep(0, 0);
    });
}
