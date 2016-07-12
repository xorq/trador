var updateTHBUSD = function(){
	return $.getJSON('/thbusd', function(a,b){
	})
}

var updateBX = function(){
	return $.getJSON('/bxorderbook', function(a, b){
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

var quotation = Backbone.Model.extend({
	defaults: {
		rates : null,
		BXOrderbook: null,
		BFXOrderbook: null
	},
	initialize : function(){
		//On production change this to : this.updateRate();
		this.set('rates', {usd: 1, thb: 35.16});
		this.updateBX();
		this.updateBFX();
	},
	updateRate : function(){
		var master = this;
		updateTHBUSD().done(function(a){
			var newRates = master.get('rates');
			newRates.thb = a.quotes.USDTHB;
			master.set('rates', rates);
		})
	},
	updateBX : function(){
		var master = this;
		return $.getJSON('/bxorderbook', function(a, b){
			master.set('BXOrderbook', a);
		})
	},
	updateBFX : function(){
		var master = this;
		return $.getJSON('/bfxorderbook', function(a, b){
			master.set('BFXOrderbook', a)
		})
	},
	getBXBest : function(bidAsk, currency){
		var master = this;
		var rate = currency == 'USD' ? master.get('rates').thb : currency == 'THB' ? 1 : null;
		if (rate == null) {
			throw 'you must specify a currency'
		}
		console.log(rate)
		console.log(master.get('BXOrderbook')[bidAsk][0][0])
		return {
			Bprice: master.get('BXOrderbook')[bidAsk][0][0] / rate,
			Bquantity: master.get('BXOrderbook')[bidAsk][0][1]
		}
	},
	getBFXBest: function(bidAsk){
		var master = this;
		return {
			Bprice: master.get('BFXOrderbook')[bidAsk][0].price * 1,
			Bquantity: master.get('BFXOrderbook')[bidAsk][0].amount * 1
		}
	},
	opportunityBXBFX: function(){
		return {
			oppBuyBX : Math.round(10 * (this.getBFXBest('bids').Bprice - this.getBXBest('asks', 'USD').Bprice)) / 10,
			oppBuyBFX : Math.round(10 * (this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks').Bprice)) / 10,
			buyBXat : this.getBXBest('asks', 'THB').Bprice,
			sellBFXat : this.getBFXBest('bids', 'USD').Bprice,
			buyBFXat : this.getBFXBest('asks', 'USD').Bprice,
			sellBFXat : this.getBXBest('bids', 'THB').Bprice
		}
	},
	refreshOpp: function(){
		var master = this;
		master.updateBX().done(function(){
			console.log('bx updated')
			master.updateBFX().done(function(a){
				console.log(master.opportunityBXBFX())
				return true
			})
		})
	}
})

var quote = new quotation();

