class BubbleChart {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _selectAge, _selectTypeCondition, _selectTime, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 650,
      containerHeight: 650,
      margin: { top: 15, right: 10, bottom: 10, left: 0 },
      tooltipPadding: 15,
      colors: ["#d92929", "#f0d773", "#ba7f4e", "#8C6239", "#6e4141"],
    };
    this.data = _data;
    this.dispatcher = _dispatcher;
    this.selectAge = _selectAge;
    this.selectTypeCondition = _selectTypeCondition;
    this.selectTime = _selectTime;
    this.selectedCategories = [];
    this.initVis();
  }

  /**
   * Create scales, axes, and append static elements
   */
  initVis() {
    let vis = this;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.chartArea = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.chart = vis.chartArea.append("g");

    vis.svg
      .append("text")
      .attr("class", ".title")
      .attr("x", 0)
      .attr("y", 62)
      .attr("dy", ".71em")
      .attr("class", "view-title")
      .text("Breed Distribution");

    // Color palette for animal types
    vis.color = d3
      .scaleOrdinal()
      .domain(["Dog", "Cat", "Bird", "Other"])
      .range([
        vis.config.colors[2],
        vis.config.colors[4],
        vis.config.colors[0],
        vis.config.colors[1],
      ]);

    // Size scale for countries
    vis.size = d3.scaleLinear().range([15, 90]); // circle will be between 7 and 55 px wide

    // Features of the forces applied to the nodes:
    vis.simulation = d3
      .forceSimulation()
      .force(
        "charge",
        d3.forceManyBody().strength(function (d) {
          return Math.pow(d.radius, 2.0) * 0.03;
        })
      )
      .force(
        "x",
        d3
          .forceX()
          .strength(0.03)
          .x(vis.width / 2)
      )
      .force(
        "y",
        d3
          .forceY()
          .strength(0.03)
          .y(vis.height / 2)
      )
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.radius + 2)
      )
      .alphaTarget(0.1)
      .alphaDecay(0.01);
  }

  updateVis() {
    let vis = this;

    vis.filtereddata = vis.data;

    if (vis.selectAge != null) {
      vis.filtereddata = vis.data.filter(
        (d) => d.age_group == vis.selectAge.age
      );
    }

    if (vis.selectTypeCondition != null) {
      vis.filtereddata = vis.data.filter(
        (d) =>
          d.intake_type == vis.selectTypeCondition.intakeType &&
          d.intake_condition == vis.selectTypeCondition.intakeCondition
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
      vis.filtereddata = vis.data.filter(
        (d) => 
          (new Date(d.intake_datetime) < maxDate &&
          new Date(d.intake_datetime) > minDate) || 
          (new Date(d.outcome_datetime) > minDate && new Date(d.outcome_datetime) < maxDate)
      );
    } 

    // create group of data needed for bubble chart
    vis.group = Array.from(
      d3.rollup(
        vis.filtereddata,
        (v) => v.length,
        (d) => d.breed,
        (d) => d.animal_type
      ),
      ([breed, type, value]) => ({
        breed: breed,
        type: Array.from(type.keys())[0],
        value: Array.from(type.values())[0],
      })
    )
      .sort((a, b) => b.value - a.value)
      .slice(0, 100);

    vis.size.domain(d3.extent(vis.group, (d) => d.value));

    // create nodes needed with size data
    vis.nodes = vis.group.map((d) => ({
      ...d,
      radius: vis.size(d.value),
      x: Math.random() * 900,
      y: Math.random() * 800,
    }));

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // draw nodes
    const bubbles = vis.chart
      .selectAll(".bubble")
      .data(vis.nodes)
      .join(
        (enter) => enter.append("circle").attr("class", "bubble"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => vis.color(d.type))
      .on("mouseover", (event, d) => {
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px").html(`
            <div class='tooltip-title'>${d.type}: ${d.breed}</div>
              <div> ${d.value} </div>
          `);
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      })
      .on("click", function (v, d) {
        const isActive = d3.select(this).classed("active");
        // limit 1 selection
        d3.selectAll(".bubble.active").classed("active", false);
        d3.selectAll(".bar.active").classed("active", false);
        d3.selectAll(".cell.active").classed("active", false);
        // toggle the selection
        d3.select(this).classed("active", !isActive);

        const selectedBreed = vis.chart.selectAll(".bubble.active").data();

        if (selectedBreed[0] != null) {
          vis.dispatcher.call("filterBreed", v, selectedBreed[0]);
        } else {
          vis.dispatcher.call("filterBreed", v, null);
        }
      })
      .call(
        d3
          .drag() // call specific function when circle is dragged
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // drag function
    function dragstarted(event, d) {
      if (!event.active) vis.simulation.alphaTarget(0.03).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) vis.simulation.alphaTarget(0.03);
      d.fx = null;
      d.fy = null;
    }

    // label first line
    const label = vis.chart
      .selectAll(".label")
      .data(vis.nodes)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "label")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .style("font-size", 12),
        (update) => update,
        (exit) => exit.remove()
      )
      .text(function (d) {
        return (d.value / vis.filtereddata.length) * 100 > 1
          ? ((d.value / vis.filtereddata.length) * 100).toFixed(2) + "%"
          : "";
      });

    // label second line
    const label1 = vis.chart
      .selectAll(".label1")
      .data(vis.nodes)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "label1")
            .attr("dy", "2em")
            .style("text-anchor", "middle")
            .style("font-size", 7),
        (update) => update,
        (exit) => exit.remove()
      )
      .text(function (d) {
        return (d.value / vis.filtereddata.length) * 100 > 1 ? d.breed : "";
      });

    // simulation function for nodes moving
    vis.simulation
      .nodes(vis.nodes)
      .on("tick", function (d) {
        bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        label.attr("x", (d) => d.x).attr("y", (d) => d.y);
        label1.attr("x", (d) => d.x).attr("y", (d) => d.y);
      })
      .restart();
  }
}
