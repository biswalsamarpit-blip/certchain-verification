/**
 * CertChain Global Configuration
 * Contains network parameters, contract address, full ABI, and demo simulation fallback data.
 */

const CONFIG = {
    // Contract address on Ethereum Sepolia Testnet.
    // If empty or unset, the system runs in high-fidelity Demo Simulation Mode.
    // When you deploy via deploy.html, this is automatically populated!
    CONTRACT_ADDRESS: "",

    NETWORK: {
        CHAIN_ID: "0xaa36a7", // 11155111 Sepolia
        CHAIN_ID_DECIMAL: 11155111,
        NAME: "Ethereum Sepolia Testnet",
        RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
        EXPLORER_URL: "https://sepolia.etherscan.io"
    },

    // Contract ABI matching CertificateRegistry.sol
    CONTRACT_ABI: [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "string", "name": "certId", "type": "string" },
                { "indexed": false, "internalType": "string", "name": "candidateName", "type": "string" },
                { "indexed": false, "internalType": "string", "name": "courseName", "type": "string" },
                { "indexed": false, "internalType": "string", "name": "orgName", "type": "string" },
                { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
            ],
            "name": "CertificateIssued",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "string", "name": "certId", "type": "string" },
                { "indexed": false, "internalType": "string", "name": "reason", "type": "string" },
                { "indexed": true, "internalType": "address", "name": "revokedBy", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
            ],
            "name": "CertificateRevoked",
            "type": "event"
        },
        {
            "inputs": [
                { "internalType": "string", "name": "certId", "type": "string" },
                { "internalType": "string", "name": "candidateName", "type": "string" },
                { "internalType": "string", "name": "courseName", "type": "string" },
                { "internalType": "string", "name": "orgName", "type": "string" },
                { "internalType": "string", "name": "ipfsHash", "type": "string" }
            ],
            "name": "issueCertificate",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "string", "name": "certId", "type": "string" },
                { "internalType": "string", "name": "reason", "type": "string" }
            ],
            "name": "revokeCertificate",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "string", "name": "certId", "type": "string" }
            ],
            "name": "verifyCertificate",
            "outputs": [
                { "internalType": "string", "name": "candidateName", "type": "string" },
                { "internalType": "string", "name": "courseName", "type": "string" },
                { "internalType": "string", "name": "orgName", "type": "string" },
                { "internalType": "string", "name": "ipfsHash", "type": "string" },
                { "internalType": "uint256", "name": "issueDate", "type": "uint256" },
                { "internalType": "bool", "name": "isValid", "type": "bool" },
                { "internalType": "string", "name": "revokeReason", "type": "string" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "string", "name": "certId", "type": "string" }
            ],
            "name": "isCertificateValid",
            "outputs": [
                { "internalType": "bool", "name": "", "type": "bool" }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],

    // Local simulation fallback dataset for testing without gas or contract deployment
    DEMO_CERTIFICATES: {
        "BCA2026-001": {
            candidateName: "Rahul Sharma",
            courseName: "Bachelor of Computer Applications (BCA)",
            orgName: "National University of Technology",
            ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
            issueDate: 1776240000, // Apr 2026
            isValid: true,
            revokeReason: ""
        },
        "BCA2026-002": {
            candidateName: "Priya Patel",
            courseName: "Master of Science in Cybersecurity",
            orgName: "Apex Institute of Science",
            ipfsHash: "QmZtmD2qt8fJpq3CLDHcgCmZVCgc4asodujdmGLBPGLN",
            issueDate: 1771400000, // Feb 2026
            isValid: false,
            revokeReason: "Credential revoked due to submission of falsified prerequisite transcripts."
        }
    }
};

// Expose globally
window.CONFIG = CONFIG;
