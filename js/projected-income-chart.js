var margin = {top: 10, right: 30, bottom: 30, left: 30};
    //width = 460 - margin.left - margin.right,
var width;
if(window.innerWidth > 640) {
  width = 640 - margin.right - margin.left;
} else {
  width = window.innerWidth - margin.right - margin.left;
}
var height = 200 - margin.top - margin.bottom;
var switch_bump = 0.1; // 10% placeholder salary bump if you switch jobs
var promotion_bump = 0.1;
var start_year = 2019;
var min_raise = 0.05, max_raise = 0.1;

var parseTime = d3.timeParse("%Y");
var parseMonthYear = d3.timeParse("%m/%d/%Y");
var formatK = d3.format(".2s");
    
// draw chart 
    //d3.select("#projected-income").remove();
var svg = d3.select("#projected-income")
    
  //.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.attr("id", "projected-income")
  .append("g")
    .attr("transform",
          "translate(" + (margin.left) + "," + margin.top + ")");
    
var yAxis = svg.append("g")
    .attr("class", "y-axis");

var xAxis = svg.append("g")
    .attr("class", "x-axis");

var salaryUpperLine = svg.append("path");
var salaryLowerLine = svg.append("path");
var projectedSalaryArea = svg.append("path");
var lowSalaryLabel = svg.append("text");
var highSalaryLabel = svg.append("text");
var currentSalaryLabel = svg.append("text");
var lowSalaryPoint = svg.append("circle");
var highSalaryPoint = svg.append("circle");
var currentSalaryPoint = svg.append("circle");

//projected chart lines, points, and area
var potentialSalaryUpperLine = svg.append("path");
var potentialSalaryLowerLine = svg.append("path");
var potentialProjectedSalaryArea = svg.append("path");
var potentialLowSalaryPoint = svg.append("circle");
var potentialHighSalaryPoint = svg.append("circle");
var potentialCurrentSalaryPoint = svg.append("circle");

var promotionContainer = svg.append("g");
promotionContainer
  .attr("id", "promo-container")
  .attr("transform", "translate(0, -20)");
var promotionSalaryPoint = svg.append("circle");
var potentialPromotionSalaryPoint = svg.append("circle");
var promotionLabelBackground = promotionContainer.append("rect");
var promotionLabel = promotionContainer.append("text");
var triangle = promotionContainer.append("path");
var promotionLine = promotionContainer.append("line");

function initChart() {
    
}
function drawProjectedIncome(raises, salary, industry, switchJobs = false, location) {
    var salary_low = parseInt(salary);
    var salary_high = parseInt(salary);
    var potential_salary_low, potential_salary_high;
      
    // loop thru raises and find selected industry min and max raises
    raises.forEach(function(element) {
      if(element.industry == industry) {
        if(location == "Hong Kong") {
          console.log('hk');
          if(element.min_raise_hk == "") {
              // keep the initial min and max raises
          } else {
              min_raise = parseFloat(element.min_raise_hk);
              max_raise = parseFloat(element.max_raise_hk);
          }
          if(element.switch_bump_hk == "") {
              // keep initial swtich bump
          } else {
              switch_bump = parseFloat(element.switch_bump_hk);
          }
        } else {
          // mainland China
          if(element.min_raise == "") {
              // keep the initial min and max raises
          } else {
              min_raise = parseFloat(element.min_raise);
              max_raise = parseFloat(element.max_raise);
          }
          if(element.switch_bump == "") {
              // keep initial swtich bump
          } else {
              switch_bump = parseFloat(element.switch_bump);
          }
        }
      }
    });
    console.log(min_raise, max_raise, switch_bump);
    
    //for every year, calculate projected salary based on salary and industry raises
    var points = [];
    var firstPoint = {};
    firstPoint.year = start_year;
    firstPoint.year = parseTime(firstPoint.year);
    
    salary_low = salary_high = salary;
    potential_salary_low = potential_salary_high = salary * (1 + switch_bump);
    
    firstPoint.salary_low = salary_low;
    firstPoint.salary_high = salary_high;
    firstPoint.potential_salary_low = potential_salary_low;
    firstPoint.potential_salary_high = potential_salary_high;
    
    points.push(firstPoint);
    
    for(let i = 1; i < 6; i++) {
        var m = {};
        
        m.year = start_year + i;
        m.year = parseTime(m.year);
        
        salary_low = Math.round(salary_low + salary_low * (min_raise));
        salary_high = Math.round(salary_high + salary_high * (max_raise));
        potential_salary_low = Math.round(potential_salary_low + potential_salary_low * (min_raise));
        potential_salary_high = Math.round(potential_salary_high + potential_salary_high * (max_raise));
        
        m.salary_low = salary_low;
        m.salary_high = salary_high;
        m.potential_salary_low = potential_salary_low;
        m.potential_salary_high = potential_salary_high;
        
        points.push(m);
        
        // let's do a promotion with an extra 10% bump after two years
        if(i == 2) {
          // a raise doesn't take a year so let's add another data point with a smaller interval, perhaps a month
          var b = {};
          b.year = parseMonthYear("4/1/" + (start_year + i));

          salary_low = salary_low + (promotion_bump * salary_low);
          salary_high = salary_high + (promotion_bump * salary_high);
          potential_salary_low = potential_salary_low + (promotion_bump * potential_salary_low);
          potential_salary_high = potential_salary_high + (promotion_bump * potential_salary_high);
          
          b.salary_low = salary_low;
          b.salary_high = salary_high;
          b.potential_salary_low = potential_salary_low;
          b.potential_salary_high = potential_salary_high;
          
          points.push(b);
        }
    }
    console.log(points);
    
    var highestPotentialSalary = compound(salary * (1 + switch_bump + promotion_bump), 1 + max_raise, 5, 'bla', false);
    function compound( input, interest, length, name, addition ) {
        var accumulated = input;
        for ( i=0; i < length; i++ ) {
            accumulated *= interest;
            if ( addition ){
                accumulated += input;
            }
        }
        return accumulated;
    }
        
    // X axis: scale and draw:
    var x = d3.scaleTime()
        //.domain([points[0].year, points[points.length-1].year])
        .domain(d3.extent(points, function(d) { return d.year; }))
        .nice(4)
        .range([0, width]);
    
    xAxis
        .attr("transform", "translate(0," + (height-40) + ")")
        .attr("class", "x-axis")
        .call(d3.axisBottom(x)
            .ticks(8)
            .tickFormat(d3.timeFormat("%Y"))
            );
    
    var y = d3.scaleLinear()
        .range([height-40, 0])
        .nice(4);
        y.domain([points[0].salary_low - 20000, highestPotentialSalary])
        .nice(4);   
    
    yAxis
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(".2s"))
        );
    
    // define how the upper salary estimate line is plotted
    var salaryHighLine = d3.line()
        .x(function(d) {
            return x(d.year);
        }) 
        .y(function(d) {
            return y(0.5 * (d.salary_high + d.salary_low));
        }) 
        .curve(d3.curveCatmullRom);
    
    // plot the upper salary estimate     
    salaryUpperLine
        .datum(points)
        .transition()
        .duration(300)
        .attr("class", "line-orange")
        .attr("id", "current-salary-line")
        .attr("d", salaryHighLine);
        
    // instead of showing upper and lower, let's try to show in between  and use area as the bounds
    var potentialSalaryHighLine = d3.line()
        .x(function(d) {
            return x(d.year);
        }) 
        .y(function(d) {
            return y(0.5*(d.potential_salary_high + d.potential_salary_low));
        }) 
        .curve(d3.curveCatmullRom);
        
    potentialSalaryUpperLine
        .datum(points)
        .transition()
        .duration(300)
        .attr("id", "potential-salary-line")
        .attr("class", "line-orange dashed opacity-5") 
        .attr("d", potentialSalaryHighLine);
    
    // gradient definition for salary upper and lower bounds area
    var defs = svg.append("defs");

    var gradient = defs.append("linearGradient")
       .attr("id", "svgGradient")
       .attr("x1", "50%")
       .attr("x2", "100%")
       .attr("y1", "50%")
       .attr("y2", "50%");
    
    gradient.append("stop")
       .attr('class', 'start')
       .attr("offset", "0%")
       .attr("stop-color", "#e4002b")
       .attr("stop-opacity", 1);
    
    gradient.append("stop")
       .attr('class', 'end')
       .attr("offset", "100%")
       .attr("stop-color", "#e4002b")
       .attr("stop-opacity", 0.1);
       
    projectedSalaryArea
      .datum(points)
      .transition()
      .duration(300)
      .attr("fill", "url(#svgGradient)")
      //.attr("fill", "e4002b")
      .attr("fill-opacity", "0.2")
      .attr('id', "projected-area")
      .attr("d", d3.area()
        .x(function(d) { return x(d.year); })
        .y0(function(d) { return y(d.salary_high); })
        .y1(function(d) { return y(d.salary_low); })
        .curve(d3.curveCatmullRom)
        );
       
    potentialProjectedSalaryArea
      .datum(points)
      .transition()
      .duration(300)
      .attr("fill", "url(#svgGradient)")
      .attr("fill-opacity", "0.2")
      .attr('id', "potential-area")
      .attr("class", "opacity-0")
      .attr("d", d3.area()
        .x(function(d) { return x(d.year); })
        .y0(function(d) { return y(d.potential_salary_high); })
        .y1(function(d) { return y(d.potential_salary_low); })
        .curve(d3.curveCatmullRom)
        );
  
    highSalaryLabel
        .transition()
        .duration(300)
        .attr("dx", width-15)
        .attr("dy", y(points[points.length-1].salary_high) - 20)
        .attr("class", "projected-salary-label")
        .text(function() {
            return formatK(points[points.length-1].salary_high);
        });
        
    highSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", width)
      .attr("cy", y((points[points.length-1].salary_high + points[points.length-1].salary_low)/2))
      .attr("r", 5)
      .attr("id", "high-salary-point")
      .attr("class", "salary-point");
      
    potentialHighSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", width)
      .attr("cy", y((points[points.length-1].potential_salary_high + points[points.length-1].potential_salary_low)/2))
      .attr("r", 5)
      .attr("id", "potential-high-salary-point")
      .attr("class", "salary-point opacity-0");
      
    currentSalaryLabel
        .transition()
        .duration(300)
        .attr("dx", - 15)
        .attr("dy", y(points[0].salary_high) - 10)
        .attr("class", "projected-salary-label")
        .text(function() {
            return formatK(points[0].salary_high);
        });
    
    currentSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", 0)
      .attr("cy", y(points[0].salary_high))
      .attr("r", 5)
      .attr("id", "current-salary-point")
      .attr("class", "salary-point");
      
    potentialCurrentSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", 0)
      .attr("cy", y(points[0].potential_salary_high))
      .attr("r", 5)
      .attr("id", "potential-current-salary-point")
      .attr("class", "salary-point opacity-0");
    
    // promotion
    var promo_x = x(points[3].year);
    var promo_y = (y(points[3].salary_high) + y(points[3].salary_low)) /2;
    
    promotionSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", promo_x)
      .attr("cy", promo_y)
      .attr("r", 4)
      .attr("id", "promotion-point")
      .attr("class", "promotion-point");
      
    potentialPromotionSalaryPoint
      .transition()
      .duration(300)
      .attr("cx", promo_x)
      .attr("cy", (y(points[3].potential_salary_high) + y(points[3].potential_salary_low))/2)
      .attr("r", 4)
      .attr("id", "potential-promotion-point")
      .attr("class", "promotion-point opacity-0");
      
    promotionLabelBackground
      .transition()
      .duration(300)
        .attr("x", promo_x - 41)
        .attr("y", promo_y - 15)
        .attr('class', "promotion-label-background");
    
    promotionLabel
        .transition()
        .duration(300)
        .attr("dx", promo_x - 33)
        .attr("dy", promo_y - 2)
        .attr("class", "salary-label")
        .text("promotion");
    
    //promotionLine
    //    .attr("x1", 166)
    //    .attr("x2", 166)
    //    .attr("y1", 61)
    //    .attr("y2", 140)
    //    .attr("class", "salary-line")
    //    .style("stroke-width", "1px")
    //    .style("stroke-dasharray", ("3, 3"))
    //    .style("stroke", "#000");
        
    var triangleData = [
                    { "x": promo_x-6,   "y": promo_y+4 },
                    { "x": promo_x+0, "y": promo_y+10 },
                    { "x": promo_x+6,   "y": promo_y+4 }
                ];
    
    var trianglePath = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });
        
    triangle
        .transition()
        .duration(300)
        .attr("d", trianglePath(triangleData))
        .attr("fill", "#f05424");
        
    // set project min and max salary in projected income explanation    
    document.getElementById("salary-low-text").innerHTML = formatK(points[points.length-1].salary_low);
    document.getElementById("salary-high-text").innerHTML = formatK(points[points.length-1].salary_high);
}