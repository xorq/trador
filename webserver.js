var request = require('request');
var _ = require('underscore');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var $ = require('jquery');
var Backbone = require('backbone');
var rp = require('request-promise');
var PushBullet = require('pushbullet');
// pushbullet access token o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S
var pusher = new PushBullet('o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S');
var subscribers = [{name: 'dandan', email: 'xorque@gmail.com'}]

var round2 = function(n){
	return Math.round(n*100)/100
}

app.get('/underscore.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/underscore/underscore-min.js')
})

app.get('/backbone.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/backbone/backbone-min.js')
})

app.get('/jquery.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/jquery/dist/jquery.min.js')
})

app.get('/trador.js', function(req,res){
	res.sendFile( __dirname + '/trador.js')
})

app.get('/socket.io.js', function(req,res){
	res.sendFile( __dirname + '/node_modules/socket.io-client/socket.io.js')
})

app.get('/datatables.css', function(req,res){
	res.sendFile(__dirname + '/datatables.css')
})
app.get('/datatables.js', function(req,res){
	res.sendFile(__dirname + '/datatables.js')
})

app.get('/', function(req, res){
	res.sendFile( __dirname + '/index.html')
})

io.on('connection', function(socket){
  console.log('a user connected');
});

var quotation = Backbone.Model.extend({
	defaults: {
		rates : null,
		BXOrderbook: null,
		BFXOrderbook: null,
	},
	initialize : function(){
		//On production change this to : this.updateRate();
		this.set('rates', {usd: 1, thb: 35.16});
		this.updateRate();
		this.updateBX();
		this.updateBFX();
	},
	updateRate : function(){
		var master = this;
		/*return rp.get('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(error, data){
			var newRates = master.get('rates');
			newRates.thb = JSON.parse(data.body).quotes.USDTHB;
			master.set('rates', newRates);
		});*/
			var newRates = master.get('rates');
			newRates.thb = 35;
			master.set('rates', newRates);
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
			console.log('you must sepcify a currency')
			return
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
			oppBuyBX : round2(this.getBFXBest('bids', 'USD').Bprice - this.getBXBest('asks', 'USD').Bprice),
			oppBuyBFX : round2(this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks', 'USD').Bprice),
			buyBXat : round2(this.getBXBest('asks', 'THB').Bprice),
			sellBFXat : round2(this.getBFXBest('bids', 'USD').Bprice),
			buyBFXat : round2(this.getBFXBest('asks', 'USD').Bprice),
			sellBXat : round2(this.getBXBest('bids', 'THB').Bprice)
		}
	},
	refreshData: function(then){
		var master = this;
		return master.updateBX(master.updateBFX(then))
	}
});

var loop = function(quote, subscribers){
	var callback = function(){
		io.emit('new quote', '')
	}
	setInterval(function(){
		quote.refreshData(callback)
	}, 30000)
};

var alert = function(subscribers, message){
	_.each(subscribers, function(subscribee){
		var now = new Date();
		var timeDiff = now - (subscribee.alertTime || 0)
		if (timeDiff > 3600000){
			pusher.note(subscribee.email, 'Alert for ' + subscribee.name, message, function(error, response){
				console.log('alert for ' + subscribee.name + ' sent')
			})
			subscribee['alertTime'] = now;
		}
	})
}

app.get('/refreshData', function(req, res){
	quote.refreshData();
	res.send(quote.opportunityBXBFX())
})

app.get('/checkopp', function(req, res){
	res.send(quote.opportunityBXBFX())
})

app.get('/rates', function(req, res){
	res.send(quote.get('rates'))
})


console.log('listening on port 9000')

var quote = new quotation();
quote.refreshData();
quote.updateRate();
setInterval(quote.updateRate, 86400000)
loop(quote, subscribers);


io.on('connection', function(socket){
	/*socket.on('message', function(message){
		io.emit('message', message)
	})
	setTimeout(function(){
		
	}, 10000)*/
})






http.listen(9000, function(){console.log('listening 9000')})


