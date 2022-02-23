<?php
    global $path, $session, $v, $appPublicRoot;
    
    $appPublicRoot=$path.'Modules/app/apps/MyForest/mmspheatpump/';
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/moment.min.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.resize.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<!-- EmonCMS 10.x -->
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<!-- EmonCMS 11.x -->
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>


<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/humanize-duration/3.21.0/humanize-duration.min.js"></script>


<link href="<?php echo $appPublicRoot; ?>style/current-status.css" rel="stylesheet">
<link href="<?php echo $appPublicRoot; ?>style/charts.css" rel="stylesheet">
<link href="<?php echo $appPublicRoot; ?>style/main.css" rel="stylesheet">

<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/application-configuration.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/error.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/freshness.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/time.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/current-status.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/energy-summary.js"></script>


<div>
    <div id="app-block" style="display:none">
        <div class="col1">
            <div class="col1-inner">
                <div class="block-bound">
                    <div style="float:right">
                        <div class="openconfig config-open" style="padding-top:10px; padding-right:10px; cursor:pointer">
                            <i class="icon-wrench icon-white"></i>
                        </div>
                    </div>

                    <div class="block-title">
                        <span data-config-key="WaterPump1Status" data-toggle-class="heating">Live Heat Pump Status</span>
                        <img data-config-key="WaterPump2Status" data-toggle-class="heating" src="<?php echo $appPublicRoot; ?>images/radiator_128.png">
                        <img data-config-key="WaterPump4Status" data-toggle-class="heating" src="<?php echo $appPublicRoot; ?>images/cylinder_128.png">
                        <div class="feed-refresh-indicator">...loading...</div>
                    </div>
                </div>

                <div class="current-status">
                    <table>
                        <tr>

                            <td>
                                <div class="title">Efficiency</div>
                                <div>
                                    <span liveValueFeed="RealtimeCoP" scale="100" fixed="0"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Flow</div>
                                <div>
                                    <span liveValueFeed="FlowTemperature" fixed="1"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Return</div>
                                <div>
                                    <span liveValueFeed="ReturnTemperature" fixed="1"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Outside</div>
                                <div>
                                    <span liveValueFeed="OutdoorTemperature" fixed="1"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Effective</div>
                                <div>
                                    <span liveValueFeed="EffectiveTemperature" fixed="1"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Using</div>
                                <div>
                                    <span liveValueFeed="TotalEnergyConsumedRate1" precision="2" scale="0.001"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                            <td>
                                <div class="title">Producing</div>
                                <div>
                                    <span liveValueFeed="TotalEnergyProducedRate1" precision="2" scale="0.001"></span>
                                    <span class="units"></span>
                                </div>
                            </td>

                        </tr>
                    </table>
                </div>

            </div>
        </div>


        <div class="col1">
            <div class="col1-inner">

                <div class="block-bound">
                    <span class="bluenav panright">></span>
                    <span class="bluenav panleft"><</span>
                    <span class="bluenav zoomout">-</span>
                    <span class="bluenav zoomin">+</span>
                    <span class="bluenav duration" title="All the data" duration='all'>all</span>
                    <span class="bluenav duration" title="One month" duration='720'>m</span>
                    <span class="bluenav duration" title="One week" duration='168'>w</span>
                    <span class="bluenav duration" duration='24'>24h</span>
                    <span class="bluenav duration" title="Today" duration='tdy'>tdy</span>
                    <span class="bluenav duration" duration='3'>3h</span>
                    <span class="bluenav duration" duration='1'>1h</span>
                    <span class="bluenav duration" duration='0.166'>10m</span>
                    <span class="bluenav update-controls auto-update-enabled">Show Latest</span>

                    <div class="block-title">
                        <span class="review-mode">Watching</span>
                        <span class="time-window"></span>
                    </div>
                </div>

                
                <div class="section-heading">Energy
                    <span data-hide-efficiency="1" data-input-config-key="TotalEnergyConsumed1" data-output-config-key="TotalEnergyProduced1"></span>
                </div>

                <div data-label="Power" data-config-keys="solar,HeatingEnergyConsumedRate1,HeatingEnergyProducedRate1,HotWaterEnergyConsumedRate1,HotWaterEnergyProducedRate1,HeatPumpFrequency" class="chart"></div>


                <div class="section-heading">Efficiency
                    <span data-hide-consumption="1" data-input-config-key="TotalEnergyConsumed1" data-output-config-key="TotalEnergyProduced1"></span>
                </div>

                <div data-config-keys="Space Heating CoP,Hot Water CoP,Nominal CoP@Design,Nominal CoP@Flow" class="chart"></div>


                <div class="section-heading">
                    <span data-config-key="WaterPump2Status" data-toggle-class="heating">
                        <img src="<?php echo $path; ?>Modules/app/apps/MyForest/mmspheatpump/images/radiator_128.png">
                        Space Heating
                    </span>
                    <span class="energy-summary" data-input-config-key="HeatingEnergyConsumed1" data-output-config-key="HeatingEnergyProduced1">
                </div>

                <div data-label="Temperature" data-config-keys="FlowTemperature,ReturnTemperature,OutdoorTemperature,RoomTemperatureZone1,EffectiveTemperature,OutdoorDewPoint,TargetHCTemperatureZone1" class="chart"></div>


                <div class="section-heading">
                    <span data-config-key="WaterPump4Status" data-toggle-class="heating">
                        <img src="<?php echo $appPublicRoot; ?>images/cylinder_128.png">
                        Hot Water
                    </span>
                    <span class="energy-summary" data-input-config-key="HotWaterEnergyConsumed1" data-output-config-key="HotWaterEnergyProduced1">
                </div>

                <div  data-label="Temperature" data-config-keys="FlowTemperature,ReturnTemperature,SetTankWaterTemperature,TankWaterTemperature" class="chart"></div>


                <div class="section-heading">Pumps</div>

                <div data-config-keys="OperationMode,WaterPump1Status,WaterPump2Status,WaterPump4Status" class="chart"></div>

            </div>
        </div>
    </div>
</div>

<div id="app-setup" class="block py-2 px-5 hide">
    <h2 class="appconfig-title">MMSP Heat Pump</h2>

    <div class="appconfig-description">
        <div class="appconfig-description-inner">
            <p>A heat pump with considerable details available as a result of having a 
                <a href="https://www.ofgem.gov.uk/key-term-explained/metering-and-monitoring-service-package-mmsp">Metering and Monitoring Service Package</a> (MMSP) installed.
            </p>
            <h3>Configuring Feeds</h3>
            <p>The list of feeds looks daunting but you can use this <a href="<?php echo $appPublicRoot; ?>device/mmsp.json">MMSP ASHP device file</a> which contains all the feeds you need.</p>
            <p>This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively
                feeds can be selected by clicking on the edit button.</p>
            <p>
                <img id="appsetup_image" src="<?php echo $appPublicRoot; ?>images/mmspheatpump.gif">
            </p>
            <p>
                Licence: <a href="https://raw.githubusercontent.com/MyForest/mmspheatpump/master/LICENSE">GNU AFFERO GENERAL PUBLIC LICENSE</a>
            </p>
        </div>
    </div>
    <div class="app-config"></div>
</div>
<script>

    // Mostly this script below acts as a way to grab state from the server memory
    // Eventually it calls the method to set up the application on the client-side

    
    // We'll use this refer to things like images and configuration files
    const applicationURL = "<?php echo $appPublicRoot; ?>";


    // Reduce confusion by turning off the configuration page if this user can't make updates
    if (!"<?php echo $session['write']; ?>") $(".openconfig").hide();
    if (!"<?php echo $session['write']; ?>") $(".config-open").hide();



    // Inject the server-stored configuration for this app into the web page so it can use the feed configuration the end-user set up

    // For example, this code might look like this on the client-side if there's a feed mapped by the user:    config.db = {"FlowTemperature":"505"};

    // This is incredibly risky. All sorts of things in the content could scupper us
    // For example a single quote
    try{
        config.db =JSON.parse('<?php echo json_encode($config); ?>');
    }catch{
        app_log("Error","Unable to load your settings, using the defaults")
        config.db={}
    }


    // Use the application name from the server-side
    config.name = "<?php echo $name; ?>";

    // Make it easier to find the application in users task manager
    document.title=config.name + " - " + document.title;

    // Use setTimeout so we can jump into the async world
    setTimeout(configureApplicationOnClientSide, 0)

</script>

<!-- We need the HTML elements to exist so we can bind events to them -->
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/auto-updater.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/time-navigation.js"></script>
<script type="text/javascript" src="<?php echo $appPublicRoot; ?>Lib/charts.js"></script>
