class BarChart {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || { top: 20, right: 20, bottom: 20, left: 40 },
    };
    this.data = _data;
    this.selectedCategories = [];
    this.initVis();
  }

  initVis() {
    // Create SVG area, initialize scales and axes
    let vis = this;

    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);


    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.chart = vis.chartArea
      .append("g");

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.yScaleR = d3.scaleLinear().range([vis.height, 0]);

    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);

    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .ticks(["Baby", "Young", "Mature", "Elder"]);
    // .tickSizeOuter(0)
    // .tickFormat(d3.format("d"));

    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .ticks(5)
      .tickSizeOuter(0)
      .tickFormat(d3.format("d"));

    vis.yAxisR = d3.axisRight(vis.yScaleR)
      .ticks(5)
      .tickFormat(d3.format("d"));

    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    vis.yAxisGR = vis.chart.append('g')
      .attr('class', 'axis y-axis')
      .attr("transform", "translate(" + vis.width + " ,0)");

    vis.svg
      .append("text")
      .attr("class", "axis-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "12")
      .text("Count / Age (Years)");


    // Append right y axis title
    vis.svg.append('text')
      .attr('class', 'axis-title')
      .attr('x', vis.width - 80)
      .attr('y', 0)
      .attr('dy', '12')
      .text('Time in Shelter (Days)');
  }

  calculateAgeCounts() {
    let vis = this;

    let ageCounts = {};

    vis.data.forEach((d) => {
      const age = d.age_group;
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

    const ageCounts = vis.calculateAgeCounts();

    ageCounts.forEach((d) => {
      d.average = d.total / d.count;
      d.ageAvg = d.totalAge / d.count;
    });

    const maxAverage = d3.max(ageCounts, (d) => d.average);


    // Sort the unique age values in ascending order
    const sortedAges = Array.from(new Set(vis.data.map(vis.xValue))).sort(
      (a, b) => a - b
    );

    vis.xScale.domain(["Baby", "Young", "Mature", "Elder"]);
    vis.yScale.domain([0, d3.max(ageCounts, vis.yValue)]);
    vis.yScaleR.domain([0, d3.max(ageCounts, vis.yValueR) + 10]);
    vis.renderVis(ageCounts);

  }

  renderVis(ageCounts) {
    // Bind data to visual elements, update axes
    let vis = this;

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    vis.chart
      .selectAll(".bar")
      .data(ageCounts)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("y", (d) => vis.yScale(vis.yValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
      .attr("fill", (d) => colorScale(vis.yValue(d)))
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("bar-hover", true);
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px")
          .html(
            `Average Age: ${d.ageAvg.toFixed(2)}  <br> Count: ${vis.yValue(d)} <br> Avg Time in Shelter: ${d.average.toFixed(2)} days`
          );
      })
      .on("mouseleave", () => {
        d3.select(event.currentTarget).classed("bar-hover", false);
        d3.select("#tooltip").style("display", "none");
      });

    vis.chart.selectAll("path")
      .data([ageCounts])
      .join(
        enter => enter.append("path").attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 5),
        update => update,
        exit => exit.remove()
      )
      .attr("d", d3.line()
        .x(function (d) { return vis.xScale(d.age) + vis.xScale.bandwidth() / 2 })
        .y(function (d) { return vis.yScaleR(d.average) })
      );

    vis.xAxisG.call(vis.xAxis).call(g => g.select('.domain').remove());;
    vis.yAxisG.call(vis.yAxis).call(g => g.select('.domain').remove());;
    vis.yAxisGR.call(vis.yAxisR).call(g => g.select('.domain').remove());;
  }
}
