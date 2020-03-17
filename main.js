import * as twgl from './lib/twgl/twgl.js'
import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'
import Stats from './lib/stats.module.js'
import { point_vs, point_fs } from './shader/point.js'
import { diffus_vs, diffus_fs } from './shader/diffus.js'
import { simulation } from './simulation.js'
import { degToRad, setupMouseControl } from './utils.js'



//////////////////
//     GUI      //
//////////////////

const stats = new Stats()
document.body.appendChild(stats.dom)




//////////////////
//  SETUP WEBGL //
//////////////////

const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl2")
twgl.resizeCanvasToDisplaySize(gl.canvas)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
gl.enable(gl.BLEND)
gl.enable(gl.DEPTH_TEST)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
gl.getExtension('OES_element_index_uint') // already enabled in chrome but yes

const pointProgram = twgl.createProgramInfo(gl, [point_vs, point_fs])
const diffusProgram = twgl.createProgramInfo(gl, [diffus_vs, diffus_fs])




//////////////////
// CAMERA, etc..//
//////////////////

var fov = 35 * Math.PI / 180
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
var near = 0.001
var far = 100
const projection = Mat4.perspective(fov, aspect, near, far)
const camera = Mat4.identity() 
Mat4.translate(camera, [0, 1.75, 6], camera)
Mat4.rotateX(camera, degToRad(-10), camera)
setupMouseControl(camera)

const modelMat = Mat4.identity()

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [0, 3, 0],
}

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.inverse(camera),
} 




//////////////////
// SURFACE DATA //
//////////////////

const widthX = 80
const widthZ = 80
const scale = 0.05

const vertices = []
const indices = [] 
make_plane(widthX, widthZ, vertices, indices, scale)

const vertexTriangles = make_triangles(indices) // VertexId: Array<TriagleId>
const triangleNormals = Array.from({length: indices.length}, e => Array(3).fill(0)); // TriagleId: Vec3 TriangleNormal 
const normals = []

const waterBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: Uint32Array.from(indices) }, // to make twgl know that it should use gl.UNSIGNED_INT as type for gl.drawElements()
    a_position: { numComponents: 3, data: vertices },
    a_normal: { numComponents: 3, data: normals },
})
waterBufferInfo.elementType = gl.UNSIGNED_INT // TODO notwendig oder vergessen wegzumachen?




//////////////////
// START MAIN LOOP
//////////////////

simulation.initialize(widthX, widthZ)
requestAnimationFrame(render)

function render() {
    requestAnimationFrame(render)
    stats.begin()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    Mat4.inverse(camera, globalUniforms.u_view)

    let heightmap = simulation.update()    
    for(let i=0; i<vertices.length/3; i++){
        let x = i % widthX
        let y = Math.floor(i/widthX)
        vertices[i*3+1] = heightmap[x][y]
    }

    //vertices[i+1] = noise(vertices[i]*0.5, Date.now()/10000, vertices[i+2]*0.5)
    twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_position, vertices);

    updateTriangleNormals()
    updateVertexNormals()
    twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_normal, normals);
    
    gl.useProgram(diffusProgram.program) 
    twgl.setUniforms(diffusProgram, globalUniforms)
    twgl.setUniforms(diffusProgram, lightUniforms)
    twgl.setUniforms(diffusProgram, { u_model: modelMat })
    twgl.setBuffersAndAttributes(gl, diffusProgram, waterBufferInfo)
    twgl.drawBufferInfo(gl, waterBufferInfo, gl.TRIANGLE_STRIP) // calls drawElements
    stats.end()
}





/**
 * from https://stackoverflow.com/a/5917700/7764088
 * strip explanation http://www.corehtml5.com/trianglestripfundamentals.php
 * vertices order: 
 *      456      
 *      123
 * TODO so umschreiben, dass gl_FrontFacing detected werden kann (zeigt momentan in die falsche richtung)
 * @param {Number} width 
 * @param {Number} depth 
 * @param {Array*} vertices 
 * @param {Number} scale
 */
function make_plane(width, depth, vertices, indices, scale) {
    // Set up vertices
    for (let y = 0; y<depth; ++y) {
        for (let x = 0; x<width; ++x) {
            vertices.push(
                (x-width/2+0.5)*scale,  
                0,
                (y-depth/2+0.5)*scale
            )
        }
    }
    // Set up indices
    let i = 0;
    for (let x = 0; x<width - 1; ++x) {
        indices[i++] = x * depth
        for (let y = 0; y < depth; ++y) {
            indices[i++] = x*depth + y
            indices[i++] = (x+1) * depth + y
        }
        indices[i++] = (x+1) * depth + (depth-1)
    }
}
 
/** 
 * triangles[vertex id] = Array<triangle id aller adjazenten Dreiecke>
 * @returns {Array} 
 */
function make_triangles(){
    const triangles = []

    // fill with empty arrays
    for(var i=0; i<vertices.length/3; i++)
        triangles.push([])

    // push triangle id to vertice id
    for (let i=0; i<indices.length; i++) {
        let vId1 = indices[i]
        let vId2 = indices[i+1]
        let vId3 = indices[i+2]

        if(isTriangle(vId1, vId2, vId3)) {
            triangles[vId1].push(i)
            triangles[vId2].push(i)
            triangles[vId3].push(i)
        }
    }    
    return triangles
}

/**
 * 
 */
function updateTriangleNormals(){
    for(let i=0; i<indices.length; i++){
        let vId1 = indices[i]
        let vId2 = indices[i+1]
        let vId3 = indices[i+2]

        if(isTriangle(vId1, vId2, vId3)) {
            let v1 = [vertices[vId1*3], vertices[vId1*3+1], vertices[vId1*3+2]]
            let v2 = [vertices[vId2*3], vertices[vId2*3+1], vertices[vId2*3+2]]
            let v3 = [vertices[vId3*3], vertices[vId3*3+1], vertices[vId3*3+2]]
                
            let v21 = Vec3.subtract(v2, v1)
            let v31 = Vec3.subtract(v3, v1)
            let n = Vec3.cross(v21, v31)
            
            // bc of triangle strip the triangles are not equally arranged in termes of clockwise/counterclockwise so it has to be tackled in normal calculation
            if(i%2==0) Vec3.mulScalar(n, -1, n)

            Vec3.normalize(n, n)
            Vec3.copy(n, triangleNormals[i]) 
        }
    }          
}



function updateVertexNormals(){
    for(let i=0; i<vertices.length/3; i++){
        let adjacentTriangleIds = vertexTriangles[i]
        let n = Vec3.create()
        
        for(let t of adjacentTriangleIds){                                    
            Vec3.add(n, triangleNormals[t], n)
        }

        Vec3.normalize(n, n)                        
        normals[i*3] = n[0]
        normals[i*3+1] = n[1]
        normals[i*3+2] = n[2]
    }          
}

/**
 * wenn ein Indice zwei mal vorkommt ist es kein richtiges Dreieck (wird es im triangle strip übersprungen)
 * @param {*} vId1 
 * @param {*} vId2 
 * @param {*} vId3 
 */
function isTriangle(vId1, vId2, vId3){
    return vId1!=vId2 && vId1!=vId3 && vId2!=vId3
}

/**
 * Window resize handling
 */
window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    twgl.resizeCanvasToDisplaySize(canvas)
    aspect = canvas.clientWidth / canvas.clientHeight    
    Mat4.perspective(fov, aspect, near, far, projection)
})




