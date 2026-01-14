import {BLACK, CUBE_MODEL, AXIS, RED, GREY, GREEN, YELLOW, BLUE, CIRCLE_MODEL, CYLINDER_MODEL, SPHERE_MODEL} from './models.js';
import {move_model, scale_model, rotate_X_Y_Z_axis, rotate_xy, rotate_xz, rotate_yz} from "./model_coordinate_calculation.js"

game.width = window.innerWidth  // W
game.height = window.innerHeight  // H

const FPS = 60
let dz = 4
let angle = 0

const ctx = game.getContext("2d")


function clear() {
    ctx.fillStyle = BLACK
    ctx.fillRect(0,0,game.width,game.height)
}

function point({x,y}, color, size) {
    let POINT_SIZE = size
    ctx.fillStyle = color
    // offseted point from centre
    ctx.fillRect(x - POINT_SIZE/2, y - POINT_SIZE/2, POINT_SIZE, POINT_SIZE)
}

function line(p1, p2, color, size) {
    ctx.lineWidth = size
    ctx.strokeStyle = color
    // console.log(p1, p2)
    ctx.beginPath()
    ctx.moveTo(p1.x,p1.y)
    ctx.lineTo(p2.x,p2.y)
    ctx.stroke()
}

function get_screen_cordinates(p) {
    // -1 ..1 =>  0..2 => 0..1 => 0...W
    // -1 ..1 =>  0..2 => 0..1 => 0...H
    return {
        x : (p.x+1)/2*game.width,
        y : (1-(p.y+1)/2)*game.height,   // 1-   normalized positive up
    }
}

function project3d_to_2d({x,y,z}){
    return {
        x : x/z,
        y : y/z,
    }
}
function translate_z({x,y,z}, dz)  { // zooom out-in
    return {x,y,z:z+dz};
}


// default camera
const camera = {
    rotX: 0,
    rotY: 0,
    distance: 4
};

// mouse inputs
let lastX = 0;
let lastY = 0;
const sensitivity = 0.003;

game.addEventListener("mousemove", (e) => {
    if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    camera.rotY += dx * sensitivity; // left-right
    camera.rotX += dy * sensitivity; // up-down

    // clamp vertical rotation
    camera.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotX));

    lastX = e.clientX;
    lastY = e.clientY;

    console.log(lastX,lastY)

});



function apply_camera(p) {
    p = rotate_yz(p, camera.rotX); // X axis (up/down)
    p = rotate_xz(p, camera.rotY); // Y axis (left/right)
    p = translate_z(p, camera.distance);
    console.log(p)


    return p;
}





function render_model(model, angle, displacement, custom_properties) {
    const v_color = custom_properties?.v_color ?? model.v_color
    const v_size  = custom_properties?.v_size  ?? model.v_size
    const e_color = custom_properties?.e_color ?? model.e_color
    const e_size  = custom_properties?.e_size  ?? model.e_size

    for(const v of model.vertices){
        point(get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(v,angle),displacement))), v_color, v_size)
    }
    for(const f of model.edges){
        for(let i=0; i<f.length;i++){
            const a = model.vertices[f[i]];
            const b = model.vertices[f[(i+1)%f.length]];
            line(get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(a,angle),displacement))),
            get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(b,angle),displacement))), e_color, e_size)
        }
    }
}

function camera_renderer(model, custom_properties) {
    const v_color = custom_properties?.v_color ?? model.v_color
    const v_size  = custom_properties?.v_size  ?? model.v_size
    const e_color = custom_properties?.e_color ?? model.e_color
    const e_size  = custom_properties?.e_size  ?? model.e_size

    for(const v of model.vertices){
        const p = apply_camera(v)
        // console.log(v,p)
        point(get_screen_cordinates(project3d_to_2d(p)), v_color, v_size)
    }
    for(const f of model.edges){
        for(let i=0; i<f.length;i++){
            const a = model.vertices[f[i]];
            const b = model.vertices[f[(i+1)%f.length]];
            const p1 = apply_camera(a);
            const p2 = apply_camera(b);
            line(get_screen_cordinates(project3d_to_2d(p1)),
            get_screen_cordinates(project3d_to_2d(p2)), e_color, e_size)
        }
    }
}



function frame() {
    let dt = 1/FPS 
    // dz += 1*dt
    angle += 0.1*Math.PI*dt 
    clear()
    render_model(AXIS,0,0.1)
    // render_model(CUBE_MODEL,angle,dz)

    camera_renderer(CUBE_MODEL)

    // render_model(scale_model(CUBE_MODEL,0.5),angle,dz)
    // render_model(scale_model(move_model(CUBE_MODEL,{x:1,y:1,z:1}),0.5),angle,dz, {v_color: YELLOW, e_color:RED, v_size: 10, e_size: 2})
    // render_model(scale_model(move_model(CYLINDER_MODEL,{x:1,y:1,z:1}),0.5),angle,dz)
    setTimeout(frame,1000/FPS)
}

setTimeout(frame,1000/FPS)

// clear()
// render_model(CUBE_MODEL,0,1.5)



// rendring done
// scale done
// camera movement  (check correctly)
// translate (check correctly)
// select a model