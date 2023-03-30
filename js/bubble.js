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
        this.selectedCategories = [];
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

        vis.svg.append('text')
            .attr('class', '.title')
            .attr('x', 0)
            .attr('y', 100)
            .attr('dy', '.71em')
            .text('Breed Distribution');

        // Color palette for animal types
        vis.color = d3.scaleOrdinal()
            .domain(["Dog", "Cat", "Bird", "Other"])
            .range(d3.schemeTableau10);

        // Size scale for countries
        vis.size = d3.scaleLinear()
            .range([15, 80])  // circle will be between 7 and 55 px wide


        // Features of the forces applied to the nodes:
        vis.simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(function (d) {
                return Math.pow(d.radius, 2.0) * 0.03
            }))
            .force('x', d3.forceX().strength(0.03).x(vis.width / 2))
            .force('y', d3.forceY().strength(0.03).y(vis.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + 2));

    }

    updateVis() {
        let vis = this;

        vis.group = Array.from(d3.rollup(vis.data, v => v.length, d => d.breed, d => d.animal_type), ([breed, type, value]) => ({
            breed: breed,
            type: Array.from(type.keys())[0],
            value: Array.from(type.values())[0]
        })).sort((a, b) => b.value - a.value).slice(0, 100);

        vis.size.domain(d3.extent(vis.group, d => d.value));

        vis.nodes = vis.group.map(d => ({
            ...d,
            radius: vis.size(d.value),
            x: Math.random() * 900,
            y: Math.random() * 800
        }))

        console.log(vis.nodes);

        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        const elements = vis.chart.selectAll('.elements')
            .data(vis.nodes, d => d.breed);

        elements.exit().remove();

        const bubblesEnter = elements.enter().append('circle')
            .classed('bubble', true);

        bubblesEnter.merge(elements)
            .attr('r', d => d.radius)
            .attr('fill', d => vis.color(d.type))
            .on("mouseover", (event, d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY) + "px")
                    .html(`
                  <div class='tooltip-title'>${d.type}: ${d.breed}</div>
                    <div> ${d.value} </div>
                `);
            })
            .on("mouseleave", () => {
                d3.select('#tooltip').style('display', 'none');
            })
            .call(d3.drag() // call specific function when circle is dragged
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

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

        const labelsEnter = elements.enter().append('text');

        labelsEnter.merge(elements)
            .attr('dy', '.3em')
            .style('text-anchor', 'middle')
            .style('font-size', 12)
            .text(function (d) {
                return (d.value > 1000) ? ((d.value / vis.data.length) * 100).toFixed(2) + "%" : '';
            })

        const labels1Enter = elements.enter().append('text');

        labels1Enter.merge(elements)
            .attr('dy', '2em')
            .style('text-anchor', 'middle')
            .style('font-size', 7)
            .text(function (d) {
                return (d.value > 1000) ? d.breed : '';
            })

        vis.simulation
            .nodes(vis.nodes)
            .on("tick", function (d) {
                bubblesEnter
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                labelsEnter
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                labels1Enter
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
            })
            .restart();


    }
}