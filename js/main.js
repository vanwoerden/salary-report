window.addEventListener('DOMContentLoaded', (event) => {
    var _data;
    var _locations;
    var _raises;
    
    // use these if no filter params present in url
    const initSalary = 200000;
    const initIndustry = "Financial Services";
    const initLocation = "Beijing";
    const initExperience = 5;
    
    const utm = "utm_source=website&utm_medium=webflow&utm_campaign=salary-benchmark";
    
    var industry;
    var location;
    var salary = 0;
    var experience;
    var HKD_value = 1.12;
    var switchJobs = false;
    
    var formatPercent = d3.format(".0%");
    var formatK = d3.format(".2s");
    // load and parse CSV
    function loadCSV(csv) {

        d3.csv(csv).then(function(data) {
            
            _data = data;
            // 2. draw charts for the first time
            loadRaisesCSV("https://cdn.jsdelivr.net/gh/vanwoerden/salary-report/data/raises_per_industry2.csv");
        });
    }
    function loadRaisesCSV(csv) {
        d3.csv(csv).then(function(raises) {
            console.log(raises);
            _raises = raises;
            //drawProjectedIncome(raises, initSalary, initIndustry);
            drawOrUpdateCharts(_data);
        });
    }
    loadCSV("https://cdn.jsdelivr.net/gh/vanwoerden/salary-report/data/active_candidate_salary_2019_10_21_under_1_5_m.csv");
    
    function drawOrUpdateCharts(data) {
        data.forEach(function(d) {
            d.id = +d.id;
            d.salary = +d.salary * HKD_value;
            d.location = d.location;
            d.gender = d.gender;
            d.months_of_experience = +d.months_of_experience;
            d.industry = d.industry;
            d.area_of_expertise = d.area_of_expertise;
        });
        
        //get unique locations
        var locations = [];
        locations = d3.nest()
            .key(function(d) { return d.location; })
            .entries(data);
        
        var justLocations = [];
        locations.forEach(function(element, i) {
            // omly add locations with more than x data points
            if(element.values.length >= 100 && element.key != "Hong Kong & Beijing") {
                justLocations.push(element.key);
            }
        });
        justLocations.sort();   
        // TODO sort by number of results
        _locations = locations;
        var locationSelect = document.getElementById('location-select');
    
        justLocations.forEach(function(v, i){
            locationSelect[i] = new Option(v,v);
        });
        //locations.forEach(function(element,key) {
        //    // put keys in new array
        //    locationSelect[key] = new Option(element.key + " (" +  + element.values.length + ")",element.key);
        //});
        
        // get unique industries
        var industries = [];
        industries = d3.nest()
            .key(function(d) { return d.industry; })
            .entries(data);
        
        var industryList = [];
        industries.forEach(function(d, i) {
            // only add industries with more than x data points
            if(d.values.length >= 30) {
                var duplicates = d.key.split(",");
                
                duplicates.forEach(function(d){
                    industryList.push(d);
                });
            }
        });
        
        var uniqueIndustries = industryList.filter( onlyUnique );
        // sort alphabetically
        uniqueIndustries.sort();
        // remove empty strings
        uniqueIndustries = uniqueIndustries.filter(function(e){return e});

        var industrySelect = document.getElementById('industry-select');
        
        uniqueIndustries.forEach(function(industry, key) {
            industrySelect[key] = new Option(industry, industry);
        });
        
        _data = data;
        //filterAndDraw();
        decodeURL(window.location.href);
        setSelectWidth("industry-select");
        setSelectWidth("location-select");
    }
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    document.getElementById("location-select").onchange = function() {
        console.log("location changed");
        setSelectWidth("location-select");
        filterAndDraw();
    };
    
    document.getElementById("industry-select").onchange = function() {
        setSelectWidth("industry-select");
        filterAndDraw();
    };
    
    document.getElementById("salary-slider").onchange = function() {
        filterAndDraw();
    };
    
    document.getElementById("salary-slider").oninput = function() {
        document.getElementById("salary").innerHTML = formatK(document.getElementById("salary-slider").value);
    };
    
    document.getElementById("experience-slider").onchange = function() {
        filterAndDraw();
    };
    
    document.getElementById("experience-slider").oninput = function() {
        document.getElementById("experience").innerHTML = document.getElementById("experience-slider").value + " years";
    };
    
    function decodeURL(url) {
        var params = getParams(url);
        
        if(params.industry != undefined) {
            document.getElementById("industry-select").value = params.industry;
        } else {
            document.getElementById("industry-select").value = "Information Technology";
        }
        
        if(params.industry != undefined) {
            document.getElementById("location-select").value = params.location;
        } else {
            document.getElementById("location-select").value = "Hong Kong";
        }
        
        if(params.salary != undefined) {
            document.getElementById("salary-slider").value = parseInt(params.salary);
            document.getElementById("salary").innerHTML = formatK(params.salary);
        } else {
            document.getElementById("salary-slider").value = 370000;
            document.getElementById("salary").innerHTML = formatK(370000);
        }
        
        if(params.experience != undefined) {
            document.getElementById("experience").innerHTML = params.experience + " years";
            document.getElementById("experience-slider").value = parseInt(params.experience);
        } else {
            document.getElementById("experience").innerHTML = "5 years";
            document.getElementById("experience-slider").value = 5;
        }
        
        document.getElementById("industry").innerHTML = params.industry;
        
        filterAndDraw();
    }
    function filterAndDraw() {
        industry = document.getElementById("industry-select").value;
        location = document.getElementById("location-select").value;
        salary = parseInt(document.getElementById("salary-slider").value);
        experience = document.getElementById("experience-slider").value;

        var filtered = getFilteredData(_data, industry, location, salary, experience);
        console.log("#results: " + filtered.length);
        
        drawHistogram(filtered, salary); 
        
        drawProjectedIncome(_raises, salary, industry, switchJobs, location);
        
        updateText(industry, location, salary);
        updateJobsLink(industry, location);
        
        //var alternatives = getAlternativeCities(_data, industry, location, salary);
        //updateAlternativeSentence(alternatives);
    }
    
    function updateJobsLink(industry, location) {
        document.getElementById("cta-industry").innerHTML = industry;
        document.getElementById("cta-location").innerHTML = "in " + location;
        //document.getElementById("jobs-link").href = "/jobs?locations=" + location + "&industries=" + industry;
        document.getElementById("jobs-link").href = "/jobs?" + utm;
    }
    function updateText(industry, location, salary) {
        document.getElementById("industry").innerHTML = industry;
        document.getElementById("location").innerHTML = location;
        //document.getElementById("salary").innerHTML = salary;
    }
    
    function updateAlternativeSentence(alternatives) {
        document.getElementById("first-alternative").innerHTML = alternatives[0].location;
        document.getElementById("second-alternative").innerHTML = alternatives[1].location;
        document.getElementById("third-alternative").innerHTML = alternatives[2].location;
        
        document.getElementById("first-alternative-salary").innerHTML = alternatives[0].salary_at_percent_rank;
        document.getElementById("second-alternative-salary").innerHTML = alternatives[1].salary_at_percent_rank;
        document.getElementById("third-alternative-salary").innerHTML = alternatives[2].salary_at_percent_rank;
    }
    
    function getFilteredData(data, industry, location, salary, experience) {
        var experienceMonths = experience * 12;
        var filteredData = data.filter(function(d) {
            
            if(d.months_of_experience > (experienceMonths - 24) && d.months_of_experience < (experienceMonths + 24) && d.industry.includes(industry) && d.location == location && d.salary < 1500000) {
                return d;
            }
        });
        // filter again with all locations if results are below 10
        if (filteredData.length <= 10) {
            console.log("not enough results, looking at all locations meow");
            // TO DO remove location filter? 
            filteredData = data.filter(function(d) {
            
                if(d.months_of_experience > (experienceMonths - 24) && d.months_of_experience < (experienceMonths + 24) && d.industry.includes(industry) && d.salary < 1500000) {
                    return d;
                }
            });
        }
        return filteredData;
    }
    
    var jobToggle = document.getElementById("job-switch-toggle");
    var c = 0;
    jobToggle.addEventListener('click', event => {
        c++;
        if(c>2) {
            c=1;
        }
        switch(c) {
            case 1:
                switchJobs = true;
                drawProjectedIncome(_raises, salary, industry, switchJobs, location);
                document.getElementById("stay").innerHTML = "switch jobs now";
                document.getElementById("leave").innerHTML = "(or you can stay in your job)";
                break;
            case 2:
                switchJobs = false;
                drawProjectedIncome(_raises, salary, industry, switchJobs, location);
                document.getElementById("stay").innerHTML = "stay in your job";
                document.getElementById("leave").innerHTML = "(or you could switch jobs)";
                break;
        }
    });
    
    function getAlternativeCities(data, industry, location, salary) {
        // compare percentage score of current combination with all other cities
        var currentPercentRank = getPercentRank();
        //console.log("currnentpercentrank " + currentPercentRank);

        // map data by location
        
        var topAlternativeCities = [];
        
        // filter on currently selected filters first (except location)
        //var filteredData = data.filter(function(d) { 
        //    if(d.industry == industry) {
        //        return d;
        //    }
        //});

        _locations.forEach(function(s) {
            //for all locations, look up the salary for the current percentRank
            
            // create a sorted array of all salaries that belong to the current location
            
            // now create the salaries array
            var salaries = s.values.map(function(d) { return d.salary; });

            //sort it
            salaries.sort(sortNumber);
            var pctSalary = percentile(salaries, currentPercentRank);
            var j = {};
            j.salary_at_percent_rank = pctSalary;
            j.location = s.key;
            topAlternativeCities.push(j);
        });
        
        // now we need to loop through the resulting array and select the top cities
        var top3 = getKeysWithHighestValue(topAlternativeCities);
        //console.log("top3");
        //console.log(top3);
        return topAlternativeCities;
    }
    
    function setSelectWidth(elem) {
        var selectId = document.getElementById(elem);
        var selectedText = selectId.options[selectId.selectedIndex].text;
        
        text = document.createElement("span"); 
        document.body.appendChild(text); 

        text.style.font = "Work Sans"; 
        text.style.fontSize = 16.8 + "px"; 
        text.style.height = 'auto'; 
        text.style.width = 'auto'; 
        text.style.position = 'absolute'; 
        text.style.whiteSpace = 'no-wrap'; 
        text.innerHTML = selectedText; 

        var width = Math.ceil(text.clientWidth); 
        document.body.removeChild(text); 
        
        selectId.style.width = (19 + width) + "px";
    }
    
    function getKeysWithHighestValue(arr){
        const first = arr.sort((a, b) => b.salary_at_percent_rank - a.salary_at_percent_rank)[0];
        const second = arr.sort((a, b) => b.salary_at_percent_rank - a.salary_at_percent_rank)[1];
        const third = arr.sort((a, b) => b.salary_at_percent_rank - a.salary_at_percent_rank)[2];

        return [first,second,third];
    }
    
    /**
    * Get the URL parameters
    * source: https://css-tricks.com/snippets/javascript/get-url-variables/
    * @param  {String} url The URL
    * @return {Object}     The URL parameters
    */
    function getParams(url) {
        var params = {};
        var parser = document.createElement('a');
        parser.href = url;
        var query = parser.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            params[pair[0]] = decodeURIComponent(pair[1]);
        }
        return params;
    }

});
       