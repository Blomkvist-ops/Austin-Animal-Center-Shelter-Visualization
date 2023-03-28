class BubbleChart {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 600,
            containerHeight: 800,
            margin: { top: 15, right: 10, bottom: 70, left: 60 },
            tooltipPadding: 15,
        }
        this.data = _data;
        this.initVis();
    }

    /**
     * Create scales, axes, and append static elements
     */
    initVis() {
        let vis = this;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

        // Color palette for animal types
        vis.color = d3.scaleOrdinal()
            .domain(["Dog", "Cat", "Bird", "Other"])
            .range(d3.schemeTableau10);

        // Size scale for countries
        vis.size = d3.scaleLinear()
            .range([15, 80])  // circle will be between 7 and 55 px wide


        // Features of the forces applied to the nodes:
        vis.simulation = d3.forceSimulation()
            .force("center", d3.forceCenter().x(200).y(400)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(.2).radius(function (d) { return (vis.size(d.value) + 3) }).iterations(1)) // Force that avoids circle overlapping

    }

    updateVis() {
        let vis = this;

        vis.group = Array.from(d3.rollup(vis.data, v => v.length, d => d.breed, d => d.animal_type), ([breed, type, value]) => ({
            breed: breed,
            type: Array.from(type.keys())[0],
            value: Array.from(type.values())[0]
        })).sort((a, b) => b.value - a.value).slice(0, 100);

        vis.size.domain(d3.extent(vis.group, d => d.value));

        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        var node = vis.chart.selectAll('.circle')
            .data(vis.group)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => vis.size(d.value))
            .attr("cx", 200)
            .attr("cy", 400)
            .style("fill", d => vis.color(d.type))
            .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            .call(d3.drag() // call specific function when circle is dragged
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        vis.simulation
            .nodes(vis.group)
            .on("tick", function (d) {
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
            });
        
        node.on("mouseover", (event, d) => {
            d3.select('#tooltip')
              .style('display', 'block')
              .style("left", (event.pageX +20) + "px")
              .style("top", (event.pageY) + "px")
              .html(`
              <div class='tooltip-title'>${d.type}: ${d.breed}</div>
                <div> ${d.value} </div>
            `);
          }) 
        .on("mouseleave", () => {
            d3.select('#tooltip').style('display', 'none');
          });
        

        // What happens when a circle is dragged?
        function dragstarted(event, d) {
            if (!event.active) vis.simulation.alphaTarget(.03).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active) vis.simulation.alphaTarget(.03);
            d.fx = null;
            d.fy = null;
        }


        // Apply these forces to the nodes and update their positions.
        // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.


        // Add textLabel
        // vis.chart.selectAll('.text')
        //     .data(vis.filteredData, d => d.id)
        //     .join('text')
        //     .attr('class', 'text')
        //     .text(d => {
        //         if (d.label == 1 || vis.selectLeader.includes(d.id)) {
        //             return d.leader
        //         }
        //     })
        //     .attr('transform',
        //         d => `translate(${vis.xScale(d.start_year)}, ${vis.yScale(d.start_age)}) rotate(-20)`);

    }
}