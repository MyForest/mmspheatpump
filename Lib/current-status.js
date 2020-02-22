async function updateCurrentStatus() {

    void updateLiveValues()

    void updateToggles()
}

async function updateLiveValues() {
    $("[liveValueFeed]").each(function () {
        const jqueryElement = $(this)

        const configKey = jqueryElement.attr("liveValueFeed")

        const configItem = config.app[configKey]

        if (configItem == null) {
            console.error("It looks like a developer error has included a config key for " + configKey)
            return;
        }

        const displayOptions = config.app[configKey].displayOptions || {}
        if (displayOptions.scale == null) displayOptions.scale = 1;

        const feedMeta = feedsByConfigKey[configKey]

        if (feedMeta) {

            const value = feedMeta.value

            const scaledValue = value * displayOptions.scale;
            const unit = displayOptions.scaledUnit || feedMeta.unit;

            if (scaledValue) {
                if (displayOptions.precision != null) jqueryElement.text(scaledValue.toPrecision(displayOptions.precision))
                if (displayOptions.fixed != null) jqueryElement.text(scaledValue.toFixed(displayOptions.fixed))
                // If you didn't set either of those then no value will show

                jqueryElement.next().text(unit)

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