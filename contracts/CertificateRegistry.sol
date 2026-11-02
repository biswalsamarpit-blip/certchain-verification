// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Decentralized, tamper-proof academic credential registry on Ethereum.
 * Allows authorized institutions to issue, revoke, and publicly verify certificates.
 */
contract CertificateRegistry {

    struct Certificate {
        string candidateName;
        string courseName;
        string orgName;
        string ipfsHash;
        uint256 issueDate;
        bool isValid;
        string revokeReason;
        address issuer;
    }

    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(string => Certificate) private certificates;
    mapping(string => bool) private certificateExists;

    event CertificateIssued(
        string indexed certId,
        string candidateName,
        string courseName,
        string orgName,
        address indexed issuer,
        uint256 timestamp
    );

    event CertificateRevoked(
        string indexed certId,
        string reason,
        address indexed revokedBy,
        uint256 timestamp
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute this");
        _;
    }

    modifier onlyIssuer() {
        require(msg.sender == owner || authorizedIssuers[msg.sender], "Not authorized to issue certificates");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @notice Issue and anchor a new certificate on the blockchain ledger
     */
    function issueCertificate(
        string calldata certId,
        string calldata candidateName,
        string calldata courseName,
        string calldata orgName,
        string calldata ipfsHash
    ) external onlyIssuer {
        require(bytes(certId).length > 0, "Certificate ID cannot be empty");
        require(bytes(candidateName).length > 0, "Candidate name cannot be empty");
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        require(bytes(orgName).length > 0, "Organization name cannot be empty");
        require(!certificateExists[certId], "Certificate with this ID already exists");

        certificates[certId] = Certificate({
            candidateName: candidateName,
            courseName: courseName,
            orgName: orgName,
            ipfsHash: ipfsHash,
            issueDate: block.timestamp,
            isValid: true,
            revokeReason: "",
            issuer: msg.sender
        });

        certificateExists[certId] = true;

        emit CertificateIssued(certId, candidateName, courseName, orgName, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a certificate in case of disciplinary action, error, or fraud
     */
    function revokeCertificate(
        string calldata certId,
        string calldata reason
    ) external onlyIssuer {
        require(certificateExists[certId], "Certificate does not exist");
        require(certificates[certId].isValid, "Certificate is already revoked");
        require(bytes(reason).length > 0, "Revocation reason required");

        certificates[certId].isValid = false;
        certificates[certId].revokeReason = reason;

        emit CertificateRevoked(certId, reason, msg.sender, block.timestamp);
    }

    /**
     * @notice Zero-gas public verification method for verifiers, employers, and background checkers
     */
    function verifyCertificate(string calldata certId) external view returns (
        string memory candidateName,
        string memory courseName,
        string memory orgName,
        string memory ipfsHash,
        uint256 issueDate,
        bool isValid,
        string memory revokeReason
    ) {
        require(certificateExists[certId], "Certificate not found on ledger");
        Certificate memory cert = certificates[certId];
        return (
            cert.candidateName,
            cert.courseName,
            cert.orgName,
            cert.ipfsHash,
            cert.issueDate,
            cert.isValid,
            cert.revokeReason
        );
    }

    /**
     * @notice Helper to check existence and validity in a single call
     */
    function isCertificateValid(string calldata certId) external view returns (bool) {
        return certificateExists[certId] && certificates[certId].isValid;
    }

    /**
     * @notice Authorize an institution wallet to issue certificates
     */
    function addAuthorizedIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @notice Revoke an institution's issuing privileges
     */
    function removeAuthorizedIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    /**
     * @notice Transfer contract ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
