var lineChart = new function(){

	var graph = null;
	var x;
	var y;
	var line;

	this.displayLineChart = function (data, minY, maxY) {
		// create an SVG element inside the #graph div that fills 100% of the div
		graph = d3.select("#lineChart").append("svg:svg").attr("width", "100%").attr("height", "100%");

		x = d3.scale.linear().domain([0, 100]).range([25, 350]); // starting point is -5 so the first value doesn't show and slides off the edge as part of the transition
		y = d3.scale.linear().domain([minY, maxY]).range([130, 0]);

		// create a line object that represents the SVN line we're creating
		line = d3.svg.line()
			// assign the X function to plot our line as we wish
			.x(function(d,i) { 
				// verbose logging to show what's actually being done
				//=.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
				// return the X coordinate where we want to plot this datapoint
				return x(i); 
			})
			.y(function(d) { 
				// verbose logging to show what's actually being done
				//console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
				// return the Y coordinate where we want to plot this datapoint
				return y(d); 
			})
			.interpolate("basis");
	
			// display the line by appending an svg:path element with the data line we created above
			graph.append("svg:path").attr("d", line(data));
			// or it can be done like this
			//graph.selectAll("path").data([data]).enter().append("svg:path").attr("d", line);
			
			var xAxis = d3.svg.axis()
                  .scale(d3.scale.linear().domain([-100, 0]).range([25, 350]))
                  .orient("bottom");
			

			graph.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(25," + 130  + ")")
				.call(xAxis);
			
			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");
				
			graph.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(50,0)")
				.call(yAxis);

			
	}
			
	this.redrawWithAnimation = function (data) {

		if(graph == null)
			return;
	
		// update with animation
		graph.selectAll("path")
			.data([data]) // set the new data
			.attr("transform", "translate(" + x(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
			.attr("d", line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
			.transition() // start a transition to bring the new value into view
			.ease("linear")
			.duration(1000) // for this demo we want a continual slide so set this to the same as the setInterval amount below
			.attr("transform", "translate(" + x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
			
			/* thanks to 'barrym' for examples of transform: https://gist.github.com/1137131 */
	}

}


var networkGraphBundle = new function(){

	this.displayNetwork = function(data){
		var diameter = 400,
			radius = diameter / 2,
			innerRadius = radius - 120;

		var cluster = d3.layout.cluster()
			.size([360, innerRadius])
			.sort(null)
			.value(function(d) { return d.size; });

		var bundle = d3.layout.bundle();

		var line = d3.svg.line.radial()
			.interpolate("bundle")
			.tension(.85)
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });

		var svg = d3.select("#networkGraph").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
		  .append("g")
			.attr("transform", "translate(" + radius + "," + radius + ")");

		var nodes = cluster.nodes(data["nodes"]),
			links = data["links"];

		svg.selectAll(".link")
		  .data(bundle(links))
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", line);

		svg.selectAll(".node")
		  .data(nodes.filter(function(n) { return !n.children; }))
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
		.append("text")
		  .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
		  .attr("dy", ".31em")
		  .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
		  .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
		  .text(function(d) { return d.key; });


		d3.select(self.frameElement).style("height", diameter + "px");

	}
}

var networkGraph = new function(){

	var svg = null;
	var link;
	var force;

	this.displayNetwork = function(graph){
		var width = 800,
			height = 400;

		var color = d3.scale.category20();

		force = d3.layout.force()
			.charge(-3)
			.size([width, height]);

		svg = d3.select("#networkGraph").append("svg")
			.attr("width", width)
			.attr("height", height);

			graph.nodes.forEach(function(d){
				
				if(d.group == mapperGroup){
					d.x = Math.random() * 500 + 50;
				}else if(d.group == masterGroup){
					d.x = 575;
				}else if(d.group == reducerGroup){
					d.x = Math.random() * 150 + 600;
				}
				
				d["fixed"] = true;
			
			});
			
			force
			  .nodes(graph.nodes)
			  .links(graph.links)
			  .start();
			
			var node = svg.selectAll(".node")
			  .data(graph.nodes)
			  .enter().append("circle")
			  .attr("class", "node")
			  .attr("r", 3)
			  .style("fill", function(d) {return color(d.group); })
			  //.call(force.drag)
			  ;
			
			node.append("title")
			  .text(function(d) { return d.name; })
			
			link = svg.selectAll(".link")
			  .data(graph.links)
			  .enter().append("line")
			  .attr("class", "link")
			  .attr("x1", function(d) { return d.source.x; })
			  .attr("y1", function(d) { return d.source.y; })
			  .attr("x2", function(d) { return d.target.x; })
			  .attr("y2", function(d) { return d.target.y; })
			  .style("stroke-width", function(d) { return Math.sqrt(d.value); });
			  
			force.on("tick", function() {
				
				link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });

				node.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; });
			});

			
			//for (var i = 30; i > 0; --i) force.tick();
			//force.stop();
	}

	this.addNewLink = function (linkData) {

	}
	
	var print = 10;
	
	this.redrawWithAnimation = function (graph) {
	
		if(svg == null)
			return;

		var links = force.links();
		
		for (var i = 0; i < links.length; i++) {
			if (curTime - links[i].time > edgeDeleteDelay) {
				//toBeRemoved.push(i);
				links.splice(i--, 1);
			}
		}		
			
		link = link.data(force.links());
		link.enter()
			.insert("line", ".node")
			.attr("class", "link")
			.attr("time", curTime);
			
		//What's the purpose of this line?
		link.exit().remove();

		force.start();
		
	}


}


