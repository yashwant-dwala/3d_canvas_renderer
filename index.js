import { BLACK, CUBE_MODEL, AXIS, RED, GREY, GREEN, YELLOW, BLUE, CIRCLE_MODEL, CYLINDER_MODEL, SPHERE_MODEL, TORUS_MODEL } from './models.js';
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
let sceneObjects = [
    {
        name: "Cube",
        model: CUBE_MODEL,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { v: RED, e: GREEN }
    },
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
let scaleMode = false;    // Object Scale (S key)
let lockedAxis = null;    // Axis constraint (X/Y keys)

// Get toggle buttons
const rotateToggle = document.getElementById('rotateToggle');
const moveToggle = document.getElementById('moveToggle');
const scaleToggle = document.getElementById('scaleToggle');

// Input Handling
document.addEventListener('keydown', (e) => {
    // Axis Constraints
    if (e.key === 'x' || e.key === 'X') lockedAxis = 'x';
    if (e.key === 'y' || e.key === 'Y') lockedAxis = 'y';
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
    // S: Object Scale
    if (e.key === 's' || e.key === 'S') {
        if (!scaleMode) {
            scaleMode = true;
            scaleToggle.classList.add('active');
        }
    }
    // Tab: Cycle Selection (Select next single item)
    if (e.key === 'Tab') {
        e.preventDefault();
        if (sceneObjects.length === 0) return;

        // find first selected or 0
        let current = selectedIndices.values().next().value || 0;
        let next = (current + 1) % sceneObjects.length;

        selectedIndices.clear();
        selectedIndices.add(next);

        console.log("Selected:", sceneObjects[next].name);
        updateSceneExplorer();
    }

    // Ctrl + D: Delete Selected
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selectedIndices.size > 0) {
            deleteModels(Array.from(selectedIndices));
        }
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
    if (e.key === 's' || e.key === 'S') {
        scaleMode = false;
        scaleToggle.classList.remove('active');
    }

    // Release Axis Lock
    if (e.key === 'x' || e.key === 'X' && lockedAxis === 'x') {
        lockedAxis = null;
    }
    if (e.key === 'y' || e.key === 'Y' && lockedAxis === 'y') {
        lockedAxis = null;
    }
});

// Activity View Logic
const tabExplorer = document.getElementById('tabExplorer');
const tabShapes = document.getElementById('tabShapes');
const explorerView = document.getElementById('explorerView');
const shapesView = document.getElementById('shapesView');
const panelTitle = document.getElementById('panelTitle');
const sidePanel = document.getElementById('sidePanel');
const panelToggle = document.getElementById('panelToggle');

function switchView(view) {
    if (view === 'explorer') {
        tabExplorer.classList.add('active');
        tabShapes.classList.remove('active');
        explorerView.style.display = 'block';
        shapesView.style.display = 'none';
        panelTitle.textContent = 'EXPLORER';
    } else {
        tabExplorer.classList.remove('active');
        tabShapes.classList.add('active');
        explorerView.style.display = 'none';
        shapesView.style.display = 'block';
        panelTitle.textContent = 'SHAPES';
    }
    sidePanel.classList.remove('collapsed');
}

if (tabExplorer) tabExplorer.addEventListener('click', () => switchView('explorer'));
if (tabShapes) tabShapes.addEventListener('click', () => switchView('shapes'));

if (panelToggle) {
    panelToggle.addEventListener('click', () => {
        sidePanel.classList.toggle('collapsed');
    });
}

// Global function for adding models (called from HTML)
window.addModel = function (type) {
    let newModel = null;
    let color = { v: "#FFF", e: "#FFF" };

    // Choose Model Type
    if (type === 'Cube') {
        newModel = CUBE_MODEL;
        color = { v: RED, e: GREEN };
    }
    else if (type === 'Sphere') {
        newModel = SPHERE_MODEL;
        color = { v: YELLOW, e: BLUE };
    }
    else if (type === 'Cylinder') {
        newModel = CYLINDER_MODEL;
        color = { v: GREEN, e: RED };
    }
    else if (type === 'Torus') {
        newModel = TORUS_MODEL;
        color = { v: "orange", e: "cyan" };
    }

    if (newModel) {
        sceneObjects.push({
            name: type,
            model: newModel,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: color
        });

        // Select the new object
        selectedIndices.clear();
        selectedIndices.add(sceneObjects.length - 1);
        updateSceneExplorer();
    }
};

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
        // Transform Selected Objects (Position)
        selectedIndices.forEach(index => {
            const obj = sceneObjects[index];
            if (lockedAxis === 'x') {
                obj.position.x += dx * moveSensitivity;
            } else if (lockedAxis === 'y') {
                obj.position.y -= dy * moveSensitivity;
            } else {
                obj.position.x += dx * moveSensitivity;
                obj.position.y -= dy * moveSensitivity;
            }
        });
    }
    else if (rotationMode && selectedIndices.size > 0) {
        // Group Rotation Logic

        // 1. Calculate Centroid
        let cx = 0, cy = 0, cz = 0;
        selectedIndices.forEach(index => {
            const pos = sceneObjects[index].position;
            cx += pos.x;
            cy += pos.y;
            cz += pos.z;
        });
        const count = selectedIndices.size;
        const centroid = { x: cx / count, y: cy / count, z: cz / count };

        // 2. Apply Rotation
        const dTheta = (lockedAxis === 'x') ? 0 : dx * sensitivity; // Yaw (around Y)
        const dPhi = (lockedAxis === 'y') ? 0 : -dy * sensitivity;  // Pitch (around X)

        selectedIndices.forEach(index => {
            const obj = sceneObjects[index];

            // A. Update Local Rotation (Orientation)
            obj.rotation.x += dPhi;
            obj.rotation.y += dTheta;

            // B. Update Position (Orbit around Centroid)
            let rel = {
                x: obj.position.x - centroid.x,
                y: obj.position.y - centroid.y,
                z: obj.position.z - centroid.z
            };

            // Rotate relative vector (Yaw then Pitch)
            rel = rotate_xz(rel, dTheta);
            rel = rotate_yz(rel, dPhi);

            // Apply new position
            obj.position.x = centroid.x + rel.x;
            obj.position.y = centroid.y + rel.y;
            obj.position.z = centroid.z + rel.z;
        });
    }
    else if (scaleMode) {
        // Transform Selected Objects (Scale)
        const dScale = dy * 0.01;
        selectedIndices.forEach(index => {
            const obj = sceneObjects[index];
            if (lockedAxis === 'x') {
                obj.scale.x = Math.max(0.1, obj.scale.x + dScale);
            } else if (lockedAxis === 'y') {
                obj.scale.y = Math.max(0.1, obj.scale.y + dScale);
            } else {
                // Uniform
                obj.scale.x = Math.max(0.1, obj.scale.x + dScale);
                obj.scale.y = Math.max(0.1, obj.scale.y + dScale);
                obj.scale.z = Math.max(0.1, obj.scale.z + dScale);
            }
        });
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
    if (selectedIndices.size > 0) {
        // Reset ONLY Selected Objects
        selectedIndices.forEach(index => {
            const obj = sceneObjects[index];
            obj.rotation = { x: 0, y: 0, z: 0 };
            obj.position = { x: 0, y: 0, z: 0 };
        });
    } else {
        // Reset Camera (No objects selected)
        camera.theta = 0;
        camera.phi = 0;
        camera.distance = 4;
    }
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



// Helper to delete models
function deleteModels(indices) {
    if (indices.length === 0) return;

    // Use Set for efficient lookup is redundant for small arrays but good practice
    const toDelete = new Set(indices);
    sceneObjects = sceneObjects.filter((_, i) => !toDelete.has(i));

    // Clear selection as indices have changed
    selectedIndices.clear();
    updateSceneExplorer();
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

        // Delete Icon SVG
        // Note: Using event.stopPropagation defined in onclick embedded in HTML string requires global scope,
        // which modules don't provide on window. 
        // So we append it as an element.

        item.innerHTML = icon + `<span>${obj.name}</span>`;

        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;

        delBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent row selection
            deleteModels([index]);
        };

        item.appendChild(delBtn);
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

        // 1.5 Apply Object Scale
        currentModel = scale_model(currentModel, obj.scale);

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
        if (selectedIndices.has(i)) {
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



// Signature typing effect
function typeSignature() {
    const text = "Rasterizer by Yashwant Dwala.";
    const signatureElement = document.getElementById('signature');
    if (!signatureElement) return;

    let i = 0;
    signatureElement.innerHTML = "";

    function type() {
        if (i < text.length) {
            signatureElement.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 100);
        } else {
            // Typing complete, remove cursor
            signatureElement.classList.add('finished');
        }
    }

    // Start typing after a small delay
    setTimeout(type, 1000);
}

// Start signature animation
typeSignature();