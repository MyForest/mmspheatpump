let updateInterval = false;
let dataFreshnessInterval = false;

function startAutoUpdate() {
    if (updateInterval == false) updateInterval = setInterval(updater, 10000);
    if (dataFreshnessInterval == false) dataFreshnessInterval = setInterval(describeUpdate, 1000)
    $(".current-status").css("opacity", "100%")
}

function stopAutoUpdate() {
    $(".current-status").css("opacity", "20%")

    try {
        clearInterval(updateInterval);
        updateInterval = false

        clearInterval(dataFreshnessInterval)
        dataFreshnessInterval = false
    } catch{ }
}

async function describeUpdate() {
    if (lastUpdate) {
        const age = new Date() - lastUpdate;

        const newestFeedAge = (new Date().getTime() / 1000 - newestFeedTime);
        const newestFeedString = humanizeDuration(newestFeedAge * 1000, { largest: 1, round: true });
        $(".feed-refresh-indicator").attr("title", "Checked feeds " + humanizeDuration(age, { largest: 1, round: true }) + " ago - the newest feed is " + newestFeedString + " seconds old")
        const pos = Math.round(age / 1000) % 10
        const gremlin = ".".repeat(pos) + "x" + ".".repeat(10 - pos)
        $(".feed-refresh-indicator").text(gremlin)
    }
}