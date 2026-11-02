/**
 * CertChain - Public Certificate Verification Engine
 * Integrates with Ethers.js and smart contract with seamless simulation fallback.
 */

document.addEventListener("DOMContentLoaded", () => {
    initVerificationEnvironment();
    setupEventListeners();
});

let isLiveContract = false;

function initVerificationEnvironment() {
    const pill = document.getElementById("networkStatus");
    if (!pill) return;

    if (CONFIG.CONTRACT_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(CONFIG.CONTRACT_ADDRESS)) {
        isLiveContract = true;
        pill.className = "status-pill connected";
        pill.innerHTML = `<span class="status-dot"></span> Live Contract Connected`;
    } else {
        isLiveContract = false;
        pill.className = "status-pill demo";
        pill.innerHTML = `<span class="status-dot"></span> Demo Simulation Mode`;
    }
}

function setupEventListeners() {
    // Quick sample chips
    const chips = document.querySelectorAll(".chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            const certId = chip.getAttribute("data-id");
            const input = document.getElementById("certificateId");
            if (input) {
                input.value = certId;
                verifyCertificate();
            }
        });
    });

    // Enter key triggers verification
    const input = document.getElementById("certificateId");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                verifyCertificate();
            }
        });
    }
}

async function verifyCertificate() {
    const input = document.getElementById("certificateId");
    const resultBox = document.getElementById("result");
    const verifyBtn = document.getElementById("verifyBtn");

    if (!input || !resultBox) return;

    const certId = input.value.trim();
    if (!certId) {
        resultBox.innerHTML = `
            <div class="result-card result-revoked" style="margin-top: 1rem;">
                <p style="color: var(--danger); font-weight: 600;">Please enter a Certificate ID to verify.</p>
            </div>
        `;
        return;
    }

    // Set loading UI
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = `<span class="spinner"></span> Verifying...`;
    }

    resultBox.innerHTML = `
        <div class="result-card" style="background: #f8fafc; border-color: var(--border); text-align: center; padding: 2rem;">
            <span class="spinner" style="border-color: var(--primary); border-bottom-color: transparent; width: 28px; height: 28px;"></span>
            <p style="margin-top: 1rem; color: var(--text-secondary); font-weight: 500;">
                Querying decentralized ledger for Certificate ID: <b>${escapeHtml(certId)}</b>...
            </p>
        </div>
    `;

    try {
        let certData = null;

        // 1. Try On-Chain Verification if live contract address exists
        if (isLiveContract && typeof window.ethers !== "undefined") {
            try {
                let provider;
                if (window.ethereum) {
                    provider = new ethers.BrowserProvider(window.ethereum);
                } else {
                    provider = new ethers.JsonRpcProvider(CONFIG.NETWORK.RPC_URL);
                }

                const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, provider);
                const data = await contract.verifyCertificate(certId);

                certData = {
                    candidateName: data[0],
                    courseName: data[1],
                    orgName: data[2],
                    ipfsHash: data[3],
                    issueDate: Number(data[4]),
                    isValid: data[5],
                    revokeReason: data[6],
                    source: "Live Sepolia Ledger"
                };
            } catch (chainErr) {
                console.warn("Contract call returned error, checking local store / simulation:", chainErr);
            }
        }

        // 2. Check local dynamic storage (issued certificates from issuer portal)
        if (!certData) {
            const localIssued = localStorage.getItem("certchain_cert_" + certId);
            if (localIssued) {
                certData = JSON.parse(localIssued);
                certData.source = "Local Simulated Ledger";
            }
        }

        // 3. Fallback to predefined demo certificates
        if (!certData && CONFIG.DEMO_CERTIFICATES && CONFIG.DEMO_CERTIFICATES[certId]) {
            certData = { ...CONFIG.DEMO_CERTIFICATES[certId], source: "Demo Ledger (Sample)" };
        }

        // Render result based on verification data
        if (!certData) {
            renderNotFound(certId);
        } else if (certData.isValid) {
            renderValidCertificate(certId, certData);
        } else {
            renderRevokedCertificate(certId, certData);
        }

    } catch (err) {
        console.error("Verification error:", err);
        resultBox.innerHTML = `
            <div class="result-card result-revoked">
                <div class="result-badge badge-revoked">Verification Error</div>
                <p>An unexpected error occurred while verifying: ${escapeHtml(err.message || String(err))}</p>
            </div>
        `;
    } finally {
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Verify Certificate
            `;
        }
    }
}

function renderValidCertificate(certId, data) {
    const resultBox = document.getElementById("result");
    const formattedDate = new Date(data.issueDate * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const ipfsDisplay = data.ipfsHash ? `
        <div class="cert-label">IPFS CID:</div>
        <div class="cert-value">
            <a href="https://ipfs.io/ipfs/${escapeHtml(data.ipfsHash)}" target="_blank" style="color: var(--primary); font-family: monospace;">
                ${escapeHtml(data.ipfsHash)} ↗
            </a>
        </div>
    ` : "";

    resultBox.innerHTML = `
        <div class="result-card result-valid">
            <div class="result-badge badge-valid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Cryptographically Verified &amp; Authentic
            </div>

            <h2 style="color: #166534; font-size: 1.35rem; margin-bottom: 0.25rem;">${escapeHtml(data.candidateName)}</h2>
            <p style="color: #15803d; font-size: 0.95rem; font-weight: 500;">${escapeHtml(data.courseName)}</p>

            <div class="cert-grid">
                <div class="cert-label">Certificate ID:</div>
                <div class="cert-value"><b>${escapeHtml(certId)}</b></div>

                <div class="cert-label">Student Name:</div>
                <div class="cert-value">${escapeHtml(data.candidateName)}</div>

                <div class="cert-label">Degree / Program:</div>
                <div class="cert-value">${escapeHtml(data.courseName)}</div>

                <div class="cert-label">Issuing Body:</div>
                <div class="cert-value">${escapeHtml(data.orgName)}</div>

                <div class="cert-label">Issue Date:</div>
                <div class="cert-value">${formattedDate}</div>

                <div class="cert-label">Ledger Status:</div>
                <div class="cert-value" style="color: var(--success); font-weight: 600;">
                    ✓ Immutable (${escapeHtml(data.source || "Blockchain")})
                </div>

                ${ipfsDisplay}
            </div>

            <div class="result-actions">
                <button type="button" class="btn btn-primary" onclick="window.print()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print / Save PDF
                </button>
            </div>
        </div>
    `;
}

function renderRevokedCertificate(certId, data) {
    const resultBox = document.getElementById("result");
    resultBox.innerHTML = `
        <div class="result-card result-revoked">
            <div class="result-badge badge-revoked">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Warning: Certificate Revoked
            </div>

            <h2 style="color: #991b1b; font-size: 1.35rem; margin-bottom: 0.25rem;">${escapeHtml(data.candidateName)}</h2>
            <p style="color: #b91c1c; font-size: 0.95rem;">${escapeHtml(data.courseName)}</p>

            <div class="cert-grid">
                <div class="cert-label">Certificate ID:</div>
                <div class="cert-value"><b>${escapeHtml(certId)}</b></div>

                <div class="cert-label">Institution:</div>
                <div class="cert-value">${escapeHtml(data.orgName)}</div>

                <div class="cert-label">Revocation Reason:</div>
                <div class="cert-value" style="color: var(--danger); font-weight: 600;">
                    ${escapeHtml(data.revokeReason || "No reason specified by issuing authority")}
                </div>

                <div class="cert-label">Ledger Status:</div>
                <div class="cert-value" style="color: var(--danger); font-weight: 600;">
                    INVALIDATED / REVOKED
                </div>
            </div>
        </div>
    `;
}

function renderNotFound(certId) {
    const resultBox = document.getElementById("result");
    resultBox.innerHTML = `
        <div class="result-card" style="background: #fffbeb; border-color: #fde68a;">
            <div class="result-badge" style="background: #fef3c7; color: #b45309;">
                Certificate Not Found
            </div>
            <h3 style="color: #92400e; margin-top: 0.5rem; font-size: 1.15rem;">No Record Found on Ledger</h3>
            <p style="color: #78350f; font-size: 0.92rem; margin-top: 0.4rem;">
                No academic credential matching Certificate ID <b>${escapeHtml(certId)}</b> has been registered on this blockchain registry.
            </p>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.6rem;">
                Tip: Try one of the sample IDs above (e.g. <code>BCA2026-001</code>) to inspect valid credential verification.
            </p>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
