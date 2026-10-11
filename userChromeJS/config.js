// skip 1st line
// Privileged CSS Loader для Firefox
(function() {
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    let chromeDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
    if (chromeDir.leafName === "chrome_debugger_profile") {
        chromeDir = chromeDir.parent;
    }
    chromeDir.append("chrome");
    function loadCustomSheet(fileName, sheetType) {
        let file = chromeDir.clone();
        file.append(fileName);
        
        if (file.exists() && file.isFile()) {
            let uri = Services.io.newFileURI(file);
            sss.loadAndRegisterSheet(uri, sheetType);
        }
    }

    loadCustomSheet("userChromeAgent.css", sss.AGENT_SHEET);
    loadCustomSheet("userChromeAuthor.css", sss.AUTHOR_SHEET);
})();