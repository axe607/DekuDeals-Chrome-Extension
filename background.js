chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery === "queryEshopPrice") {
            const baseSearchUrl = "https://eshop-prices.com/games?q={0}&currency={1}"
            const url = baseSearchUrl.replace('{0}', request.title).replace('{1}', request.currency);

            fetch(url)
                .then(response => response.text())
                .then(text => sendResponse(text))
                .catch(error => console.error(error))
            return true;
        }
        else if (request.contentScriptQuery === "queryFlagsSvg") {
            const svgUrl = GetLocalResource('/svg/flags.svg');
            fetch(svgUrl)
                .then(response => response.text())
                .then(text => sendResponse(text))
                .catch(error => console.error(error))
            return true;
        }
        else if (request.contentScriptQuery === "queryEshopGamePage") {
            fetch(request.url)
                .then(response => response.text())
                .then(text => sendResponse({text, url : request.url}))
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