let timeout = null;

function save_options() {
    clearTimeout(timeout);

    var enebaShop = document.getElementById('eneba-shop');
    chrome.storage.local.set({
        excludeEnebaShop: enebaShop.checked
    }, function () {
        var status = document.getElementById('status');
        status.style = 'display: block';
        timeout = setTimeout(function () { status.style = 'display: none'; }, 2000);
    });
}

function restore_options() {
    chrome.storage.local.get({
        excludeEnebaShop: false
    }, function (items) {
        document.getElementById('eneba-shop').checked = items.excludeEnebaShop;
    });
}

function localizeHtmlPage() {
    //Localize by replacing __MSG_***__ meta tags
    const obj = document.getElementsByTagName('html')[0];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
        return v1 ? chrome.i18n.getMessage(v1) : "";
    });

    if (valNewH != valStrH) {
        obj.innerHTML = valNewH;
    }
}

localizeHtmlPage();

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);