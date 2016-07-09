var updateTHBUSD = function(){
	$.getJSON('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(a){
		window.localStorage.setItem('THBUSD', a.quotes.USDTHB);
	})
	
}

var findAskVolume = function(a){
	var cumulater = _.map(a, function(b){
		return b
	})
	return cumulater
}

var a = function(){
	return $.getJSON('/bxorderbook', function(a,b){
		return a
	})
};

var afterUpdate = function(a){
	console.log(a)
}

a().done(function(a){
	afterUpdate(a);
});

