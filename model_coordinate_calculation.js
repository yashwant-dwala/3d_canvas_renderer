export function rotate_xz({x,y,z}, angle){
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return {
        x: x*c - z*s,
        y,
        z: x*s + z*c,
    }
}

export function rotate_yz({x,y,z}, angle){
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return {
        x,
        y: y*c - z*s,
        z: y*s + z*c,
    }
}

export function rotate_xy({x,y,z}, angle){
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return {
        x: x*c - y*s,
        y: x*s + y*c,
        z,
    }
}

export function rotate_X_Y_Z_axis({x,y,z}, angle){
    return rotate_xy(rotate_yz(rotate_xz({x,y,z}, angle), angle), angle)
}



export function move_model(model, offset){
    return {
        vertices: model.vertices.map(v => ({
            x: v.x + offset.x,  
            y: v.y + offset.y,
            z: v.z + offset.z,
        })),
        edges: model.edges.map(e => [...e])
    }
}

export function scale_model(model, factor){
    return {
        vertices: model.vertices.map(v => ({
            x: v.x * factor,  
            y: v.y * factor,
            z: v.z * factor,
        })),
        edges: model.edges.map(e => [...e])
    }
}