async function configureApplicationOnClientSide() {

    // Fetch shape of application from the server
    config.app = await (await fetch(applicationURL + "config/application-configuration.json")).json()

    // Load the available feeds for this user's system so we can configure the application
    config.feeds = await (await fetch("../feed/list.json")).json()

    config.initapp = function () { init() };
    config.showapp = function () { show() };
    config.hideapp = function () { clear() };

    config.init();
}

function init() { }


function show() {

    // The app configuration page makes it black so set it back
    $("body").css("background-color", "white");

    resize();

    updater();

    startAutoUpdate()
}

function clear() {
    stopAutoUpdate()
}