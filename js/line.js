function drawLine(dataset) {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
                w = 960 - margin.left - margin.right,
                h = 500 - margin.top - margin.bottom;

    var padding =20;

    var xScale = d3.scaleTime()
        .domain([d3.min(dataset,function (d) { return d.salary }),d3.max(dataset,function (d) { return d.salary }) ]).range([padding, w - padding * 2])

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset,function (d) { return d.cat1 }) ]).range([h- padding, padding])    

    var xAxis = d3.axisBottom().scale(xScale);
    var yAxis = d3.axisLeft().scale(yScale);

    var svg1 = d3.select("body").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    var line = d3.line()
         .x(function(d) { return xScale(d['date']); })
         .y(function(d) { return yScale(d['cat1']); });

    var path = svg1.append('path').attr('d', line(dataset));
    //draw points
    var selectCircle = svg1.selectAll(".circle")
        .data(dataset)

    selectCircle.enter().append("circle")
        .attr("class", "circle")
        .attr("r", 10)
        .attr("cx", function(d) {
          return xScale(d.salary)
        })
        .attr("cy", function(d) {
          return yScale(d.cat1)
        })
        .attr("fill", "#FFC300");

    

    svg1.append("g").attr("class", "axis").attr("transform", "translate(0," + (h - padding) + ")").call(xAxis);       
    //draw Y axis
    svg1.append("g").attr("class", "axis").attr("transform", "translate(" + padding + ",0)").call(yAxis);
    // add label
    svg1.append("text").attr("x", (w/2)).attr("y", h+30).attr("text-anchor", "middle").text("Year");
    svg1.append("text").attr("x", padding).attr("y", padding-20).attr("text-anchor", "middle").text("# of Events");            
    //add title
    svg1.append("text").attr("x", (w/2)).attr("y", padding).attr("text-anchor", "middle").text("Events per Year by Category");  
}