var FOLDER = '/Users/dandan/Documents/Projects/trador'

var request = require('request');
var _ = require('underscore');
var express = require('express');
var app = express();
app.get('/bxorderbook',function(req, res){
	request.get('https://bx.in.th/api/orderbook/?pairing=1', function(error, data){
		res.send(data.body)
	})
})

app.get('/thbusd',function(req, res){
	request.get('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(error, data){
		res.send(data.body)
	})
})

app.get('/underscore.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/underscore/underscore-min.js')
})

app.get('/jquery.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/jquery/dist/jquery.min.js')
})

app.get('/trador.js', function(req,res){
	res.sendFile( FOLDER + '/trador.js')
})

app.get('/', function(req, res){
	res.sendFile( FOLDER + '/trador.html')
})

app.listen(1234);