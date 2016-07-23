var opportunities = Backbone.Model.extend({
	initialize: function(){
		return this.update();
	},
	update: function(){
		var master = this;
		return $.getJSON('/checkOpp', function(a){
			master.set(a)
		})
	}
});

var viewOpps = Backbone.View.extend({
	model: opportunities,
	template: _.template('\
		<table id="opps" class="compact stripe">\
			<thead>\
				<tr>\
					<th>Operation</th>\
					<th>Profit</th>\
					<th>Achat</th>\
					<th>Vente</th>\
				</tr>\
			</thead>\
			<tbody>\
				<tr>\
					<td>Buy BX</td>\
					<td><%=oppBuyBX%></td>\
					<td><%=buyBXat%></td>\
					<td><%=sellBFXat%></td>\
				</tr>\
				<tr>\
					<td>Buy BFX</td>\
					<td><%=oppBuyBFX%></td>\
					<td><%=buyBFXat%></td>\
					<td><%=sellBXat%></td>\
				</tr>\
			</tbody>\
		</table>\
	'),
	initialize: function(){
		
	},
	render: function(){
		var master = this;
		this.$el.html(this.template(this.model.toJSON()));
		$('#opps', master.$el).DataTable({
			"paging":     false,
			"ordering":   false,
			"info":       false,
			"searching":  false
		});
		return this
	}
})



var user = Backbone.Model.extend({
	default: {
		email: null
	},
	initialize: function(){
		return this.getEmail();
	},
	getEmail: function(){
		var master = this;
		return $.getJSON('/userdata', function(userData){
			master.set('email', userData.email);
		})
	},
	email: function(){
		return this.get('email');
	}
})

var loginView = Backbone.View.extend({
	template: _.template('\
		<%=!email ? "<input id=email>email</input>\
		<input id=password>Password</input>\
		<button id=submit>Submit</button>" : \
		"<button id=logout>Log Out</button><button id=delete-account>Delete Account</button>"%> \
		'),
	events: {
		'click #submit' : 'submit',
		'click #logout' : 'logOut',
		'click #delete-account' : 'deleteAccount',
	},
	initialize: function(){
		console.log(this.model)
	},
	render: function(){
		this.$el.html(this.template({email: this.model.email()}));
		return this
	},
	submit: function(){
		var master = this;
		$.post('/userregister', {email:$('#email').val(), passhash: sha256($('#password').val() + $('#email').val())}).done(function(answer){
			if (answer){
				master.model.getEmail().done(function(){master.render()})
			}
		})
	},
	logOut: function(){
		document.cookie = 'email=; id=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		location.reload();
	},
	deleteAccount: function(){
		var master = this;
		var a = window.confirm('Are you sure to want to delete your account?');
		if (a) {
			$.get('/deleteaccount', function(result){
				if (result == 'deleted') {
					master.render();
				}
			})
		}
	}
})


var currentUser = new user();
var userView = new loginView({model: currentUser});

currentUser.getEmail().done(function(){
	userView.render().$el.appendTo($('#user_pannel'))
});

var oppModel = new opportunities();
var socket = io();
var oppView = new viewOpps({model:oppModel})

var refresh = function(){
	oppModel.initialize().done(function(){
		oppView.render().$el.appendTo($('#info'))
		$('#info').empty();
		oppView.render().$el.appendTo($('#info'));
	})
}
refresh();
socket.on('new quote', function(msg){
	refresh()
})
