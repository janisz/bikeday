function geocode(from, callback) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address}, function (results, status) {
        callback(results, status);
    });
}