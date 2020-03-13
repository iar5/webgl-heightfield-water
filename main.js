import * as twgl from './lib/twgl/twgl.js';
import * as Vec3 from './lib/twgl/v3.js';
import * as Mat4 from './lib/twgl/m4.js';
import Stats from './lib/stats.module.js'
import { degToRad } from './utils.js'
import { point_vs, point_fs } from './shader/point.js'
import { diffus_vs, diffus_fs } from './shader/diffus.js'
import { noise } from './noise.js'



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
requestAnimationFrame(render);




//////////////////
// CAMERA, etc..//
//////////////////

var fov = 35 * Math.PI / 180
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
var near = 0.001
var far = 100
const projection = Mat4.perspective(fov, aspect, near, far)
const camera = Mat4.identity() 
Mat4.translate(camera, [0, 1.5, 6], camera)
Mat4.rotateX(camera, degToRad(-10), camera)

const modelMat = Mat4.identity()

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [-2.0, 3.0, 2.0],
}

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.inverse(camera),
} 




//////////////////
// SURFACE DATA //
//////////////////

const vertices = []
const indices = [] 
make_plane(20, 20, vertices, indices, 0.25)

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
//   MAIN LOOP  //
//////////////////

function render() {
    requestAnimationFrame(render)
    stats.begin()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    Mat4.inverse(camera, globalUniforms.u_view)

    for(let i=0; i<vertices.length; i+=3){
        let d = noise(vertices[i]/2, Date.now()/10000, vertices[i+2]/2)
        //vertices[i+1] = d
    }
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

        // wenn ein Indice zwei mal vorkommt ist es kein richtiges Dreieck (wird es im triangle strip übersprungen)
        if(vId1 != vId2 && vId1 != vId3 && vId2 != vId3) {
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

        if(vId1 != vId2 && vId1 != vId3 && vId2 != vId3) {

            let v1 = [vertices[vId1], vertices[vId1+1], vertices[vId1+2]]
            let v2 = [vertices[vId2], vertices[vId2+1], vertices[vId2+2]]
            let v3 = [vertices[vId3], vertices[vId3+1], vertices[vId3+2]]

            let v12 = Vec3.subtract(v2, v1)
            let v23 = Vec3.subtract(v3, v1)
            let n = Vec3.cross(v12, v23)
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
 * Window resize handling
 */
window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    twgl.resizeCanvasToDisplaySize(canvas)
    aspect = canvas.clientWidth / canvas.clientHeight    
    Mat4.perspective(fov, aspect, near, far, projection)
})


/**
 * Mouse controls
 * by http://learningwebgl.com/blog/?p=1253
 */
var mouseDown
var lastMouseX
var lastMouseY
canvas.onmousedown = function(e) {
    mouseDown = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
}
document.onmouseup = function(e) { mouseDown = false }
document.onmousemove = function(e) {
    if (!mouseDown) return
    let newX = e.clientX
    let newY = e.clientY
    let deltaX = newX - lastMouseX
    let deltaY = newY - lastMouseY
    lastMouseX = newX
    lastMouseY = newY
    let newRotationMatrix = Mat4.create()
    Mat4.identity(newRotationMatrix)
    Mat4.rotateY(newRotationMatrix, -degToRad(deltaX / 5), newRotationMatrix)
    //m4.rotateX(newRotationMatrix, -degToRad(deltaY / 5), newRotationMatrix)
    Mat4.multiply(newRotationMatrix, camera, camera)
}


