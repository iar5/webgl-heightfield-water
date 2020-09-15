import * as twgl from '../../lib/twgl/twgl.js'
import * as Vec3 from '../../lib/twgl/v3.js'
import * as Mat4 from '../../lib/twgl/m4.js'


const skybox_vs = `
    attribute vec3 a_position;
    
    varying vec3 v_position;

    void main() {
        v_position = a_position;
        gl_Position = vec4(a_position, 1);
    }
`

const skybox_fs = `
    precision highp float;

    uniform samplerCube u_skybox;
    uniform mat4 u_viewDirectionProjectionInverse;

    varying vec3 v_position;

    void main() {
        vec4 t = u_viewDirectionProjectionInverse * vec4(v_position, 1);
        gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
    }
`

const tempMat4 = Mat4.identity()


/**
 * https://webglfundamentals.org/webgl/lessons/webgl-skybox.html
 */
export default class Skybox{

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
                'assets/skybox/xpos.jpg',
                'assets/skybox/xneg.jpg',
                'assets/skybox/ypos.jpg',
                'assets/skybox/yneg.jpg', 
                'assets/skybox/zpos.jpg',
                'assets/skybox/zneg.jpg',
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
        twgl.setUniforms(this.programInfo, this.uniforms)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE)
    }
}