ymaps.ready(init);
var mapCenter = [55.755381, 37.619044], 
	myMap, 
	сlickCoords,
	clickAddress,
	clusterer;

function onCloseWindow() {
	commentsWindow.classList.toggle('show');
}

function onAddComment() {
	 var clickObject =  {
            	"op": "add",
            	"review": {
            		"coords": clickCoords, 
            		"address": clickAddress,
            		"name": nameInp.value,
            		"place": companyInp.value,
            		"text": commentInp.value,
            		"date": ''
            	}
            };
	var req = new XMLHttpRequest();
	req.responseType = 'json';
	req.open('POST', 'http://localhost:3000', true);
	req.onload = function() {
		console.log(req.response);
		clusterer.add(getPlaceMark(clickObject.review));
	    comments.innerHTML += '<li><p><b>'+ nameInp.value +'</b> '+ commentInp.value +'</p></li>';
	};
	req.onerror = function(argument) {
		alert('Не удалось отправить данные на сервер');
	};
  	req.send(JSON.stringify(clickObject));
}

function getPlaceMark(valueObj)
{
	var placemark = new ymaps.Placemark([valueObj.coords.x,valueObj.coords.y], {
	            // Устаналиваем данные, которые будут отображаться в балуне.
	            balloonContentHeader: valueObj.place,
	            balloonContentAddress: valueObj.address,
	            balloonContentComment: valueObj.text 
	        });
	return placemark;
}

function getPlaceMarksByResponses(response)
{
	// Заполняем кластер геообъектами
	var placemarks = [];

	for (var key in response) {
		for (var i = 0; i < response[key].length; i++) {
			placemarks.push(getPlaceMark(response[key][i]));
			comments.innerHTML += '<li><p><b>'+ response[key][i].name +'</b> '+ response[key][i].text +'</p></li>';
		}
	}
	return placemarks;
}

function onLoadInit() {
	var req = new XMLHttpRequest();
	req.open('POST', 'http://localhost:3000', true);
	req.responseType = 'json';
	req.onload = function() {
		console.log(req.response);
		var placemarks = getPlaceMarksByResponses(req.response);
	    clusterer.add(placemarks);
	    myMap.geoObjects.add(clusterer);
		//clusterer.balloon.open(clusterer.getClusters()[0]);
	};
	req.onerror = function(argument) {
		alert('Не удалось прочитать данные с сервера');
	};
	var body = {
		op : 'all'
	}
	req.send(JSON.stringify(body));
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
	addBtn.addEventListener('click', onAddComment);
//	readBtn.addEventListener('click', onReadComments);
});

function init () {
	 // Создаем собственный макет с информацией о выбранном геообъекте.
    var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class=ballon_body><a href="#">{{ properties.balloonContentAddress|raw }}</a></div>' +
        '<div class=ballon_footer>{{ properties.balloonContentComment|raw }}</div>'
    );
	clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        // Устанавливаем стандартный макет балуна кластера "Карусель".
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        // Устанавливаем собственный макет.
        clusterBalloonItemContentLayout: customItemContentLayout,
        // Устанавливаем режим открытия балуна. 
        // В данном примере балун никогда не будет открываться в режиме панели.
        clusterBalloonPanelMaxMapArea: 0,
        // Устанавливаем размеры макета контента балуна (в пикселях).
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        // Устанавливаем максимальное количество элементов в нижней панели на одной странице
        clusterBalloonPagerSize: 5
        // Настройка внешего вида нижней панели.
        // Режим marker рекомендуется использовать с небольшим количеством элементов.
        // clusterBalloonPagerType: 'marker',
        // Можно отключить зацикливание списка при навигации при помощи боковых стрелок.
        // clusterBalloonCycling: false,
        // Можно отключить отображение меню навигации.
        // clusterBalloonPagerVisible: false
    });

    myMap = new ymaps.Map("map", {
        center: mapCenter, // Углич
        zoom: 11
    }, {
        balloonMaxWidth: 200,
        searchControlProvider: 'yandex#search'
    });
    
   // Слушаем клик на карте
    myMap.events.add('click', function(e) {
        var coords = e.get('coords');
        ymaps.geocode(coords).then(function (res) {
	        var firstGeoObject = res.geoObjects.get(0);                                                                                                                              
	        clickAddress = firstGeoObject.properties.get('text');
	        clickCoords = { "x" : coords[0], "y" : coords[1] };
	        openCommentsWindow(e._sourceEvent.originalEvent.pagePixels[0], 
	        				   e._sourceEvent.originalEvent.pagePixels[1],
	        				   clickCoords,
	        				   clickAddress);
	    })
    });
    
    onLoadInit();    
}

function openCommentsWindow(left, top, coords, address)
{
	title.innerHTML = address;
	if(!commentsWindow.classList.contains('show'))
	    commentsWindow.classList.toggle('show');

	commentsWindow.style.top = calcX(top) + 'px';
	commentsWindow.style.left = calcY(left) + 'px'; 
}

function calcX(left)
{
	return left;
}

function calcY(top)
{
	return top;
}
