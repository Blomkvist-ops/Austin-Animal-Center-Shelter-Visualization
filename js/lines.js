class Line {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _data2, _selectAnimalType, _selectBreed, _selectAge, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1300,
      containerHeight: 280,
      margin: { top: 45, right: 60, bottom: 30, left: 100 },
      tooltipPadding: 15,
      colors: ["#F9F3B9", "#E5CD6C", "#ba7f4e", "#8C6239", "#2F1313"],
    };
    this.data = _data;
    this.data2 = _data2;
    this.selectAnimalType = _selectAnimalType;
    this.selectBreed = _selectBreed;
    this.selectAge = _selectAge;
    this.selectTime = null;
    this.dispatcher = _dispatcher;
    this.initVis();
  }
  initVis() {
    let vis = this;

    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .append("g")
      .attr(
        "transform",
        "translate(" +
        vis.config.margin.left +
        "," +
        vis.config.margin.top +
        ")"
      );

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.keys = ["intake", "outcome"];

    vis.colorScale = d3
      .scaleOrdinal()
      .domain(vis.keys)
      .range([vis.config.colors[2], vis.config.colors[1]]);

    vis.xScale = d3.scaleTime().range([0, vis.width]);

    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.yScaleR = d3.scaleLinear().range([vis.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);

    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .tickPadding(10)
      .tickFormat((d) => Math.abs(d));

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.clip = vis.chart
      .append("defs")
      .append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .attr("x", 0)
      .attr("y", 0);

    vis.areaChart = vis.chart.append("g").attr("clip-path", "url(#clip)");

    // Initialize brush component
    vis.brushG = vis.chart.append("g").attr("class", "brush x-brush");

    vis.defaultSelection = [0, 0];
    vis.brush = d3
      .brushX()
      .extent([
        [0, 0],
        [vis.width, vis.height],
      ])
      .on("end", function ({ selection }) {
        if (selection) {
          if (selection[0] != 0 && selection[1] != 0) {
            d3.selectAll(".bubble.active").classed("active", false);
            d3.selectAll(".bar.active").classed("active", false);
            d3.selectAll(".cell.active").classed("active", false);
            vis.selectedDomain = selection.map(vis.xScale.invert, vis.xScale);
            vis.selectTime = selection.map(vis.xScale.invert, vis.xScale);
            vis.dispatcher.call("filterTime", this, vis.selectedDomain);
            vis.updateVis();
          }
        }
        if (!selection) {
          vis.selectTime = [0, 0];
          vis.dispatcher.call("filterTime", this, null);
          vis.updateVis();
        }
      });

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`)
      .call(vis.xAxis);

    // Append y-axis group
    vis.yAxisG = vis.chart
      .append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(-50, 0)");

    vis.svg
      .append("text")
      .attr("class", "view-title")
      .attr("x", 0)
      .attr("y", 5)
      .attr("dy", ".71em")
      .text("Intake & Outcome Timeline");

    vis.chart
      .append("text")
      .attr("class", "axis-title")
      .attr("x", 0)
      .attr("y", 5)
      .attr("dy", ".71em")
      .text("Intake Number");

    vis.chart
      .append("text")
      .attr("class", "axis-title")
      .attr("x", 0)
      .attr("y", 180)
      .attr("dy", ".71em")
      .text("Outcome Number");

    vis.size = 20;
    vis.mygroup = [0, 1];

    // Create the legend
    vis.legend = vis.chart
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.width - 100}, 0)`);

    vis.legendItemHeight = 20;

    // Update the legendData array with age groups and their colors
    vis.legendData = [
      { age: "Intake", color: "#E5CD6C" },
      { age: "Outcome", color: "#ba7f4e" },
    ];

    // Initialize clipping mask that covers the whole chart
    vis.chart
      .append("defs")
      .append("clipPath")
      .attr("id", "chart-mask")
      .append("rect")
      .attr("width", vis.width)
      .attr("y", -vis.config.margin.top)
      .attr("height", vis.config.containerHeight);

    vis.chart = vis.chart.append("g").attr("clip-path", "url(#chart-mask)");

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    const getMinDate = function (d1, d2) {
      if (d1 > d2) return d2;
      else return d1;
    };
    const getMaxDate = function (d1, d2) {
      if (d1 < d2) return d2;
      else return d1;
    };

    vis.filtereddata = vis.data;
    vis.filtereddata2 = vis.data2;

    let groupByDate = d3.group(vis.filtereddata, (g) => {
      return g.datetime.substring(0, 10);
    });

    vis.intakeArr = Array.from(groupByDate.entries());
    vis.intakeArr.forEach((e) => {
      e[1] = e[1].length;
    });

    let intakeTypeByDate = d3.group(vis.filtereddata, g => g.datetime.substring(0, 10), g => g.animal_type)
    vis.intakeTypeArr = Array.from(intakeTypeByDate.entries());
    vis.intakeNumArr = []

    const getTypeNum = function (currEntry, type) {
      if (currEntry.get(type)) {
        return currEntry.get(type).length;
      }
      return 0;
    }


    let outcomeTypeByDate = d3.group(vis.filtereddata2, g => g.datetime.substring(0, 10), g => g.animal_type)
    vis.outcomeTypeArr = Array.from(outcomeTypeByDate.entries());
    vis.outcomeNumArr = []

    if (vis.selectAnimalType.length > 0) {
      vis.intakeTypeArr.forEach((e) => {
        let res = 0
        for (let i = 0; i < vis.selectAnimalType.length; i++) {
          res += getTypeNum(e[1], vis.selectAnimalType[i])
        }
        vis.intakeNumArr.push([e[0], res]);
      })
      vis.outcomeTypeArr.forEach((e) => {
        let res = 0
        for (let i = 0; i < vis.selectAnimalType.length; i++) {
          res += getTypeNum(e[1], vis.selectAnimalType[i])
        }
        vis.outcomeNumArr.push([e[0], -res]);
      })
    }


    // get outcome data group by date
    let groupByDate2 = d3.group(vis.filtereddata2, (g) => {
      return g.datetime.substring(0, 10);
    });

    vis.outcomeArr = Array.from(groupByDate2.entries());
    vis.outcomeArr.forEach((e) => {
      e[1] = e[1].length;
    });

    // get net data
    let groupByDate3 = new Map();
    vis.intakeArr.forEach((e) => {
      if (groupByDate2.get(e[0]) != null) {
        let cnt = 0;
        for (let k in groupByDate2.get(e[0])) {
          cnt++;
        }
        let num = e[1] - cnt;
        groupByDate3.set(e[0], [num, e[1], cnt]);
      } else {
        groupByDate3.set(e[0], [e[1], e[1], 0]);
      }
    });

    vis.outcomeArr.forEach((e) => {
      if (groupByDate3.get(e[0]) == null) {
        groupByDate3.set(e[0], [-e[1], 0, e[1]]);
      }
    });

    const parseTime = d3.timeParse("%Y-%m-%d");
    // const parseTime = d3.timeParse("%Y-%m")
    vis.netArr = Array.from(groupByDate3.entries());
    let groupData = [];

    vis.intakeSum = vis.filtereddata.length;
    vis.outcomeSum = vis.filtereddata2.length;

    vis.netArr.forEach((e) => {
      let netNum = e[1][0];
      let intakeNum = e[1][1];
      let outcomeNum = e[1][2];
      groupData.push({
        key: e[0],
        values: [
          { year: e[0], name: "outcome", val: outcomeNum },
          { year: e[0], name: "intake", val: intakeNum },
        ],
      });
    });

    if (
      vis.selectTime != null &&
      vis.selectTime.length != 0 &&
      vis.selectTime[1] != 0
    ) {
      vis.newFilter1 = vis.data.filter(
        (d) =>
          new Date(d.datetime) < vis.selectTime[1] &&
          new Date(d.datetime) > vis.selectTime[0]
      );
      vis.newFilter2 = vis.data2.filter(
        (d) =>
          new Date(d.datetime) < vis.selectTime[1] &&
          new Date(d.datetime) > vis.selectTime[0]
      );
      vis.intakeSum = vis.newFilter1.length;
      vis.outcomeSum = vis.newFilter2.length;
    }

    vis.sortedNet = [];
    vis.netArr.forEach((e) => {
      vis.sortedNet.push({ year: parseTime(e[0]), value: e[1] });
    });

    vis.sortedNet.sort(function (a, b) {
      return a.year - b.year;
    });

    vis.intakeArr.sort(function (a, b) {
      return parseTime(a[0]) - parseTime(b[0]);
    });
    vis.outcomeArr.sort(function (a, b) {
      return parseTime(a[0]) - parseTime(b[0]);
    });

    // sort types arr
    vis.intakeNumArr.sort(function (a, b) {
      return parseTime(a[0]) - parseTime(b[0]);
    });
    vis.outcomeNumArr.sort(function (a, b) {
      return parseTime(a[0]) - parseTime(b[0]);
    });

    // vis.mygroup = [0, 1]
    vis.stackedData = d3
      .stack()
      .keys(vis.mygroup)
      .value(function (d, key) {
        return d.values[key].val;
      })(groupData);

    // sort stacked data to get correct stacked line chart
    this.stackedData.forEach((arr) => {
      arr.sort(function (a, b) {
        return parseTime(a.data.key) - parseTime(b.data.key);
      });
    });

    this.stackedData[0].forEach((e) => {
      e[2] = 0;
    });

    this.stackedData[1].forEach((e, i) => {
      e[0] = e[0] - this.stackedData[0][i][1];
      e[1] = e[1] - this.stackedData[0][i][1];
      e[2] = 1;
    });
    // get intake data group by date

    if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
      let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1]);
      let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1]);
      vis.xScale.domain([minDate, maxDate]);
    } else {
      vis.xScale.domain([new Date("2013-10-01"), new Date("2018-05-01")]);
    }
    vis.yScale.domain([-160, 160]);
    vis.yScaleR.domain([-100, 100]);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    const parseTime = d3.timeParse("%Y-%m-%d");

    let area = d3
      .area()
      .x(function (d, i) {
        return vis.xScale(parseTime(d.data.key));
      })
      .y0(function (d) {
        if (d[2] == 1) {
          return vis.yScale(d[0]);
        } else {
          return vis.yScale(-d[0]);
        }
      })
      .y1(function (d) {
        if (d[2] == 1) {
          return vis.yScale(d[1]);
        } else {
          return vis.yScale(-d[1]);
        }
      });

    vis.areaChart
      .selectAll("mylayers")
      .data(vis.stackedData)
      .join("path")
      .style("fill", function (d) {
        name = vis.keys[d.key];
        return vis.colorScale(name);
      })
      .attr("d", area);


    if (vis.selectAnimalType.length > 0) {
      vis.chart
        .selectAll(".intakeline")
        .data([
          vis.intakeNumArr
        ]) // Filter out data points with null or undefined average values
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "intakeline")
              .attr("fill", "none"),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr("d",
          d3.line().x(function (d) {
            return vis.xScale(parseTime(d[0]));
          })
            .y(function (d) {
              return vis.yScale(d[1]);
            })
        );

      vis.chart
        .selectAll(".outcomeline")
        .data([
          vis.outcomeNumArr
        ]) // Filter out data points with null or undefined average values
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "outcomeline")
              .attr("fill", "none"),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr("d",
          d3.line().x(function (d) {
            return vis.xScale(parseTime(d[0]));
          })
            .y(function (d) {
              return vis.yScale(d[1]);
            })
        );
    } else {
      vis.chart
        .selectAll(".intakeline")
        .data([]) // Filter out data points with null or undefined average values
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "intakeline")
              .attr("fill", "none"),
          (update) => update,
          (exit) => exit.remove()
        );

      vis.chart
        .selectAll(".outcomeline")
        .data([
        ]) // Filter out data points with null or undefined average values
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "outcomeline")
              .attr("fill", "none"),
          (update) => update,
          (exit) => exit.remove()
        );
    }

    vis.areaChart.append("g").attr("class", "brush").call(vis.brush);

    // Update axis and area position
    vis.xAxisG
      .transition()
      .duration(1000)
      .call(d3.axisBottom(vis.xScale).ticks(12));

    vis.areaChart.selectAll("path").transition().duration(1000).attr("d", area);

    vis.brushG.call(vis.brush).call(vis.brush.move, this.defaultSelection);

    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".lines").remove());

    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());

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
      .style("fill", (d) => {
        return d.color;
      });

    vis.legendItems
      .selectAll("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(
        (d) =>
          `${d.age} : ${d.age == "Intake" ? vis.intakeSum : vis.outcomeSum}`
      )
      .style("font-size", "12px");
  }
}
