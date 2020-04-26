import * as twgl from './lib/twgl/twgl.js'
import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'
import Stats from './lib/stats.module.js'
import { bottom_vs, bottom_fs } from './shader/bottom.js'
import { water_vs, water_fs } from './shader/water.js'
import { simulation } from './simulators/simpleSimulation.js'
import { degToRad, setupMouseControl, makeTriangleStripIndices, makeUniformGrid, loadImage } from './utils.js'



//////////////////
//     GUI      //
//////////////////

const stats = new Stats()
document.body.appendChild(stats.dom)




//////////////////
//  SETUP WEBGL //
//////////////////

var paused = false
const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl2")
twgl.resizeCanvasToDisplaySize(gl.canvas)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
gl.enable(gl.BLEND)
gl.enable(gl.DEPTH_TEST)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
gl.getExtension('OES_element_index_uint') // to use bigger indice arrays, already enabled in chrome but for older versions

const bottomProgram = twgl.createProgramInfo(gl, [bottom_vs, bottom_fs])
const waterProgram = twgl.createProgramInfo(gl, [water_vs, water_fs])




//////////////////
// CAMERA, etc..//
//////////////////

var fov = 35 * Math.PI / 180
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
var near = 0.001
var far = 100
const projection = Mat4.perspective(fov, aspect, near, far)

window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    twgl.resizeCanvasToDisplaySize(canvas)
    aspect = canvas.clientWidth / canvas.clientHeight    
    Mat4.perspective(fov, aspect, near, far, projection)
})

const camera = Mat4.identity() 
Mat4.translate(camera, [0, 1.75, 6], camera)
Mat4.rotateX(camera, degToRad(-12), camera)
setupMouseControl(camera)

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [0, 3, 0],
}

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.inverse(camera),
    u_cameraPosition: Vec3.create(), // TODO theoretisch über view matrix
} 


//////////////////
//BOTTOM TEXTURE//
//////////////////
const bottomModelMat = Mat4.identity()
Mat4.scale(bottomModelMat, [2, 1, 2], bottomModelMat)
Mat4.translate(bottomModelMat, [0, -0.5, 0], bottomModelMat)
const bottomTexture = twgl.createTexture(gl, { src: "assets/tiles.jpg" })

const bottomBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: [ // setting indices makes twgl to call drawElements
        0, 1, 2, 
        3, 2, 1
    ]},
    a_position: { numComponents: 3, data: [
        -1, 0, 1,
        1, 0, 1,
        -1, 0, -1,
        1, 0, -1
    ]},
    a_normal: { numComponents: 3, data: [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ]},
    a_texcoord: { numComponents: 2, data: [
        0, 1,
        1, 1,
        0, 0,
        1, 0,
    ]},
})
const bottomUniforms = {
    u_model: bottomModelMat,
    u_texture: bottomTexture
}


//////////////////
// WATER SURFACE//
//////////////////
const waterModelMat = Mat4.identity()

const widthX = 51 // 51 elemten = damit von 0 bis einschließlich 50 geht // TODO warum geht 41 net amk
const widthZ = 41
const scale = 0.1

const vertices = makeUniformGrid(widthX, widthZ, scale)
const indices = makeTriangleStripIndices(widthX, widthZ)
const vertexTriangles = makeTriangles(indices) // VertexId: Array<TriagleId>
const triangleNormals = Array.from({length: indices.length}, e => Array(3).fill(0)); // TriagleId: Vec3 TriangleNormal 
const normals = []

const waterBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: Uint32Array.from(indices) }, // to make twgl know that it should use gl.UNSIGNED_INT as type for gl.drawElements(). results in waterBufferInfo.elementType => gl.UNSIGNED_INT
    a_position: { numComponents: 3, data: vertices },
    a_normal: { numComponents: 3, data: normals },
})
const waterUniforms = { 
    u_model: waterModelMat ,
    u_bottomModelMat: bottomModelMat,
    u_bottomTexture: bottomTexture
}




//////////////////
// START MAIN LOOP
//////////////////

start()

function start(){
    simulation.initialize(widthX, widthZ)
    requestAnimationFrame(update)
}

function update(){
    requestAnimationFrame(update)
    stats.begin()
    updateCamera()
    if(!paused) updateSimulation()
    render()
    stats.end()
}

function updateCamera() {
    Mat4.inverse(camera, globalUniforms.u_view)
    Mat4.getTranslation(camera, globalUniforms.u_cameraPosition)
}

function updateSimulation() {
    let heightmap = simulation.update()  
    for(let i=0; i<vertices.length/3; i++){
        let x = i % widthX
        let y = Math.floor(i/widthX)
        vertices[i*3+1] = heightmap[x][y]
    }
    twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_position, vertices);

    updateTriangleNormals()
    updateVertexNormals()
    twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_normal, normals);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
    gl.useProgram(waterProgram.program) 
    twgl.setUniforms(waterProgram, globalUniforms)
    twgl.setUniforms(waterProgram, lightUniforms)
    twgl.setUniforms(waterProgram, waterUniforms)
    twgl.setBuffersAndAttributes(gl, waterProgram, waterBufferInfo)
    twgl.drawBufferInfo(gl, waterBufferInfo, gl.TRIANGLE_STRIP)

    gl.useProgram(bottomProgram.program) 
    twgl.setUniforms(bottomProgram, globalUniforms)
    twgl.setUniforms(bottomProgram, lightUniforms)
    twgl.setUniforms(bottomProgram, bottomUniforms)
    twgl.setBuffersAndAttributes(gl, bottomProgram, bottomBufferInfo)
    twgl.drawBufferInfo(gl, bottomBufferInfo, gl.TRIANGLES) 
}

window.addEventListener('keydown', e => {
    if(e.keyCode == 32)
        paused = !paused
})



 
/** 
 * triangles[vertex id] = Array<triangle id aller adjazenten Dreiecke>
 * @returns {Array} 
 */
export function makeTriangles(){
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
            
            // in triangle strip the triangles are not equally arranged in termes of clockwise/counterclockwise 
            // every second triangle need to get flipped
            // not sure if my implementation is conventional correct but its uniform and worming
            if(i%2==1) Vec3.mulScalar(n, -1, n)

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





