import * as twgl from './lib/twgl/twgl.js'
import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'
import Stats from './lib/stats.module.js'
import { texture_vs, texture_fs } from './shader/texture.js'
import { water_vs, water_fs } from './shader/water.js'
import { degToRad, createOrbitCamera } from './lib//utils.js'
import HeightfieldSimulation from './simulators/HeightfieldSimulation.js'
import { simulation } from './simulators/simplewater.js'



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
const gl = canvas.getContext("webgl", {antialias: true})
twgl.resizeCanvasToDisplaySize(gl.canvas)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
gl.enable(gl.BLEND)
gl.enable(gl.DEPTH_TEST)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
gl.getExtension('OES_element_index_uint') // to use bigger indice arrays, already enabled in chrome but for older versions

const poolProgram = twgl.createProgramInfo(gl, [texture_vs, texture_fs])
const waterProgram = twgl.createProgramInfo(gl, [water_vs, water_fs])




//////////////////
//   TEXTURES   //
//////////////////
const colorTexture = twgl.createTexture(gl, { src: [255, 0, 0, 255] })
const tilesTexture = twgl.createTexture(gl, { 
    //mag: gl.LINEAR,
    //min: gl.LINEAR,
    src: "assets/tiles.jpg" 
})

const cubeMap = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    //mag: gl.LINEAR,
    //min: gl.LINEAR,
    src: [
        "assets/tiles.jpg",
        "assets/tiles.jpg",
        "assets/tiles.jpg", // y transparent machen?
        "assets/tiles.jpg",
        "assets/tiles.jpg",
        "assets/tiles.jpg"
      ],
})
const cubeMapEnv = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    mag: gl.LINEAR,
    min: gl.LINEAR,
    src: [
        'assets/xpos.jpg',
        'assets/xneg.jpg',
        'assets/ypos.jpg',
        'assets/yneg.jpg', // gibts nicht?
        'assets/zpos.jpg',
        'assets/zneg.jpg',
      ],
})
const cubeMapTest = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    src: [
        'assets/test/xpos.png',
        'assets/test/xneg.png',
        'assets/test/ypos.png',
        'assets/test/yneg.png', 
        'assets/test/zpos.png',
        'assets/test/zneg.png',
      ],
})



//////////////////
// CAMERA, etc..//
//////////////////
const fov = degToRad(45)
const projection = Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100)

window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.width, canvas.width)
    twgl.resizeCanvasToDisplaySize(canvas)
    Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100, projection)
})

const camera = createOrbitCamera(canvas, Vec3.create(0, -0.1, 4), 25, 0)

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [0, 3, 0],
}

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.identity(),
} 




//////////////////
//    POOL      //
//////////////////
const s = 14/24 // scale calculated by tiles (want to see 14 of 24 tiles)

const poolModelMat = Mat4.identity()
Mat4.translate(poolModelMat, [0, s-1, 0], poolModelMat) 
Mat4.scale(poolModelMat, [1, s, 1], poolModelMat)

const poolBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: [
        0,  1,  2,      0,  2,  3,    // vorne
        4,  5,  6,      4,  6,  7,    // hinten
        8,  9,  10,     8,  10, 11,   // unten
        12, 13, 14,     12, 14, 15,   // rechts
        16, 17, 18,     16, 18, 19,   // links
    ]},
    a_position: { numComponents: 3, data: [
        // vorderne
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
       // hinteren
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,
       // unteren
       -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,
       // rechts
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,
       // links
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0
    ]},
    a_texcoord: { numComponents: 2, data: [
        // vorne
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0*s,
        0.0,  1.0*s,
        // hinten
        0.0,  0.0,
        1.0*s,  0.0,
        1.0*s,  1.0,
        0.0,  1.0,
        // unten
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // rechts
        0.0,  0.0,
        1.0*s,  0.0,
        1.0*s,  1.0,
        0.0,  1.0,
        // links
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0*s,
        0.0,  1.0*s
    ]},
    a_normal: { numComponents: 3, data: [
        //vorne
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        //hinten
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        // unten
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        // rechts
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        // links
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
    ]},
})

const poolUniforms = {
    u_model: poolModelMat,
    u_texture: tilesTexture,
}


//////////////////
//     WATER    //
//////////////////
const waterModelMat = Mat4.identity() 
Mat4.translate(waterModelMat, [0, 0, 0], waterModelMat) 
Mat4.scale(waterModelMat, [2, 1, 2], waterModelMat)

const heightfieldSimulation = new HeightfieldSimulation(80, 80, simulation)

const waterBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: Uint32Array.from(heightfieldSimulation.indices) }, // use gl.drawElements() with 32 Bit (waterBufferInfo.elementType is set to gl.UNSIGNED_INT)
    a_position: { numComponents: 3, data: heightfieldSimulation.vertices },
    a_normal: { numComponents: 3, data: heightfieldSimulation.normals },
})

const waterUniforms = { 
    u_model: waterModelMat,
    u_cubeMap: cubeMap,
    u_cubeEnvMap: cubeMapEnv,
    u_bottomModelMat: poolModelMat, 
    u_cameraPosition: Vec3.create(), 
}




//////////////////
//   MAIN LOOP  //
//////////////////
requestAnimationFrame(update)

function update(){
    requestAnimationFrame(update)
    stats.begin()
    updateCamera()
    if(!paused) {
        heightfieldSimulation.update()
        twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_position, heightfieldSimulation.vertices);
        twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_normal, heightfieldSimulation.normals);
    }
    render()
    stats.end()
}

function updateCamera() {
    Mat4.inverse(camera.mat, globalUniforms.u_view)
    Mat4.getTranslation(camera.mat, waterUniforms.u_cameraPosition)
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
    gl.useProgram(waterProgram.program) 
    twgl.setUniforms(waterProgram, globalUniforms)
    twgl.setUniforms(waterProgram, lightUniforms)
    twgl.setUniforms(waterProgram, waterUniforms)
    twgl.setBuffersAndAttributes(gl, waterProgram, waterBufferInfo)
    twgl.drawBufferInfo(gl, waterBufferInfo, gl[heightfieldSimulation.DRAW_MODE])

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(poolProgram.program) 
    twgl.setUniforms(poolProgram, globalUniforms)
    twgl.setUniforms(poolProgram, lightUniforms)
    twgl.setUniforms(poolProgram, poolUniforms)
    twgl.setBuffersAndAttributes(gl, poolProgram, poolBufferInfo)
    twgl.drawBufferInfo(gl, poolBufferInfo, gl.TRIANGLES) 
    gl.disable(gl.CULL_FACE);
}

window.addEventListener('keydown', e => {
    if(e.keyCode == 32)
        paused = !paused
})

