export const GREEN = "#50FF50"
export const YELLOW = "yellow"
export const GREY = "grey"
export const RED = "red"
export const BLUE = "blue"
export const BLACK = "#101010"

export const CUBE_MODEL = {
    vertices :[
        {x:1, y:1, z:1},
        {x:1, y:-1, z:1},
        {x:-1, y:-1, z:1},
        {x:-1, y:1, z:1},
    
        {x:1, y:1, z:-1},
        {x:1, y:-1, z:-1},
        {x:-1, y:-1, z:-1},
        {x:-1, y:1, z:-1},
    ],
    edges : [
        [0,1,2,3],
        [4,5,6,7],
        [1,5],
        [0,4],
        [2,6],
        [3,7],
    ],
    v_color: RED,
    e_color: GREEN,
    v_size: 9,
    e_size: 3,
};


export const AXIS = {
    vertices : [
        {x:0, y:0, z:0},
        {x:0, y:1, z:1},
        {x:1, y:0, z:1},
        {x:0, y:-1, z:1},
        {x:-1, y:0, z:1},
    ],
    edges : [
        [0,1],
        [0,2],
        [0,3],
        [0,4],
    ],
    v_color: BLUE,
    e_color: GREY,
    v_size: 5,
    e_size: 1,
}
