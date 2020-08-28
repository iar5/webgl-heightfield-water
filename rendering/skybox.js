/**
 * water shader with reflektion/refraction based on a cubemap
 */
export const skybox_vs = 
`
    attribute vec3 a_position;
    
    varying vec3 v_position;

    void main() {
        v_position = a_position;
        gl_Position = vec4(a_position, 1);
    }
`

export const skybox_fs = 
`
    precision highp float;

    uniform samplerCube u_skybox;
    uniform mat4 u_viewDirectionProjectionInverse;

    varying vec3 v_position;

    void main() {
        vec4 t = u_viewDirectionProjectionInverse * vec4(v_position, 1);
        gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
    }
`