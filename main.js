ymaps.ready(init);
var mapCenter = [55.755381, 37.619044], 
	myMap, 
	сlickCoords,
	clickAddress,
	clusterer,
 // Создаем собственный макет с информацией о выбранном геообъекте.
     customItemContentLayout;
function onCloseWindow() {
	commentsWindow.classList.toggle('show');
}

function onAddComment() {
	var d = new Date(),
	clickObject =  {
		"op": "add",
		"review": {
			"coords": clickCoords, 
			"address": clickAddress,
			"name": nameInp.value,
			"place": companyInp.value,
			"text": commentInp.value,
			"date": d.toLocaleString()
		}
	};
	var req = new XMLHttpRequest();
	req.responseType = 'json';
	req.open('POST', 'http://localhost:3000', true);
	req.onload = function() {
		var noCommentsEl = document.getElementById("noComments");
		if(noCommentsEl !== null)
			noCommentsEl.parentNode.removeChild(noCommentsEl);

		console.log(req.response);
		clusterer.add(getPlaceMark(clickObject.review));
	    comments.innerHTML += getLiHtmlByObject(clickObject.review);//'<li><p><b>'+ nameInp.value +'</b> '+ commentInp.value +'</p></li>';
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
	            balloonX: valueObj.coords.x,
	            balloonY: valueObj.coords.y,
	            balloonContentHeader: valueObj.place,
	            balloonContentAddress: valueObj.address,
	            balloonContentComment: valueObj.text,
	            // balloonContentLayout: customItemContentLayout,
	            // balloonPanelMaxMapArea: 0,
	            hintContent: valueObj.place + valueObj.address + valueObj.text
	        }, {
	        	balloonContentLayout: customItemContentLayout
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
	document.addEventListener('click', onClick)
//	readBtn.addEventListener('click', onReadComments);
});

function onClick(e) {
	if(e.target == myMap.balloon)
	{
		return;	
	}
	if(e.target.parentElement.classList.contains('ballon_body'))
	{
		e.preventDefault();
		clickCoords = { 'x': e.target.getAttribute('d_x'), 'y':  e.target.getAttribute('d_y') };
		clickAddress = e.target.innerHTML;
		console.log(clickCoords);
		openCommentsWindow(e.clientX, e.clientY, clickCoords, clickAddress);
	}
}

function init () {
	customItemContentLayout =  ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class=ballon_body><a href="#" d_x="{{properties.balloonX|raw}}" d_y="{{properties.balloonY|raw}}">{{ properties.balloonContentAddress|raw }}</a></div>' +
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
        clusterBalloonContentLayoutHeight: 160,
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

	//clusterer.addEventListener('click', onClickClaster);
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
    
    clusterer.events.add('click', function(e){
    	if(commentsWindow.classList.contains('show'))
	    	commentsWindow.classList.toggle('show');
    })
    onLoadInit();    
}

function onClickClaster(e)
{
	alert('Клстер');
}

function openCommentsWindow(left, top, coords, address)
{
	myMap.balloon.close();
	title.innerHTML = address;
	title.setAttribute('title', address);
	commentsWindow.style.top = calcY(top) + 'px';
	commentsWindow.style.left = calcX(left) + 'px'; 
	comments.innerHTML = '';
	if(!commentsWindow.classList.contains('show'))
	    commentsWindow.classList.toggle('show');

	var p = new Promise(function(resolve, reject){
    	var req = new XMLHttpRequest();
		req.open('POST', 'http://localhost:3000', true);
		req.responseType = 'json';
		req.onload = function(){
			resolve(req.response);	
		} 
		req.onerror = function(){ 
			reject(address);
		} 
		var body = {
			op: "get", 
			address: address
		}
		req.send(JSON.stringify(body));
	}).then(function(response){
		if(response === null) {
			return;
		}
		if(response.length == 0){
			comments.innerHTML += '<li id="noComments">Пока нет отзывов<li>';
			return;
		}
		comments.innerHTML = '';
		for (var key in response) {
			comments.innerHTML += getLiHtmlByObject(response[key]);
		}
    }, 
    function(address){
    	alert('Ошибка при получении отзывов по адресу: ' + address);
    });
}

function getLiHtmlByObject(obj)
{
	return '<li><p><b>'+ obj.name +'</b>   '+ obj.place + '</p>'+
								  '<p>' + obj.text  +  '</p></li>'
}

function calcX(left)
{
	if(left + commentsWindow.offsetWidth > document.body.clientWidth)
	{ 
		var delta = document.body.clientWidth - commentsWindow.offsetWidth;
		if(delta < 0)
			return 0;
		else 
			return delta;
	}
	
	return left;
}

function calcY(top)
{
	if(top + commentsWindow.offsetHeight > document.body.clientHeight)
	{
		var delta = document.body.clientHeight - commentsWindow.offsetHeight;
		if(delta < 0)
			return 0;
		else
			return delta;
	}
	return top;
}
