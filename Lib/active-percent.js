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
        const activeConfigKeys = $(this).attr("data-active-input-config-keys").split(",").map(s => s.trim())

        if (activeConfigKeys) {
            const summaries = activeConfigKeys.map(key => {
                const title = config.app[key].displayOptions.label
                return title + ": " + activePercent(feedHistoryByConfigKey[key])
            })
            $(this).text(summaries.join(", "))
        } else {
            // Not enough feeds configured for this summary
            $(this).text("")
        }

    })
}
