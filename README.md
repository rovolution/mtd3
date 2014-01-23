# MTD3
==================
## Description

MTD3 is a visualization library for creating canned, re-usable charts. 

The charts are SVG-based and created with the D3.js visualization library.

This library provides a simplifed JavaScript interface for creating and customizing these visualizations.


## Chart Types

The following custom charts can be created:

### Spiderview
![Spiderview](/graphics/spiderview.png)

### Heat Map
* ![Heat Map](/graphics/heat-map.png)

### Histogram
* ![Histogram](/graphics/histogram.png)

### Line Chart
* ![Line Chart](/graphics/line-chart.png)


## Getting Started/Setup

The library only has one third party depedency, D3.js.

In your webpage, load the latest version of D3.js followed by the MTD3.js library:

```
<script type='text/javascript' src="http://d3js.org/d3.v3.min.js"></script>
<script type='text/javascript' src="src/mtd3.js"></script>
```

Also load the MTD3 CSS file:

```
<link type="text/css" rel="stylesheet" href="styles/mtd3.css"></link>
```

## Example

For example, to create an instance of the Spiderview chart: 

*1.* Add a SVG element to your html:

```
<svg id="spiderview" class="d3-chart" xmlns="http://www.w3.org/2000/svg" version="1.1">
	<defs></defs>
</svg>
```

*2.* Then in your JavaScript, you create an instance of the Spiderview chart, set any configuration options on it, set the data for the chart, and apply it to the SVG element:

```
/* 
	Create chart instance 
*/
var spiderChart = mtd3.charts.SpiderViewChart();

/* 
	Set chart configuration 
*/
spiderChart
	.sameDimensionScale(true);

/* 
	Bind data and instantiate on page 
*/
var chartData = [
	{
		"name" : "P. Manning",
		"Passing Yards" : 5477,
		"TD/INT Ratio" : 5.5,
		"Yards Per Attempt" : 8.3, 
		"Completion %" : 68.3,
		"Passer Rating": 115.1,
		"Games Started": 16,
		"mtd3-color" : "#FF9933" # Set custom color for spider
	},
	{
		"name" : "A. Smith",
		"Passing Yards" : 3313,
		"TD/INT Ratio" : 3.3,
		"Completion %" : 60.6,
		"Yards Per Attempt" : 6.5,
		"Passer Rating": 89.1,
		"Games Started": 15,
		"mtd3-color" : "#FF8080"
	},
	{
		"name" : "T. Pryor",
		"Passing Yards" : 1798,
		"TD/INT Ratio" : 0.6,
		"Yards Per Attempt" : 6.6, 
		"Completion %" : 57.4,
		"Passer Rating": 69.1,
		"Games Started": 9,
		"mtd3-color" : "#000000"
	},
	{
		"name" : "P. Rivers",
		"Passing Yards" : 4478,
		"TD/INT Ratio" : 2.9,
		"Yards Per Attempt" : 8.2, 
		"Completion %" : 69.5,
		"Passer Rating": 105.5,
		"Games Started": 16,
		"mtd3-color" : "#33CCFF"
	}
];

d3.select('#spiderview')
  .datum(chartData)
.transition().duration(1200).call(spiderChart);

```

*3.* The chart should now appear!

## API Documentation

COMING SOON


## Installing Grunt

The codebase has a number of built-in Grunt command line tasks. [Click here](http://gruntjs.com/) to read more about grunt.

*__Before using grunt, make sure that you have [Node.js](http://nodejs.org/) installed on your system!__*

Once you have confirmed that Node.js is installed, open up a Terminal, navigate to the mtd3 directory, and type ```npm install``` to install grunt and its various depedencies.

Once the installation process is complete, you can now run the following grunt tasks:

```
grunt test
```
Runs jshint on the MTD3 source code






```
grunt development
```
Launches a web server on your localhost at port 9001 that serves up the index.html page. 

Anytime the /src/mtd3.js code is modified, jshint is automatically run against the source code.

Great for testing changes while developing!







```
grunt production
```
Generates a production version of the source code and CSS. The code is generated within the /dist directory.


## Development Instructions

To submit a contribution, open a pull request against the master branch.

* **Please makes sure that your code is 100% compliant with the ```grunt test``` command before submitting a pull request!**

* **Also, if you are testing your changes on the index.html file included within this repository, please do not include any changes to that file in your pull request!**

* **Please squash your commits together before submitting a pull request! For more information on squashing, [please see this linked article](http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html).**

This process will probably change in the future.


## Thank Yous

- [Mike Bostock](https://github.com/mbostock)
- [Jason Davies](https://github.com/jasondavies)
- [NVD3](https://github.com/novus/nvd3) by Novus Partners
- [The MITRE Corporation](http://www.mitre.org/)
	* Matt Koehler: *mkoehler {at} mitre {dot} org*
	* Zoe Henscheid: *zhenscheid {at} mitre {dot} org*
	* Ivan Ramiscal: *iramiscal {at} mitre {dot} org*
	* Marie Francesca: *maf {at} mitre {dot} org*


## Author

- Rohit Kalkur
	* URL: http://www.rovolutionary.com/
	* Email: *rohit {dot} kalkur {at} gmail {dot} com*