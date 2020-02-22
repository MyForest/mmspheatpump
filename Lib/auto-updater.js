var lastUpdate = null;
var newestFeed = null;
var oldestFeed = null;
let autoUpdate = true;

const feedsByConfigKey = {};

/** Uses the feeds API to stash the latest value and metadata for all feeds */
async function updateFeedCache() {

    const response = await fetch("../feed/list.json")
    const result = await response.json()

    if (result) {

        Object.entries(config.app).map(([configKey, configItem]) => {

            // The config.app{}.value tells us which feed.id in this instance of Emoncms represents the specific config key so let's update our cache accordingly
            const feedFromAPIThatRepresentsThisConfigItem = result.find(feed => feed.id == configItem.value)

            if (feedFromAPIThatRepresentsThisConfigItem) {

                // Cache the feed information for this instance of Emoncms using the application's naming (i.e. the configKey)
                // This allows the app code to simply refer to things by stable configKey without worrying about the local naming of the feed
                feedsByConfigKey[configKey] = feedFromAPIThatRepresentsThisConfigItem

            } else {
                // Purposefully clear it so we don't keep referring to a feed that might have vanished since we put it in the cache
                feedsByConfigKey[configKey] == null
            }
        })
    }
}

async function setAutoRefresh(enabled) {

    autoUpdate = enabled

    if (autoUpdate) {
        $(".update-controls").addClass("auto-update-enabled")
        $(".review-mode").html("Watching")
    } else {
        $(".update-controls").removeClass("auto-update-enabled")
        $(".review-mode").html("Reviewing")
    }
}

async function updater() {

    await updateFeedCache()

    previousNewest = newestFeed;
    newestFeed = Math.max(...Object.values(feedsByConfigKey).map(f => f.time))
    oldestFeed = Math.min(...Object.values(feedsByConfigKey).map(f => f.start_time))

    if (view.end == 0) {
        // Assign a default view window
        view.end = newestFeed * 1000;
        view.start = view.end - 3600 * 1000;
    }

    // Start updating the current status, we'll await it later
    const currentStatusPromise = updateCurrentStatus();

    if (autoUpdate) {
        if (previousNewest != newestFeed) {
            // Something has a new timestamp (of course the actual values may not have changed!)
            // TODO: Investigate /Lib/timeseries.js
            $(".feed-refresh-indicator").addClass("processing")
            try {

                const interval = view.end - view.start
                view.end = newestFeed * 1000;
                view.start = view.end - interval
                console.log("Updated start and end of rolling window", view.start, view.end, interval / 1000)
                await loadDataAndRenderCharts()
                previousNewest = newestFeed
            } finally {
                $(".feed-refresh-indicator").removeClass("processing")
            }
        }
    }

    await currentStatusPromise;
    lastUpdate = new Date();
}

$(".update-controls").click(async function () {

    setAutoRefresh(!autoUpdate)

    if (autoUpdate) {
        const interval = view.end - view.start
        view.end = newestFeed * 1000;
        view.start = view.end - interval
        console.log("Updated start and end of rolling window", view.start, view.end, interval / 1000)

        await loadDataAndRenderCharts()
    }

});