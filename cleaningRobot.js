class World {
    constructor(numFloors) {
        this.location = 0;
        this.floors = [];
        for (let i = 0; i < numFloors; i++) {
            this.floors.push({ dirty: false });
        }
    }

    markFloorDirty(floorNumber) {
        this.floors[floorNumber].dirty = true;
    }

    simulate(action) {
        switch (action) {
            case 'SUCK':
                this.floors[this.location].dirty = false;
                break;
            case 'LEFT':
                this.location = 0;
                break;
            case 'RIGHT':
                this.location = 2;
                break;
            case 'UP':
                this.location = 1;
                break;
            case 'DOWN':
                this.location = 3;
                break;
        }

        return action;
    }
}

function reflexVacuumAgent(world) {
    if (world.floors[world.location].dirty) { return 'SUCK'; }
    else if (world.location == 3) { return 'RIGHT'; }
    else if (world.location == 1) { return 'LEFT'; }
    else if (world.location == 2) { return 'UP'; }
    else if (world.location == 0) { return 'DOWN'; }
}

function tableVacuumAgent(world, table) {
    let location = world.location;
    let dirty = world.floors[location].dirty ? 1 : 0;
    return table[location][dirty];
}
