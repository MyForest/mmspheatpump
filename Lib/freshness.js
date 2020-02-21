let updateInterval = false;
let dataFreshnessInterval = false;

function startAutoUpdate() {
    updateInterval = setInterval(updater, 10000);
    dataFreshnessInterval = setInterval(describeUpdate, 1000)
    $(".current-status").css("opacity", "100%")
}

function stopAutoUpdate() {
    $(".current-status").css("opacity", "20%")
    clearInterval(updateInterval);
    updateInterval = false

    clearInterval(dataFreshnessInterval)
    dataFreshnessInterval = false
}

async function describeUpdate() {
    if (lastUpdate) {
        const age = (new Date() - lastUpdate) / 1000;

        const newestFeedAge = (new Date().getTime() / 1000 - newestFeed);
        const newestFeedString = newestFeedAge - newestFeedAge % 10;

        $("#updater").text("Checked feeds " + Math.floor(age) + " seconds ago - the newest feed is " + newestFeedString + " seconds old")
    }
}