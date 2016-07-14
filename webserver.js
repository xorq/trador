var FOLDER = '/home/ubuntu'

var request = require('request');
var _ = require('underscore');
var express = require('express');
var app = express();
var $ = require('jquery');
var Backbone = require('backbone');
var rp = require('request-promise');
var PushBullet = require('pushbullet');
var pusher = new PushBullet('o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S');
// pushbullet access token o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S
app.get('/thbusd',function(req, res){
	request.get('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(error, data){
		res.send(data.body)
	})
})

app.get('/underscore.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/underscore/underscore-min.js')
})

app.get('/backbone.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/backbone/backbone-min.js')
})

app.get('/jquery.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/jquery/dist/jquery.min.js')
})

app.get('/trador.js', function(req,res){
	res.sendFile( FOLDER + '/trador.js')
})

app.get('/', function(req, res){
	res.sendFile( FOLDER + '/index.html')
})


var updateTHBUSD = function(){
	return $.getJSON('/thbusd', function(a,b){
	})
}

var quotation = Backbone.Model.extend({
	defaults: {
		rates : null,
		BXOrderbook: null,
		BFXOrderbook: null,
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
			master.set('rates', newRates);
		})
	},
	updateBX : function(then){
		var master = this;
		return rp.get('https://bx.in.th/api/orderbook/?pairing=1', function(error, data){
			master.set('BXOrderbook', JSON.parse(data.body));
			if (typeof then == 'function') {
				then();
			}
		})
	},
	updateBFX : function(then){
		var master = this;
		var payload = {
			"limit_bids": 4,
			"limit_asks": 4,
			"group": 0
		};
		var options = {
			url: 'https://api.bitfinex.com/v1/book/BTCUSD',
			qs: payload
		};
		return rp.get(options, function(error, response, body) {
			master.set('BFXOrderbook', JSON.parse(body));
			if (typeof then == 'function') {
				then();
			}
		});
	},
	getBXBest : function(bidAsk, currency){
		var master = this;
		var rate = currency == 'USD' ? master.get('rates').thb : currency == 'THB' ? 1 : null;
		if (rate == null) {
			throw 'you must specify a currency'
		}
		var bx = master.get('BXOrderbook')
		return {
			Bprice: bx[bidAsk][0][0] / rate,
			Bquantity: bx[bidAsk][0][1]
		}
	},
	getBFXBest: function(bidAsk, currency){
		var master = this;
		var bfx = master.get('BFXOrderbook');
		var rate = currency == 'THB' ? master.get('rates').thb : currency == 'USD' ? 1 : null;
		if (bfx[bidAsk] && bfx[bidAsk][0] && bfx[bidAsk][0].price && bfx[bidAsk][0].amount){
			return {
				Bprice: bfx[bidAsk][0].price * rate,
				Bquantity: bfx[bidAsk][0].amount * 1
			}	
		} else {
			return {
				Bprice: null,
				Bquantity: null
			}
		}
	},
	opportunityBXBFX: function(){
		return {
			oppBuyBX : Math.round(10 * (this.getBFXBest('bids').Bprice - this.getBXBest('asks', 'USD').Bprice)) / 10,
			oppBuyBFX : Math.round(10 * (this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks').Bprice)) / 10,
			buyBXat : this.getBXBest('asks', 'THB').Bprice,
			sellBFXat : this.getBFXBest('bids', 'USD').Bprice,
			buyBFXat : this.getBFXBest('asks', 'USD').Bprice,
			sellBXat : this.getBXBest('bids', 'THB').Bprice
		}
	},
	refreshData: function(then){
		var master = this;
		return master.updateBX(master.updateBFX(then))
	}
});

var loop = function(quote){
	var callback = function(){
		var opp = quote.opportunityBXBFX();
		var maxOpp = Math.max(opp.oppBuyBFX, opp.oppBuyBX)
		var sentence = [
			'Buy', 
			opp.oppBuyBFX > opp.oppBuyBFX ? 'BFX' : 'BX',
			'at',
			opp.oppBuyBFX > opp.oppBuyBFX ? opp.buyBFXat : opp.buyBXat,
			'SELL',
			opp.oppBuyBFX > opp.oppBuyBFX ? 'BX' : 'BFX',
			'at',
			opp.oppBuyBFX > opp.oppBuyBFX ? opp.sellBXat : opp.sellBFXat,
			'Profit',
			maxOpp,
			'$'
		].join(' ')
		if (maxOpp > 15) {
			alert(sentence)
		}
	}
	setInterval(function(){
		quote.refreshData(callback)
	}, 10000)
}

var alert = function(message){
	pusher.note('xorque@gmail.com','Opportunitee', message, function(error, response){
		console.log('alert sent')
	});
}

var quote = new quotation();
quote.refreshData();

loop(quote);

app.get('/refreshData', function(req, res){
	quote.refreshData();
	//res.send(quote.opportunityBXBFX())
})

app.get('/checkopp', function(req, res){
	res.send(quote.opportunityBXBFX())
})

app.listen(9000);
console.log('listening on port 9000')







