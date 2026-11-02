/**
 * CertChain - University Issuer & Administration Engine
 * Handles wallet authentication, on-chain credential minting, and certificate revocation.
 */

let provider = null;
let signer = null;
let userAddress = null;
let isConnected = false;

document.addEventListener("DOMContentLoaded", async () => {
    initIssuerStatus();

    // Auto-detect existing wallet authorization
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (e) {
            console.log("No pre-existing wallet connection:", e);
        }
    }
});

function initIssuerStatus() {
    const pill = document.getElementById("networkStatus");
    if (!pill) return;

    if (CONFIG.CONTRACT_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(CONFIG.CONTRACT_ADDRESS)) {
        pill.className = "status-pill connected";
        pill.innerHTML = `<span class="status-dot"></span> Contract Configured (Sepolia)`;
    } else {
        pill.className = "status-pill demo";
        pill.innerHTML = `<span class="status-dot"></span> Demo Simulation Mode`;
    }
}

async function connectWallet() {
    const btnText = document.getElementById("walletBtnText");
    const banner = document.getElementById("walletBanner");
    const accountDisplay = document.getElementById("connectedAccount");
    const networkDisplay = document.getElementById("connectedNetwork");
    const pill = document.getElementById("networkStatus");

    if (!window.ethereum) {
        alert("MetaMask wallet extension is not detected. The portal will operate in Demo Mode.");
        return;
    }

    try {
        btnText.innerText = "Connecting...";
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        userAddress = accounts[0];
        signer = await provider.getSigner();

        const network = await provider.getNetwork();
        if (network.chainId !== 11155111n) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: CONFIG.NETWORK.CHAIN_ID }]
                });
            } catch (switchErr) {
                console.warn("Could not auto-switch network:", switchErr);
            }
        }

        isConnected = true;
        btnText.innerText = `Connected (${userAddress.slice(0, 6)}...${userAddress.slice(-4)})`;
        if (banner) banner.style.display = "flex";
        if (accountDisplay) accountDisplay.innerText = userAddress;
        if (networkDisplay) networkDisplay.innerText = "Ethereum Sepolia (ChainID: 11155111)";

        if (pill) {
            pill.className = "status-pill connected";
            pill.innerHTML = `<span class="status-dot"></span> Wallet Connected`;
        }

    } catch (err) {
        console.error("Wallet connection failed:", err);
        btnText.innerText = "Connect Wallet";
        alert("Wallet connection failed: " + (err.message || String(err)));
    }
}

function switchTab(tab) {
    const issueSec = document.getElementById("issueSection");
    const revokeSec = document.getElementById("revokeSection");
    const tabIssueBtn = document.getElementById("tabIssueBtn");
    const tabRevokeBtn = document.getElementById("tabRevokeBtn");
    const txResult = document.getElementById("txResult");

    if (txResult) txResult.innerHTML = "";

    if (tab === "issue") {
        issueSec.style.display = "block";
        revokeSec.style.display = "none";
        tabIssueBtn.className = "btn btn-primary";
        tabRevokeBtn.className = "btn btn-outline";
    } else {
        issueSec.style.display = "none";
        revokeSec.style.display = "block";
        tabIssueBtn.className = "btn btn-outline";
        tabRevokeBtn.className = "btn btn-primary";
    }
}

async function handleIssueCertificate() {
    const certId = document.getElementById("certId").value.trim();
    const studentName = document.getElementById("studentName").value.trim();
    const course = document.getElementById("course").value.trim();
    const institution = document.getElementById("institution").value.trim();
    const ipfsHash = document.getElementById("ipfsHash").value.trim();

    const submitBtn = document.getElementById("issueSubmitBtn");
    const txResult = document.getElementById("txResult");

    if (!certId || !studentName || !course || !institution) {
        alert("Please fill in all mandatory fields (*)");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Processing Issuance...`;

    try {
        const hasLiveContract = isConnected && CONFIG.CONTRACT_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(CONFIG.CONTRACT_ADDRESS);

        if (hasLiveContract) {
            // Live Blockchain Transaction via MetaMask Signer
            txResult.innerHTML = `
                <div class="result-card" style="background: #eff6ff; border-color: #bfdbfe;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span class="spinner" style="border-color: var(--primary); border-bottom-color: transparent;"></span>
                        <div>
                            <b>Please confirm the transaction in MetaMask</b>
                            <p style="font-size: 0.85rem; color: #1e40af;">Anchoring ${escapeHtml(certId)} onto the blockchain...</p>
                        </div>
                    </div>
                </div>
            `;

            const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, signer);
            const tx = await contract.issueCertificate(certId, studentName, course, institution, ipfsHash);

            txResult.innerHTML = `
                <div class="result-card" style="background: #eff6ff; border-color: #bfdbfe;">
                    <h4 style="color: #1e40af;">Transaction Broadcasted!</h4>
                    <p style="font-size: 0.9rem; margin-top: 0.35rem;">
                        Tx Hash: <a href="${CONFIG.NETWORK.EXPLORER_URL}/tx/${tx.hash}" target="_blank" style="color: var(--primary); font-family: monospace;">${tx.hash} ↗</a>
                    </p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.4rem;">
                        <span class="spinner" style="width: 12px; height: 12px; border-color: var(--primary); border-bottom-color: transparent; margin-right: 4px;"></span>
                        Awaiting block confirmation...
                    </p>
                </div>
            `;

            await tx.wait();
            renderIssuanceSuccess(certId, studentName, course, institution, tx.hash, "Ethereum Sepolia Ledger");

        } else {
            // High-Fidelity Simulation Mode: Save to browser storage for instant testing
            const newCert = {
                candidateName: studentName,
                courseName: course,
                orgName: institution,
                ipfsHash: ipfsHash,
                issueDate: Math.floor(Date.now() / 1000),
                isValid: true,
                revokeReason: ""
            };

            localStorage.setItem("certchain_cert_" + certId, JSON.stringify(newCert));
            const mockTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
            
            renderIssuanceSuccess(certId, studentName, course, institution, mockTxHash, "Demo Simulated Ledger");
        }

        // Reset form
        document.getElementById("certId").value = "";
        document.getElementById("studentName").value = "";
        document.getElementById("course").value = "";
        document.getElementById("ipfsHash").value = "";

    } catch (err) {
        console.error("Issuance error:", err);
        txResult.innerHTML = `
            <div class="result-card result-revoked">
                <div class="result-badge badge-revoked">Issuance Failed</div>
                <p style="margin-top: 0.4rem;"><b>Reason:</b> ${escapeHtml(err.reason || err.message || String(err))}</p>
            </div>
        `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Issue &amp; Sign Certificate on Blockchain
        `;
    }
}

function renderIssuanceSuccess(certId, studentName, course, institution, txHash, ledger) {
    const txResult = document.getElementById("txResult");
    txResult.innerHTML = `
        <div class="result-card result-valid">
            <div class="result-badge badge-valid">🎉 Certificate Successfully Issued</div>
            <h3 style="color: #166534; margin: 0.35rem 0;">Anchored on ${escapeHtml(ledger)}</h3>
            
            <div class="cert-grid" style="margin: 1rem 0;">
                <div class="cert-label">Certificate ID:</div>
                <div class="cert-value"><b>${escapeHtml(certId)}</b></div>

                <div class="cert-label">Recipient:</div>
                <div class="cert-value">${escapeHtml(studentName)}</div>

                <div class="cert-label">Degree:</div>
                <div class="cert-value">${escapeHtml(course)}</div>

                <div class="cert-label">Institution:</div>
                <div class="cert-value">${escapeHtml(institution)}</div>

                <div class="cert-label">Transaction Hash:</div>
                <div class="cert-value" style="font-family: monospace; font-size: 0.85rem;">
                    ${escapeHtml(txHash)}
                </div>
            </div>

            <div class="result-actions" style="margin-top: 1rem;">
                <a href="index.html" class="btn btn-primary">
                    Verify Certificate in Verification Portal ↗
                </a>
            </div>
        </div>
    `;
}

async function handleRevokeCertificate() {
    const certId = document.getElementById("revokeCertId").value.trim();
    const reason = document.getElementById("revokeReason").value.trim();
    const submitBtn = document.getElementById("revokeSubmitBtn");
    const txResult = document.getElementById("txResult");

    if (!certId || !reason) {
        alert("Please provide both Certificate ID and Revocation Reason.");
        return;
    }

    if (!confirm(`Are you certain you want to permanently revoke Certificate ID "${certId}"? This action cannot be reversed on the blockchain.`)) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Processing Revocation...`;

    try {
        const hasLiveContract = isConnected && CONFIG.CONTRACT_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(CONFIG.CONTRACT_ADDRESS);

        if (hasLiveContract) {
            const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, signer);
            const tx = await contract.revokeCertificate(certId, reason);

            txResult.innerHTML = `
                <div class="result-card" style="background: #fef2f2; border-color: #fecaca;">
                    <p>Revocation transaction broadcasted: ${escapeHtml(tx.hash)}</p>
                </div>
            `;
            await tx.wait();
        } else {
            // Update local storage simulation
            let certObj = null;
            const existing = localStorage.getItem("certchain_cert_" + certId);
            if (existing) {
                certObj = JSON.parse(existing);
            } else if (CONFIG.DEMO_CERTIFICATES[certId]) {
                certObj = { ...CONFIG.DEMO_CERTIFICATES[certId] };
            } else {
                certObj = {
                    candidateName: "Unknown Recipient",
                    courseName: "Academic Degree",
                    orgName: "Issuing University",
                    issueDate: Math.floor(Date.now() / 1000)
                };
            }

            certObj.isValid = false;
            certObj.revokeReason = reason;
            localStorage.setItem("certchain_cert_" + certId, JSON.stringify(certObj));
        }

        txResult.innerHTML = `
            <div class="result-card result-revoked">
                <div class="result-badge badge-revoked">Certificate Revoked</div>
                <h3 style="color: #991b1b; margin-top: 0.35rem;">Status Updated to Revoked</h3>
                <p style="margin-top: 0.4rem;">Certificate ID <b>${escapeHtml(certId)}</b> has been marked invalid on the registry.</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Reason: ${escapeHtml(reason)}</p>
            </div>
        `;

        document.getElementById("revokeCertId").value = "";
        document.getElementById("revokeReason").value = "";

    } catch (err) {
        console.error("Revocation error:", err);
        txResult.innerHTML = `
            <div class="result-card result-revoked">
                <div class="result-badge badge-revoked">Revocation Failed</div>
                <p style="margin-top: 0.4rem;"><b>Reason:</b> ${escapeHtml(err.reason || err.message || String(err))}</p>
            </div>
        `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Revoke Certificate Permanently
        `;
    }
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
