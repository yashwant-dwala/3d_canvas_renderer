import { BLACK, CUBE_MODEL, AXIS, RED, GREY, GREEN, YELLOW, BLUE, CIRCLE_MODEL, CYLINDER_MODEL, SPHERE_MODEL } from './models.js';
import { move_model, scale_model, rotate_X_Y_Z_axis, rotate_xy, rotate_xz, rotate_yz } from "./model_coordinate_calculation.js"

game.width = window.innerWidth  // W
game.height = window.innerHeight  // H

const FPS = 60
let dz = 4
let angle = 0

const ctx = game.getContext("2d")


function clear() {
    ctx.fillStyle = BLACK
    ctx.fillRect(0, 0, game.width, game.height)
}

function point({ x, y }, color, size) {
    let POINT_SIZE = size
    ctx.fillStyle = color
    // offseted point from centre
    ctx.fillRect(x - POINT_SIZE / 2, y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE)
}

function line(p1, p2, color, size) {
    ctx.lineWidth = size
    ctx.strokeStyle = color
    // console.log(p1, p2)
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
}

function get_screen_cordinates(p) {
    // -1 ..1 =>  0..2 => 0..1 => 0...W
    // -1 ..1 =>  0..2 => 0..1 => 0...H
    return {
        x: (p.x + 1) / 2 * game.width,
        y: (1 - (p.y + 1) / 2) * game.height,   // 1-   normalized positive up
    }
}

function project3d_to_2d({ x, y, z }) {
    return {
        x: x / z,
        y: y / z,
    }
}
function translate_z({ x, y, z }, dz) { // zooom out-in
    return { x, y, z: z + dz };
}


// Scene State
const sceneObjects = [
    {
        name: "Cube",
        model: CUBE_MODEL,
        position: { x: -2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: { v: RED, e: GREEN }
    },
    {
        name: "Sphere",
        model: SPHERE_MODEL,
        position: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: { v: YELLOW, e: BLUE }
    },
    {
        name: "Cylinder",
        model: CYLINDER_MODEL,
        position: { x: 0, y: -2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: { v: GREEN, e: RED }
    }
];

let selectedIndices = new Set([0]); // Set of selected model indices (default first)

// Camera using spherical coordinates (eliminates gimbal lock)
const camera = {
    theta: 0,      // horizontal angle (azimuth)
    phi: 0,        // vertical angle (elevation)
    distance: 4
};

// Toggle States
let rotationMode = false; // Object Rotation (R key)
let moveMode = false;     // Object Movement (G key)

// Get toggle buttons
const rotateToggle = document.getElementById('rotateToggle'); // Reuse for Object Rotation indicator
const moveToggle = document.getElementById('moveToggle');

// Input Handling
document.addEventListener('keydown', (e) => {
    // R: Object Rotation
    if (e.key === 'r' || e.key === 'R') {
        if (!rotationMode) {
            rotationMode = true;
            rotateToggle.classList.add('active');
        }
    }
    // G: Object Move
    if (e.key === 'g' || e.key === 'G') {
        if (!moveMode) {
            moveMode = true;
            moveToggle.classList.add('active');
        }
    }
    // Tab: Cycle Selection (Select next single item)
    if (e.key === 'Tab') {
        e.preventDefault();
        // find first selected or 0
        let current = selectedIndices.values().next().value || 0;
        let next = (current + 1) % sceneObjects.length;

        selectedIndices.clear();
        selectedIndices.add(next);

        console.log("Selected:", sceneObjects[next].name);
        updateSceneExplorer();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        rotationMode = false;
        rotateToggle.classList.remove('active');
    }
    if (e.key === 'g' || e.key === 'G') {
        moveMode = false;
        moveToggle.classList.remove('active');
    }
});

// Mouse Interaction
let lastX = 0;
let lastY = 0;
const sensitivity = 0.003;
const moveSensitivity = 0.01;

game.addEventListener("mousemove", (e) => {
    if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    if (moveMode) {
        // Transform the Active Object (Position)
        const obj = sceneObjects[activeObjectIndex];
        obj.position.x += dx * moveSensitivity;
        obj.position.y -= dy * moveSensitivity;
    }
    else if (rotationMode) {
        // Transform the Active Object (Rotation)
        const obj = sceneObjects[activeObjectIndex];
        obj.rotation.x -= dy * sensitivity; // Pitch
        obj.rotation.y += dx * sensitivity; // Yaw
    }
    else {
        // Default: Camera Orbit
        if (e.buttons === 1) { // Left click drag
            camera.theta += dx * sensitivity;
            camera.phi -= dy * sensitivity;
        }
    }

    lastX = e.clientX;
    lastY = e.clientY;
});

// Update logic to handle null check properly on mouse up/leave
game.addEventListener("mousedown", (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
});

// Zoom functionality (Mouse Wheel)
game.addEventListener("wheel", (e) => {
    e.preventDefault(); // Prevent page scrolling
    const zoomSensitivity = 0.005;
    camera.distance += e.deltaY * zoomSensitivity;

    // Clamp zoom levels (nearest: 1, farthest: 20)
    camera.distance = Math.max(1, Math.min(20, camera.distance));
}, { passive: false });



// Reset Button
document.getElementById('resetButton').addEventListener('click', () => {
    camera.theta = 0;
    camera.phi = 0;
    camera.distance = 4;
    // Reset all objects
    sceneObjects.forEach(obj => {
        obj.rotation = { x: 0, y: 0, z: 0 };
    });
    // Hard reset positions
    sceneObjects[0].position = { x: -2, y: 0, z: 0 };
    sceneObjects[1].position = { x: 2, y: 0, z: 0 };
    sceneObjects[2].position = { x: 0, y: -2, z: 0 };

    // Reset selection
    activeObjectIndex = 0;
    updateSceneExplorer();
});

function apply_camera(p) {
    // Spherical coordinate camera - eliminates gimbal lock
    // Rotate the point by the camera angles

    // Apply horizontal rotation (theta) around Y axis (using XZ plane)
    p = rotate_xz(p, camera.theta);

    // Apply vertical rotation (phi) around the rotated X axis (using YZ plane)
    p = rotate_yz(p, camera.phi);

    // Move away from camera
    p = translate_z(p, camera.distance);
    return p;
}





function render_model(model, angle, displacement, custom_properties) {
    const v_color = custom_properties?.v_color ?? model.v_color
    const v_size = custom_properties?.v_size ?? model.v_size
    const e_color = custom_properties?.e_color ?? model.e_color
    const e_size = custom_properties?.e_size ?? model.e_size

    for (const v of model.vertices) {
        point(get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(v, angle), displacement))), v_color, v_size)
    }
    for (const f of model.edges) {
        for (let i = 0; i < f.length; i++) {
            const a = model.vertices[f[i]];
            const b = model.vertices[f[(i + 1) % f.length]];
            line(get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(a, angle), displacement))),
                get_screen_cordinates(project3d_to_2d(translate_z(rotate_X_Y_Z_axis(b, angle), displacement))), e_color, e_size)
        }
    }
}

function camera_renderer(model, custom_properties) {
    const v_color = custom_properties?.v_color ?? model.v_color
    const v_size = custom_properties?.v_size ?? model.v_size
    const e_color = custom_properties?.e_color ?? model.e_color
    const e_size = custom_properties?.e_size ?? model.e_size

    for (const v of model.vertices) {
        const p = apply_camera(v)
        // console.log(v,p)
        point(get_screen_cordinates(project3d_to_2d(p)), v_color, v_size)
    }
    for (const f of model.edges) {
        for (let i = 0; i < f.length; i++) {
            const a = model.vertices[f[i]];
            const b = model.vertices[f[(i + 1) % f.length]];
            const p1 = apply_camera(a);
            const p2 = apply_camera(b);
            line(get_screen_cordinates(project3d_to_2d(p1)),
                get_screen_cordinates(project3d_to_2d(p2)), e_color, e_size)
        }
    }
}



// Scene Explorer Logic
function updateSceneExplorer() {
    const list = document.getElementById('modelList');
    if (!list) return; // Guard clause
    list.innerHTML = '';

    sceneObjects.forEach((obj, index) => {
        const item = document.createElement('div');
        const isSelected = selectedIndices.has(index);
        item.className = 'model-item' + (isSelected ? ' active' : '');

        item.onclick = (e) => {
            // Multi-selection logic with Modifier Keys
            if (e.metaKey || e.ctrlKey) {
                // Toggle selection
                if (selectedIndices.has(index)) {
                    selectedIndices.delete(index);
                } else {
                    selectedIndices.add(index);
                }
            }
            else if (e.shiftKey) {
                // Shift: Add to selection
                selectedIndices.add(index);
            }
            else {
                // Single select (clear others)
                selectedIndices.clear();
                selectedIndices.add(index);
            }

            updateSceneExplorer();
        };

        // File Icon SVG
        const icon = `<svg class="model-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>`;

        item.innerHTML = icon + `<span>${obj.name}</span>`;
        list.appendChild(item);
    });
}

// Initial Call
updateSceneExplorer();

function frame() {
    let dt = 1 / FPS
    clear()

    // Render Axis (Global, Static)
    render_model(AXIS, 0, 0.1)

    // Render Scene Objects
    for (let i = 0; i < sceneObjects.length; i++) {
        const obj = sceneObjects[i];

        // 1. Get Base Model
        let currentModel = obj.model;

        // 2. Apply Object Rotation
        // Rotate vertices around object center (0,0,0) before translation
        currentModel = {
            vertices: currentModel.vertices.map(v => {
                let p = rotate_xz(v, obj.rotation.y); // Yaw
                p = rotate_yz(p, obj.rotation.x);     // Pitch
                return p;
            }),
            edges: currentModel.edges
        };

        // 3. Apply Object Position (Translation)
        currentModel = move_model(currentModel, obj.position);

        // 4. Highlight Selected Object
        let style = { v_color: obj.color.v, e_color: obj.color.e };
        if (i === activeObjectIndex) {
            style.e_color = "#FFFFFF"; // White edges for selected
            style.v_size = 6;
            style.e_size = 3;
        }

        // 5. Render to Camera
        camera_renderer(currentModel, style);
    }

    setTimeout(frame, 1000 / FPS)
}

setTimeout(frame, 1000 / FPS)

// clear()
// render_model(CUBE_MODEL,0,1.5)



// rendring done
// scale done
// camera movement  (check correctly)
// translate (check correctly)
// select a model