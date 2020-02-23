let chartSeriesByConfigKey = {};
let flot_font_size = 12;

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

    await Promise.all([
        updateWindowSummary(feedHistoryByConfigKey, timeInterval),
        drawCharts(),
    ]);
}


async function drawCharts() {

    const charts = []
    $(".chart").each(async function () {
        charts.push($(this))
    })

    await Promise.all(charts.map(
        async chart => {
            try {
                await drawChart(chart)
            } finally {
                chart.removeClass("processing")
            }
        }
    ))
}

async function drawChart(jQueryElement) {
    if (jQueryElement == null) return
    const configKeys = jQueryElement.attr("data-config-keys").split(",").map(s => s.trim())

    const dataSeries = configKeys.map(configKey => Object.assign({}, chartSeriesByConfigKey[configKey]))
    const seriesWithHistory = dataSeries.filter(ds => ds != null)

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
                label: getYAxisLabel(dataSeries, jQueryElement.attr("data-label"))
            },
            grid: {
                color: "lightgray",
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
                noColumns: dataSeries.length,
                color: "black",
                sorted: true
            }
        }

        jQueryElement.options = options;

        setYAxisTickFormatter(dataSeries, jQueryElement.options.yaxis, jQueryElement)

    }

    jQueryElement.options.xaxis.font.size = flot_font_size
    jQueryElement.options.yaxis.font.size = flot_font_size

    $.plot(jQueryElement, seriesWithHistory, jQueryElement.options);

    // Flot doesn't have native axis label support
    // We can't apply the label until the elements have been drawn
    $(".yAxis", jQueryElement).attr("data-label", jQueryElement.options.yaxis.label)
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

function resize() {
    const window_width = $(this).width();

    if (window_width < 450) flot_font_size = 10;

    const top_offset = 0;
    const placeholder_bound = $('.placeholder_bound');
    const placeholder = $('.chart');

    const width = placeholder_bound.width();
    let height = width * 0.6;
    if (height < 250) height = 250;
    if (height > 480) height = 480;
    if (height > width) height = width;

    height = 200

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);

    drawChart();
}
// on finish sidebar hide/show
$(function () {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})

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