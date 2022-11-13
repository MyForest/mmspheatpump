function activeAmount(activeSeries) {

    const readingCount = activeSeries.length;
    if (readingCount < 2) return 0;
    const sum = activeSeries.reduce((partialSum, a) => partialSum + a[1], 0)
    const proportion = sum / activeSeries.length
    return proportion * 100

}

function activePercent(inputDataSeries) {

    const consumed = activeAmount(inputDataSeries)
    return consumed.toFixed(1) + "%"
}

async function updateActivePercentSummary(feedHistoryByConfigKey) {

    $("[data-active-input-config-keys]").each(function () {
        var activeConfigKeys = null;
        try {
            activeConfigKeys = $(this).attr("data-active-input-config-keys").split(",").map(s => s.trim())

        } catch (err) {
            console.error("Unable to parse active input config keys", err)
            return
        }

        if (activeConfigKeys) {
            const summaries = activeConfigKeys.map(key => {
                try {
                    var title = key
                    try { // Try for a better label
                        title = config.app[key].displayOptions.label
                    } catch {
                        console.error("Unable to get better title for " + key, err)
                    }
                    return title + ": " + activePercent(feedHistoryByConfigKey[key])
                } catch (err) {
                    console.error("Unable to calculate active percent for " + key, err)
                    return "(error for " + key + ")"
                }
            })
            $(this).text(summaries.join(", "))
        } else {
            // Not enough feeds configured for this summary, clear the text
            $(this).text("")
        }

    })
}
