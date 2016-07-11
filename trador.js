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
		USDTHBRate : null,
		BXOrderbook: null,
		BFXOrderbook: null
	},
	initialize : function(){
		//On production change this to : this.updateRate();
		this.set('USDTHBRate', 35.16);
		this.updateBX();
		this.updateBFX();
	},
	updateRate : function(){
		var master = this;
		updateTHBUSD().done(function(a){
			master.set('USDTHBRate', a.quotes.USDTHB)
		})
	},
	updateBX : function(){
		var master = this;
		return $.getJSON('/bxorderbook', function(a, b){
			master.set('BXOrderbook', a);
			return true
		})
	},
	updateBFX : function(){
		var master = this;
		return $.getJSON('/bfxorderbook', function(a, b){
			master.set('BFXOrderbook', a)
			return true
		})
	},
	getBXBest : function(bidAsk, THBUSD){
		var master = this;
		var rate = THBUSD == 'USD' ? master.get('USDTHBRate') : THBUSD == 'THB' ? 1 : null;
		if (rate == null) {
			throw 'you must specify a currency'
		}
		return {
			Bprice: master.get('BXOrderbook')[bidAsk][0][0] * 1 / rate,
			Bquantity: master.get('BXOrderbook')[bidAsk][0][1]
		}
	},
	getBFXBest: function(bidAsk){
		var master = this;
		return {
			Bprice: master.get('BFXOrderbook')[bidAsk][0].price,
			Bquantity: master.get('BFXOrderbook')[bidAsk][0].amount
		}
	},
	opportunityBXBFX: function(){
		return {
			oppBuyBX : Math.round(10 * (this.getBFXBest('bids').Bprice - this.getBXBest('asks', 'USD').Bprice)) / 10,
			oppBuyBFX : Math.round(10 * (this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks').Bprice)) / 10
		}
	},
	refreshOpp: function(){
		var master = this;
		master.updateBX().done(function(){
			console.log('bx updated')
			master.updateBFX().done(function(){
				console.log('bfx updated');
				console.log(master.opportunityBXBFX())
				return true
			})
		})
	}
})

var quote = new quotation();

