class HeatMap {
  constructor(_config, _data, _selectBreed, _selectAge, _selectTime, _dispatcher) {
    // Initialize HeatMap object with the specified configuration and data
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1300,
      containerHeight: 330,
      margin: _config.margin || { top: 80, right: 100, bottom: 40, left: 100 },
      colors: ["#F9F3B9", "#E5CD6C", "#AE6427", "#8C6239", "#2F1313"],
    };
    this.data = _data;
    this.selectBreed = _selectBreed;
    this.selectAge = _selectAge;
    this.selectTime = _selectTime;
    this.dispatcher = _dispatcher;
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

    vis.svg
      .append("text")
      .attr("class", "view-title left")
      .attr("x", 0)
      .attr("y", 50)
      .attr("dy", "12")
      .text("Intake Condition / Intake Type / Count");

    // Create the legend
    vis.legend = vis.chart
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.width}, 0)`);

    vis.legendItemHeight = 20;
  }

  updateVis() {
    // Update visualization settings based on the data
    let vis = this;

    vis.filteredData = vis.data;

    if (vis.selectBreed != null) {
      vis.filteredData = vis.data.filter(
        (d) => d.breed == vis.selectBreed.breed
      );
    }

    if (vis.selectAge != null) {
      vis.filteredData = vis.data.filter(
        (d) => d.age_group == vis.selectAge.age
      );
    }

    const getMinDate = function (d1, d2) {
      if (d1 > d2) return d2;
      else return d1;
    };
    const getMaxDate = function (d1, d2) {
      if (d1 < d2) return d2;
      else return d1;
    };

    if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
      let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1]);
      let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1]);
      vis.filteredData = vis.data.filter(
        (d) => 
          (new Date(d.intake_datetime) < maxDate &&
          new Date(d.intake_datetime) > minDate) || 
          (new Date(d.outcome_datetime) > minDate && new Date(d.outcome_datetime) < maxDate)
      );
    } 

    // Group data by intake type and intake condition
    const groupedData = d3.rollups(
      vis.filteredData,
      (v) => v.length,
      (d) => d.intake_type,
      (d) => d.intake_condition
    );

    // Calculate the counts for each intake type
    const intakeTypeCounts = vis.filteredData.reduce((acc, item) => {
      if (!acc[item.intake_type]) {
        acc[item.intake_type] = 0;
      }
      acc[item.intake_type]++;
      return acc;
    }, {});

    // Sort the intake types based on counts in descending order
    const xDomain = Array.from(
      new Set(vis.filteredData.map((d) => d.intake_type))
    ).sort((a, b) => intakeTypeCounts[b] - intakeTypeCounts[a]);

    // Calculate the counts for each intake condition
    const intakeConditionCounts = vis.filteredData.reduce((acc, item) => {
      if (!acc[item.intake_condition]) {
        acc[item.intake_condition] = 0;
      }
      acc[item.intake_condition]++;
      return acc;
    }, {});

    // Sort the intake conditions based on counts in descending order
    const yDomain = Array.from(
      new Set(vis.filteredData.map((d) => d.intake_condition))
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

    vis.groupSizes = vis.calculateGroupSizes(
      orderedData.length,
      vis.config.colors.length
    );

    vis.legendData = vis.generateLegendData(orderedData);

    vis.renderVis(orderedData);
  }

  generateLegendData(orderedData) {
    let vis = this;

    if (orderedData.length === 0) {
      // Return an empty array if there is no data
      return [];
    }

    const initialLegendData = vis.groupSizes.map((size, i) => {
      const start = vis.groupSizes.slice(0, i).reduce((a, b) => a + b, 0);
      const end = start + size - 1;

      // Ensure that the range is not empty
      if (orderedData[start] && orderedData[end]) {
        return {
          color: vis.config.colors[i],
          range: [orderedData[start].count, orderedData[end].count],
        };
      }
      return null;
    });

    // Filter out any null values and then merge overlapping ranges
    const filteredLegendData = initialLegendData.filter(
      (item) => item !== null
    );
    const mergedLegendData = filteredLegendData.reduce((acc, item) => {
      if (acc.length === 0 || item.range[0] > acc[acc.length - 1].range[1]) {
        acc.push(item);
      } else {
        acc[acc.length - 1].range[1] = item.range[1];
      }
      return acc;
    }, []);

    return mergedLegendData;
  }

  calculateGroupSizes(length, numGroups) {
    const baseSize = Math.floor(length / numGroups);
    const remainder = length % numGroups;
    const sizes = [];

    for (let i = 0; i < numGroups; i++) {
      sizes.push(i < numGroups - remainder ? baseSize : baseSize + 1);
    }
    return sizes;
  }

  renderVis(orderedData) {
    let vis = this;

    // Create a custom color scale function that takes the count as input and returns the corresponding color
    vis.colorScale = (count) => {
      for (const legendItem of vis.legendData) {
        if (count >= legendItem.range[0] && count <= legendItem.range[1]) {
          return legendItem.color;
        }
      }
    };

    vis.chart
      .selectAll(".cell")
      .data(orderedData)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "cell")
            .attr("x", (d) => vis.xScale(d.intakeType))
            .attr("y", (d) => vis.yScale(d.intakeCondition))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", vis.yScale.bandwidth())
            .attr("fill", (d) => vis.colorScale(d.count))
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
            })
            .on("click", function (v, d) {
              if (d.count > 0) {
                const isActive = d3.select(this).classed("active");
                // limit 1 selection
                d3.selectAll(".bar.active").classed("active", false);
                d3.selectAll(".bubble.active").classed("active", false);
                d3.selectAll(".cell.active").classed("active", false);
                // toggle the selection
                d3.select(this).classed("active", !isActive);
                const selectedTypeCondition = vis.chart
                  .selectAll(".cell.active")
                  .data();

                if (selectedTypeCondition[0] != null) {
                  vis.dispatcher.call(
                    "filterTypeCondition",
                    v,
                    selectedTypeCondition[0]
                  );
                } else {
                  vis.dispatcher.call("filterTypeCondition", v, null);
                }
              }
            }),
        (update) =>
          update
            .attr("x", (d) => vis.xScale(d.intakeType))
            .attr("y", (d) => vis.yScale(d.intakeCondition))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", vis.yScale.bandwidth())
            .attr("fill", (d) => vis.colorScale(d.count)),
        (exit) => exit.remove()
      );

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

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
              (d, i) => `translate(0, ${i * vis.legendItemHeight})`
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
      .text((d) =>
        d.range[0] === d.range[1] ? d.range[0] : `${d.range[0]} - ${d.range[1]}`
      )
      .style("font-size", "12px");
  }
}
