

var updateTHBUSD = function(){
	return $.getJSON('/thbusd', function(a,b){
		window.localStorage.setItem('THBUSD', a.quotes.USDTHB);
	})
}

var updateBX = function(){
	return $.getJSON('/bxorderbook', function(a, b){
		window.localStorage.setItem('BXRate', a);
	})
}

var findAskVolume = function(a){
	var cumulater = _.map(a, function(b){
		return b
	})
	return cumulater
}

var afterUpdate = function(a){
	console.log(a)
}

