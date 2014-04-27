function geocode(address, callback) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            callback(results[0].geometry.location);
        } else {
            alert("Location " + address + "not found");
        }
    });
}

;$(document).ready(function () {


    $('#hour').val((new Date().getHours() + 1)%24);
    $('#searchButton').click(function () {
            weather($('#hour').val(), 2, function(result)
            {
                console.log(result);
                endHour = result.endHour;
                startHour = result.startHour;
                $('#weather').html(result.message + "<img src='" + result.icon + "'/>");
                sunsetSunrise(endHour, function(result)
                {
                    if ((startHour > result.sunsetHour && startHour < 24) || (startHour < result.sunsetHour && (startHour >= 0 && startHour < result.sunriseHour)))
                    {
                        $('#sunsetSunrise').html("You will be biking in the dark, after sunset at " + result.sunsetHour + ":" + result.sunsetMinute);
                    }
                    else
                    {
                        $('#sunsetSunrise').html("You won't make it before sunset at " + result.sunsetHour + ":" + result.sunsetMinute);
                    }
                });
            });
            // locations
            var from;
            var fromStation;
            var to;
            var toStation;

            geocode($('#from').val(), function (location) {
                from = {location: location, lat: location.lat(), lng: location.lng()};
                $("#resultFrom").text(location);
                // translate to
                console.log('from', from);
                geocode($('#to').val(), function (location) {
                    to = {location: location, lat: location.lat(), lng: location.lng()};
                    $("#resultTo").text(location);
                    console.log('to', to);
                    // veturilo
                    findStations(function (stations) {
                        fromStation = findNearestStation(from, stations);
                        console.log('fromStation', fromStation);
                        $('#fromStation').text(fromStation.name);
                        $('#fromStationBikes').text(fromStation.bikes);
                        toStation = findNearestStation(to, stations);
                        console.log('toStation', toStation);
                        $('#toStation').text(toStation.name);

                        // draw on map
                        var fromLL = new google.maps.LatLng(from.lat, from.lng);
                        var toLL = new google.maps.LatLng(to.lat, to.lng);
                        var fromStationLL = new google.maps.LatLng(fromStation.lat, fromStation.lng);
                        var toStationLL = new google.maps.LatLng(toStation.lat, toStation.lng);


                        calcRoute(fromLL, fromStationLL, toStationLL, toLL);

                    });
                });


            });

            return false;
        }
    );


});;var mapOptions = {
    zoom: 12,
    center: new google.maps.LatLng(52.2324, 21.0127),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    panControl: true,
    panControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
    },
    zoomControl: true,
    zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.RIGHT_TOP
    },
    scaleControl: true,
    scaleControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
    },
    streetViewControl: true,
    streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
    }
};

var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
var bikeLayer = new google.maps.BicyclingLayer();
var markers =
{
    startWalk: new google.maps.Marker({
        map: map,
        icon: 'img/start-walk.png'
    }),
    startBike: new google.maps.Marker({
        map: map,
        icon: 'img/start-bike.png'
    }),
    stopBike: new google.maps.Marker({
        map: map,
        icon: 'img/stop-bike.png'
    }),
    stopWalk: new google.maps.Marker({
        map: map,
        icon: 'img/stop-walk.png'
    })
};


var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
var bikeLayer = new google.maps.BicyclingLayer();
bikeLayer.setMap(map);


var rendererWalkToStationsOptions = new google.maps.Polyline({
    strokeColor: "#00FF00"
});
var rendererBikingOptions = new google.maps.Polyline({
    strokeColor: "#FF0000"
});
var rendererFromStationOptions = new google.maps.Polyline({
    strokeColor: "#0000FF"
});

var directionsService = new google.maps.DirectionsService();
var directionsDisplayWalkToStation = new google.maps.DirectionsRenderer({preserveViewport: true, polylineOptions: rendererWalkToStationsOptions, markerOptions: {visible: false}});
var directionsDisplayWalkFromStation = new google.maps.DirectionsRenderer({preserveViewport: true, polylineOptions: rendererFromStationOptions, markerOptions: {visible: false}});
var directionsDisplayBike = new google.maps.DirectionsRenderer({preserveViewport: true, polylineOptions: rendererBikingOptions, markerOptions: {visible: false}});

//function that calculate routes
function calcRoute(from, fromStation, toStation, to) {

    directionsDisplayWalkToStation.setMap(map);
    directionsDisplayWalkFromStation.setMap(map);
    directionsDisplayBike.setMap(map);

    new google.maps.Marker({
        position: from,
        map: map,
        icon: 'img/start-walk.png'
    });
    new google.maps.Marker({
        position: fromStation,
        map: map,
        icon: 'img/start-bike.png'
    });
    new google.maps.Marker({
        position: toStation,
        map: map,
        icon: 'img/stop-bike.png'
    });
    new google.maps.Marker({
        position: to,
        map: map,
        icon: 'img/stop-walk.png'
    });

    var bounds = new google.maps.LatLngBounds();
    bounds.extend(from);
    bounds.extend(to);
    bounds.extend(fromStation);
    bounds.extend(toStation);
    console.log("Bounding to ", bounds);

    map.panToBounds(bounds);
    map.fitBounds(bounds);


    var requestToStation = {
        origin: from,
        destination: fromStation,
        transitOptions: {
            departureTime: new Date(1337675679473)
        },
        travelMode: google.maps.TravelMode.WALKING
    };

    var requestBicycling = {
        origin: fromStation,
        destination: toStation,
        transitOptions: {
            departureTime: new Date(1337675679473)
        },
        travelMode: google.maps.TravelMode.BICYCLING
    };

    var requestFromStation = {
        origin: toStation,
        destination: to,
        transitOptions: {
            departureTime: new Date(1337675679473)
        },
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(requestToStation, function (result, status) {
        console.log("Status", status);
        if (status == google.maps.DirectionsStatus.OK) {
            console.log("Set directions");
            directionsDisplayWalkToStation.setDirections(result);
        }
        else {
            console.error("Error", status);
        }
        var duration = result.routes[0].legs[0].duration.value;
        $("#toStationDuration").html(result.routes[0].legs[0].duration.text);
        console.log("Walk to station:", result.routes[0].legs[0].duration);
        directionsService.route(requestBicycling, function (result, status) {
            console.log("Status", status);
            if (status == google.maps.DirectionsStatus.OK) {
                console.log("Set bicycling directions");
                directionsDisplayBike.setDirections(result);
            }
            else {
                console.error("Error", status);
            }
            duration = duration + result.routes[0].legs[0].duration.value;
            console.log("Biking duration:", result.routes[0].legs[0].duration);
            directionsService.route(requestFromStation, function (result, status) {
                console.log("Status", status);
                if (status == google.maps.DirectionsStatus.OK) {
                    console.log("Set directions");
                    directionsDisplayWalkFromStation.setDirections(result);
                }
                else {
                    console.error("Error", status);
                }
                duration = duration + result.routes[0].legs[0].duration.value;
                $("#toEndDuration").html(result.routes[0].legs[0].duration.text);
                var endTime = (parseInt($('#hour').val(), 10)) + (duration / 3600) % 24;
                $("#endTime").html(Math.ceil(endTime));

                console.log("Total duration", duration);
                console.log("Walk to end:", result.routes[0].legs[0].duration);

                weather($('#hour').val(), Math.ceil(duration / 3600), function(result)
                {
                console.log("Result", result);
                endHour = result.endHour;
                startHour = result.startHour;
                $('#weather').html(result.message + "<img src='" + result.icon + "'/>");
                sunsetSunrise(endHour, function(result)
                {
                  $('#sunsetSunrise').html("");
                    if ((startHour > result.sunsetHour && startHour < 24) ||
                      (startHour < result.sunsetHour &&
                        (startHour >= 0 && startHour < result.sunriseHour)))
                    {
                        $('#sunsetSunrise').html("You will be biking in the dark, after sunset at " + result.sunsetHour + ":" + result.sunsetMinute);
                    }
                    else
                    {
                        $('#sunsetSunrise').html("You won't make it before sunset at " + result.sunsetHour + ":" + result.sunsetMinute);
                    }
                });
            });
            });
        });

    });


};function findStations(callback) {
    $.ajax({
        type: 'GET',
        url: 'http://localhost:8765/mockdata/veturilo.xml',
        dataType: 'xml',
        success: function (xml) {
            var stations = [];
            $(xml).find('place').each(function () {
                var place = $(this);
                var station = {
                    name: place.attr('name'),
                    lat: place.attr('lat'),
                    lng: place.attr('lng'),
                    bikes: place.attr('bikes'),
                    racks: place.attr('bike_racks')
                };
                stations.push(station);
            });
            callback(stations);
        }
    });
}

var distanceSquare = function (pointA, pointB) {
    var x = pointA.lat - pointB.lat;
    var y = pointA.lng - pointB.lng;
    return (x * x) + (y * y);
};


function findNearestStation(point, stations) {
    var nearest = null;
    var smallestDistanceSquare;
    $.each(stations, function (i, station) {
        var distance = distanceSquare(point, station);
        if ((nearest === null) || ((smallestDistanceSquare > distance) && (stations.bikes != '0'))) {
            nearest = station;
            smallestDistanceSquare = distance;
        }
    });
    return nearest;
}

;function weather(startHour, hoursOnARoad, callback) {
    $.ajax({ url: "http://api.wunderground.com/api/086afffe3fa8ba4d/hourly/q/Poland/Warsaw.json", dataType: "jsonp", success: function (parsed_json) {
        var temp_c = parsed_json.hourly_forecast[0].temp.metric;
        var beginHour = parsed_json.hourly_forecast[0].FCTTIME.hour;
        var offset = startHour - beginHour;
        var x = "";
        var conditions = [];
        conditions[0]="Thunderstorms";
        conditions[1]="Thunderstorm";
        conditions[2]="Chance of Thunderstorms";
        conditions[3]="Chance of Thunderstorm";
        conditions[4]="Snow";
        conditions[5]="Chance of Snow";
        conditions[6]="Sleet";
        conditions[7]="Chance of Sleet";
        conditions[8]="Freezing Rain";
        conditions[9]="Rain";
        conditions[10]="Chance of Freezing Rain";
        conditions[11]="Chance of Rain";
        conditions[12]="Scattered Clouds";
        conditions[13]="Overcast";
        conditions[14]="Cloudy";
        conditions[15]="Mostly Cloudy";
        conditions[16]="Partly Cloudy";
        conditions[17]="Flurries";
        conditions[18]="Fog";
        conditions[19]="Haze";
        conditions[20]="Sunny";
        conditions[21]="Mostly Sunny";
        conditions[22]="Partly Sunny";
        conditions[23]="Clear";
        conditions[24]="Unknown";
        var currentJ = 100;
        var worstWeather = 100;
        for (var i = offset; i < hoursOnARoad; i++)
        {
            for (j = 0; j < 25; ++j )
            {
                if (parsed_json.hourly_forecast[i].condition === conditions[j])
                {
                    if (j < currentJ)
                    {
                        currentJ = j;
                        worstWeather = i;
                    }
                }
            }
        }
        var result = {};

        if (currentJ < 2)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> There will be thunderstorms during your trip";
        }
        if (currentJ > 1 && currentJ < 4)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> There might be thunderstorms during your trip";
        }
        if (currentJ == 4)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It will be snowing during your trip";
        }
        if (currentJ == 5)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It might be snowing during your trip";
        }
        if (currentJ == 6)
        {
           result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It will be sleeting during your trip";
        }
        if (currentJ == 7)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It might be sleeting during your trip";
        }
        if (currentJ == 8 || currentJ == 9)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It will be raining during your trip";
        }
        if (currentJ == 10 || currentJ == 11)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It might be raining during your trip";
        }
        if (currentJ > 11 && currentJ < 20)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It will be cloudy during your trip";
        }
        if (currentJ > 19)
        {
            result.message = "Current temperature in Warsaw is " + temp_c + ".</br> It will be great weather during your trip";
        }

        console.log(parsed_json.hourly_forecast);

        result.icon = parsed_json.hourly_forecast[0].icon_url;
        result.endHour = parsed_json.hourly_forecast[0].offset + hoursOnARoad.hour;
        result.startHour = startHour;

        callback(result);
    } });
}
function sunsetSunrise(endHour, callback) {
    $.ajax({
        url: "http://api.wunderground.com/api/086afffe3fa8ba4d/astronomy/q/Poland/Warsaw.json",
        dataType: "jsonp",
        success: function (parsed_json) {
            var result = {
                sunriseHour: parsed_json.moon_phase.sunrise.hour,
                sunriseMinute:  parsed_json.moon_phase.sunrise.minute,
                sunsetHour:  parsed_json.moon_phase.sunset.hour,
                sunsetMinute: parsed_json.moon_phase.sunset.minute
            };
            callback(result);
        }
    });
}