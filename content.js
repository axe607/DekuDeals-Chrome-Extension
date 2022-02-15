const baseSearchUrl = "https://eshop-prices.com/games?q={0}&currency={1}"
const baseUrl = "https://eshop-prices.com";

const title = document.querySelector(".display-5").innerText;
var searchUrl = baseSearchUrl.replace('{0}', encodeURIComponent(title));

const currency = getCurrency() || 'RUS';
searchUrl = searchUrl.replace('{1}', currency);

loadFlagsSvg();
getEshopPricesPage(searchUrl);

function getEshopPricesPage(url) {
    chrome.runtime.sendMessage(
        { contentScriptQuery: 'queryEshopPrice', url: url },
        response => parseEshopPricesPage(response));
}

function loadFlagsSvg() {
    chrome.runtime.sendMessage({ contentScriptQuery: 'queryFlagsSvg' }, response => applySvg(response));
}

function applySvg(response) {
    var svgEl = document.createElement('div');
    svgEl.innerHTML = response;
    svgEl.style = "display: none"
    document.querySelector('body').append(svgEl);
}

function parseEshopPricesPage(html) {
    var page = new DOMParser().parseFromString(html, 'text/html').body;

    var gameItem = parseGameItems(page);
    if (!gameItem) {
        console.log('CANNOT FIND GAME AT ESHOP-PRICES.COM');
        return;
    }

    var priceEl = gameItem.querySelector(".price")

    var linkElement = document.createElement('a');
    linkElement.href = gameItem.href;
    linkElement.target = 'blank';
    linkElement.append(priceEl);

    linkElement.href = linkElement.href.replace('dekudeals', 'eshop-prices');

    var divElem = document.createElement('div');
    divElem.append(createMedalElement());
    divElem.append(linkElement);

    priceEl.querySelector("svg").style = "vertical-align: bottom;";

    priceEl.querySelector(".price-tag").style = "display: inline-flex; flex-direction: column; align-items: flex-end;";

    var originalPrice = priceEl.querySelector(".price-tag > del");
    if (originalPrice) {
        originalPrice.style = "opacity: .4; font-size: .8em;";
    }

    var flag = priceEl.querySelector("svg > use");
    svgPath = flag.getAttribute("xlink:href");

    var flagSvgPath = flag.getAttribute("xlink:href");
    flagSvgPath = flagSvgPath.substring(flagSvgPath.indexOf('#i-flag'))

    flag.setAttribute("xlink:href", flagSvgPath);

    var tableEl = document.querySelector(".item-price-table");
    if (tableEl) {
        tableEl.after(divElem);
    }
    else {
        document.getElementById("price-history").before(divElem);
    }
}

function createMedalElement() {
    var img = document.createElement('img');
    img.src = GetLocalResource('/svg/medal.svg');;
    img.width = 20;
    img.height = 20;
    img.style = "vertical-align: bottom;";
    return img;
}

function parseGameItems(page) {
    var items = page.querySelectorAll('.games-list-item');
    const normalizedSearchTitle = NormalizeTitle(title);

    for (let i = 0; i < items.length; i++) {
        const element = items[i];
        gameTitleEl = element.querySelector(".games-list-item-title > h5");
        if (!gameTitleEl) {
            continue;
        }

        if (NormalizeTitle(gameTitleEl.innerText) === normalizedSearchTitle) {
            return element;
        }
    }
}

function NormalizeTitle(title) {
    return title.trim()
        .replaceAll('™', '')
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll('+', '')
        .replaceAll('®', '')
        .replaceAll(/\s/g, '')
        .toLowerCase();
}

function getCurrency() {
    var countryAbbr = document.getElementById("navbarCountry1").innerText.substring(2).trim().toLowerCase();
    countryAbbr = countryAbbr === 'uk' ? 'gb' : countryAbbr;

    var flagEl = document.querySelector('.dropdown-menu.country-select .flag2-' + countryAbbr);
    if (!flagEl) {
        return null;
    }

    var text = flagEl.parentElement.innerText;
    return text.substring(text.length - 4, text.length - 1);
}

function GetLocalResource(path) {
    if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
        return chrome.runtime.getURL(path);
    }
    else if (typeof browser !== 'undefined') {
        return browser.runtime.getURL(path);
    }

    return path;
}