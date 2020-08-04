export const testinit_vs = 
`
    precision highp float;

    attribute vec2 a_position; 

    varying vec2 v_texcoord;  

    void main() {
        v_texcoord = 0.5 * a_position + 0.5; // from [-1, 1] clip space to [0, 1] texture space
        gl_Position = vec4(a_position, 0.0, 1.0); 
    }
`

export const testinit_fs = `
precision highp float;

varying vec2 v_texcoord;

void main() {
  gl_FragColor = vec4(v_texcoord, 0.0, 1.0);
}`;