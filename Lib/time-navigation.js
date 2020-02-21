async function showHumanWeAreLoadingCharts(whatTheyClicked) {
    $(".chart").addClass("processing")
    $(whatTheyClicked).addClass("processing")
    try {
        await loadDataAndRenderCharts();
    } finally {
        $(whatTheyClicked).removeClass("processing")
    }
}

$(".zoomout").click(async function () { view.zoomout(); showHumanWeAreLoadingCharts($(this)); });
$(".zoomin").click(async function () { view.zoomin(); showHumanWeAreLoadingCharts($(this)); });
$(".panright").click(async function () { view.panright(); showHumanWeAreLoadingCharts($(this)); });
$(".panleft").click(async function () { view.panleft(); showHumanWeAreLoadingCharts($(this)); });

$(".duration").click(async function () {

    const requestedTime = $(this).attr("duration");

    switch (requestedTime) {
        case undefined: return;
        case null: return;
        case "tdy": { view.start = midnight(); break }
        case "all": { view.start = oldestFeed * 1000; break }
        default: { view.start = (newestFeed - requestedTime * 3600) * 1000; break }
    }

    view.end = newestFeed * 1000;

    showHumanWeAreLoadingCharts($(this));

});

$(".chart").bind("plotselected", async function (_event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;

    showHumanWeAreLoadingCharts($(this));
});
