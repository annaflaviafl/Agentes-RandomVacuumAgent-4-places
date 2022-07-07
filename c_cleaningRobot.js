const SIZE = 100;
const colors = {
    perceptBackground: 'hsl(240,10%,85%)',
    perceptHighlight: 'hsl(60,100%,90%)',
    actionBackground: 'hsl(0,0%,100%)',
    actionHighlight: 'hsl(150,50%,80%)'
};

function makeDiagram(selector) {
    let diagram = {}, world = new World(4);
    diagram.world = world;
    diagram.xPosition = (floorNumber) => {
        if (floorNumber == 3) {
            return 15 + floorNumber * 200 / diagram.world.floors.length
        }
        else {
            return 15 + floorNumber * 600 / diagram.world.floors.length
        }
    };


    diagram.yPosition = (floorNumber) => {
        if (floorNumber == 1) {
            return 150;
        } else if (floorNumber == 3) {
            return 450;
        } else { return 300 }
    };

    diagram.root = d3.select(selector);
    diagram.robot = diagram.root.append('g')
        .attr('class', 'robot')
        .style('transform', `translate(${diagram.xPosition(world.location)}px, 100px`);
    diagram.robot.append('rect')
        .attr('width', SIZE)
        .attr('height', SIZE)
        .attr('fill', 'hsl(206, 100%, 50%)');
    diagram.perceptText = diagram.robot.append('text')
        .attr('x', SIZE / 2)
        .attr('y', -25)
        .attr('text-anchor', 'middle');
    diagram.actionText = diagram.robot.append('text')
        .attr('x', SIZE / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle');

    diagram.floors = [];
    for (let floorNumber = 0; floorNumber < world.floors.length; floorNumber++) {
        diagram.floors[floorNumber] =
            diagram.root.append('rect')
                .attr('class', 'clean floor') // for css
                .attr('x', diagram.xPosition(floorNumber))
                .attr('y', diagram.yPosition(floorNumber))
                .attr('width', SIZE)
                .attr('height', SIZE / 4)
                .on('click', function () {
                    world.markFloorDirty(floorNumber);
                    diagram.floors[floorNumber].attr('class', 'dirty floor');
                });
    }

    const randomDirtyFloor = Math.floor(Math.random() * 3);
    world.markFloorDirty(randomDirtyFloor);
    diagram.floors[randomDirtyFloor].attr('class', 'dirty floor');

    return diagram;
}

function renderWorld(diagram) {
    for (let floorNumber = 0; floorNumber < diagram.world.floors.length; floorNumber++) {
        diagram.floors[floorNumber].attr('class', diagram.world.floors[floorNumber].dirty ? 'dirty floor' : 'clean floor');
    }
    diagram.robot.style('transform', `translate(${diagram.xPosition(diagram.world.location)}px,${diagram.yPosition(diagram.world.location) - 100}px)`);
}

function renderAgentPercept(diagram, dirty) {
    let perceptLabel = { false: "It's clean", true: "It's dirty" }[dirty];
    diagram.perceptText.text(perceptLabel);
}

function renderAgentAction(diagram, action) {
    let actionLabel = { null: 'Waiting', 'SUCK': 'Vacuuming', 'LEFT': 'Going left', 'RIGHT': 'Going right', 'UP': 'Going up', 'DOWN': 'Going down' }[action];
    diagram.actionText.text(actionLabel);
}

const STEP_TIME_MS = 2500;
function makeAgentControlledDiagram() {
    let diagram = makeDiagram('#agent-controlled-diagram svg');

    function update() {
        let location = diagram.world.location;
        let percept = diagram.world.floors[location].dirty;
        let action = reflexVacuumAgent(diagram.world);
        diagram.world.simulate(action);
        renderWorld(diagram);
        renderAgentPercept(diagram, percept);
        renderAgentAction(diagram, action);
    }
    update();
    setInterval(update, STEP_TIME_MS);
}

function makeReaderControlledDiagram() {
    let diagram = makeDiagram('#reader-controlled-diagram svg');
    let nextAction = null;
    let animating = false;

    function makeButton(action, label, x) {
        let button = d3.select('#reader-controlled-diagram .buttons')
            .append('button')
            .attr('class', 'btn btn-default')
            .style('position', 'absolute')
            .style('left', x + 'px')
            .style('width', '100px')
            .text(label)
            .on('click', () => {
                setAction(action);
                updateButtons();
            });
        button.action = action;
        return button;
    }

    let buttons = [
        makeButton('LEFT', 'Move left', 440),
        makeButton('SUCK', 'Vacuum', 330),
        makeButton('RIGHT', 'Move right', 220),
        makeButton('UP', 'Move up', 0),
        makeButton('DOWN', 'Move down', 110),
    ];

    function updateButtons() {
        for (let button of buttons) {
            button.classed('btn-warning', button.action == nextAction);
        }
    }

    function setAction(action) {
        nextAction = action;
        if (!animating) { update(); }
    }

    function update() {
        let percept = diagram.world.floors[diagram.world.location].dirty;
        if (nextAction !== null) {
            diagram.world.simulate(nextAction);
            renderWorld(diagram);
            renderAgentPercept(diagram, percept);
            renderAgentAction(diagram, nextAction);
            nextAction = null;
            updateButtons();
            animating = setTimeout(update, STEP_TIME_MS);
        } else {
            animating = false;
            renderWorld(diagram);
            renderAgentPercept(diagram, percept);
            renderAgentAction(diagram, null);
        }
    }
}

function makeTableControlledDiagram() {
    let diagram = makeDiagram('#table-controlled-diagram svg');

    function update() {
        let table = getRulesFromPage();
        let location = diagram.world.location;
        let percept = diagram.world.floors[location].dirty;
        let action = tableVacuumAgent(diagram.world, table);
        diagram.world.simulate(action);
        renderWorld(diagram);
        renderAgentPercept(diagram, percept);
        renderAgentAction(diagram, action);
        showPerceptAndAction(location, percept, action);
    }
    update();
    setInterval(update, STEP_TIME_MS);

    function getRulesFromPage() {
        let table = d3.select("#table-controlled-diagram table");
        let left_clean = table.select("[data-action=left-clean] select").node().value;
        let left_dirty = table.select("[data-action=left-dirty] select").node().value;
        let up_clean = table.select("[data-action=up-clean] select").node().value;
        let up_dirty = table.select("[data-action=up-dirty] select").node().value;
        let right_clean = table.select("[data-action=right-clean] select").node().value;
        let right_dirty = table.select("[data-action=right-dirty] select").node().value;
        let down_clean = table.select("[data-action=down-clean] select").node().value;
        let down_dirty = table.select("[data-action=down-dirty] select").node().value;
        return [[left_clean, left_dirty], [up_clean, up_dirty], [right_clean, right_dirty], [down_clean, down_dirty]];
    }

    function showPerceptAndAction(location, percept) {
        let locationMarker = location === 0 ? 'left' : location === 1 ? 'up' : location === 2 ? 'right' : 'down';
        console.log(location, locationMarker, percept)
        let perceptMarker = percept ? 'dirty' : 'clean';

        d3.selectAll('#table-controlled-diagram th')
            .filter(function () {
                let marker = d3.select(this).attr('data-input');
                return marker == perceptMarker || marker == locationMarker;
            })
            .style('background-color', (d) => colors.perceptHighlight);

        d3.selectAll('#table-controlled-diagram td')
            .style('padding', '5px')
            .filter(function () {
                let marker = d3.select(this).attr('data-action');
                return marker == locationMarker + '-' + perceptMarker;
            })
            .transition().duration(0.05 * STEP_TIME_MS)
            .style('background-color', colors.actionHighlight)
            .transition().duration(0.9 * STEP_TIME_MS)
            .style('background-color', colors.actionBackground);
    }
}


makeAgentControlledDiagram();
makeReaderControlledDiagram();
makeTableControlledDiagram();
