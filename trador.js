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

a().done(function(a){
	console.log(findAskVolume(a.asks))
});

