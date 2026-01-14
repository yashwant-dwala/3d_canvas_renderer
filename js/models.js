export const GREEN = "#50FF50"
export const YELLOW = "yellow"
export const GREY = "grey"
export const RED = "red"
export const BLUE = "blue"
export const BLACK = "#101010"

export const CUBE_MODEL = {
    vertices: [
        { x: 1, y: 1, z: 1 },
        { x: 1, y: -1, z: 1 },
        { x: -1, y: -1, z: 1 },
        { x: -1, y: 1, z: 1 },

        { x: 1, y: 1, z: -1 },
        { x: 1, y: -1, z: -1 },
        { x: -1, y: -1, z: -1 },
        { x: -1, y: 1, z: -1 },
    ],
    edges: [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [1, 5],
        [0, 4],
        [2, 6],
        [3, 7],
    ],
    v_color: RED,
    e_color: GREEN,
    v_size: 9,
    e_size: 3,
};


export const AXIS = {
    vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 0, z: 1 },
        { x: 0, y: -1, z: 1 },
        { x: -1, y: 0, z: 1 },
    ],
    edges: [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
    ],
    v_color: BLUE,
    e_color: GREY,
    v_size: 5,
    e_size: 1,
}


export const CIRCLE_MODEL = {
    vertices: (() => {
        const verts = [];
        const segments = 8;      // smoothness
        const radius = 1;

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            verts.push({
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius,
            });
        }
        return verts;
    })(),

    edges: (() => {
        const edges = [];
        const segments = 8;

        for (let i = 0; i < segments; i++) {
            edges.push([i, (i + 1) % segments]);
        }
        return edges;
    })(),

    v_color: GREEN,
    e_color: GREEN,
    v_size: 6,
    e_size: 2,
};


export const CYLINDER_MODEL = {
    vertices: (() => {
        const verts = [];
        const segments = 32;
        const radius = 1;
        const halfHeight = 1;

        // Front circle (z = +halfHeight)
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            verts.push({
                x: Math.cos(a) * radius,
                y: Math.sin(a) * radius,
                z: halfHeight,
            });
        }

        // Back circle (z = -halfHeight)
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            verts.push({
                x: Math.cos(a) * radius,
                y: Math.sin(a) * radius,
                z: -halfHeight,
            });
        }

        return verts;
    })(),

    edges: (() => {
        const edges = [];
        const segments = 32;

        // front circle edges
        for (let i = 0; i < segments; i++) {
            edges.push([i, (i + 1) % segments]);
        }

        // back circle edges
        for (let i = 0; i < segments; i++) {
            edges.push([
                i + segments,
                ((i + 1) % segments) + segments
            ]);
        }

        // side edges
        for (let i = 0; i < segments; i++) {
            edges.push([i, i + segments]);
        }

        return edges;
    })(),

    v_color: RED,
    e_color: GREEN,
    v_size: 6,
    e_size: 2,
};

export const SPHERE_MODEL = {
    vertices: (() => {
        const verts = [];
        const radius = 1;
        const latSegments = 6;   // vertical rings
        const lonSegments = 12;   // horizontal slices

        for (let lat = 0; lat <= latSegments; lat++) {
            const theta = (lat / latSegments) * Math.PI;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            for (let lon = 0; lon < lonSegments; lon++) {
                const phi = (lon / lonSegments) * Math.PI * 2;

                verts.push({
                    x: radius * sinT * Math.cos(phi),
                    y: radius * cosT,
                    z: radius * sinT * Math.sin(phi),
                });
            }
        }
        return verts;
    })(),

    edges: (() => {
        const edges = [];
        const latSegments = 6;
        const lonSegments = 12;

        const ring = lonSegments;

        for (let lat = 0; lat < latSegments; lat++) {
            for (let lon = 0; lon < lonSegments; lon++) {
                const curr = lat * ring + lon;
                const nextLon = lat * ring + (lon + 1) % ring;
                const nextLat = (lat + 1) * ring + lon;

                // horizontal ring
                edges.push([curr, nextLon]);

                // vertical connection
                edges.push([curr, nextLat]);
            }
        }

        return edges;
    })(),

    v_color: RED,
    e_color: GREEN,
    v_size: 4,
    e_size: 2,
};

export const TORUS_MODEL = {
    vertices: (() => {
        const verts = [];
        const R = 1.5; // Major radius
        const r = 0.5; // Minor radius
        const majorSegments = 12;
        const minorSegments = 6;

        for (let i = 0; i < majorSegments; i++) {
            const phi = (i / majorSegments) * Math.PI * 2;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);

            for (let j = 0; j < minorSegments; j++) {
                const theta = (j / minorSegments) * Math.PI * 2;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                // Torus on XZ plane
                verts.push({
                    x: (R + r * cosTheta) * cosPhi,
                    y: r * sinTheta,
                    z: (R + r * cosTheta) * sinPhi,
                });
            }
        }
        return verts;
    })(),

    edges: (() => {
        const edges = [];
        const majorSegments = 12;
        const minorSegments = 6;

        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const current = i * minorSegments + j;
                const nextMinor = i * minorSegments + (j + 1) % minorSegments;
                const nextMajor = ((i + 1) % majorSegments) * minorSegments + j;

                // Loop along tube (minor)
                edges.push([current, nextMinor]);
                // Loop around ring (major)
                edges.push([current, nextMajor]);
            }
        }
        return edges;
    })(),
    v_color: "orange",
    e_color: "cyan",
    v_size: 4,
    e_size: 2,
};
