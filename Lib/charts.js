let chartSeriesByConfigKey = {};
let flot_font_size = 12;

async function updateGraph() {
    // Use this to update the endpoint in realtime

    const interval = view.end - view.start
    if (interval < (7200 * 1000)) {
        view.end = newestFeed * 1000;
        view.start = view.end - interval
        console.log("Updated start and end of rolling window", view.start, view.end, interval / 1000)
    }
    await loadDataAndRenderCharts();
}

async function loadDataAndRenderCharts() {

    if (view.end == 0) return;
    if (view.end <= view.start) console.log("Odd view times:", view.end, view.start)


    var start = view.start;
    var end = view.end;
    var npoints = 1200;
    const timeInterval = (end - start) / 1000;

    var interval = timeInterval / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start / intervalms) * intervalms;
    end = Math.ceil(end / intervalms) * intervalms;

    chartSeriesByConfigKey = {};
    const feedHistoryByConfigKey = {}

    // Fetch all the latest data

    await Promise.all(Object.keys(config.app).map(async configKey => {
        if (feedsByConfigKey[configKey]) {

            const feedHistory = feed.getdata(feedsByConfigKey[configKey].id, start, end, interval, 1, 1);
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
                font: { size: flot_font_size, color: "black" },
                reserveSpace: false
            },
            yaxis: {
                font: { size: flot_font_size, color: "black" },
                reserveSpace: false,
                label: getYAxisLabel(dataSeries, jQueryElement.attr("data-label"))
            },
            grid: {
                show: true,
                color: "lightgray",
                borderWidth: 0,
                clickable: true,
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
                sorted: true,
                backgroundOpacity: 0
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