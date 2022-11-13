let chartSeriesByConfigKey = {};
let flot_font_size = 12;
let nominalEfficiencies = null;

// Let's make the date formatting sane if we can
try {
    const locale = window.navigator.userLanguage || window.navigator.language;
    moment.locale(locale)
} catch{
    console.warn("Unable to set date formatting locale")
}

async function indicateTimeWindow(start, end, timeInterval) {

    const humanTime = humanizeDuration(timeInterval * 1000, { largest: 2, round: true })
    $(".time-window").html(humanTime)

    const humanStart = moment(start).calendar()
    const humanEnd = moment(end).calendar()


    let humanFriendlyMoments = humanStart;
    if (humanStart != humanEnd) humanFriendlyMoments += " to " + humanEnd
    $(".time-window").attr("title", humanFriendlyMoments)
}
function sum(arrayOfNumber) {
    return arrayOfNumber.reduce((p, value) => p + value || 0, 0)
}
function createCoPFeed(inputFeedHistory, outputFeedHistory) {
    if (inputFeedHistory == null || outputFeedHistory == null) return []

    // Assumes the feeds are aligned in time and there's no gaps in either feed
    return inputFeedHistory.map((row, index, array) => {

        // If no input then don't declare a CoP
        if (row[1] == 0) return null;

        // If no output then don't declare a CoP
        if (outputFeedHistory[index]) {
            if (outputFeedHistory[index][1] == 0) return null;
        }

        const cohortSize = Math.min(index, 3)

        const inputCohortValues = array.slice(index - cohortSize, index + cohortSize + 1).map(([_, value]) => value)
        const inputCohortSum = sum(inputCohortValues)

        if (inputCohortSum == 0) return null;


        const outputCohortValues = outputFeedHistory.slice(index - cohortSize, index + cohortSize + 1).map(([_, value]) => value)

        const constrainedOutputCohortValues = outputCohortValues.map((value, index) => {
            const upperLimit = 7 * inputCohortValues[index]
            return Math.min(upperLimit, value)
        })

        const outputCohortSum = sum(constrainedOutputCohortValues)

        if (outputCohortSum == 0) return null;

        return [row[0], outputCohortSum / inputCohortSum]
    })
}

function createClientSideCoPFeed(inputConfigKey, outputConfigKey, configKey, color) {

    if (chartSeriesByConfigKey[inputConfigKey] == null || chartSeriesByConfigKey[outputConfigKey] == null) return

    const copFeedHistory = createCoPFeed(chartSeriesByConfigKey[inputConfigKey].data, chartSeriesByConfigKey[outputConfigKey].data)

    chartSeriesByConfigKey[configKey] = {
        color,
        bars: {
            show: true
        },
        lines: { fill: true },
        data: copFeedHistory,
        "label": configKey,
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

}

function createClientSideNominalEfficiencyFeeds(externalTemperatureConfigKeys, flowTemperatureConfigKey) {

    const designTemperature = config.app.DesignFlowTemperature.value

    const externalFeeds = externalTemperatureConfigKeys.map(configKey => chartSeriesByConfigKey[configKey])

    // This hunts for the first feed that can provide reasonable data for the time window being reviewed
    const outsideTemperatureSeries = externalFeeds.find(feed => feed != null && feed.data != null && feed.data[0] != null)

    const flowTemperatureSeries = chartSeriesByConfigKey[flowTemperatureConfigKey]

    if (outsideTemperatureSeries == null || flowTemperatureSeries == null) return

    const copAtFlowFeed = []
    const copAtDesign = []

    // Look for outdoor temperature at the time the flow temperature was logged
    flowTemperatureSeries.data.map(row => {

        const timestamp = row[0]
        // Default to the first temp
        let outdoorTemp = outsideTemperatureSeries.data[0][1];

        // Try to find a more representative temperature. Stop looking once we pass the reference timestamp
        outsideTemperatureSeries.data.find(info => {
            if (info[0] > timestamp) return true
            outdoorTemp = info[1]
        })

        // We can only do CoP lookups on whole numbers at the moment
        outdoorTemp = Math.round(outdoorTemp)
        const flowTemp = Math.round(row[1])

        if (nominalEfficiencies[flowTemp]) {
            copAtFlowFeed.push([row[0], nominalEfficiencies[flowTemp]["nominal"][outdoorTemp]])
        } else {
            copAtFlowFeed.push([row[0], 0])
        }
        copAtDesign.push([row[0], nominalEfficiencies[designTemperature]["nominal"][outdoorTemp]])
    })


    chartSeriesByConfigKey["Nominal CoP@Flow"] = {
        data: copAtFlowFeed,
        color: "gold",
        "label": "Nominal CoP@Flow",
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

    chartSeriesByConfigKey["Nominal CoP@Design"] = {
        data: copAtDesign,
        color: "silver",
        "label": "Nominal CoP@" + designTemperature,
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

}

async function loadDataAndRenderCharts(forceRefresh) {

    if (view.end == 0) return;
    if (view.end <= view.start) console.log("Odd view times:", view.end, view.start)

    // Turn off auto-refresh if we've wandered into the past
    if (view.end < (newestFeedTime * 1000)) setAutoRefresh(false)

    var start = view.start;
    var end = view.end;

    // Get as much detail as we can reasonably display. We can't easily show more than one visual element per pixel
    // Notably we don't do this on each resize because it would cause a very clunky resize experience. We will respect the new size on the next refresh
    const npoints = $(this).width();

    const timeInterval = (end - start) / 1000;

    indicateTimeWindow(start, end, timeInterval)

    var interval = timeInterval / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start / intervalms) * intervalms;
    end = Math.ceil(end / intervalms) * intervalms;

    const feedHistoryByConfigKey = {}

    // Fetch the feed history

    const efficiencyPromise = fetch(applicationURL + "config/interpolated_efficiencies.json")

    await Promise.all(Object.keys(config.app).map(async configKey => {
        if (feedsByConfigKey[configKey]) {
            // This feed has been configured locally

            // Start by attaching the known history if there is some
            if (chartSeriesByConfigKey[configKey]) {
                feedHistoryByConfigKey[configKey] = chartSeriesByConfigKey[configKey].data
            }

            if (forceRefresh) {
                // Don't do anything clever
            } else {
                const latestTimeOnServerForFeed = feedsByConfigKey[configKey].time * 1000;
                if (chartSeriesByConfigKey.hasOwnProperty(configKey)) {
                    const data = chartSeriesByConfigKey[configKey].data;
                    if (data) {
                        const newestRecordOnClient = data[data.length - 1]
                        if (newestRecordOnClient) {
                            const latestTimeOnClientForFeed = newestRecordOnClient[0]
                            if (latestTimeOnClientForFeed >= latestTimeOnServerForFeed) {
                                return
                            }
                        }
                    }
                }
            }
            // It's really tempting to just add the latest record on to the end of the local list
            // However, we may have missed a lot of data
            // This is especially true on mobile where where the web page gets put to sleep when it's not showing

            const feedId = feedsByConfigKey[configKey].id
            const url = "../feed/data.json?id=" + feedId + "&start=" + start + "&end=" + end + "&interval=" + interval + "&skipmissing=1&limitinterval=1"
            const feedHistory = await (await fetch(url)).json()

            feedHistoryByConfigKey[configKey] = feedHistory;

            const chartSeriesOptionsAndData = Object.assign({}, config.app[configKey].displayOptions);
            if (chartSeriesOptionsAndData.label == null) chartSeriesOptionsAndData.label = configKey
            chartSeriesOptionsAndData.data = feedHistory

            chartSeriesOptionsAndData.units = feedsByConfigKey[configKey].unit

            chartSeriesByConfigKey[configKey] = chartSeriesOptionsAndData
        }
    }))

    createClientSideCoPFeed("HeatingEnergyConsumedRate1", "HeatingEnergyProducedRate1", "Space Heating CoP", "green")
    createClientSideCoPFeed("HotWaterEnergyConsumedRate1", "HotWaterEnergyProducedRate1", "Hot Water CoP", "blue")
    createClientSideCoPFeed("TotalEnergyConsumedRate1", "TotalEnergyProducedRate1", "Total CoP")

    if (config.app.IncludeNominalEfficiences) {
        if (config.app.IncludeNominalEfficiences.value) {
            nominalEfficiencies = await (await efficiencyPromise).json()

            createClientSideNominalEfficiencyFeeds(["EffectiveTemperature", "OutdoorTemperature"], "FlowTemperature")
        }
    }

    await Promise.all([
        updateWindowSummary(feedHistoryByConfigKey, timeInterval),
        updateActivePercentSummary(feedHistoryByConfigKey),
        $(".chart").each(async function () { await drawChart($(this)) })
    ]);
}

async function drawChart(jQueryElement) {
    if (jQueryElement == null) return
    const configKeys = jQueryElement.attr("data-config-keys").split(",").map(s => s.trim())

    const dataSeries = configKeys.map(configKey => Object.assign({}, chartSeriesByConfigKey[configKey]))
    const seriesWithHistory = dataSeries.filter(ds => ds != null && Object.keys(ds).length > 0)

    if (seriesWithHistory.length == 0) {
        jQueryElement.addClass("chart-with-no-feeds")
        return
    }
    jQueryElement.removeClass("chart-with-no-feeds")

    // Find out more about the options at https://github.com/flot/flot/blob/master/API.md

    if (jQueryElement.get()[0].childNodes.length == 0) {
        // Create a legend container
        jQueryElement.before("<div class='legendContainer' data-config-keys='" + configKeys.join(",") + "'>chart legend</div>");
    }

    const options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            min: view.start,
            max: view.end,
            font: { size: flot_font_size, color: "black" }
        },
        yaxis: {
            font: { size: flot_font_size, color: "black" },
            label: getYAxisLabel(seriesWithHistory, jQueryElement.attr("data-label"))
        },
        grid: {
            borderWidth: 0,
            clickable: true,
            hoverable: true,
            margin: { left: 20 }
        },
        series: {
            lines: { lineWidth: 0.5 }
        },
        bars: {
            align: "center",
            barWidth: 60 * 1000, // Should be wider when viewing a longer time window
            lineWidth: 0.5
        },
        selection: { mode: "x" },
        legend: {
            noColumns: seriesWithHistory.length,
            color: "black",
            sorted: true,
            container: jQueryElement.prev()
        }
    }

    setYAxisTickFormatter(seriesWithHistory, options.yaxis, jQueryElement)


    $.plot(jQueryElement, seriesWithHistory, options);

    // Flot doesn't have native axis label support
    // We can't apply the label until the elements have been drawn
    $(".yAxis", jQueryElement).attr("data-label", options.yaxis.label)

    jQueryElement.removeClass("processing")
}

function getYAxisLabel(dataSeries, baseLabelText) {
    if (dataSeries == null) return "";

    const units = dataSeries.map(ds => {
        if (ds) return ds.scaledUnit || ds.units || "";
        return ""
    })

    const uniqueUnits = [...new Set(units)];

    if (uniqueUnits.length == 1) {
        const units = uniqueUnits[0];
        if (baseLabelText) {
            if (units) {
                return baseLabelText + " (" + units + ")"
            } else {
                return baseLabelText
            }
        }
        return units
    } else {
        console.log("There were conflicting untis for chart", uniqueUnits)
    }
}

function setYAxisTickFormatter(dataSeries, yaxis) {
    if (dataSeries == null) return;

    const scales = dataSeries.map(ds => {
        if (ds) return ds.scale || 1
        return 1
    })
    const uniqueScales = [...new Set(scales)];

    if (uniqueScales.length == 1) {
        const commonScale = uniqueScales[0]
        if (commonScale && commonScale != 1) {

            yaxis.tickFormatter = (val, _axis) => {
                return Math.round(val * commonScale, yaxis.tickDecimals);
            }
        }

    } else {
        console.log("There were conflicting scales for chart", uniqueScales)
    }
}

async function showValueInLegendForTimestamp(chart, timestamp) {

    const configKeysForChart = chart.dataset.configKeys.split(",").map(k => k.trim());

    const chartSeriesByLabel = {}

    configKeysForChart.map(configKey => {
        const series = chartSeriesByConfigKey[configKey]
        if (series) {
            chartSeriesByLabel[series.label] = configKey
        } else {
            // Vanishes during refreshes
        }
    })


    $(".legendLabel", chart).each(function () {

        const existing = $(this).html()
        const originalLabel = existing.split("=")[0].trim()

        const configKey = chartSeriesByLabel[originalLabel];
        const chartSeries = chartSeriesByConfigKey[configKey]
        if (chartSeries) {
            const feedHistory = chartSeries.data

            let valueAtTimestamp = null
            for (item of feedHistory) {
                if (item) {
                    datapointTime = item[0]
                    value = item[1]
                    if (datapointTime > timestamp) break // We've gone past the timestamp
                    valueAtTimestamp = value
                }
            }

            if (valueAtTimestamp) {
                const displayValue = niceDisplayValue(valueAtTimestamp, configKey)
                const displayUnits = niceDisplayUnit(configKey)
                const newLabel = originalLabel + " = " + displayValue + displayUnits;
                $(this).html(newLabel)
            } else {
                // Wipe out the value display to indicate there isn't one
                $(this).html(originalLabel)
            }
        } else {
            // Vanishes during refreshes
        }
    })
}

$(".chart").bind("plothover", function (_event, pos) {

    if (pos.x) {
        // Notably we want to show a synchronized value in all the charts for the time the user is hovering over with their mouse
        $(".legendContainer").each(function (_index, container) {
            showValueInLegendForTimestamp(container, pos.x + 30000)
        })
    }

});
