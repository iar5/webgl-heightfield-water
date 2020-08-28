import * as twgl from '/lib/twgl/twgl.js'
import * as primitives from '/lib/twgl/primitives.js'
import * as Vec3 from '/lib/twgl/v3.js'
import * as Mat4 from '/lib/twgl/m4.js'
import { skybox_vs, skybox_fs } from '/rendering/skybox.js'

const tempMat4 = Mat4.identity()

export default class Enviroment{

    constructor(gl){

        this.programInfo = twgl.createProgramInfo(gl, [skybox_vs, skybox_fs])

        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            indices: { numComponents: 3, data: [ 0, 1, 2, 2, 1, 3 ] },
            a_position: { numComponents: 2, data: [
                -1, -1,
                1, -1,
                -1, 1,
                1, 1
            ]},
            a_normal: { numComponents: 3, data: [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
            ]},
            a_texcoord: { numComponents: 2, data: [
                0, 0,
                1, 0,
                0, 1,
                1, 1,
            ]},
        })

        const cubeMap = twgl.createTexture(gl, {
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

        this.uniforms = {
            u_skybox: cubeMap,
            u_viewDirectionProjectionInverse: Mat4.identity()
        }
    }

    render(gl, globalUniforms){
        // transformation from https://twgljs.org/examples/no-box-skybox.html
        Mat4.setTranslation(globalUniforms.u_view, [0, 0, 0], tempMat4);
        Mat4.multiply(globalUniforms.u_projection, tempMat4, tempMat4);
        Mat4.inverse(tempMat4, this.uniforms.u_viewDirectionProjectionInverse);

        gl.useProgram(this.programInfo.program)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.setUniforms(this.programInfo, this.uniforms)
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE)
    }
}