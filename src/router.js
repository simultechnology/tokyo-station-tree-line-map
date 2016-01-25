(function () {
    var map = new L.Map('map', {
        center: new L.LatLng(35.682000, 139.764300), zoom: 18
    });
    var googleLayer = new L.Google('ROADMAP');
    map.addLayer(googleLayer);
    googleLayer.setOpacity(1);
    var selectedMap = 'BLANK';

    var myLayer = L.tileLayer(
      "http://navi-sv.koseidosokui.tokyo:10085/con00-cgi/getRaster/1.0.0/2015RASP1/default/EPSG3857/{z}/{y}/{x}.png"
    );
    map.addLayer(myLayer);
    myLayer.setOpacity(0);
    $('.leaflet-google-layer').css('opacity', 0);

    $('#btn-container .btn').on('click', function(e) {
        var value = $(this).attr('value');
        buffer = [];
        selectedMap = value;
        if (myLayer) {
            map.removeLayer(myLayer);
        }
        if (value === 'BLANK') {
            myLayer.setOpacity(0);
            $('.leaflet-google-layer').css('opacity', 0);

        } else if (value === 'NAVI1TB1') {

            $('.leaflet-google-layer').css('opacity', 0.3);
            myLayer = L.tileLayer(
              "http://navi-sv.koseidosokui.tokyo:10085/con00-cgi/getRaster/1.0.0/" + value + "/default/EPSG3857/{z}/{y}/{x}.png"
            );
            map.addLayer(myLayer);

            drawLines();
            //$.get('data/NAVI1TB1.csv').then(
            //  function(data) {
            //    if (typeof data === 'string') {
            //        var json = JSON.parse(data);
            //        drawLines(json);
            //    }
            //});

        } else if (value !== 'BLACK') {
            $('.leaflet-google-layer').css('opacity', 0.3);
            myLayer = L.tileLayer(
              "http://navi-sv.koseidosokui.tokyo:10085/con00-cgi/getRaster/1.0.0/" + value + "/default/EPSG3857/{z}/{y}/{x}.png"
            );
            map.addLayer(myLayer);
        } else {
            $('.leaflet-google-layer').css('opacity', 1);
        }
        e.stopImmediatePropagation();
        drawLines();
    });


    function getSquareLatLngs(yIdx, xIdx, squareSize) {
        var latLng = map.containerPointToLatLng(L.point(xIdx * squareSize, yIdx * squareSize));
        var latLng1 = map.containerPointToLatLng(L.point((xIdx + 1) * squareSize, yIdx * squareSize));
        var latLng2 = map.containerPointToLatLng(L.point((xIdx + 1) * squareSize, (yIdx + 1) * squareSize));
        var latLng3 = map.containerPointToLatLng(L.point(xIdx * squareSize, (yIdx + 1) * squareSize));

        return [latLng, latLng1, latLng2, latLng3];
    }

    var polylines = [], lavatories = [];

    var FLOOR_MAPPING_INFO = {
        "1" : "NAVI1T1",
        "-1" : "NAVI1TB1",
        "-2" : "NAVI1TB2"
    };

    var ROUTE_FLOOR = {
        "BLANK": 'data/NAVI1TB1.csv',
        "BLACK": 'data/NAVI1TB1.csv',
        "2015RASP1": 'data/NAVI1TB1.csv',
        "NAVI1TB1": 'data/NAVI1TB1.csv',
        "NAVI1TB2": 'data/NAVI1TB2.csv',
        "NAVI1T1": 'data/NAVI1T1.csv'
    };
    function getRoutes(map_name, func) {
//    console.log(ROUTE_FLOOR);
        if(ROUTE_FLOOR && ROUTE_FLOOR.hasOwnProperty(map_name)) {
            $.get(ROUTE_FLOOR[map_name]).then(func);
        }
    }

    function drawLines() {
        polylines = clearObjects(polylines);

        addPoiToMap('data/lavatory.csv');

        var squareSize = 25;

        var horizontalCounts = window.innerWidth / squareSize;
        var verticalCounts = window.innerHeight / squareSize;
        getRoutes(selectedMap, function(data) {
            if (typeof data === 'string') {
                var routes = JSON.parse(data);
                for (var i = 0; i <= horizontalCounts; i++) {
                    for (var j = 0; j <= verticalCounts; j++) {
                        var squareLatLngs = getSquareLatLngs(j, i, squareSize);
                        var polyline = L.polyline(squareLatLngs, {
                            color: '#333', weight: 1, opacity: 0.8
                        }).addTo(map);

                        for (var l = 0; l < routes.length; l++) {
                            var isContain = polyline.getBounds().contains(routes[l]);
                            if (isContain) {
                                polyline.setStyle({
                                    color: 'black', weight: 1, fill: true, fillOpacity: 0.8, fillColor: '#ff8c00'
                                });
                                break;
                            }
                        }
                        polylines.push(polyline);
                    }
                }
            }
        });

    }

    var LavatoryIcon = L.Icon.extend({
        options: {
            iconUrl: 'img/lavatory.jpg',
            iconSize:     [30, 30]
        }
    });

    function addPoiToMap(url) {

        lavatories = clearObjects(lavatories);

        $.get(url)
          .then(function(data) {
              var json = JSON.parse(data);
              for (var i = 0; i < json.length; i++) {
                  if (FLOOR_MAPPING_INFO[json[i][2]] === selectedMap ||
                    (selectedMap === '2015RASP1' && json[i][2] === -1) ||
                    (selectedMap === 'BLANK' && json[i][2] === -1) ||
                    (selectedMap === 'BLACK' && json[i][2] === -1)) {

                      var lMarker = L.marker([json[i][1], json[i][0]], {icon: new LavatoryIcon()});
                      lMarker.addTo(map);
                      lavatories.push(lMarker);
                  }
              }
          });
    }

    function clearObjects(objects) {
        if (objects) {
            for (var i = 0; i < objects.length; i++) {
                map.removeLayer(objects[i]);
            }
        }
        return [];
    }

    drawLines();

    var timer = false;
    $(window).resize(function() {
        if (timer !== false) {
            clearTimeout(timer);
        }
        timer = setTimeout(function() {
            //console.log('resized');
            drawLines();

        }, 200);
    });
//var rec = $("#recode");
//var stop = $("#stop");
//var buffer = [];


    map.on('click', function(e) {
        console.log("[" + e.latlng.lat + ", " + e.latlng.lng + "],");
////    var point = [e.latlng.lat, e.latlng.lng];
//    var index = -1;
//    var buf = 10000;
//    for (var ii=0;ii<buffer.length;ii++) {
//        //console.log(Math.round(buffer[ii][0] * buf), Math.round(e.latlng.lat * buf), Math.round(buffer[ii][1] * buf), Math.round(e.latlng.lng * buf));
//        if(Math.round(buffer[ii][0] * buf) == Math.round(e.latlng.lat * buf) && Math.round(buffer[ii][1]*buf) == Math.round(e.latlng.lng * buf))
//            index = ii;
//    }
//    if(index<0)
//        buffer.push([e.latlng.lat, e.latlng.lng]);
//    else
//        buffer.splice(index);
//    drawLines(map);
    });

    var tid = -1;
    map.on('moveend', function() {
        if(tid>0)
            clearTimeout(tid);

        tid = setTimeout(function () {
            drawLines();
        }, 0);
    });
} ());

