async function showHumanWeAreLoadingCharts(whatTheyClicked) {
    $(".chart").addClass("processing")
    $(whatTheyClicked).addClass("processing")
    try {
        await loadDataAndRenderCharts();
    } finally {
        $(whatTheyClicked).removeClass("processing")
    }
}

$(".zoomout").click(function () { view.zoomout(); showHumanWeAreLoadingCharts($(this)); });
$(".zoomin").click(function () { view.zoomin(); showHumanWeAreLoadingCharts($(this)); });
$(".panright").click(function () { view.panright(); showHumanWeAreLoadingCharts($(this)); });
$(".panleft").click(function () { view.panleft(); showHumanWeAreLoadingCharts($(this)); });

$(".duration").click(function () {

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

$(".chart").bind("plotselected", function (_event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;

    showHumanWeAreLoadingCharts($(this));
});
