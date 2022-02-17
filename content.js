const title = document.querySelector(".display-5").innerText;
const encodedTitle = encodeURIComponent(title);
const currency = getCurrency() || 'RUS';

loadFlagsSvg();
loadEshopPricesPage();

function loadFlagsSvg() {
    chrome.runtime.sendMessage({ contentScriptQuery: 'queryFlagsSvg' }, response => applySvg(response));
}

function loadEshopPricesPage() {
    chrome.runtime.sendMessage(
        { contentScriptQuery: 'queryEshopPrice', title: encodedTitle, currency: currency },
        response => parseEshopPricesPage(response));
}

function loadTop3Prices(url) {
    chrome.runtime.sendMessage(
        { contentScriptQuery: 'queryEshopGamePage', url: url },
        null,
        parseTop3Prices);
}

function applySvg(response) {
    var svgEl = document.createElement('div');
    svgEl.innerHTML = response;
    svgEl.style = "display: none"
    document.querySelector('body').append(svgEl);
}

function parseEshopPricesPage(html) {
    const page = new DOMParser().parseFromString(html, 'text/html').body;

    const gameItem = parseGameItems(page);
    if (!gameItem) {
        console.log('CANNOT FIND GAME AT ESHOP-PRICES.COM');
        return;
    }

    let divWrapper = createAndAppendDivWrapper();
    gameItem.href = gameItem.href.replace('dekudeals', 'eshop-prices').replace('www.', '');

    loadTop3Prices(gameItem.href);

    var priceEl = gameItem.querySelector(".price")

    var linkElement = createLinkElement(gameItem.href)
    linkElement.append(priceEl);

    let goldDiv = document.createElement('div');
    goldDiv.style = 'display: flex; align-items: flex-end;';
    divWrapper.append(goldDiv);

    goldDiv.append(createGoldMedalElement());
    goldDiv.append(linkElement);

    priceEl.querySelector("svg").style = "vertical-align: bottom;";

    priceEl.querySelector(".price-tag").style = "display: inline-flex; flex-direction: column; align-items: flex-end;";

    var originalPrice = priceEl.querySelector(".price-tag > del");
    if (originalPrice) {
        originalPrice.style = "opacity: .5; font-size: .85em;";
    }

    correctSvgUseAttribute(priceEl.querySelector("svg > use"))
}

function parseTop3Prices(response) {
    const page = new DOMParser().parseFromString(response.text, 'text/html').body
    const rows = page.querySelectorAll("table.prices-table > tbody > tr.pointer");

    const eshopPricesBlock = document.querySelector('#eshop-prices');

    eshopPricesBlock.innerHTML = '';
    eshopPricesBlock.append(createBlockFromRow(createGoldMedalElement(), parseFlagFromRow(rows[0]), parsePriceFromRow(rows[0]), response.url, true));
    eshopPricesBlock.append(createBlockFromRow(createSilverMedalElement(), parseFlagFromRow(rows[1]), parsePriceFromRow(rows[1]), response.url));
    eshopPricesBlock.append(createBlockFromRow(createBronzeMedalElement(), parseFlagFromRow(rows[2]), parsePriceFromRow(rows[2]), response.url));
}

function createBlockFromRow(medalElement, svgElement, priceElement, url, excludeMargin) {
    if (!priceElement) {
        return '';
    }

    const div = document.createElement('div');
    div.style = 'display: flex; align-items: flex-end;' + (excludeMargin ? '' : 'margin-left: 20px');
    div.append(medalElement);

    const linkElement = createLinkElement(url)
    div.append(linkElement);

    const spanElement = document.createElement('span');
    linkElement.append(spanElement);

    if (svgElement) {
        spanElement.append(svgElement);
    }
    spanElement.append(priceElement);

    return div;
}

function parseFlagFromRow(row) {
    if (!row) {
        return null;
    }

    const svg = row.querySelector('td svg.emoji');
    if (!svg) {
        return null;
    }

    svg.style = 'vertical-align: bottom; margin-right: 5px;'
    correctSvgUseAttribute(svg.querySelector('use'));
    return svg;
}

function parsePriceFromRow(row) {
    if (!row) {
        return null;
    }

    const td = row.querySelector('td.price-value');
    const span = document.createElement('span');
    span.style = 'display: inline-flex; flex-direction: column; align-items: flex-end;'
    const discount = td.querySelector('.discounted');

    if (discount) {
        var originalPrice = discount.querySelector("del");
        if (originalPrice) {
            originalPrice.style = "opacity: .5; font-size: .85em;";
        }
    }

    span.innerHTML = discount ? discount.innerHTML : td.innerHTML;
    return span;
}

function createLinkElement(href) {
    var linkElement = document.createElement('a');
    linkElement.href = href;
    linkElement.target = 'blank';
    return linkElement;
}

function createAndAppendDivWrapper() {
    let divWrapper = document.createElement('div');
    divWrapper.id = "eshop-prices";
    divWrapper.style = "display: flex; margin-bottom: 20px;";

    if (document.querySelector(".item-price-table")) {
        document.querySelector(".item-price-table").after(divWrapper);
    }
    else if (document.getElementById("price-history")) {
        document.getElementById("price-history").before(divWrapper);
    }
    else {
        document.querySelector('[aria-controls="descriptionCollapse"]').before(divWrapper);
    }

    return divWrapper;
}

function correctSvgUseAttribute(useElement) {
    svgPath = useElement.getAttribute("xlink:href");

    var flagSvgPath = useElement.getAttribute("xlink:href");
    flagSvgPath = flagSvgPath.substring(flagSvgPath.indexOf('#i-flag'))

    useElement.setAttribute("xlink:href", flagSvgPath);
}

function createGoldMedalElement() {
    const img = createMedalElement();
    img.src = GetLocalResource('/svg/gold.svg');;
    return img;
}

function createSilverMedalElement() {
    const img = createMedalElement();
    img.src = GetLocalResource('/svg/silver.svg');;
    return img;
}

function createBronzeMedalElement() {
    const img = createMedalElement();
    img.src = GetLocalResource('/svg/bronze.svg');;
    return img;
}

function createMedalElement() {
    const img = document.createElement('img');
    img.width = 20;
    img.height = 20;
    img.style = "vertical-align: bottom; margin-right: 5px";
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

    const postfix = NormalizeTitle('for Nintendo Switch')
    // Search with excluding 'for Nintendo Switch' postfix
    for (let i = 0; i < items.length; i++) {
        const element = items[i];
        gameTitleEl = element.querySelector(".games-list-item-title > h5");
        if (!gameTitleEl) {
            continue;
        }

        let normalizedGameTitle = NormalizeTitle(gameTitleEl.innerText).replace(postfix, '');
        if (normalizedGameTitle === normalizedSearchTitle) {
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