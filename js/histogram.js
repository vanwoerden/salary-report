var _percentRank = 0;
var currency = "HK$";
function drawHistogram(data, userSalary) {
    
    var formatPercent = d3.format(".0%");
    var formatK = d3.format(".2s");
    var formatComma = d3.format(",");
    
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 30};
        //width = 460 - margin.left - margin.right,
    var width;
    if(window.innerWidth > 640) {
      width = 640 - margin.right - margin.left;
    } else {
      width = window.innerWidth - margin.right - margin.left;
    }
    var height = 250 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    d3.select("#histogram").remove();
    var svg = d3.select("#salary-benchmark-block")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "histogram")
      .append("g")
        .attr("transform",
              "translate(" + (margin.left) + "," + margin.top + ")");
    
    // X axis: scale and draw:
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.salary })])
        .nice(4)
        .range([0, width]);
          
    var colors = d3.scaleQuantile()
        .domain(data.map(function(d) { return d.salary; }))
        .range(['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5']);
     
    var tickValuesX = [];
    if(Math.abs(userSalary - colors.quantiles()[1]) < 140000) {
            //alert("small");
            tickValuesX = [0,colors.quantiles()[1], d3.max(data, function(d) { return d.salary; } )];
        } else {
            //alert("big");   
            tickValuesX = [0,userSalary, colors.quantiles()[1], d3.max(data, function(d) { return d.salary; } )];
        }
    svg.append("g")
        .attr("transform", "translate(0," + 160 + ")")
        .attr("class", "x-axis")
        .call(d3.axisBottom(x)
            //.tickValues([0,userSalary, colors.quantiles()[1], d3.max(data, function(d) { return d.salary; } )])
            .tickValues(tickValuesX)
            //.ticks(4)
            .tickFormat(formatK)
            );
  
    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return d.salary; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(20)); // then the numbers of bins
  
    // get the bins
    var bins = histogram(data);
    
    // add a 0 value as first and last value
    bins.unshift({x0: 0, x1:0, length: 0});
    bins.push({x0: bins[bins.length-1].x0+1, x1: bins[bins.length-1].x1+1, length: 0});
  
    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([160, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length * 1.2; })]);   // d3.hist has to be called before the Y axis obviously

    // hide y axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // append the bar rectangles to the svg element
    //svg.selectAll("rect")
    //    .data(bins)
    //    .enter()
    //    .append("rect")
    //        .attr("x", 1)
    //        .attr("transform", function(d) {
    //            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
    //        })
    //        .attr("width", function(d) {
    //            if((x(d.x1) - x(d.x0)) > -1){
    //                return x(d.x1) - x(d.x0) - 1 ;
    //            } else {
    //                return 0;
    //            }
    //            
    //        })
    //        .attr("height", function(d) { return height - y(d.length); })
    //        .style("fill", "#fff")
    //    .transition()
    //        .style("fill", function(d) {
    //            return colors(d.x1);
    //        })
    //        .duration(500);
        
    var qline = d3.line()
        .x(function(d) {
            return x(d.x0) + 0.5 * (x(d.x1) - x(d.x0));
        }) 
        .y(function(d) {
            return y(d.length);
        }) 
        .curve(d3.curveMonotoneX);
        //.curve(d3.curveCatmullRom);
    
    // TO DO draw two lines, one < 50% and one > 50%
    var quantilesLine = svg.append("path")
        .datum(bins) 
        .attr("class", "line") 
        .attr("d", qline);
     
    var numArray = data.map(function(d) { return d.salary; });
    numArray.sort(sortNumber);
    
    var ranking = percentRank(numArray, userSalary);
    _percentRank = ranking;
    document.getElementById("percentage").innerHTML = Math.round(100*ranking) + "%";
    
    //calculate delta from market rate salary (50% percentile)
    var deltaFromMedianSalary = 0;

    if(colors.quantiles()[1] == undefined) {
        deltaFromMedianSalary = "unknown";
    } else
    if(colors.quantiles()[1] >= userSalary) {
        // user is paid below market rate
        deltaFromMedianSalary = currency + " " + formatK(colors.quantiles()[1] - userSalary) + " below market rate";
    } else {
        // user gets paid above market rate
        deltaFromMedianSalary = currency + " " + formatK(userSalary - colors.quantiles()[1]) + " above market rate";
    }
    
    document.getElementById("delta-from-median").innerHTML = deltaFromMedianSalary;
    
    // calculate the bin length that corresponds to the userSalary
    var userBinLength = 0;
    bins.forEach(function(bin) {
        if(bin.x0 <= userSalary && userSalary <= bin.x1) {
            userBinLength = bin.length;
        }
    });
    
    // now put a dot on the chart to show where the userSalary ranks
    var tx = x(userSalary);
    var ty = y(userBinLength);
    
    // display median as market rate salary level
    var trianglePath = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });
        
    var medianBackground = svg.append("rect")
        .attr("x", x(colors.quantiles()[1]) - 45)
        .attr("y", 185)
        .attr('class', "median-background");
        
    var median = svg.append("text")
        .attr("dx", x(colors.quantiles()[1]) - 37)
        .attr("dy", 199)
        .attr("class", "median-label")
        .text(function() {
            return "market rate";
        });
            
    var medianTriangleData = [
                    { "x": x(colors.quantiles()[1])-5,  "y": 186 },
                    { "x": x(colors.quantiles()[1]),    "y": 180 },
                    { "x": x(colors.quantiles()[1])+5,  "y": 186 }
                ];
        
    var medianTriangle = svg.append("path")
        .attr("d", trianglePath(medianTriangleData))
        .attr("fill", "#333");
    
    var userSalaryLine = svg.append("line")
        .attr("x1", tx + 0.5)
        .attr("x2", tx + 0.5)
        .attr("y1", ty - 6)
        .attr("y2", 158)
        .attr("class", "salary-line")
        .style("stroke-width", "1px")
        .style("stroke-dasharray", ("3, 3"))
        .style("stroke", "#000");
        
    var youLabelBackground = svg.append("rect")
        .attr("x", tx - 20)
        .attr("y", ty - 35)
        .attr('class', "label-background");
    
    var youLabel = svg.append("text")
        .attr("dx", tx - 11)
        .attr("dy", ty - 22)
        .attr("class", "salary-label")
        .text("you");
    
    var triangleData = [
                    { "x": tx-5,   "y": ty-16 },
                    { "x": tx+0.5,     "y": ty-10 },
                    { "x": tx+6,   "y": ty-16 }
                ];
        
    var triangle = svg.append("path")
        .attr("d", trianglePath(triangleData))
        .attr("fill", "#f05424");
        //.attr("stroke-width", 2);
            
}
function getPercentRank() {
    return _percentRank;
}
function sortNumber(a, b) {
    return a - b;
}