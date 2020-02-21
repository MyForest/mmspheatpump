var lastUpdate = null;
var newestFeed = null;
var oldestFeed = null;
var feedsByConfigKey = {};
const lastUpdateByFeedId = {}
const feedMetaDataById = new Map()

/** Notably listbyidasync is bad because it sends the API key on the URL which is logged by web servers. It gets 1.6k per call */
async function getFeedsLatest() {

    const now = (new Date()).getTime()
    Object.entries(config.app).map(async ([feedName, feedConfig]) => {
        const feedId = feedConfig.value;
        const feedMetaData = feedMetaDataById[feedId];

        if (feedMetaData) {

            const lastUpdate = lastUpdateByFeedId[feedId]

            const nextUpdate = lastUpdate + 2 * feedMetaData.interval;

            if (now > nextUpdate) {
                console.log("Should get update for " + feedName)
                const url = "../feed/timevalue.json?id=" + feedId;
                const res = await fetch(url)
                body = await res.json()
                lastUpdate[feedId] = body.time
            } else {
                console.debug(feedName + " won't be updated until " + nextUpdate)
            }
        }

    })

}

async function updater() {

    const result = await new Promise(resolve => feed.listbyidasync(resolve));

    if (result) {

        // Quick lookup for feeds
        Object.entries(config.app).map(([feedName, feedConfig]) => {
            const dataFromResult = result[feedConfig.value]
            if (dataFromResult != null) {
                feedsByConfigKey[feedName] = result[feedConfig.value];
            }
        })

        previousNewest = newestFeed;
        newestFeed = Math.max(...Object.values(feedsByConfigKey).map(f => f.time))
        oldestFeed = Math.min(...Object.values(feedsByConfigKey).map(f => f.start_time))

        if (view.end == 0) {
            view.end = newestFeed * 1000;
            view.start = view.end - 3600 * 1000;
        }

        const currentStatusPromise = updateCurrentStatus();

        const timeInterval = (view.end - view.start) / 1000;
        if (timeInterval > 7200) {
            $(".review-mode").html("Review - not updating")
        } else {
            $(".review-mode").html("Watching with rolling window of " + timeInterval + " seconds")

            if (previousNewest != newestFeed) {
                $("#updater").addClass("processing")
                try {
                    await updateGraph()
                    previousNewest = newestFeed
                } finally {
                    $("#updater").removeClass("processing")
                }
            }
        }

        await currentStatusPromise;
        lastUpdate = new Date();

    }
}