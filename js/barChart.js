class BarChart {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _dispatch) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || { top: 20, right: 20, bottom: 20, left: 40 },
    };
    this.data = _data;
    this.initVis();
  }

  initVis() {
    // Create SVG area, initialize scales and axes
    let vis = this;

    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);

    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .tickSizeOuter(0)
      .tickFormat(d3.format("d"));

    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .ticks(5)
      .tickSize(-vis.width)
      .tickSizeOuter(0)
      .tickFormat(d3.format("d"));

    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    vis.svg
      .append("text")
      .attr("class", "axis-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "12")
      .text("Time in Shelter (Days) / Age (Years)");
  }

  calculateAgeCounts() {
    let vis = this;

    let ageCounts = {};

    vis.data.forEach((d) => {
      const age = d.age_upon_outcome;
      const timeInShelter = d.time_in_shelter;

      if (!ageCounts[age]) {
        ageCounts[age] = { age, total: 0, count: 0 };
      }

      ageCounts[age].total += timeInShelter;
      ageCounts[age].count += 1;
    });

    return Object.values(ageCounts);
  }

  updateVis() {
    // Prepare data and scales
    let vis = this;

    vis.xValue = (d) => d.age_upon_outcome;
    vis.yValue = (d) => d.time_in_shelter;

    const ageCounts = vis.calculateAgeCounts();

    ageCounts.forEach((d) => {
      d.average = d.total / d.count;
    });

    const maxAverage = d3.max(ageCounts, (d) => d.average);

    // Sort the unique age values in ascending order
    const sortedAges = Array.from(new Set(vis.data.map(vis.xValue))).sort(
      (a, b) => a - b
    );

    // Set the xScale domain using the sorted age values
    vis.xScale.domain(sortedAges);
    vis.yScale.domain([0, maxAverage]);

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
      .attr("x", (d) => vis.xScale(d.age))
      .attr("y", (d) => vis.yScale(d.average))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(d.average))
      .attr("fill", (d) => colorScale(d.age))
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px")
          .html(
            `Age: ${d.age}<br>Avg Time in Shelter: ${d.average.toFixed(2)} days`
          );
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      });

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}
