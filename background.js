chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "queryEshopPrice") {
            console.log("Send: " + request.url);
            fetch(request.url)
                .then(response => response.text())
                .then(text => sendResponse(text))
                .catch(error => console.error(error))
            return true;
        }
        else if (request.contentScriptQuery == "queryFlagsSvg") {
            const svgUrl = GetLocalResource('/svg/flags.svg');
            fetch(svgUrl)
                .then(response => response.text())
                .then(text => sendResponse(text))
                .catch(error => console.error(error))
            return true;
        }
    });

    function GetLocalResource(path) {
        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
            return chrome.runtime.getURL(path);
        }
        else if (typeof browser !== 'undefined') {
            return browser.runtime.getURL(path);
        }
    
        return path;
    }