class HeatMap {
  constructor(_config, _data) {
    // Initialize HeatMap object with the specified configuration and data
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1300,
      containerHeight: 300,
      margin: _config.margin || { top: 20, right: 100, bottom: 40, left: 100 },
      colors: ["#F9F3B9", "#E5CD6C", "#AE6427", "#8C6239", "#2F1313"],
    };
    this.data = _data;
    this.initVis();
  }

  initVis() {
    // Initialize visualization settings
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

    // Set up scales and axes
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.05);
    vis.yScale = d3.scaleBand().range([0, vis.height]).padding(0.05);

    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");
  }

  updateVis() {
    // Update visualization settings based on the data
    let vis = this;

    // Group data by intake type and intake condition
    const groupedData = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => d.intake_type,
      (d) => d.intake_condition
    );

    // Calculate the counts for each intake type
    const intakeTypeCounts = vis.data.reduce((acc, item) => {
      if (!acc[item.intake_type]) {
        acc[item.intake_type] = 0;
      }
      acc[item.intake_type]++;
      return acc;
    }, {});

    // Sort the intake types based on counts in descending order
    const xDomain = Array.from(
      new Set(vis.data.map((d) => d.intake_type))
    ).sort((a, b) => intakeTypeCounts[b] - intakeTypeCounts[a]);

    // Calculate the counts for each intake condition
    const intakeConditionCounts = vis.data.reduce((acc, item) => {
      if (!acc[item.intake_condition]) {
        acc[item.intake_condition] = 0;
      }
      acc[item.intake_condition]++;
      return acc;
    }, {});

    // Sort the intake conditions based on counts in descending order
    const yDomain = Array.from(
      new Set(vis.data.map((d) => d.intake_condition))
    ).sort((a, b) => intakeConditionCounts[b] - intakeConditionCounts[a]);

    // Update scales and domains based on the sorted intake types and conditions
    vis.xScale.domain(xDomain);
    vis.yScale.domain(yDomain);

    // Create all possible combinations of intake types and conditions.
    const allCombinations = xDomain.flatMap((intakeType) =>
      yDomain.map((intakeCondition) => ({
        intakeType,
        intakeCondition,
      }))
    );

    // Flatten the groupedData into an array of objects containing the intake type, intake condition, and count
    const flattenedData = groupedData.flatMap(([intakeType, nested]) =>
      nested.map(([intakeCondition, count]) => ({
        intakeType,
        intakeCondition,
        count,
      }))
    );

    // Merge the flattenedData and allCombinations arrays, setting the count to 0 if there is no match in flattenedData
    const mergedData = allCombinations.map((combination) => {
      const match = flattenedData.find(
        (d) =>
          d.intakeType === combination.intakeType &&
          d.intakeCondition === combination.intakeCondition
      );
      return match ? match : { ...combination, count: 0 };
    });

    // Sort the mergedData by count in ascending order and adds an order property to each object based on its index
    const orderedData = mergedData
      .sort((b, a) => b.count - a.count)
      .map((data, index) => ({ ...data, order: index }));

    const groupSize = Math.ceil(orderedData.length / vis.config.colors.length);

    // Create a color scale with 5 ordinal groups based on the order property of the mergedData array
    vis.colorScale = d3
      .scaleOrdinal()
      .domain(orderedData.map((d) => d.order))
      .range(
        d3
          .range(vis.config.colors.length)
          .flatMap((i) => d3.range(groupSize).map(() => vis.config.colors[i]))
      );

    vis.renderVis(orderedData);
  }

  renderVis(orderedData) {
    let vis = this;

    vis.chart
      .selectAll("rect")
      .data(orderedData)
      .join("rect")
      .attr("x", (d) => vis.xScale(d.intakeType))
      .attr("y", (d) => vis.yScale(d.intakeCondition))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", vis.yScale.bandwidth())
      .attr("fill", (d) => vis.colorScale(d.order))
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("rect-hover", true);
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px")
          .html(`Count: ${d.count}`);
      })
      .on("mouseleave", (event) => {
        d3.select(event.currentTarget).classed("rect-hover", false);
        d3.select("#tooltip").style("display", "none");
      });

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // Create the legend
    const legend = vis.chart
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.width}, 0)`);

    const groupSize = Math.ceil(orderedData.length / vis.config.colors.length);
    const legendData = d3
      .range(vis.config.colors.length)
      .reverse()
      .map((i) => ({
        color: vis.config.colors[i],
        range: [
          orderedData.find((obj) => obj.order === i * groupSize).count,
          orderedData.find((obj) => obj.order === (i + 1) * groupSize - 1)
            .count,
        ],
      }));

    const legendItemHeight = 20;

    const legendItems = legend
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * legendItemHeight})`);

    legendItems
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", (d) => d.color);

    legendItems
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text((d) => `${d.range[0]} - ${d.range[1]}`)
      .style("font-size", "12px");
  }
}
