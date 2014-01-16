/***********************************************************************/
/***********************************************************************/
/*				
								MTD3							
		-Author: Rohit Kalkur, The MITRE Corporation


*/
/***********************************************************************/
/***********************************************************************/
(function() {
	/**********************************************************************
														
														HELPERS

	**********************************************************************/

	var mtd3 = window.mtd3 || {};
	window.mtd3 = mtd3;

	mtd3.components = {}; //Support components such as Legend, Controls
	mtd3.charts = {}; //Charts such as HorizontalPercentOverTimeBarChart
	mtd3.helpers = {};

	/**********************************************************************
														
														HELPERS

	**********************************************************************/
	mtd3.helpers.sortNumber = function (a,b) {
		return a - b;
	};

	mtd3.helpers.objIsArray = function(obj) {
		var retval = (Object.prototype.toString.call(obj) === '[object Array]') ? true : false;
		return retval;
	};

	mtd3.helpers.isNotUndefined = function(obj) {
		return typeof obj !== "undefined";
	};

	mtd3.helpers.degreesToRadians = function(deg) {
		return (Math.PI*deg)/180;
	};

	mtd3.helpers.valueIsBtwZeroAndOne = function(val) {
		if((val >= 0.0) && (val <= 1.0)) {
			return true;
		} else {
			throw new Error("Value must be between 0 and 1");
		}
	};

	mtd3.helpers.addUniqueElemToArray = function(elem) {
		if(arguments.length !== 1) {
			throw new Error("Function only accepts one argument");
		}
		if(!mtd3.helpers.objIsArray(this)) {
			throw new Error("Function only accepts one argument of type Array");
		}
		if (this.indexOf(elem) === -1) { this.push(elem); }
	};

	mtd3.helpers.indexOfForObjectArrayByProperty = function(array, propertyName, searchValue) {
		return array.map(function(e) { return e[propertyName]; }).indexOf(searchValue);
	};

	mtd3.helpers.calculateSvgTextWidth = function(svgd3TextElem) {
		var tmpSVGCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		
		tmpSVGCanvas.setAttribute('version', '1.1');
		tmpSVGCanvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    tmpSVGCanvas.setAttribute('visibility', 'hidden');
		tmpSVGCanvas.appendChild(svgd3TextElem[0][0].cloneNode(true));
		document.body.appendChild(tmpSVGCanvas);

		d3.select(tmpSVGCanvas).select('text')
			.style('font-size', svgd3TextElem.style('font-size'));

		var textWidth = d3.select(tmpSVGCanvas).select('text').node().getComputedTextLength();
		document.body.removeChild(tmpSVGCanvas);
		return Math.round(textWidth * 1.15); //slight adjustment due to difference in computedTextLength()
	};

	/**********************************************************************

															COMPONENTS

	***********************************************************************/
	mtd3.components.Legend = function() {
	var margin = {top: 0, right: 0, bottom: 0, left: 0},
			width = 960 - margin.right - margin.left, // width
			height = 20 - margin.top - margin.bottom, // height
			rowHeight = 21, //Height of a single row of series in the legend
			rowWidth = 23, // Width of a single row of series in the legend
			dispatch = d3.dispatch('legendClick'),
			useSeriesCirclesAsBtns = false
			;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this);

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer();
					drawLegend();
				}

				/***********************
						Local Methods    
				***********************/
				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.legend").data([data]);

					wrap.enter().append("svg:g")
						.attr("class", "mtd3 legend")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")").append('g');

					return wrap.select('g');
				}

				function drawLegend() {
					var newSeries;

					drawSeries();
					alignSeries();

					function drawSeries() {
						var series = graphContainer.selectAll("g.series").data(data);
						newSeries = series.enter().append("svg:g").attr("class", "series");

						newSeries.append("svg:circle")
							.attr("r", 7)
							.style("fill", function(d) { return d.color;})
							.on('click', function(d,i) {
								dispatch.legendClick(d,i);
							});

						newSeries.append("svg:text")
							.text(function(d) {return d.name;})
							.attr('text-anchor', 'start')
							.attr('dy', '.32em')
							.attr('dx', '8');

						if(useSeriesCirclesAsBtns) series.classed('disabled', function(d) { return d.disabled; });
						series.exit().remove();
					}

					function alignSeries() {
						var seriesWidths = [];

						newSeries.each(function() {
							var currentRow = 0,
							numOfSeriesAboveCurrentRow = 0;
							seriesWidths.push(d3.select(this).select('text').node().getComputedTextLength() + rowWidth); //NOTE: 23 is ~ the width of the circle plus some padding});
						
							newSeries.attr("transform", function(d,i) {
								return "translate(" + calculateSeriesHorizontalOffset(i) + "," + calculateSeriesVerticalOffset() + ")";

								function calculateSeriesHorizontalOffset(seriesIndex) {
									var horizonOffset = 0,
											addingSeriesWillOverflowRow;
									for(var k = numOfSeriesAboveCurrentRow; k < seriesIndex; k++) {
										horizonOffset+=seriesWidths[k];
									}
									addingSeriesWillOverflowRow = (horizonOffset + seriesWidths[seriesIndex]) > width;
									if(addingSeriesWillOverflowRow) {
										currentRow++;
										numOfSeriesAboveCurrentRow+=k;
										return 0;
									} else {
										return horizonOffset;
									}
								}
								function calculateSeriesVerticalOffset() { return currentRow * rowWidth; }
							});
							height = (currentRow + 1) * rowHeight;
						});
					}
				}
			}); //End of selection.data
			return chart;
		} //End of chart

		/*************************************************************
                
										Global getters and setters                  

		*************************************************************/

		chart.dispatch = dispatch;

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.useSeriesCirclesAsBtns = function(_) {
			if(!arguments.length) return useSeriesCirclesAsBtns;
			useSeriesCirclesAsBtns = _;
		};

		return chart;
	}; //End of Legend


	mtd3.components.Controls = function() {
		var wrappedGraph = mtd3.components.Legend(),
				buttonColor = "black",
				onClickFn;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this);
						
				//chart.update = function() { chart(selection) };
				chart.container = this;

				if(data || data.length) {
					var formattedGraphData = formatData();

					createGraphWithData(formattedGraphData);
					bindEvents();
				}

				function formatData() {
					return data.map(function(d) {
						return { "name" : d.name, "color" : buttonColor, "disabled" : d.disabled };
					});
				}

				function createGraphWithData(data) {
					container.datum(data).call(wrappedGraph);
					// height = wrappedGraph.height();
					// width = wrappedGraph.width();
				}

				function bindEvents() {
					wrappedGraph.dispatch.on('legendClick', function(d) {
						d.disabled = !d.disabled;
						wrappedGraph.update();
					});
				}
			});
			return chart;
		}

		d3.rebind(chart, wrappedGraph, 'margin', 'height', 'width','useSeriesCirclesAsBtns');

		chart.update = function() { wrappedGraph.update(); };

		chart.buttonColor = function(_) {
			if (!arguments.length) return buttonColor;
			buttonColor = _;
			return chart;
		};

		chart.onClickFn = function(_) {
			if(!arguments.length) return onClickFn;
			if(typeof _ === 'function') {
				onClickFn = _;
			} else {
				throw new Error("argument is not a function. Must be a function");
			}
			return chart;
		};

		return chart;
	}; //End of Controls


	mtd3.components.Polygon = function(initVals) {
		if( !mtd3.helpers.isNotUndefined(initVals) ) initVals = {};

		var numSides = mtd3.helpers.isNotUndefined(initVals['numSides']) ? initVals['numSides'] : 3,
				radius = mtd3.helpers.isNotUndefined(initVals['radius']) ? initVals['radius'] : 1,
				xOrigin = 0,
				yOrigin = 0,
				xOffset = 0, //If not specified, half of container size
				yOffset = 0, //If not specified, half of container size,
				rotationAngle = 0,
				fillOpacity = 1,
				fillColor = 'black',
				strokeColor = 'black',
				strokeOpacity = 1,
				strokeWidth = 1,
				containerSize = 0
				;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this);
				
				validateContainer();

				var coordinates = mtd3.helpers.isNotUndefined(data) ? data : generateCoordinates(),
						coordinatesString = createCoordString(coordinates);
     
				if(!xOffset || !yOffset) { calculateOffsets(); }
				var graphContainer = drawContainer();
				drawPolygon(coordinatesString);

				function validateContainer() {
						var containerWidth = parseInt(container.style('width'), 10),
								containerHeight = parseInt(container.style('height'), 10),
								polygonSize = radius*2;

					if ((containerWidth < polygonSize) || (containerHeight < polygonSize)) {
						throw new Error("radius*2 exceeds container size.");
					}

					containerSize = containerHeight;
				}

				function generateCoordinates() {
					var coords = [],
							rotationAngleInRadians = rotationAngle * (Math.PI/180);

						for (var i = 1; i <= numSides; i++) {
								var angle = 2*Math.PI*i/numSides,
											x = radius * Math.cos(angle + rotationAngleInRadians) + xOrigin,
											y = radius * Math.sin(angle + rotationAngleInRadians) + yOrigin;
											coords.push({ 'x':x, 'y':y });
						}
						return coords;
					}

				// function maxYValOfCoordinates(coordinates) {
				//return d3.max(coordinates, function(coordPair) { return coordPair.y; });
				// }

				function createCoordString(coordinates) {
					var coordinatesAsStrings = coordinates.map(function(coordPair) {
						return coordPair.x + "," + coordPair.y;
					});
					return coordinatesAsStrings.join(' ');
				}

				function calculateOffsets() {
					//var offset = containerSize / 2;
					//xOffset = offset,
					//yOffset = offset;
				}

				function drawContainer() {
					return container.append("g")
									.attr("class", "mtd3 polygon")
									.attr("transform","translate(" + xOffset + "," +  yOffset + ") scale(1, -1)");
				}

				function drawPolygon(coordsString) {
					graphContainer.append("svg:polygon")
						.style('fill', fillColor)
						.style('fill-opacity', fillOpacity) // 0 (transparent) -> 1 (opaque)
						.style('stroke', strokeColor)
						.style('stroke-opacity', strokeOpacity) // 0 (transparent) -> 1 (opaque)
						.style('stroke-width', strokeWidth)
						.attr('points', coordsString);
				}
			}); //End of selection(data)
			return chart;
		} //End of chart

		chart.rotationAngle = function(_) {
			if(!arguments.length) return rotationAngle;
			rotationAngle = _;
			return chart;
		};

		chart.fillColor = function(_) {
			if (!arguments.length) return fillColor;
			fillColor = _;
			return chart;
		};

		chart.fillOpacity = function(_) {
			if (!arguments.length) return fillOpacity;
			if(mtd3.helpers.valueIsBtwZeroAndOne(_)) fillOpacity = _;
			return chart;
		};

		chart.strokeColor = function(_) {
			if (!arguments.length) return strokeColor;
			strokeColor = _;
			return chart;
		};

		chart.strokeOpacity = function(_) {
			if (!arguments.length) return strokeOpacity;
			if(mtd3.helpers.valueIsBtwZeroAndOne(_)) strokeOpacity = _;
			return chart;
		};

		chart.xOffset =function(_) {
			if (!arguments.length) return xOffset;
			if(mtd3.helpers.valueIsBtwZeroAndOne(_)) xOffset = _;
			return chart;
		};

		chart.yOffset =function(_) {
		if (!arguments.length) return yOffset;
			if(mtd3.helpers.valueIsBtwZeroAndOne(_)) yOffset = _;
			return chart;
		};

		chart.strokeWidth = function(_) {
			if (!arguments.length) return strokeWidth;
			strokeWidth = _;
			return chart;
		};

		return chart;
	}; //End of Polygon


	mtd3.components.Tooltip = (function() {

		var delay = 500,
			container = null;

		function createTooltipContainer() {
			if(!container) {
				var domContainer = document.createElement("div");
				domContainer.className = "mtd3tooltip";

				var body = document.getElementsByTagName('body')[0];
				body.appendChild(domContainer);

				container = d3.select(domContainer);
			}
		}

		/* Event Handlers */
		function revealTooltip() {
			if(!container) createTooltipContainer();
				container.transition()
					.duration(delay)
					.style("opacity", 1);
		}

		function hideTooltip() {
				container.transition()
					.duration(delay)
					.style("opacity", 0);
			}

		function setTooltip(content) {
			if(!content) content = "tooltip text";
			container
				.text(content)
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 12) + "px")
				.style("width", determineTooltipWidth(content));
		}

		function determineTooltipWidth(content) {
			return (content.length * 10) + "px";
		}

		return {
			revealTooltip : revealTooltip,
			hideTooltip : hideTooltip,
			setTooltip : setTooltip
		};
	
	})(); //End of Tooltip

	/***********************************************************************
	
									CHARTS

	***********************************************************************/


	mtd3.charts.HorizontalPercentOverTimeBarChart = function() {
		var margin = {top: 30, right: 40, bottom: 20, left: 50},
				width = null,
				height = null,
				xScale = d3.scale.ordinal().rangePoints([0, width], 2),
				barHeight = 20,
				//z = d3.scale.ordinal().range(["steelblue", "#ccc"]),
				duration = 750,
				delay = 25,
				showLegend = true,
				tooltips = true,
				showControls = true,
				controls = null,
				colorPalette = d3.scale.category20(),
				percentLabels,
				highlightedRows = [],
				currentHorizontalOffset = 0
				;
				

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
						availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
						availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer(),
							formattedGraphData = formatDataForGraphInput(),
							legendHeight = showLegend ? createLegendAndGetLegendHeight(formattedGraphData.legendData) : 0,
							controlsHeight = showControls ? createControlsAndGetControlsHeight(0, legendHeight) : 0,
							chartContainer = createChartContainer(0, legendHeight + controlsHeight);

					createXAxis(formattedGraphData.uniqueDates);
					createYAxis(formattedGraphData.dataOrganizedByGroupName.length);
					createBars(formattedGraphData.dataOrganizedByGroupName);

					if(showControls) bindControlsEvents();
				}

				function formatDataForGraphInput() {
					var dataOrganizedByGroupName = d3.map(),
							uniqueDates = [],
							legendData = [];

					data.forEach(function(category) {
						var color = category.color ? category.color : colorPalette(category.name);
						
						legendData.push({
							"name" : category.name,
							"color" : color
						});
						category.data.forEach(function(group) {
							var dataSet = group.groupData.map(function(datapoint) {
								mtd3.helpers.addUniqueElemToArray.call(uniqueDates, datapoint.date);
								return {
									"date" : datapoint.date,
									"percent" : datapoint.percent,
									"color" : color
								};
							});
							var key = group.groupName;

							if(dataOrganizedByGroupName.has(key)) {
								var currentDataArray = dataOrganizedByGroupName.get(key);
								dataOrganizedByGroupName.set(key, currentDataArray.concat(dataSet));
							} else {
								dataOrganizedByGroupName.set(key, dataSet);
							}
						});
					});

					return {
						"dataOrganizedByGroupName" : dataOrganizedByGroupName.entries(),
						"uniqueDates" : uniqueDates,
						"legendData" : legendData
					};
				} //End of formatDataForGraphInput()

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.horiz-percent-bars-graph").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 horiz-percent-bars-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				}

				function createChartContainer(xOffset, yOffset) {
					return graphContainer.append("svg:g")
									.attr("class", "chart")
									.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
				}

				function createXAxis(xAxisLabels) {
					chartContainer.append("svg:g").attr("class", "x axis");
					xScale = d3.scale.ordinal()
						.rangePoints([0, availableWidth], 2)
						.domain(xAxisLabels);

					var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient("top");

					var xAxisContainer = chartContainer.selectAll(".x.axis").transition().duration(duration).call(xAxis);
					xAxisContainer.selectAll("text").attr("x", -(xScale()/2) ); //Center labels
				}

				function createYAxis(numOfTicks) {
					var axisHeight = numOfTicks * barHeight * 1.6;
					chartContainer.append("svg:g")
						.attr("class", "y axis")
					.append("svg:line")
						.attr("y1", "0")
						.attr("y2", axisHeight);
				}

				function createBars(barChartData) {
					chartContainer.append("svg:g")
						.attr("class", "bars-wrap")
						.attr("transform", "translate(0,5)");

					var barsContainerEnter = chartContainer.select("g.bars-wrap").selectAll("g.data-bars-group").data(barChartData);
					var barsContainer = barsContainerEnter.enter().append("svg:g")
							.attr("class", function(d,i) {
								var classTags = "data-bars-group",
								highlighted = highlightedRows.indexOf(i) > -1;
								if(highlighted) classTags+=' highlighted';
								return classTags;
					}).attr("transform", function(d, i) { return "translate(0," + (1.4 * barHeight * i) + ")"; });

					barsContainer.append("svg:text")
						.attr("x", -6)
						.attr("y", barHeight / 2)
						.attr("dy", ".35em")
						.attr("text-anchor", "end")
						.text(function(d) { return d.key; });

					if(tooltips) {
						barsContainer
							.on("mouseover", mtd3.components.Tooltip.revealTooltip)
							.on("mousemove", function(d) { return mtd3.components.Tooltip.setTooltip(d.key); })
							.on("mouseout", mtd3.components.Tooltip.hideTooltip);
					}

					var dataBars = barsContainer.selectAll(".interval-data-bars")
							.data(function(d) {
								var sortedDatapoints = sortDataBarsInputData(d);
								return sortedDatapoints;
							});
					
					dataBars.enter().append("svg:g")
						.attr("class", "data-bar")
						.attr("transform", function(d,i) {
							return "translate(" + calculateHorizontalOffsetForSegment(d,i) + ",0)";
						});

					dataBars.append("svg:rect")
						.attr("height", barHeight)
						.style("fill", function(d) { return d.color; })
						.attr("width", 0)
						.transition()
						.duration(duration)
						.attr("width", function(d) { return calculateBarWidth(d.percent); });

					percentLabels = dataBars.append("svg:text")
						.attr("y", barHeight / 1.5)
						.attr("x", function(d) { return calculateBarWidth(d.percent) / 2; })
						.attr("text-anchor", "middle")
						.text(function(d) { return d3.format("%")(d.percent); });
				} //End of createBars()

				function sortDataBarsInputData(data) {
					return data.value.sort(function(a,b) {
						var aDateIndex = formattedGraphData.uniqueDates.indexOf(a.date),
								bDateIndex = formattedGraphData.uniqueDates.indexOf(b.date);

								if (aDateIndex < bDateIndex) {
									return -1;
								} else if(aDateIndex > bDateIndex) {
									return 1;
								} else {
									return compareByIndexInLegendArray(a,b);
								}
					});
				}

				function compareByIndexInLegendArray(a,b) {
					var aLegendIndex = mtd3.helpers.indexOfForObjectArrayByProperty(formattedGraphData.legendData, 'color', a.color),
							bLegendIndex = mtd3.helpers.indexOfForObjectArrayByProperty(formattedGraphData.legendData, 'color', b.color);
					if (aLegendIndex < bLegendIndex) {
						return -1;
					} else if(aLegendIndex > bLegendIndex) {
						return 1;
					} else {
						return 0;
					}
				}

        function calculateHorizontalOffsetForSegment(segmentData, i) {
					var horizontalOffset = 0;
					if (i === 0) { currentHorizontalOffset = 0; }
						horizontalOffset = currentHorizontalOffset;
						currentHorizontalOffset+=calculateBarWidth(segmentData['percent']);
						return horizontalOffset;
        }

				function calculateBarWidth(percent) { return percent * xScale(); }

				function createControlsAndGetControlsHeight(xOffset, yOffset) {
						var controlsData = [ { name: 'Toggle Percent Labels', disabled: false } ];

						graphContainer.append('svg:g').attr('class', 'controlsWrap')
							.attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');

						controls = mtd3.components.Controls()
							.width(availableWidth)
							.useSeriesCirclesAsBtns(true);

						graphContainer.select('.controlsWrap')
							.datum(controlsData)
							.call(controls);

						var controlsHeight = controls.height() * 1.7;
						availableHeight-=controlsHeight;

						return controlsHeight;
				}

				function createLegendAndGetLegendHeight(data) {
					var legend = mtd3.components.Legend().width(availableWidth);
					graphContainer.append('svg:g').attr('class', 'legendWrap');
					graphContainer.select('.legendWrap')
						.datum(data)
						.call(legend);
					var legendHeight = legend.height() * 1.7;
					availableHeight-=legendHeight;
					return legendHeight;
				}  //End of createLegend

				function bindControlsEvents() {
					controls.onClickFn(function(d) {
						switch(d.name) {
							case 'Toggle Percent Labels':
								togglePercentLabels(d.disabled);
								break;
						}

						function togglePercentLabels(disabled) {
							switch(disabled) {
								case true:
									percentLabels.classed('hidden', true);
									break;
								case false:
									percentLabels.classed('hidden', false);
									break;
							}
						}
					});
				} //End of bindControlsEvents()
			}); //End of selection.data()
			return chart;
		} //End of chart()

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.barHeight = function(_) {
			if(!arguments.length) return barHeight;
			barHeight = _;
			return chart;
		};

		chart.duration = function(_) {
			if(!arguments.length) return duration;
			duration = _;
			return chart;
		};

		chart.delay = function(_) {
			if(!arguments.length) return delay;
			delay = _;
			return chart;
		};

		chart.colorPalette = function(_) {
			if(!arguments.length) return colorPalette;
			colorPalette = _;
			return chart;
		};

		chart.tooltips = function(_) {
			if(!arguments.length) return tooltips;
			tooltips = _;
			return chart;
		};

		chart.showLegend = function(_) {
			if(!arguments.length) return showLegend;
			showLegend = _;
			return chart;
		};

		chart.showControls = function(_) {
			if(!arguments.length) return showControls;
			showControls = _;
			return chart;
		};

		chart.highlightedRows = function(_) {
			if(!arguments.length) return highlightedRows;
			if(_ instanceof Array) highlightedRows = _;
			return chart;
		};

		chart.groupSegmentLength = function() {
			return xScale();
		};
		
		return chart;
	}; //End of HorizontalPercentOverTimeBarChart


	mtd3.charts.MultiBoxWhiskerChart = function() {
		var margin = {top: 30, right: 10, bottom: 10, left: 50},
				width = null,
				height = null,
				//xScale = null,
				duration = 0,
				domain = null,
				value = Number,
				whiskers = [0,0],
				quartiles = [0,0,0],
				singleBoxWhiskerWidth = null,
				spacingBetweenBoxPlots = 110,
				tickFormat = null,
				oldXScales = [],
				x0 = null,
				x1 = null
				;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
						// availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
						availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer(),
							chartContainer = createChartContainer(0,0),
							graphData = formatDataForGraphInput();
					drawChart();
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd31920").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 box-whisker-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				} //End of createGraphContainer()

				function createChartContainer(xOffset, yOffset) {
					var chartContainerWrap = graphContainer.selectAll("g.chart").data([data]);
					chartContainerWrap.enter().append("svg:g")
						.attr("class", "chart")
						.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
					return chartContainerWrap;
				} //End of createChartContainer()

				function formatDataForGraphInput() {
					var g,
							n,
							min,
							max,
							whiskerIndices;
					return data.map(function(d) {
						var singleBoxWhiskerGraphData = {
							quartileData : [],
							whiskerData : [],
							outlierIndices : [],
							label : null
						};

						/*****************      Data Extraction      ****************/
					if(d instanceof Array) {
						d = d.map(value).sort(d3.ascending);
						g = d3.select(this);
						n = d.length;
						min = d[0];
						max = d[n - 1];

						if(quartiles instanceof Function) {
							singleBoxWhiskerGraphData.quartileData = d.quartiles = quartiles(d);
						} else {
							throw new Error("invalid data type for quartiles (must be Function)");
						}
						if(whiskers instanceof Function) {
							whiskerIndices = whiskers && whiskers.call(this, d);
							singleBoxWhiskerGraphData.whiskerData = whiskerIndices && whiskerIndices.map(function(i) { return d[i]; });
						} else {
							throw new Error("invalid data type for whiskers (must be Function)");
						}
						singleBoxWhiskerGraphData.outlierIndices = whiskerIndices ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n)) : d3.range(n);
					} else if(d instanceof Object && d.min && d.max && d.q1 && d.q2 && d.q3) {
							g = d3.select(this);
							min = d.min;
							max = d.max;
							singleBoxWhiskerGraphData.quartileData = [d.q1, d.q2, d.q3];
							singleBoxWhiskerGraphData.whiskerData = [d.min, d.max];
							if(d.label) singleBoxWhiskerGraphData.label = d.label;
					} else {
							throw new Error("Invalid data format");}
							return singleBoxWhiskerGraphData;
					});
				} //End of formatDataForGraphInput()

				function drawChart() {
					singleBoxWhiskerWidth = 20;
					var boxWhiskerPlots = chartContainer.selectAll("g.box-whisker-plot").data(graphData);
							
					boxWhiskerPlots.enter().append("svg:g")
						.attr("class", "box-whisker-plot")
						.attr("transform", function(d,i) {
							var spacing =  i * spacingBetweenBoxPlots;
							return "translate(" + spacing + "," + 0 + ")";
						});
						boxWhiskerPlots.exit().remove();
						boxWhiskerPlots.each(function(d,i) {
							drawSingleBoxWhiskerPlot(d3.select(this),d,i);
						});
					}
					
					function drawSingleBoxWhiskerPlot(singleboxWhiskerChart, data, index) {
						updateXScales(data,index);
						if(data.label) drawBoxWhiskerLabel(singleboxWhiskerChart, data);
						drawCenterLine(singleboxWhiskerChart, data.whiskerData);
						drawIqrBox(singleboxWhiskerChart, data.quartileData);
						drawMedianLine(singleboxWhiskerChart, data.quartileData);
						drawWhiskers(singleboxWhiskerChart, data.whiskerData);
						drawOutlers(singleboxWhiskerChart, data.outlierIndices);
						drawTicks(singleboxWhiskerChart, data);
					}

					function updateXScales(data, index) {
						// Compute the new x-scale.
						x1 = d3.scale.linear()
									.domain(domain(data, index))
									.range([availableHeight, 0]);
						// Retrieve the old x-scale, if this is an update.
						x0 = oldXScales[index] || d3.scale.linear()
									.domain([0, Infinity])
									.range(x1.range());
						// Stash the new scale.
						oldXScales[index] = x1;
					}

					function drawBoxWhiskerLabel(container, data) {
						var newYOffset = function() { return x1(data.whiskerData[1]) - 20; };
						var label = container.selectAll("text.label").data([data.label] || []);

						label.enter().append("text")
							.attr("class", "label")
							.attr("dy", ".3em")
							.attr("dx", 6)
							.attr("x", -8)
							.attr("y", x0)
							.text(function(d) { return d; })
							.style("opacity", 1e-6)
						.transition()
							.duration(duration)
							.attr("y", newYOffset)
							.style("opacity", 1);

						label.transition()
							.duration(duration)
							.text(function(d) { return d; })
							.attr("y", newYOffset)
							.style("opacity", 1);

						label.exit().transition()
							.duration(duration)
							.attr("y", newYOffset)
							.style("opacity", 1e-6)
							.remove();
					}

					function drawCenterLine(container, whiskerData) {
						var center = container.selectAll("line.center").data(whiskerData ? [whiskerData] : []);

						center.enter().insert("line", "rect")
							.attr("class", "center")
							.attr("x1", singleBoxWhiskerWidth / 2)
							.attr("y1", function(d) { return x0(d[0]); })
							.attr("x2", singleBoxWhiskerWidth / 2)
							.attr("y2", function(d) { return x0(d[1]); })
							.style("opacity", 1e-6)
							.transition()
							.duration(duration)
							.style("opacity", 1)
							.attr("y1", function(d) { return x1(d[0]); })
							.attr("y2", function(d) { return x1(d[1]); });

						center.transition()
							.duration(duration)
							.style("opacity", 1)
							.attr("y1", function(d) { return x1(d[0]); })
							.attr("y2", function(d) { return x1(d[1]); });

						center.exit().transition()
							.duration(duration)
							.style("opacity", 1e-6)
							.attr("y1", function(d) { return x1(d[0]); })
							.attr("y2", function(d) { return x1(d[1]); })
							.remove();
					}

					function drawIqrBox(container, quartileData) {
						var box = container.selectAll("rect.box").data([quartileData]);

						box.enter().append("rect")
								.attr("class", "box")
								.attr("x", 0)
								.attr("y", function(d) { return x0(d[2]); })
								.attr("width", singleBoxWhiskerWidth)
								.attr("height", function(d) { return x0(d[0]) - x0(d[2]); })
							.transition()
								.duration(duration)
								.attr("y", function(d) { return x1(d[2]); })
								.attr("height", function(d) { return x1(d[0]) - x1(d[2]); });

						box.transition()
							.duration(duration)
							.attr("y", function(d) { return x1(d[2]); })
							.attr("height", function(d) { return x1(d[0]) - x1(d[2]); });
					}

					function drawMedianLine(container, quartileData) {
						var medianLine = container.selectAll("line.median").data([quartileData[1]]);

						medianLine.enter().append("line")
								.attr("class", "median")
								.attr("x1", 0)
								.attr("y1", x0)
								.attr("x2", singleBoxWhiskerWidth)
								.attr("y2", x0)
							.transition()
								.duration(duration)
								.attr("y1", x1)
								.attr("y2", x1);

						medianLine.transition()
							.duration(duration)
							.attr("y1", x1)
							.attr("y2", x1);
					}

					function drawWhiskers(container, whiskerData) {
						var whisker = container.selectAll("line.whisker").data(whiskerData || []);

						whisker.enter().insert("line", "circle, text")
								.attr("class", "whisker")
								.attr("x1", 0)
								.attr("y1", x0)
								.attr("x2", singleBoxWhiskerWidth)
								.attr("y2", x0)
								.style("opacity", 1e-6)
							.transition()
								.duration(duration)
								.attr("y1", x1)
								.attr("y2", x1).style("opacity", 1);

						whisker.transition()
							.duration(duration)
							.attr("y1", x1)
							.attr("y2", x1)
							.style("opacity", 1);

						whisker.exit().transition()
							.duration(duration)
							.attr("y1", x1)
							.attr("y2", x1)
							.style("opacity", 1e-6)
							.remove();
					}

					function drawOutlers(container, outlierIndices) {
						var outlier = container.selectAll("circle.outlier").data(outlierIndices, Number);

						outlier.enter().insert("circle", "text")
							.attr("class", "outlier")
							.attr("r", 5)
							.attr("cx", singleBoxWhiskerWidth / 2)
							.attr("cy", function(d, i) { return x0(d[i]); })
							.style("opacity", 1e-6)
						.transition()
							.duration(duration)
							.attr("cy", function(d, i) { return x1(d[i]); })
							.style("opacity", 1);

						outlier.transition()
							.duration(duration)
							.attr("cy", function(d, i) { return x1(d[i]); })
							.style("opacity", 1);

						outlier.exit().transition()
							.duration(duration)
							.attr("cy", function(d, i) { return x1(d[i]); })
							.style("opacity", 1e-6)
							.remove();
					}

					function drawTicks(container, data) {
						var format = tickFormat || x1.tickFormat(8);
						drawBoxTicks(container, format, data.quartileData);
						drawWhiskerTicks(container, format, data.whiskerData);
					}

					function drawBoxTicks(container, format, quartileData) {
						var boxTick = container.selectAll("text.box").data(quartileData);

						boxTick.enter().append("text")
							.attr("class", "box")
							.attr("dy", ".3em")
							.attr("dx", function(d, i) { return i & 1 ? 6 : -6; })
							.attr("x", function(d, i) { return i & 1 ? singleBoxWhiskerWidth : 0; })
							.attr("y", x0)
							.attr("text-anchor", function(d, i) { return i & 1 ? "start" : "end"; })
							.text(format)
						.transition()
							.duration(duration)
							.attr("y", x1);

						boxTick.transition()
							.duration(duration)
							.text(format)
							.attr("y", x1);
					}

				function drawWhiskerTicks(container, format, whiskerData) {
					var whiskerTick = container.selectAll("text.whisker").data(whiskerData || []);
					whiskerTick.enter().append("text")
							.attr("class", "whisker")
							.attr("dy", ".3em")
							.attr("dx", 6)
							.attr("x", singleBoxWhiskerWidth)
							.attr("y", x0)
							.text(format)
							.style("opacity", 1e-6)
						.transition()
							.duration(duration)
							.attr("y", x1)
							.style("opacity", 1);
					
					whiskerTick.transition()
						.duration(duration)
						.text(format)
						.attr("y", x1)
						.style("opacity", 1);

					whiskerTick.exit().transition()
						.duration(duration)
						.attr("y", x1)
						.style("opacity", 1e-6)
						.remove();
				}

				}); //End of selection.data()
				return chart;
			} //End of chart()

		chart.margin = function(x) {
			if (!arguments.length) return margin;
			margin = x;
			return chart;
		};

		chart.width = function(x) {
			if (!arguments.length) return width;
			width = x;
			return chart;
		};

		chart.height = function(x) {
			if (!arguments.length) return height;
			height = x;
			return chart;
		};

		chart.tickFormat = function(x) {
			if (!arguments.length) return tickFormat;
			tickFormat = x;
			return chart;
		};

		chart.duration = function(x) {
			if (!arguments.length) return duration;
			duration = x;
			return chart;
		};

		chart.domain = function(x) {
			if (!arguments.length) return domain;
			domain = x === null ? x : d3.functor(x);
			return chart;
		};

		chart.value = function(x) {
			if (!arguments.length) return value;
			value = x;
			return chart;
		};

		chart.whiskers = function(x) {
			if (!arguments.length) return whiskers;
			whiskers = x;
			return chart;
		};

		chart.quartiles = function(x) {
			if (!arguments.length) return quartiles;
			quartiles = x;
			return chart;
		};

		chart.spacingBetweenBoxPlots = function(x) {
			if (!arguments.length || typeof x !== "number") return spacingBetweenBoxPlots;
			spacingBetweenBoxPlots = x;
			return chart;
		};

		return chart;
	}; //End of MultiBoxWhiskerChart


	mtd3.charts.ParallelCoordinatesChart = function() {
		var margin = {top: 30, right: 10, bottom: 10, left: 10},
				width = null,
				height = null,
				xScale = null,
				colorPalette = d3.scale.category20(),
				dimensions = null,
				dimensionScales = {},
				dimensionDomElements = null,
				dragging = {},
				showLegend = false,
				showControls = true,
				controls = null,
				background = null,
				foreground = null,
				dimensionsWithBrushes = [];

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
						availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
						availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer();
					var legendData = formatLegendData();
					var legendHeight = showLegend ? createLegendAndGetLegendHeight(legendData) : 0;
					var controlsHeight = showControls ? createControlsAndGetControlsHeight(0, legendHeight) : 0;
					var chartContainer = createChartContainer(0, legendHeight + controlsHeight);
					
					createScalesForXAxisAndDimensions();
					drawDataLines();
					drawDimensionAxes();

					if(showControls) bindControlsEvents();
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.parallel-coords-graph").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 parallel-coords-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				}
				
				function formatLegendData() {
					return data.map(function(d) {
						return {
							"name" : d.name,
							"color" : interpolateColor(d)
						};
					});
				}

				function createLegendAndGetLegendHeight(legendData) {
					var legend = mtd3.components.Legend().width(availableWidth);
					graphContainer.append('svg:g').attr('class', 'legendWrap');
					graphContainer.select('.legendWrap')
						.datum(legendData)
					.call(legend);

					var legendHeight = legend.height() * 1.7;
					availableHeight-=legendHeight;
					return legendHeight;
				}

				function createControlsAndGetControlsHeight(xOffset, yOffset) {
					var controlsData = [
						{ name: 'Clear All Brushes', disabled: false }
					];

					graphContainer.append('svg:g').attr('class', 'controlsWrap')
						.attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');

					controls = mtd3.components.Controls()
											.width(availableWidth)
											.useSeriesCirclesAsBtns(true);

					graphContainer.select('.controlsWrap')
												.datum(controlsData)
												.call(controls);

					var controlsHeight = controls.height() * 1.7;
					availableHeight-=controlsHeight;

					return controlsHeight;
				}

				function bindControlsEvents() {
					controls.onClickFn(function(d) {
						switch(d.name) {
							case 'Clear All Brushes':
								dimensionDomElements.selectAll('g.brush').remove();
								drawBrushes();
								break;
						}
					});
				} //End of bindControlsEvents()

				function createChartContainer(xOffset, yOffset) {
					var chartContainer = graphContainer.append("svg:g")
								.attr("class", "chart")
								.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
							return chartContainer;
				} //End of createChartContainer()

				function createScalesForXAxisAndDimensions() {
						xScale = d3.scale.ordinal().rangePoints([0, availableWidth], 1);
						// Extract the list of dimensions and create a scale for each.
							xScale.domain(dimensions = d3.keys(data[0]).filter(function(d) {
								var propertyIsAValidDimension = (d !== "name" && d !== "mtd3-color");
								if(propertyIsAValidDimension) {
									return propertyIsAValidDimension && (dimensionScales[d] = determineScale(d));
								}
							}));
						} //End of createScalesForXAxisAndDimensions()
				
				function determineScale(dataIndex) {
					var firstDataVal = data[0][dataIndex];
					if(typeof firstDataVal === "string") {
						return createOrdinalScale(dataIndex);
					} else {
						return createLinearScale(dataIndex);
					}
				}

				function createOrdinalScale(dataIndex) {
					return d3.scale.ordinal()
									.domain(data.map(function(p) { return p[dataIndex]; }))
									.rangePoints([availableHeight, 0]);
				}

				function createLinearScale(dataIndex) {
					return d3.scale.linear()
									.domain(d3.extent(data, function(p) { return +p[dataIndex]; }))
									.range([availableHeight, 0]);
				}

				function drawDataLines() {
					// Add grey background lines for context.
					background = chartContainer.append("svg:g")
												.attr("class", "background")
												.selectAll("path")
													.data(data)
												.enter().append("svg:path")
												.attr("d", path);
					// Add blue foreground lines for focus.
					foreground = chartContainer.append("svg:g")
												.attr("class", "foreground")
													.selectAll("path")
												.data(data)
												.enter().append("svg:path")
													.attr("d", path)
												.style("stroke", function(d) { return interpolateColor(d); });
					} //End of drawDataLines()

					function drawDimensionAxes() {
						// Add a group element for each dimension.
						dimensionDomElements = chartContainer.selectAll(".dimension")
									.data(dimensions)
								.enter().append("svg:g")
									.attr("class", "dimension")
									.attr("transform", function(d) { return "translate(" + xScale(d) + ")"; })
									.call(d3.behavior.drag()
										.on("dragstart", function(d) {
											dragging[d] = this.__origin__ = xScale(d);
											background.attr("visibility", "hidden");
										})
										.on("drag", function(d) {
											dragging[d] = Math.min(availableWidth, Math.max(0, this.__origin__ += d3.event.dx));
											foreground.attr("d", path);
											dimensions.sort(function(a, b) { return position(a) - position(b); });
											xScale.domain(dimensions);
											dimensionDomElements.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
										})
										.on("dragend", function(d) {
											delete this.__origin__;
											delete dragging[d];
											transition(d3.select(this)).attr("transform", "translate(" + xScale(d) + ")");
											transition(foreground)
												.attr("d", path);
											background
													.attr("d", path)
													.transition()
													.delay(500)
													.duration(0)
													.attr("visibility", null);
										}));

							// Add an axis and title.
							dimensionDomElements.append("svg:g")
									.attr("class", "axis")
									.each(function(d) {
										var axis = d3.svg.axis().orient("left");
										d3.select(this).call(axis.scale(dimensionScales[d]));
									})
									.append("svg:text")
										.attr("text-anchor", "middle")
										.attr("y", -9)
										.text(String);

							drawBrushes();
							function transition(g) { return g.transition().duration(500); }

					} //End of createDimensionAxes()

					function drawBrushes() {
							dimensionDomElements.append("svg:g")
									.attr("class", "brush")
									.each(function(d) { d3.select(this).call(dimensionScales[d].brush = d3.svg.brush().y(dimensionScales[d]).on("brush", filterDataLines)); })
								.selectAll("rect")
									.attr("x", -8)
									.attr("width", 16);

							filterDataLines();
					}

					function filterDataLines() {
						dimensionsWithBrushes = dimensions.filter(function(p) { return !dimensionScales[p].brush.empty();});
						var extents = dimensionsWithBrushes.map(function(p) { return dimensionScales[p].brush.extent(); });
						setDisplayOfLines(extents);
					}

					function setDisplayOfLines(extents) {
						foreground.style("display", function(d) {
							return dimensionsWithBrushes.every(function(p, i) {
								var dVal = typeof d[p] === "number" ? d[p] : dimensionScales[p](d[p]);
								return valueIsWithinBrush(extents[i], dVal);
							}) ? null : "none";
						});
					}

					function valueIsWithinBrush(extents, value) {
						return (extents[0] <= value) && (value <= extents[1]);
					}

					function position(d) {
						var v = dragging[d];
						return v === null ? xScale(d) : v;
					}

					// Returns the path for a given data point.
					function path(d) {
						var line = d3.svg.line();
						return line(dimensions.map(function(p) { return [position(p), dimensionScales[p](d[p])]; }));
					}

					//Returns a color code for a datapoint
					function interpolateColor(d) {
						return d['mtd3-color'] ? d['mtd3-color'] : colorPalette(d);
					}
				}); //End of selection.data()

				return chart;
			} //End of chart()

			chart.margin = function(_) {
				if (!arguments.length) return margin;
				margin = _;
				return chart;
			};

			chart.width = function(_) {
				if (!arguments.length) return width;
				width = _;
				return chart;
			};

			chart.height = function(_) {
				if (!arguments.length) return height;
				height = _;
				return chart;
			};

			chart.colorPalette = function(_) {
				if(!arguments.length) return colorPalette;
				colorPalette = _;
				return chart;
			};

			chart.showLegend = function(_) {
				if(!arguments.length) return showLegend;
				showLegend = _;
				return chart;
			};

			chart.showControls = function(_) {
				if(!arguments.length) return showControls;
				showControls = _;
				return chart;
			};

			return chart;
		}; //End of ParallelCoordinatesChart


	mtd3.charts.SpiderViewChart = function() {
		var margin = {top: 0, right: 0, bottom: 0, left: 0},
				width = null,
				height = null,
				radius = null,
				showLegend = true,
				colorPalette = d3.scale.category20(),
				dimensions = [],
				dimensionScales = {},
				dimensionRotationAngles = {},
				animationDuration = 1200,
				sameDimensionScale = false,
				sameDimensionScaleKeyVal = 0
				;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
						availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
						availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;
 
				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					radius = radius ? radius : Math.min(availableWidth,availableHeight) * 0.45;
					var graphContainer = createGraphContainer();
					var legendHeight = showLegend ? drawLegendAndGetLegendHeight() : 0;
					var chartContainer = createChartContainer(availableWidth/2, legendHeight+(availableHeight/2));

					extractDimensionsAndCreateScales();
					calculateRotationAngles();
					drawDimensionAxes();
					drawSpiderGridlinesAndGraphBorder();
					drawSpiders();
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.spiderview-graph").data([data]);
							
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 spiderview-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				}

				function drawLegendAndGetLegendHeight() {
					graphContainer.append('svg:g').attr('class', 'legendWrap');

					var legend = mtd3.components.Legend().width(availableWidth).margin({top : 11, bottom : 0, left : availableWidth/3.5, right : 0}),
							legendData = data.map(function(d) { return { "name" : d.name, "color" : interpolateColor(d) }; });

					graphContainer.select('.legendWrap')
							.datum(legendData)
						.call(legend);

					var legendHeight = legend.height() * 1.7;
					availableHeight -= legendHeight;

					return legendHeight;
				} //End of createLegendAndGetLegendHeight()

				function createChartContainer(xOffset, yOffset) {
					var chartContainer = graphContainer.append("svg:g")
						.attr("class", "chart")
						.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
					return chartContainer;
				} //End of createChartContainer()

				function extractDimensionsAndCreateScales() {
					extractDimensions();
					createScales();
				} //End of extractDimensionAndCreateScales()

				function extractDimensions() {
					dimensions = d3.keys(data[0]).filter(function(d) { return propertyIsAValidDimension(d); });
				}
				
				function createScales() {
					if(sameDimensionScale) {
						createSameDimensionScale();
					} else {
						dimensions.forEach(function(dimName) { createUniqueDimensionScale(dimName); });
					}
         }

        function createSameDimensionScale() {
					var domain = calculateSameDimensionDomain();
					dimensionScales[sameDimensionScaleKeyVal] = createAxisScale(domain);
				}

				function calculateSameDimensionDomain() {
					return data.reduce(function(currentDomain, p) {
						var dimVals = dimensions.map(function(dimName) { return +p[dimName]; });
							return currentDomain.concat(dimVals);
					},[]).sort(mtd3.helpers.sortNumber);
				}

				function createUniqueDimensionScale(dimName) {
					var domain = data.map(function(p) { return +p[dimName]; }).sort(mtd3.helpers.sortNumber);
					dimensionScales[dimName] = createAxisScale(domain);
				}

				function createAxisScale(_domain) {
					return d3.scale.ordinal()
						.domain(_domain)
						.rangeBands([0, radius], 1);
        }

				function calculateRotationAngles() {
					var indexToDegreesConversionFactor = 360/dimensions.length;
					dimensions.forEach(function(dimName, index) {
						dimensionRotationAngles[dimName] = (index + 1) * indexToDegreesConversionFactor;
					});
				}

				function drawDimensionAxes() {
					var dimensionAxes = chartContainer.append("g").attr("class", "dimensions")
																.selectAll("g.axis")
																	.data(dimensions)
																.enter().append("g")
																	.attr("class", "axis")
																	.attr("transform", function(dim) { return "rotate(" + dimensionRotationAngles[dim] + " 0 0)"; })
																	.each(function(d) {
																		var axisScale = getAxisScale(d),
																		axis = d3.svg.axis()
																						.scale(axisScale)
																						.orient("top");
																		d3.select(this).call(axis);
																});

					dimensionAxes.append("g").attr("class", "axis-label")
						.attr("transform", "translate(" + radius*1.04 + ")")
					.append("text")
						.attr("text-anchor", function(dim) {
							var rotationAngle = dimensionRotationAngles[dim];
							if(rotationAngle === 90 || rotationAngle === 270) { return 'middle'; }
							else if(rotationAngle > 90 && rotationAngle < 270) { return 'end'; }
							else { return 'start'; }
						})
						.attr("transform", function(dim) { return "rotate(" + (360 - dimensionRotationAngles[dim]) + " 0 0)"; })
							.text(function(d) { return d; });
						} //End of drawDimensionAxes()

        function drawSpiderGridlinesAndGraphBorder() {
					drawGridlines();
					drawGraphBorder();

          function drawGridlines() {
						var gridlines = chartContainer.append("g").attr("class", "gridlines"),
								dimensionWithLargestDomain = getDimensionWithLargestDomain(),
								largestDomainDimensionScale = dimensionScales[dimensionWithLargestDomain];

						for (var i=0; i<=largestDomainDimensionScale.domain().length; i++) {
							var radius = largestDomainDimensionScale.range()[i];
							var gridline = mtd3.components.Polygon({numSides : dimensions.length, radius : radius })
								.strokeColor('grey')
								.fillOpacity(0)
								.strokeOpacity(0.3)
								.strokeWidth(1.5);
							var gridlineContainer = gridlines.append("g").attr("class", "gridline");
							plotPolygon(gridlineContainer, gridline);
						}
					}
			
					function drawGraphBorder() {
						var border = mtd3.components.Polygon({numSides : dimensions.length, radius : radius})
							.fillOpacity(0)
							.strokeWidth(2);
						var borderContainer = chartContainer.append("g").attr("class", "border");
						plotPolygon(borderContainer, border);
					}

					function plotPolygon(container, polygon) {
						container.datum(null).transition().duration(animationDuration).call(polygon);
					}
        }

				function getDimensionWithLargestDomain() {
					if(sameDimensionScale) {
						return sameDimensionScaleKeyVal;
					} else {
						return determineDimensionWithLargestDomain();
					}
				} //End of getDimensionWithLargestDomain

				function determineDimensionWithLargestDomain() {
					return dimensions.reduce(function(currentLargestDim, currentDim) {
						var currentDimDomainSize = dimensionScales[currentDim].domain().length,
								currentLargestDimDomainSize = dimensionScales[currentLargestDim].domain().length;
						if(currentDimDomainSize > currentLargestDimDomainSize) {
							return currentDim;
						} else {
							return currentLargestDim;
						}
					});
				}

				function drawSpiders() {
					var spiderData = generateSpiderData();
					plotSpiders(spiderData);
				}

				function generateSpiderData() {
					return data.map(function(d) {
						return {
							"coords" : generatePolygonCoordsFromInputData(d),
							"color" : interpolateColor(d)
						};
					});
				}

				function generatePolygonCoordsFromInputData(d) {
					return d3.keys(d).filter(propertyIsAValidDimension).map(function(dimName) {
					var coordRadius = calculateCoordRadius(dimName, d),
							coordAngleInDegrees = dimensionRotationAngles[dimName],
							angleInRadians = mtd3.helpers.degreesToRadians(coordAngleInDegrees);
							return { 'x': coordRadius * Math.cos(angleInRadians), 'y': coordRadius * Math.sin(angleInRadians) };
					});
				}

				function calculateCoordRadius(dimName, d) {
					var dimScale = getAxisScale(dimName);
					return dimScale(d[dimName]);
				}

				function getAxisScale(d) {
					if(sameDimensionScale) {
						return dimensionScales[sameDimensionScaleKeyVal];
					} else {
						return dimensionScales[d];
					}
				}

				function plotSpiders(spiderData) {
					var spiders = chartContainer.append("g").attr("class", "spiders");
					spiders.selectAll("g.spider")
                .data(spiderData)
              .enter().append("g")
					.attr("class", "spider")
					.each(function(d) {
						var spider = mtd3.components.Polygon()
                      .fillOpacity(0.3)
                      .fillColor(d['color'])
                      .strokeColor(d['color'])
                      .strokeWidth(1);
            d3.select(this).datum(d['coords']).transition().duration(animationDuration).call(spider);
          });
        }

        function propertyIsAValidDimension(d) { return (d !== "name" && d !== "mtd3-color"); }

        function interpolateColor(d) { return d['mtd3-color'] ? d['mtd3-color'] : colorPalette(d.name); }
			}); //End of selection(data)
			return chart;
		} //End of chart

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.radius = function(_) {
			if (!arguments.length) return radius;
			radius = _;
			return chart;
		};

		chart.colorPalette = function(_) {
			if(!arguments.length) return colorPalette;
			colorPalette = _;
			return chart;
		};

		chart.showLegend = function(_) {
			if(!arguments.length) return showLegend;
			showLegend = _;
			return chart;
		};

		chart.animationDuration = function(_) {
			if(!arguments.length) return animationDuration;
			animationDuration = _;
			return chart;
		};

		chart.sameDimensionScale = function(_) {
			if(!arguments.length) return sameDimensionScale;
			sameDimensionScale = _;
			return chart;
		};

		return chart;
	}; //End of SpiderViewChart

	mtd3.charts.LineChart = function() {
		var margin = {top: 30, right: 10, bottom: 20, left: 25},
			width = null,
			height = null,
			xScale = d3.scale.linear(),
			yScale = d3.scale.linear(),
			xAxisScaleMaxValMultipler = 1.0,
			yAxisScaleMaxValMultipler = 1.0,
			xDataProperty = "x",
			yDataProperty = "y",
			eventTooltips = false,
			transitionDuration = 1000,
			eventLinesColorScale = d3.scale.category10();

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
					availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
					availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer(),
						chartContainer = createChartContainer(0, 0),
						lineData = data.data || [],
						eventData = data.events || [];
					
					setDomainAndRangeForXAndYScales();
					drawDataLines();
					createAndDrawAxes();
					drawEventIndicators();
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.line-graph").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 line-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				} //End of createGraphContainer()

				function createChartContainer(xOffset, yOffset) {
					var chartContainer = graphContainer.selectAll("g.chart").data([data]);
					chartContainer.enter().append("svg:g")
						.attr("class", "chart")
						.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
					return chartContainer;
				} //End of createChartContainer()

				function drawDataLines() {
					var line = d3.svg.line()
								.x(function(d) { return xScale(d[xDataProperty]); })
								.y(function(d) { return yScale(d[yDataProperty]); });

					var dataLinesContainer = chartContainer.selectAll(".data-lines").data([data]);
					
					dataLinesContainer.enter().append("svg:g")
						.attr("class", "data-lines");

					var dataLines = dataLinesContainer.selectAll(".line").data(lineData);

					dataLines.enter().append("path")
							.attr("class", "line")
							.style("stroke-opacity", 0)
						.transition()
							.duration(transitionDuration)
							.style("stroke-opacity", 1)
							.attr("d", function(d) { 
								return line(d.data); 
							});

					dataLines.transition()
						.duration(transitionDuration)
						.attr("d", function(d) {
							return line(d.data); 
						});

					dataLines.exit()
						.transition()
							.duration(transitionDuration)
							.style("stroke-opacity", 0)
							.remove();
				}

				function createAndDrawAxes() {
					var axes = createD3Axes();
					drawAxes(axes);
				}

				function setDomainAndRangeForXAndYScales() {
					var mergedLineData = d3.merge(lineData.map(function(d) { return d.data; }));

					var xScaleDomain = d3.extent(mergedLineData, function(d) { return d[xDataProperty]; });
					xScaleDomain[1]*=xAxisScaleMaxValMultipler;

					xScale
						.domain(xScaleDomain)
						.range([0, availableWidth]);

					var yScaleDomain = d3.extent(mergedLineData, function(d) { return d[yDataProperty]; });
					yScaleDomain[1]*=yAxisScaleMaxValMultipler;

					yScale
						.domain(yScaleDomain)
						.range([availableHeight, 0]);
				}

				function createD3Axes() {
					var xAxis = d3.svg.axis()
									.scale(xScale)
									.orient("bottom");
					var yAxis = d3.svg.axis()
									.scale(yScale)
									.orient("left");
					return {
						'x' : xAxis,
						'y' : yAxis
					};
				}

				function drawAxes(d3Axes) {
					drawXAxis(d3Axes.x);
					drawYAxis(d3Axes.y);
				}

				function drawXAxis(d3XAxis) {
					var xAxis = chartContainer.selectAll(".x-axis")
						.data([data]);
						
					xAxis.enter().append("svg:g")
						.attr('class', 'x-axis axis')
						.attr('transform', 'translate(0,' + availableHeight + ')')
						.transition()
						.duration(transitionDuration)
							.call(d3XAxis);

					xAxis.transition()
						.duration(transitionDuration)
							.call(d3XAxis);						
					
					// TODO
					// var xAxisLabel = xAxisContainer.append("text")
					//.attr('class', "x-axis-label")
					//.attr("text-anchor", "end");
					
					//xAxisLabel.attr("X Axis Label");
				}

				function drawYAxis(d3YAxis) {
					var yAxis = chartContainer.selectAll(".y-axis")
						.data([data]);
						
					yAxis.enter().append("svg:g")
						.attr('class', 'y-axis axis')
						.transition()
						.duration(transitionDuration)
							.call(d3YAxis);

					yAxis.transition()
						.duration(transitionDuration)
							.call(d3YAxis);

					// TODO
					//var yAxisLabel = yAxisContainer.append("text")
					//.attr('class', "y-axis-label")
					//.attr("transform", "rotate(-90)")
					//.attr("y", 6)
					//.attr("dy", ".71em")
					//.attr("text-anchor", "end");
					//yAxisLabel.attr("Y Axis Label");
				}

				function drawEventIndicators() {
					var eventsContainer = chartContainer.selectAll("g.events")
						.data([eventData]);

					eventsContainer.enter().append("g")
						.attr("class", "events");

					var extractXValue = function(d) { return xScale(d[xDataProperty]); };

					var eventIndicators = eventsContainer.selectAll(".event")
						.data(eventData);

					eventIndicators.enter().append("line")
							.attr("class", "event")
							.attr("x1", extractXValue)
							.attr("y1", availableHeight)
							.attr("x2", extractXValue)
							.attr("y2", availableHeight)
							.style("stroke", function(d) {
								return eventLinesColorScale(d.type);
							})
						.transition()
							.duration(transitionDuration)
							.attr("y2", 0);


					var halfOfTransitionDuration = transitionDuration / 4;

					eventIndicators
						.transition()
						.duration(halfOfTransitionDuration)
							.attr("y2", availableHeight)
						.transition()
							.attr("x1", extractXValue)
							.attr("y1", availableHeight)
							.attr("x2", extractXValue)
							.style("stroke", function(d) {
								return eventLinesColorScale(d.type);
							})
						.transition()
						.duration(halfOfTransitionDuration)
							.attr("y2", 0);

					eventIndicators.exit()
						.transition()
							.duration(transitionDuration)
							.attr("y2", availableHeight)
							.remove();

					if(eventTooltips) bindEventTooltips(eventIndicators);
				}

				function bindEventTooltips(eventIndicators) {
					eventIndicators
						.on("mouseover", mtd3.components.Tooltip.revealTooltip)
						.on("mousemove", function(d,i) {
							var content = eventTooltips(d,i);
							return mtd3.components.Tooltip.setTooltip(content); 
						})
						.on("mouseout", mtd3.components.Tooltip.hideTooltip);
				}
				
			}); //End of selection.data()\
			return chart;
		} //End of chart()

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.x = function(_) {
			if(!arguments.length) return xDataProperty;
			xDataProperty = _;
			return chart;
		};

		chart.y = function(_) {
			if(!arguments.length) return yDataProperty;
			xDataProperty = _;
			return chart;
		};

		chart.transitionDuration = function(_) {
			if(!arguments.length) return transitionDuration;
			transitionDuration = _;
			return chart;
		};

		chart.eventTooltips = function(_) {
			if(!arguments.length) return eventTooltips;
			eventTooltips = _;
			return chart;
		};

		chart.xAxisScaleMaxValMultipler = function(_) {
			if(!arguments.length) {
				return xAxisScaleMaxValMultipler;
			} else if(arguments[0] < 1.0) {
				throw new Error("mtd3.charts.LineChart() - xAxisScaleMaxValMultipler cannot be below 1.0");
			} else {
				xAxisScaleMaxValMultipler = _;	
			}
			return chart;
		};

		chart.yAxisScaleMaxValMultipler = function(_) {
			if(!arguments.length) {
				return yAxisScaleMaxValMultipler;
			} else if(arguments[0] < 1.0) {
				throw new Error("mtd3.charts.LineChart() - yAxisScaleMaxValMultipler cannot be below 1.0");
			} else {
				yAxisScaleMaxValMultipler = _;	
			}
			return chart;
		};

		return chart;
	}; //End of LineChart


	mtd3.charts.Histogram = function() {
		var margin = {top: 30, right: 10, bottom: 20, left: 25},
			width = null,
			height = null,
			xScale = d3.scale.linear(),
			yScale = d3.scale.linear(),
			ticks = null,
			showBinCountLabels = true,
			transitionDuration = 1300
			;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
					availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
					availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer(),
						chartContainer = createChartContainer(0, 0);
					
					configureXScale(data);
					data = transformIntoHistogramData();
					configureYScale(data);
					createAndDrawAxes();
					drawBars();
				}

				function transformIntoHistogramData() {
					var histogramDataLayout = d3.layout.histogram();
					if(ticks) {
						histogramDataLayout.bins(xScale.ticks(ticks));
					}
					return histogramDataLayout(data);
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.histogram-graph").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 histogram-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				}

				function createChartContainer(xOffset, yOffset) {
					var chartContainer = graphContainer.selectAll("g.chart").data([data]);
					chartContainer.enter().append("svg:g")
						.attr("class", "chart")
						.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
					return chartContainer;
				}

				function drawBars() {
					var binWidth = calculateBinWidth() - 1,
						labelXPosition = binWidth/2;

					var barsContainer = chartContainer.selectAll(".bars").data([data]);
					barsContainer.enter().append("svg:g").attr("class", "bars");
					
					var bars = barsContainer.selectAll(".bar").data(data);
					/*
						Remove any extraneous bars
					*/
					bars.exit()
						.transition()
							.duration(transitionDuration)
							.style("fill-opacity", 0)
							.remove();

					/*
						Update existing bars
					*/
					bars
						.transition()
							.duration(transitionDuration)
							.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });
					bars.select("rect")
								.attr("height", function(d) { return availableHeight - yScale(d.y); })
								.attr("width", binWidth);
					bars.select("text")
						.attr("x", labelXPosition)
						.text(formatCountLabelValue);
						
					/*
						Draw new bars
					*/
					var newBars = bars.enter().append("svg:g")
						.attr("class", "bar")
						.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });
						
					newBars.append("rect")
							.attr("x", 1)
							.attr("width", 0)
							.attr("height", function(d) { return availableHeight - yScale(d.y); })
						.transition()
							.delay(transitionDuration)
							.duration(transitionDuration)
							.attr("width", binWidth);

					newBars.append("text")
							.attr("dy", ".75em")
							.attr("y", 6)
							.attr("x", labelXPosition)
							.attr("text-anchor", "middle")
							.text(formatCountLabelValue);
				}

				function calculateBinWidth() {
					var domainMin = xScale.domain()[0],
						domainMax = xScale.domain()[1];

					if(domainMin >= 0) {
						return xScale(domainMin + data[0].dx);
					} else {
						var sumOfMaxAndMinDomainVals = domainMax + domainMin,
							middleDomainVal = sumOfMaxAndMinDomainVals / 2;
							
						return xScale(data[0].dx) - xScale(middleDomainVal);
					}
				}

				function formatCountLabelValue(d) {
					return d3.format(",.0f")(d.y);
				}

				function createAndDrawAxes() {
					var axes = createD3Axes();
					drawAxes(axes);
				}

				function configureXScale(rawData) {
					var min = d3.min(rawData),
						max = d3.max(rawData);

					xScale
						.domain([min, max])
						.nice(1)
						.range([0, availableWidth]);
				}

				function configureYScale(histogramData) {
					yScale
						.domain([0, d3.max(histogramData, function(d) { return d.y; })])
						.range([availableHeight, 0]);
				}

				function createD3Axes() {
					var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient("bottom");

					return {
						"x" : xAxis
					};
				}

				function drawAxes(d3Axes) {
					drawXAxis(d3Axes.x);
				}

				function drawXAxis(d3XAxis) {
					var xAxis = chartContainer.selectAll(".x-axis").data([data]);
					
					xAxis.enter().append("svg:g")
							.attr('class', 'x-axis axis')
							.attr('transform', 'translate(0,' + availableHeight + ')')
						.transition()
							.duration(transitionDuration)
						.call(d3XAxis);

					xAxis
						.transition()
							.duration(transitionDuration)
							.call(d3XAxis);
				}
			
			}); //End of selection.data()
			return chart;
		} //End of chart()

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.transitionDuration = function(_) {
			if (!arguments.length) return transitionDuration;
			transitionDuration = _;
			return chart;
		};

		chart.ticks = function(_) {
			if(!arguments.length) {
				return ticks;
			} else if(typeof arguments[0] !== 'number') {
				throw new Error("mtd3.charts.Histogram() - ticks must be of type 'number'");
			} else {
				ticks = _;	
			}
			return chart;
		};

		chart.showBinCountLabels = function(_) {
			if(!arguments.length) return showBinCountLabels;
			showBinCountLabels = _;
			return chart;
		};

		return chart;
	}; //End of Histogram


	mtd3.charts.HeatMap = function() {
		var margin = {top: 0, right: 0, bottom: 0, left: 0},
			width = null,
			height = null,
			squareSize = 17,
			squareColorScale = d3.scale.linear().domain([0, 1]).range(["white", "#004D03"]), // NOTE: "004D03" is a very dark green
			squareEventHandlers = [],
			squareElements,
			tooltips = false
			;

		function chart(selection) {
			selection.each(function(data) {
				var container = d3.select(this),
					//availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
					availableHeight = (height || parseInt(container.style('height'), 10) || 500) - margin.top - margin.bottom;

				chart.update = function() { chart(selection); };
				chart.container = this;

				if(data || data.length) {
					var graphContainer = createGraphContainer(),
						chartContainer = createChartContainer(0, 0);
					drawSquares();
					bindEventsToSquares(squareEventHandlers);
					if(tooltips) bindTooltipHandlersToSquares();
					drawChartLabel();
				}

				function createGraphContainer() {
					var wrap = container.selectAll("g.mtd3.heatmap-graph").data([data]);
					wrap.enter().append("svg:g")
						.attr("class", "mtd3 heatmap-graph")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						.append('g');
					return wrap.select('g');
				}

				function createChartContainer(xOffset, yOffset) {
					var chartContainer = graphContainer.selectAll("g.chart").data([data]);
					chartContainer.enter().append("svg:g")
						.attr("class", "chart")
						.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
					return chartContainer;
				}

				function drawChartLabel() {
					var xOffset = 15,
						yOffset = (availableHeight/2) * 0.9;

					var labelContainer = chartContainer.selectAll(".label").data([data]);
					
					labelContainer.enter().append("svg:text")
						.attr("class", "label")
						.attr("x",0)
						.attr("y",0)
						.attr('transform', 'translate(' + xOffset +',' + yOffset + ') rotate(-90)')
						.text(function(d) { return d.name; });

					labelContainer
						.attr('transform', 'translate(' + xOffset +',' + yOffset + ') rotate(-90)')
						.text(function(d) { return d.name; });
				}

				function drawSquares() {
					var squaresContainer = chartContainer.selectAll(".squares").data([data]);
					
					squaresContainer.enter().append("g")
						.attr("class", "squares")
						.attr('transform', 'translate(' + 20 +',0)');
				
					var squaresData = data.data,
						availableColumnHeight = availableHeight,
						columnOffset = 0,
						dataIndexToColumnOffsetScaleDomain = [],
						dataIndexToColumnOffsetScaleRange = [],
						dataIndexToColumnOffsetScale = d3.scale.quantile();

					dataIndexToColumnOffsetScaleDomain.push(0);
					dataIndexToColumnOffsetScaleRange.push(columnOffset);
					
					squaresContainer.selectAll(".square").remove();

					squareElements = squaresContainer.selectAll(".square").data(squaresData);
					squareElements.enter().append("rect")
						.attr("class", "square")
						.style("fill", calculateSquareColor)
						.attr("width", squareSize)
						.attr("height", squareSize)
						.attr("y", determineSquareYOffset);

					function determineSquareYOffset(d, i) {
						if(availableColumnHeight >= squareSize) {
							var squareYPosition = availableHeight - availableColumnHeight;
							availableColumnHeight -= squareSize;
							return squareYPosition;
						} else {
							availableColumnHeight = availableHeight - squareSize;
							columnOffset += squareSize;
							dataIndexToColumnOffsetScaleDomain.push(i);
							dataIndexToColumnOffsetScaleRange.push(columnOffset);
							return 0;
						}
					}

					if(columnOffset > 0 && dataIndexToColumnOffsetScaleDomain.length >= 2) {
						var domainSegmentSize = dataIndexToColumnOffsetScaleDomain[1] - dataIndexToColumnOffsetScaleDomain[0],
							highestDomainValueIndex = dataIndexToColumnOffsetScaleDomain.length - 1,
							highestDomainValue = dataIndexToColumnOffsetScaleDomain[highestDomainValueIndex],
							secondToLastDomainValue = highestDomainValue + domainSegmentSize,
							lastDomainValue = secondToLastDomainValue + domainSegmentSize;
						dataIndexToColumnOffsetScaleDomain.push(secondToLastDomainValue);
						dataIndexToColumnOffsetScaleDomain.push(lastDomainValue);
						dataIndexToColumnOffsetScaleRange.push(columnOffset + squareSize);
					}

					dataIndexToColumnOffsetScale
						.domain(dataIndexToColumnOffsetScaleDomain)
						.range(dataIndexToColumnOffsetScaleRange);

					squareElements.attr("x", function(d, i) {
						return dataIndexToColumnOffsetScale(i); 
					});
				}

				function bindEventsToSquares() {
					squareEventHandlers.forEach(function(eventHandler) {
						squareElements.on(eventHandler.event, eventHandler.callback);
					});					
				}

				function bindTooltipHandlersToSquares() {
					squareElements
						.on("mouseover", mtd3.components.Tooltip.revealTooltip)
						.on("mousemove", function(d,i) {
							var content = tooltips(d,i);
							return mtd3.components.Tooltip.setTooltip(content); 
						})
						.on("mouseout", mtd3.components.Tooltip.hideTooltip);
				}

				function calculateSquareColor(d) {
					return squareColorScale(d.value);
				}
			
			}); //End of selection.data()
			return chart;
		} //End of chart()

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.colorScaleDomain = function(_) {
			if(!arguments.length) return squareColorScale.domain();
			squareColorScale.domain(_);
			return chart;
		};

		chart.colorScaleRange = function(_) {
			if(!arguments.length) return squareColorScale.range();
			squareColorScale.range(_);
			return chart;
		};

		chart.squareSize = function(_) {
			if(!arguments.length) return squareSize;
			squareSize = _;
			return chart;	
		};

		chart.tooltips = function(_) {
			if(!arguments.length) return tooltips;
			tooltips = _;
			return chart;	
		};

		chart.bindEventHandlerToSquares = function(_eventName, _callbackFn) {
			if(arguments.length !== 2) {
				throw new Error("bindEventHandlerToSquares() accepts only 2 arguments: one with the event name, and one for the callback function");
			} else {
				registerEventHandler(_eventName, _callbackFn);
				return chart;
			}
		};

		chart.unbindEventHandlers = function(_eventName) {
			if(arguments.length === 0) {
				unbindAllEventHandlers();
				return chart;
			} else if(arguments.length !== 1) {
				throw new Error("unbindEventHandlers() accepts only 1 argument (event name) or nothing (unbinds all event handlers)");
			} else if (!squareElements) {
				throw new Error("squares for HeatMap have not been rendered to the DOM yet");
			}
			else {
				unbindEvent(_eventName);
				return chart;
			}
		};

		function registerEventHandler(_eventName, _callbackFn) {
			squareEventHandlers.push({
				"event" : _eventName,
				"callback" : _callbackFn
			});
		}

		function unbindAllEventHandlers() {
			squareEventHandlers.forEach(function(eventHandler) {
				unbindEvent(eventHandler.event);
				eventHandler = null;
			});
			squareEventHandlers = [];
		}

		function unbindEvent(eventName) {
			squareElements.on(eventName, null);
		}

		return chart;
	}; //End of Heat Map


})(); //End of library code