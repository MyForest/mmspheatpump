async function updateCurrentStatus() {

    void updateLiveValues()

    void updateToggles()
}

function niceDisplayValue(value, configKey) {

    const displayOptions = chartSeriesByConfigKey[configKey] || {}
    if (displayOptions.scale == null) displayOptions.scale = 1;

    const scaledValue = value * displayOptions.scale;

    if (displayOptions.precision != null) return scaledValue.toPrecision(displayOptions.precision)
    if (displayOptions.fixed != null) return scaledValue.toFixed(displayOptions.fixed)

    return scaledValue;
}

function niceDisplayUnit(configKey) {
    const displayOptions = chartSeriesByConfigKey[configKey] || {}

    if (displayOptions.scaledUnit) return displayOptions.scaledUnit

    const feedMeta = feedsByConfigKey[configKey]
    return feedMeta.unit

}

async function updateLiveValues() {
    $("[liveValueFeed]").each(function () {
        const jqueryElement = $(this)

        const configKey = jqueryElement.attr("liveValueFeed")

        const feedMeta = feedsByConfigKey[configKey]

        if (feedMeta) {

            const value = feedMeta.value;

            if (value) {
                jqueryElement.text(niceDisplayValue(value, configKey))
                jqueryElement.next().text(niceDisplayUnit(configKey))
            } else {
                jqueryElement.text("---")
                jqueryElement.next().text("")
            }

            void setTitleBasedOnFeed(jqueryElement, configKey)
            void setTitleBasedOnFeed(jqueryElement.next(), configKey)

        } else {
            jqueryElement.text("n/a")
            jqueryElement.attr("title", "Unable to find feed for '" + configKey + "' which would be used to show the value")
        }
    })
}

async function setTitleBasedOnFeed(jqueryElement, configKey) {
    const appFeed = config.app[configKey]
    if (appFeed) {
        description = "Based on '" + configKey + "' feed which is described as:\n" + appFeed.description
        jqueryElement.attr("title", description)
    }
}

/** Toggles a class depending on whether a feed is zero or not */
async function updateToggles() {

    $("[toggleFeed][toggleClass]").each(function () {

        const configKey = $(this).attr("toggleFeed")
        const feedMeta = feedsByConfigKey[configKey]

        if (feedMeta) {
            const thresholdClassName = $(this).attr("toggleClass")
            if (feedMeta.value) {
                $(this).addClass(thresholdClassName)
            } else {
                $(this).removeClass(thresholdClassName)
            }
            void setTitleBasedOnFeed($(this), configKey)

        } else {
            // Couldn't find the source data so explain the toggle
            $(this).attr("title", "Unable to find feed '" + configKey + "' which would be used to show status")
        }
    })

    const hotWaterTemperature = feedsByConfigKey["TankWaterTemperature"].value

    $(".cylinder_active").attr("title", "TankWaterTemperature is " + hotWaterTemperature + " °C")
}