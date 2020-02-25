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

function createCoPFeed(inputFeedHistory, outputFeedHistory) {

    // Assumes the feeds are aligned in time and there's no gaps in either feed
    return inputFeedHistory.map((row, index, array) => {

        const friends = 5

        const inputFriends = array.slice(index - friends, index + friends).map(([_, value]) => value)
        const input = inputFriends.reduce((p, value) => p + value, 0)

        if (input == 0) return [row[0], 0]

        const outputFriends = outputFeedHistory.slice(index - friends, index + friends).map(([_, value]) => value)

        const sensibleOutputFriends = outputFriends.map((value, index) => {
            const inputValue = inputFriends[index]
            const upperLimit = 5 * inputValue
            return Math.min(upperLimit, value)
        })

        const output = sensibleOutputFriends.reduce((p, value) => p + value, 0)

        return [row[0], output / input]
    })
}

function createClientSideCoPFeed(inputConfigKey, outputConfigKey, configKey) {

    if (chartSeriesByConfigKey[inputConfigKey] == null || chartSeriesByConfigKey[outputConfigKey] == null) return

    const copFeedHistory = createCoPFeed(chartSeriesByConfigKey[inputConfigKey].data, chartSeriesByConfigKey[outputConfigKey].data)

    chartSeriesByConfigKey[configKey] = {
        data: copFeedHistory,
        "label": configKey,
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

}

function createClientSideNominalEfficiencyFeeds(outsideTemperatureConfigKey, flowTemperatureConfigKey) {

    const designTemperature = config.app.DesignFlowTemperature.value

    const outsideTemperatureSeries = chartSeriesByConfigKey[outsideTemperatureConfigKey]
    const flowTemperatureSeries = chartSeriesByConfigKey[flowTemperatureConfigKey]

    if (outsideTemperatureSeries == null || flowTemperatureSeries == null) return

    // Naively assumes the feeds are aligned in time and there's no gaps in either feed

    const copAtFlowFeed = []
    const copAtDesign = []

    outsideTemperatureSeries.data.map((row, index) => {

        const outdoorTemp = row[1]
        const flowTemp = Math.round(flowTemperatureSeries.data[index][1], 0)

        if (nominalEfficiencies[flowTemp]) {
            copAtFlowFeed.push([row[0], nominalEfficiencies[flowTemp]["nominal"][outdoorTemp]])
        } else {
            copAtFlowFeed.push([row[0], 0])
        }
        copAtDesign.push([row[0], nominalEfficiencies[designTemperature]["nominal"][outdoorTemp]])
    })


    chartSeriesByConfigKey["Nominal CoP@Flow"] = {
        data: copAtFlowFeed,
        color: "purple",
        "label": "Nominal CoP@Flow",
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

    chartSeriesByConfigKey["Nominal CoP@Design"] = {
        data: copAtDesign,
        color: "green",
        "label": "Nominal CoP@" + designTemperature,
        "scale": 100,
        "scaledUnit": "%",
        "fixed": 0
    }

}

async function loadDataAndRenderCharts() {

    if (view.end == 0) return;
    if (view.end <= view.start) console.log("Odd view times:", view.end, view.start)

    // Turn off auto-refresh if we've wandered into the past
    if (view.end < (newestFeed * 1000)) setAutoRefresh(false)

    var start = view.start;
    var end = view.end;
    var npoints = 1200;
    const timeInterval = (end - start) / 1000;

    indicateTimeWindow(start, end, timeInterval)

    var interval = timeInterval / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start / intervalms) * intervalms;
    end = Math.ceil(end / intervalms) * intervalms;

    chartSeriesByConfigKey = {};
    const feedHistoryByConfigKey = {}

    // Fetch the feed history

    const efficiencyPromise = fetch(applicationURL + "config/interpolated_efficiencies.json")

    await Promise.all(Object.keys(config.app).map(async configKey => {
        if (feedsByConfigKey[configKey]) {
            // This feed has been configured locally

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

    createClientSideCoPFeed("HeatingEnergyConsumedRate1", "HeatingEnergyProducedRate1", "Space Heating CoP")
    createClientSideCoPFeed("HotWaterEnergyConsumedRate1", "HotWaterEnergyProducedRate1", "Hot Water CoP")
    createClientSideCoPFeed("TotalEnergyConsumedRate1", "TotalEnergyProducedRate1", "Total CoP")

    if (config.app.IncludeNominalEfficiences.value) {
        nominalEfficiencies = await (await efficiencyPromise).json()

        createClientSideNominalEfficiencyFeeds("OutdoorTemperature", "FlowTemperature")
    }

    await Promise.all([
        updateWindowSummary(feedHistoryByConfigKey, timeInterval),
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

    if (jQueryElement.options == null) {
        // Cache the options
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
                margin: { top: 25, left: 20 }
            },
            series: {
                lines: { lineWidth: 0.5 }
            },
            selection: { mode: "x" },
            legend: {
                position: "NW",
                noColumns: seriesWithHistory.length,
                color: "black",
                sorted: true
            }
        }

        jQueryElement.options = options;

        setYAxisTickFormatter(seriesWithHistory, jQueryElement.options.yaxis, jQueryElement)

    }

    jQueryElement.options.xaxis.font.size = flot_font_size
    jQueryElement.options.yaxis.font.size = flot_font_size

    $.plot(jQueryElement, seriesWithHistory, jQueryElement.options);

    // Flot doesn't have native axis label support
    // We can't apply the label until the elements have been drawn
    $(".yAxis", jQueryElement).attr("data-label", jQueryElement.options.yaxis.label)

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
            for ([datapointTime, value] of feedHistory) {
                if (datapointTime > timestamp) break // We've gone past the timestamp
                valueAtTimestamp = value
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
        $(".chart").each(function (_chartIndex, chart) {
            showValueInLegendForTimestamp(chart, pos.x)
        })
    }

});