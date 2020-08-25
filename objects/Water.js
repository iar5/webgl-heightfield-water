import * as twgl from '/lib/twgl/twgl.js'
import * as Vec3 from '/lib/twgl/v3.js'
import * as Mat4 from '/lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices, makeUniformGridUVs } from '/lib/utils.js'
import { water_vs, water_fs } from '/rendering/water.js'
import { water_test_vs, water_test_fs } from '/rendering/watertest.js'
import JsSimulator from '/simulators/js/JsSimulator.js'
import GpgpuSimulator from '/simulators/gpgpu/GpgpuSimulator.js'


/**
 * This water object is able to use the JsSimulator and the GpgpuSimulator aswell.
 * Since there are only minor differences in the usage of both simulators, this class combines their usage.
 * If you want to switch the simulator, just (un)comment the corresponding simulator and programInfo.
 * There are some attributes and uniforms only used in one simulator but its no problem, if it's registered for the other one aswell.
 */
export default class Water{

    constructor(gl){

        const cubeMapTiles = twgl.createTexture(gl, {
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
                'assets/env/xpos.jpg',
                'assets/env/xneg.jpg',
                'assets/env/ypos.jpg',
                'assets/env/yneg.jpg', // gibts nicht
                'assets/env/zpos.jpg',
                'assets/env/zneg.jpg',
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
    
        this.countX = 128
        this.countZ = 128
        this.vertices = makeUniformGrid(this.countX, this.countZ)
        this.indices = makeTriangleStripIndices(this.countX, this.countZ)
        this.uv = makeUniformGridUVs(this.countX, this.countZ)

        this.simulator = new JsSimulator(this.countX, this.countZ, this.vertices, this.indices)
        this.programInfo = twgl.createProgramInfo(gl, [water_vs, water_fs])

        //this.simulator = new GpgpuSimulator(this.countX, this.countZ, gl)
        //this.programInfo = twgl.createProgramInfo(gl, [water_test_vs, water_test_fs]) 

        this.modelMat = Mat4.identity() 
        Mat4.translate(this.modelMat, [0, 0, 0], this.modelMat) 
        Mat4.scale(this.modelMat, [2, 1, 2], this.modelMat)

        gl.getExtension('OES_element_index_uint') // to use bigger indice arrays, already enabled in chrome but for older versions
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            indices: { numComponents: 3, data: Uint32Array.from(this.indices) }, // use gl.drawElements() with 32 Bit (bufferInfo.elementType is set to gl.UNSIGNED_INT)
            a_position: { numComponents: 3, data: this.vertices },
            a_normal: { numComponents: 3, data: this.simulator.normals },
            a_texcoord: { numComponents: 2, data: this.uv },
        })

        this.uniforms = { 
            u_model: this.modelMat,
            u_cubeMap: cubeMapTiles,
            u_cubeEnvMap: cubeMapEnv,
            u_poolModelMat: null, // TODO pool parameter hier auch angeben 
        }
    }

    update(gl){
        this.simulator.update(gl)
    }

    render(gl, globalUniforms, lightUniforms){
        gl.useProgram(this.programInfo.program) 
        twgl.setUniforms(this.programInfo, globalUniforms)
        twgl.setUniforms(this.programInfo, lightUniforms)
        twgl.setUniforms(this.programInfo, this.uniforms)
        if(this.simulator.texture) twgl.setUniforms(this.programInfo, { u_texture: this.simulator.texture })
        if(this.simulator.normals) twgl.setAttribInfoBufferFromArray(gl, this.bufferInfo.attribs.a_normal, this.simulator.normals)
        twgl.setAttribInfoBufferFromArray(gl, this.bufferInfo.attribs.a_position, this.vertices)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.bindFramebufferInfo(gl, null)
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE_STRIP)
    }
}