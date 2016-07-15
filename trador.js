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

var view = Backbone.View.extend({
	model: opportunities,
	template: _.template('<div><b>buy at <%=buyBXat%></b></div>'),
	initialize: function(){
		
	},
	render: function(){
		this.$el.html(this.template(this.model.toJSON()));
		return this
	}
})

var oppModel = new opportunities();
oppModel.initialize().done(function(){
	var oppView = new view({model:oppModel})
	oppView.render().$el.appendTo($('#info'))
})