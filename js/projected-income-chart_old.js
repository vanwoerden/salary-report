var margin = {top: 10, right: 40, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;
var switch_bump = 0.1; // 10% placeholder salary bump if you switch jobs
var start_year = 2019;
var min_raise = 0.05, max_raise = 0.1;

var parseTime = d3.timeParse("%Y");
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
          "translate(" + margin.left + "," + margin.top + ")");

function initChart() {
    
}
function drawProjectedIncome(raises, salary, industry, switchJobs = false) {
    console.log("drawinc");
    
    var salary_low = parseInt(salary);
    var salary_high = parseInt(salary);
    //
    /* based on expected raise for selected industry
     * salary
     * switch to a job or not
     * move to a different location
     * --> draw projected income
     * --> add a sentence of how users income will change
     *
     */
    
    
    // loop thru raises and find selected industry min and max raises
    console.log(raises);
    raises.forEach(function(element) {
        if(element.industry == industry) {
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
    });
    
    //for every year, calculate projected salary based on salary and industry raises
    var points = [];
    for(let i = 0; i < 6; i++) {
        var m = {};
        m.year = start_year + i;
        m.year = parseTime(m.year);
        
        m.salary_low = salary_low;
        m.salary_high = salary_high;
        
        // add a bump if we a re switching to a new job
        if(switchJobs) {
            salary_low = Math.round(salary_low + salary_low * (min_raise + switch_bump));
            salary_high = Math.round(salary_high + salary_high * (max_raise + switch_bump));
        } else {
            salary_low = Math.round(salary_low + salary_low * (min_raise));
            salary_high = Math.round(salary_high + salary_high * (max_raise));
        }
        points.push(m);
    }
    
    var highestPotentialSalary = compound(salary, 1 + max_raise + switch_bump, 5, 'bla', false);
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
    
    var xAxis = svg.selectAll(".x-axis")
        .datum(points)
        .enter()
            .append("g")
            .attr("transform", "translate(0," + 160 + ")")
            .attr("class", "x-axis")
            .call(d3.axisBottom(x)
                .ticks(8)
                .tickFormat(d3.timeFormat("%Y"))
                );
        
    //svg.append("g")
    //    .attr("transform", "translate(0," + 160 + ")")
    //    .attr("class", "x-axis")
    //    .call(d3.axisBottom(x)
    //        .ticks(8)
    //        .tickFormat(d3.timeFormat("%Y"))
    //        );
    
    var y = d3.scaleLinear()
        .range([160, 0])
        .nice(4);
        y.domain([0, highestPotentialSalary])
        .nice(4);   
    
    // hide y axis
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(".2s"))
        );
        
    var salaryHighLine = d3.line()
        .x(function(d) {
            return x(d.year);
        }) 
        .y(function(d) {
            return y(d.salary_high);
        }) 
        .curve(d3.curveMonotoneX);
        //.curve(d3.curveCatmullRom);
    
    // TO DO draw two lines, one < 50% and one > 50%
    var salaryUpperLine = svg.enter().append("path")
        .datum(points) 
        .attr("class", "line-orange")
        .attr("d", salaryHighLine);
        
    var salaryLowLine = d3.line()
        .x(function(d) {
            return x(d.year);
        }) 
        .y(function(d) {
            return y(d.salary_low);
        }) 
        .curve(d3.curveMonotoneX);
        //.curve(d3.curveCatmullRom);
    
    // TO DO draw two lines, one < 50% and one > 50%
    var salaryLowerLine = svg.append("path")
        .datum(points) 
        .attr("class", "line-orange") 
        .attr("d", salaryLowLine);
        
        
    var projectedSalaryArea = svg.append("path")
      .datum(points)
      .attr("fill", "#f05424")
      .attr("fill-opacity", "0.3")
      //.attr("stroke", "#69b3a2")
      //.attr("stroke-width", 1.5)
      .attr("d", d3.area()
        .x(function(d) { return x(d.year); })
        .y0(function(d) { return y(d.salary_high); })
        .y1(function(d) { return y(d.salary_low); })
        );
    
    var lowSalaryLabel = svg.append("text")
        .attr("dx", width+5)
        .attr("dy", y(points[points.length-1].salary_low) + 4)
        .attr("class", "projected-salary-label")
        .text(function() {
            return formatK(points[points.length-1].salary_low);
        });
        
    var highSalaryLabel = svg.append("text")
        .attr("dx", width+5)
        .attr("dy", y(points[points.length-1].salary_high) + 4)
        .attr("class", "projected-salary-label")
        .text(function() {
            return formatK(points[points.length-1].salary_high);
        });
    
    // set project min and max salary in projected income explanation    
    document.getElementById("salary-low-text").innerHTML = formatK(points[points.length-1].salary_low);
    document.getElementById("salary-high-text").innerHTML = formatK(points[points.length-1].salary_high);
}
function updateProjectedIncomeChart(data) {
    console.log("updateProjectedIncomeChart");
    // 1. redraw x and y axis
    // 2. redreaw all lines and paths and labels
    // 3. add transition too
    
}