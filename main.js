ymaps.ready(init);
var myMap, myPlacemark;

function onCloseWindow() {
	commentsWindow.classList.toggle('show');
}

new Promise(function(resolve) {
	if(document.readyState === 'complete') {
		resolve();
	}
	else {
		window.onload = resolve;
	}
}).then(function() {
	//Убираем окно с кмментариями
	closeBtn.addEventListener('click', onCloseWindow);
});

function init () {
    myMap = new ymaps.Map("map", {
        center: [57.5262, 38.3061], // Углич
        zoom: 11
    }, {
        balloonMaxWidth: 200,
        searchControlProvider: 'yandex#search'
    });

   // Слушаем клик на карте
    myMap.events.add('click', function (e) {
        if(!commentsWindow.classList.contains('show'))
        	commentsWindow.classList.toggle('show');
        var coords = e.get('coords');
        getAddress(coords);
    });

 
    // Определяем адрес по координатам (обратное геокодирование)
    function getAddress(coords) {
        //myPlacemark.properties.set('iconContent', 'поиск...');
        ymaps.geocode(coords).then(function (res) {
			
            var firstGeoObject = res.geoObjects.get(0);
           
            myMap.hint.open(myMap.Point(100, 100), "Москва");
            
        });
	}
}

