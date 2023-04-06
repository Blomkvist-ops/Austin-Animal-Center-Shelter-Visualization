// BarChart class definition
class BarChart {
  // Class constructor with initial configuration
  constructor(_config, _data, _selectBreed, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 600,
      containerHeight: 500,
      margin: _config.margin || { top: 20, right: 125, bottom: 100, left: 50 },
      colors: ["#8C6239", "#AE6427", "#E5CD6C", "#F9F3B9"],
    };
    this.data = _data;
    this.selectBreed = _selectBreed;
    this.dispatcher = _dispatcher;
    this.selectedCategories = [];
    this.initVis();
  }

  // Initializes the SVG, chart area, scales, and axes
  initVis() {
    let vis = this;

    // Create SVG area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Create chart area (group element) and position it according to margins
    vis.chartArea = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Create the main chart group element
    vis.chart = vis.chartArea.append("g");

    // Calculate the width and height of the chart area
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);
    vis.yScaleR = d3.scaleLinear().range([vis.height, 0]);
    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);

    vis.colorScale = d3
      .scaleOrdinal(vis.config.colors.reverse())
      .domain(["Baby", "Young", "Mature", "Elder"]);

    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .ticks(["Baby", "Young", "Mature", "Elder"]);
    vis.yAxis = d3

      .axisLeft(vis.yScale)
      .ticks(5)
      .tickSizeOuter(0)
      .tickFormat(d3.format("d"));

    vis.yAxisR = d3.axisRight(vis.yScaleR).ticks(5).tickFormat(d3.format("d"));

    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis left");

    vis.yAxisGR = vis.chart
      .append("g")
      .attr("class", "axis y-axis right")
      .attr("transform", "translate(" + vis.width + " ,0)");

    vis.svg
      .append("text")
      .attr("class", "axis-title left")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "12")
      .text("Count / Age (Years)");

    // Append right y axis title
    vis.svg
      .append("text")
      .attr("class", "axis-title right")
      .attr("x", vis.width - 40)
      .attr("y", 0)
      .attr("dy", "12")
      .text("Time in Shelter (Days)");

    // Create the legend
    vis.legend = vis.chart
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.width}, 0)`);

    vis.legendItemHeight = 20;
    vis.legendColorScale = d3.scaleOrdinal(vis.config.colors.slice(0, 4));

    // Update the legendData array with age groups and their colors
    vis.legendData = [
      { age: "Baby", range: "0-2", color: vis.legendColorScale("Baby") },
      { age: "Young", range: "2-5", color: vis.legendColorScale("Young") },
      { age: "Mature", range: "5-10", color: vis.legendColorScale("Mature") },
      { age: "Elder", range: "10+", color: vis.legendColorScale("Elder") },
    ];
  }

  getAgeGroup(age) {
    if (age >= 0 && age < 2) return "Baby";
    if (age >= 2 && age < 5) return "Young";
    if (age >= 5 && age < 10) return "Mature";
    return "Elder";
  }

  // get age counts
  calculateAgeCounts() {
    let vis = this;

    let ageCounts = {};

    vis.filtereddata.forEach((d) => {
      const age = vis.getAgeGroup(d.age_upon_outcome); // Use helper function to determine age group
      const timeInShelter = d.time_in_shelter;

      if (!ageCounts[age]) {
        ageCounts[age] = { age, total: 0, count: 0, totalAge: 0 };
      }

      ageCounts[age].total += timeInShelter;
      ageCounts[age].count += 1;
      ageCounts[age].totalAge += d.age_upon_outcome;
    });

    return Object.values(ageCounts);
  }

  updateVis() {
    // Prepare data and scales
    let vis = this;

    vis.xValue = (d) => d.age;
    vis.yValue = (d) => d.count;
    vis.yValueR = (d) => d.average;

    vis.filtereddata = vis.data;

    if (vis.selectBreed != null) {
      vis.filtereddata = vis.data.filter(
        (d) => d.breed == vis.selectBreed.breed
      );
    }

    const ageCounts = vis.calculateAgeCounts();

    ageCounts.forEach((d) => {
      d.average = d.total / d.count;
      d.ageAvg = d.totalAge / d.count;
    });

    vis.xScale.domain(["Baby", "Young", "Mature", "Elder"]);
    vis.yScale.domain([0, d3.max(ageCounts, vis.yValue)]);
    vis.yScaleR.domain([0, d3.max(ageCounts, vis.yValueR) + 10]);
    vis.renderVis(ageCounts);
  }

  renderVis(ageCounts) {
    // Bind data to visual elements, update axes
    let vis = this;

    // bar view
    vis.chart
      .selectAll(".bar")
      .data(ageCounts)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("y", (d) => vis.yScale(vis.yValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
      .attr("fill", (d) => vis.colorScale(vis.xValue(d)))
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("bar-hover", true);
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px")
          .html(
            `Average Age: ${d.ageAvg.toFixed(2)}  <br> Count: ${vis.yValue(
              d
            )} <br> Avg Time in Shelter: ${d.average.toFixed(2)} days`
          );
        d3.selectAll(".y-axis.left .tick text").style("font-weight", "bold");
        d3.select(".axis-title.left").style("font-weight", "bold");
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget).classed("bar-hover", false);
        d3.select("#tooltip").style("display", "none");
        d3.selectAll(".y-axis.left .tick text").style("font-weight", "normal");
        d3.select(".axis-title.left").style("font-weight", "normal");
      })
      .on("click", function (v, d) {
        const isActive = d3.select(this).classed("active");
        // limit 1 selection
        d3.selectAll(".bar.active").classed("active", false);
        // toggle the selection
        d3.select(this).classed("active", !isActive);

        const selectedGender = vis.chart.selectAll(".bar.active").data();

        if (selectedGender[0] != null) {
          vis.dispatcher.call("filterAge", v, selectedGender[0]);
        } else {
          vis.dispatcher.call("filterBreed", v, null);
        }
      });

    // line view
    vis.chart
      .selectAll("path")
      .data([ageCounts])
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#2f1313")
            .attr("stroke-width", 5),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return vis.xScale(d.age) + vis.xScale.bandwidth() / 2;
          })
          .y(function (d) {
            return vis.yScaleR(d.average);
          })
      )
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("path-hover", true);
        d3.selectAll(".y-axis.right .tick text").style("font-weight", "bold");
        d3.select(".axis-title.right").style("font-weight", "bold");
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget).classed("path-hover", false);
        d3.selectAll(".y-axis.right .tick text").style("font-weight", "normal");
        d3.select(".axis-title.right").style("font-weight", "normal");
      });

    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
    vis.yAxisGR.call(vis.yAxisR).call((g) => g.select(".domain").remove());

    vis.legendItems = vis.legend
      .selectAll(".legend-item")
      .data(vis.legendData)
      .join(
        (enter) =>
          enter
            .append("g")
            .attr("class", "legend-item")
            .attr(
              "transform",
              (d, i) => `translate(30, ${i * vis.legendItemHeight})`
            ),
        (update) => update,
        (exit) => exit.remove()
      );

    vis.legendItems
      .selectAll("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", (d) => d.color);

    vis.legendItems
      .selectAll("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 20)
      .attr("y", 12)
      .text((d) => `${d.age}: ${d.range}`)
      .style("font-size", "12px");
  }
}
