/**
 * Backward-compatibility wrapper
 * If any page or script includes script.js directly, load js/config.js and js/verify.js
 */
(function() {
    if (typeof CONFIG === "undefined") {
        const configScript = document.createElement("script");
        configScript.src = "js/config.js";
        document.head.appendChild(configScript);
    }
    if (typeof verifyCertificate === "undefined") {
        const verifyScript = document.createElement("script");
        verifyScript.src = "js/verify.js";
        document.head.appendChild(verifyScript);
    }
})();
